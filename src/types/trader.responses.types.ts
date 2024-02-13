export interface TraderPerformance {
  name: string
  value: number
}

export interface TraderStatistics {
  totalTrades: number
  profitableDays: number
  highestTradeROI: number
  highestTradePNL: number
  tradesPerDay: number
  winRatio: number
  avgTradingSize: number
  avgTradeDuration: number
  biggestTradeLoss: number
}

export interface LeaderTrade {
  symbol: string
  amount: number
  leverage: number
  entryPrice: number
  markPrice: number
  pnl: number
  roe: number
  days: number
  openTime: string
  closeTime: string | null
  leaderTradeStatus: string
  side: string
}

export interface MergedPosition {
  id: string
  symbol: string
  amount: number
  leverage: number
  entryPrice: number
  markPrice: number
  pnl: number
  roe: number
  days: number
  openTime: string
  closeTime: string
  tradeHistoryList: LeaderTrade[]
  isLong: boolean
}

export interface LeaderHistory {
  mergedPositionsData: MergedPosition[]
  records: number
}
