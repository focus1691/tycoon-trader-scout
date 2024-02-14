import { LeaderboardEntry, LeaderHistory, TraderPerformance, TraderStatistics } from '.'

export interface TraderInfo {
  entry: LeaderboardEntry
  performance: TraderPerformance[]
  statistics: TraderStatistics
  history: LeaderHistory
}

export type QuantStats = {
  id: string
  kRatio: number
}
