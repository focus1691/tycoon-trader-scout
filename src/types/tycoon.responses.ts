import { Leaderboard } from './leaderboard.responses.types'
import { LeaderHistory, TraderPerformance, TraderStatistics } from './trader.responses.types'

// GET /LeaderboardApi/GetLeaderboard?statsType=PNL&periodType=weekly&topCount=10&search=&leaderType=Public&skipLeaderCount=10&allTimeProfitable=true&atleastTrackingMonth=0&pnlHigherThan=0&noOfTradesLast7days=0&winRate=0&sort=Weekly&direction=desc
export interface LeaderboardResponse {
  leaderBoard: Leaderboard
  records: number
}

// GET /LeaderboardApi/GetLeaderPerformance?leaderId=BC1CCB31BA947F98E6579362E9493824&statisticType=PNL
export type TraderPerformanceResponse = TraderPerformance[]

// GET /LeaderboardApi/GetLeaderStatistics?leaderId=BC1CCB31BA947F98E6579362E9493824
export type TraderStatisticsResponse = TraderStatistics

// GET /LeaderboardApi/GetLeaderHistory?leaderId=BC1CCB31BA947F98E6579362E9493824&skipRecords=0&takeRecords=10
export type TraderHistoryResponse = LeaderHistory
