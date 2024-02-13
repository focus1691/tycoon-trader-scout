import { from, map, toArray } from 'rxjs'
import { FilterTraderConfig, LeaderHistory, TraderInfo, TraderPerformance, TraderStatistics } from './types'
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
  private config: FilterTraderConfig = {
    numOfTraders: 10,
    kRatio: 100
  }

  public async init() {
    await this.scanTycoonTraders()
    this.debug()
  }

  private updateTraderInfo(id: string, performance: TraderPerformance[], statistics: TraderStatistics, history: LeaderHistory): void {
    const cumulativeReturns = performance.map((p) => p.value)
    const kRatio = calculateKRatio(cumulativeReturns)

    const traderInfo: TraderInfo = {
      id,
      performance,
      statistics,
      history,
      computedStats: {
        kRatio
      }
    }
    this.tradersMap.set(id, traderInfo)
  }

  getTraderInfo(id: string): TraderInfo | undefined {
    return this.tradersMap.get(id)
  }

  // Method to get all traders' information
  getAllTradersInfo(): TraderInfo[] {
    return Array.from(this.tradersMap.values())
  }

  async scanTycoonTraders(): Promise<void> {
    const ids = await fetchLeaderboard()

    for (const id of ids) {
      const performance: TraderPerformance[] = await fetchTraderPerformance(id)
      const statistics: TraderStatistics = await fetchTraderStatistics(id)
      const history: LeaderHistory = await fetchTraderHistory(id)

      // Update the map with the new trader info
      this.updateTraderInfo(id, performance, statistics, history)
    }
  }

  public filterTopPerformers(): void {
    from(Array.from(this.tradersMap.values()))
      .pipe(
        filterKRatio(this.config.kRatio),
        toArray(),
        map((traders) => traders.sort((a, b) => b.computedStats.kRatio - a.computedStats.kRatio)),
        map((traders) => traders.slice(0, this.config.numOfTraders))
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
      console.log(`K-Ratio: ${traderInfo.computedStats.kRatio}`)
      console.log('------------------------------------------')
    })
  }
}
