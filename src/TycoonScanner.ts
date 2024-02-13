import { LeaderHistory, TraderInfo, TraderPerformance, TraderStatistics } from './types'
import { fetchLeaderboard, fetchTraderHistory, fetchTraderPerformance, fetchTraderStatistics } from './utils'

export default class TycoonScanner {
  private tradersMap: Map<string, TraderInfo> = new Map<string, TraderInfo>()

  public async init() {
    await this.scanTycoonTraders()
    this.debug()
  }

  private updateTraderInfo(id: string, performance: TraderPerformance[], statistics: TraderStatistics, history: LeaderHistory): void {
    const traderInfo: TraderInfo = {
      id,
      performance,
      statistics,
      history
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
      console.log('------------------------------------------')
    })
  }
}
