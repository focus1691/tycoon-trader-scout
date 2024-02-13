import { LeaderHistory, TraderPerformance, TraderStatistics } from '.'

export interface TraderInfo {
  id: string
  performance: TraderPerformance[]
  statistics: TraderStatistics
  history: LeaderHistory
  computedStats: QuantStats
}

export type QuantStats = {
  kRatio: number
}
