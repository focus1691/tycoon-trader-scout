import { from, map, toArray } from 'rxjs'
import { CacheService } from './redis'
import { FilterTraderConfig, LeaderboardEntry, LeaderboardResponse, QuantStats, TraderInfo, TraderPerformance } from './types'
import { fetchLeaderboard, fetchTraderHistory, fetchTraderPerformance, fetchTraderStatistics, filterKRatio } from './utils'
import regression from 'regression'
import { RateLimiter } from './RateLimiter'

function calculateKRatio(cumulativeReturns: number[]): number {
  // Correctly type the data as an array of DataPoint
  const data: [number, number][] = cumulativeReturns.map((value, index): [number, number] => [index + 1, value])

  // Perform linear regression
  const result = regression.linear(data)

  // Extract the slope (growth rate) from the equation
  const slope = result.equation[0]

  // Calculate predicted values and residuals
  const n = data.length
  const meanX = (n + 1) / 2 // Mean of x, since x is just 1, 2, ..., n
  let sumResidualsSquared = 0
  let sumVarianceX = 0

  data.forEach(([x, y]) => {
    const predictedY = result.predict(x)[1]
    const residual = y - predictedY
    sumResidualsSquared += residual ** 2
    sumVarianceX += (x - meanX) ** 2
  })

  // Calculate standard error of the slope
  const standardError = Math.sqrt(sumResidualsSquared / (n - 2) / sumVarianceX)

  // Calculate K-Ratio as slope / standard error of the slope
  const kRatio = slope / standardError

  return kRatio
}

export default class TycoonScanner {
  private tradersMap: Map<string, TraderInfo> = new Map<string, TraderInfo>()
  private customStats: Map<string, QuantStats> = new Map<string, QuantStats>()
  private filteredTraderIds: string[] = []

  private cacheService = new CacheService()

  private config: FilterTraderConfig = {
    limit: 10,
    minKRatio: 5
  }

  private rateLimiter = new RateLimiter(50)

  public async init() {
    await this.cacheService.connect()
    await this.scanTycoonTraders()
    this.filterTopPerformers()
    this.debug()
  }

  private calcCustomStats(id: string, performance: TraderPerformance[]): void {
    const cumulativeReturns = performance.map((p) => p.value)
    const kRatio = calculateKRatio(cumulativeReturns)

    const stats: QuantStats = {
      id,
      kRatio
    }

    this.customStats.set(id, stats)
  }

  getTraderInfo(id: string): TraderInfo | undefined {
    return this.tradersMap.get(id)
  }

  // Method to get all traders' information
  getAllTradersInfo(): TraderInfo[] {
    return Array.from(this.tradersMap.values())
  }

  async scanTycoonTraders(): Promise<void> {
    console.time('scanTycoonTraders')
    const data: LeaderboardResponse = await fetchLeaderboard()

    const totalEntries: number = data.leaderBoard.entries.length

    for (let i = 0; i < totalEntries; i++) {
      const entry: LeaderboardEntry = data.leaderBoard.entries[i]
      const cacheKey = `tycoon-id:${entry.id}`
      let traderInfo: TraderInfo

      console.log(`Processing entry ${i + 1}/${totalEntries}`)

      const cachedData = await this.cacheService.getData(cacheKey)
      if (cachedData) {
        console.log(`Data for ${cacheKey} found in cache.`)
        traderInfo = cachedData
      } else {
        // Schedule each request through the rate limiter
        const performance = await this.rateLimiter.schedule(() => fetchTraderPerformance(entry.id))
        const statistics = await this.rateLimiter.schedule(() => fetchTraderStatistics(entry.id))
        const history = await this.rateLimiter.schedule(() => fetchTraderHistory(entry.id))

        traderInfo = { entry, performance, statistics, history }
        await this.cacheService.setData(cacheKey, traderInfo)
      }

      this.tradersMap.set(entry.id, traderInfo)
      const performanceData = traderInfo.performance ? traderInfo.performance : []
      this.calcCustomStats(entry.id, performanceData)
    }

    console.timeEnd('scanTycoonTraders')
  }

  public filterTopPerformers(): void {
    from(Array.from(this.customStats.values()))
      .pipe(
        filterKRatio(this.config.minKRatio),
        toArray(),
        map((traders) => traders.sort((a, b) => b.kRatio - a.kRatio)),
        map((traders) => traders.slice(0, this.config.limit))
      )
      .subscribe((topTraders) => {
        this.filteredTraderIds = topTraders.map((trader) => trader.id)
      })
  }

  debug(): void {
    this.filteredTraderIds.forEach((id) => {
      console.log(`Trader ID: ${id}`)
      console.log(`Total Trades: ${this.tradersMap.get(id)?.statistics.totalTrades}`)
      console.log(`Profitable Days: ${this.tradersMap.get(id)?.statistics.profitableDays}`)
      console.log(`Highest Trade ROI: ${this.tradersMap.get(id)?.statistics.highestTradeROI}`)
      console.log(`Highest Trade PNL: ${this.tradersMap.get(id)?.statistics.highestTradePNL}`)
      console.log(`Trades Per Day: ${this.tradersMap.get(id)?.statistics.tradesPerDay}`)
      console.log(`Win Ratio: ${this.tradersMap.get(id)?.statistics.winRatio}`)
      console.log(`Average Trading Size: ${this.tradersMap.get(id)?.statistics.avgTradingSize}`)
      console.log(`Average Trade Duration: ${this.tradersMap.get(id)?.statistics.avgTradeDuration}`)
      console.log(`Biggest Trade Loss: ${this.tradersMap.get(id)?.statistics.biggestTradeLoss}`)
      console.log(`K-Ratio: ${this.customStats.get(id)?.kRatio}`)
      console.log('------------------------------------------')
    })
  }
}
