import { from, map, toArray } from 'rxjs'
import { CacheService } from './redis'
import { FilterTraderConfig, LeaderboardEntry, LeaderboardResponse, LeaderHistory, QuantStats, TraderInfo, TraderPerformance, TraderStatistics } from './types'
import { fetchLeaderboard, fetchTraderHistory, fetchTraderPerformance, fetchTraderStatistics, filterKRatio } from './utils'
import regression from 'regression'

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
  private cacheService = new CacheService()
  private config: FilterTraderConfig = {
    limit: 10,
    minKRatio: 100
  }

  public async init() {
    await this.cacheService.connect()
    await this.scanTycoonTraders()
    this.debug()
  }

  private calcCustomStats(id: string, performance: TraderPerformance[]): void {
    const cumulativeReturns = performance.map((p) => p.value)
    const kRatio = calculateKRatio(cumulativeReturns)

    const stats: QuantStats = {
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
    const data: LeaderboardResponse = await fetchLeaderboard()

    for (let i = 0; i < data.leaderBoard.entries.length; i++) {
      const entry: LeaderboardEntry = data.leaderBoard.entries[i]
      const cacheKey = `tycoon-id:${entry.id}`
      let traderInfo: TraderInfo

      // Check if the data exists in cache
      const cachedData = await this.cacheService.getData(cacheKey)
      if (cachedData) {
        console.log(`Data for ${cacheKey} found in cache.`)
        traderInfo = cachedData
      } else {
        // Fetch data since it's not in the cache
        const performance: TraderPerformance[] = await fetchTraderPerformance(entry.id)
        const statistics: TraderStatistics = await fetchTraderStatistics(entry.id)
        const history: LeaderHistory = await fetchTraderHistory(entry.id)

        traderInfo = {
          entry,
          performance,
          statistics,
          history
        }

        // Store the fetched data in cache
        await this.cacheService.setData(cacheKey, traderInfo)
      }

      // Load trader info into memory and calculate custom stats
      // These operations are performed regardless of data origin (API or cache)
      this.tradersMap.set(entry.id, traderInfo)
      // Need to ensure performance data is available for calculation
      // If data was from cache, extract the performance data for calcCustomStats
      const performanceData = traderInfo.performance ? traderInfo.performance : []
      this.calcCustomStats(entry.id, performanceData)
    }
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
        console.log(topTraders)
      })
  }

  debug(): void {
    this.tradersMap.forEach((traderInfo, id) => {
      console.log(`Trader ID: ${id}`)
      console.log(`Total Trades: ${traderInfo.statistics.totalTrades}`)
      console.log(`Profitable Days: ${traderInfo.statistics.profitableDays}`)
      console.log(`Highest Trade ROI: ${traderInfo.statistics.highestTradeROI}`)
      console.log(`Highest Trade PNL: ${traderInfo.statistics.highestTradePNL}`)
      console.log(`Trades Per Day: ${traderInfo.statistics.tradesPerDay}`)
      console.log(`Win Ratio: ${traderInfo.statistics.winRatio}`)
      console.log(`Average Trading Size: ${traderInfo.statistics.avgTradingSize}`)
      console.log(`Average Trade Duration: ${traderInfo.statistics.avgTradeDuration}`)
      console.log(`Biggest Trade Loss: ${traderInfo.statistics.biggestTradeLoss}`)
      console.log(`K-Ratio: ${this.customStats.get(id)?.kRatio}`)
      console.log('------------------------------------------')
    })
  }
}
