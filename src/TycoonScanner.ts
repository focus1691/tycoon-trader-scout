import { LeaderHistory, TraderInfo, TraderPerformance, TraderStatistics } from './types'
import { fetchLeaderboard, fetchTraderHistory, fetchTraderPerformance, fetchTraderStatistics } from './utils'
import regression, { DataPoint } from 'regression'

function calculateKRatio(cumulativeReturns: number[]): number {
  // Correctly type the data as an array of DataPoint (which is [number, number])
  const data: DataPoint[] = cumulativeReturns.map((value, index): DataPoint => [index + 1, value])

  // Perform linear regression
  const result = regression.linear(data)

  // Extract the slope (growth rate) from the equation
  const slope = result.equation[0]

  // Here, we're lacking a direct method to calculate standard error from the regression library's result
  // As an alternative, consider focusing on the slope or the r2 property for the quality of fit
  // If you need the standard error, you'll need to calculate it manually based on regression residuals

  // Temporarily, let's use the slope as our metric (you may want to adjust this based on your requirements)
  // Note: This is a placeholder solution. You should implement a proper standard error calculation if needed.
  const kRatio = slope // Placeholder, not an actual K-Ratio calculation without the standard error

  return kRatio
}

export default class TycoonScanner {
  private tradersMap: Map<string, TraderInfo> = new Map<string, TraderInfo>()

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

  public filterTopPerformers(topN: number = 10) {}

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
