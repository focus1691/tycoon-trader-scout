import { TYCOON_ACCESS_TOKEN } from '../secrets'
import { BASE_URL } from '../config'
import { LeaderboardResponse, LeaderHistory, TraderPerformance, TraderStatistics } from '../types'

// Fetch leaderboard and return a list of trader IDs
export async function fetchLeaderboard(): Promise<string[]> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderboard?statsType=PNL&periodType=weekly&topCount=10&search=&leaderType=Public&skipLeaderCount=10&allTimeProfitable=true&atleastTrackingMonth=0&pnlHigherThan=0&noOfTradesLast7days=0&winRate=0&sort=Weekly&direction=desc`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TYCOON_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })

  const data: LeaderboardResponse = await response.json()
  return data.leaderBoard.entries.map((entry) => entry.id)
}

// Fetch and return trader performance by ID
export async function fetchTraderPerformance(id: string): Promise<TraderPerformance[]> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderPerformance?leaderId=${id}&statisticType=PNL`
  // Your fetch function here
  const response = await fetch(url) // Replace fetch with your HTTP client
  return response.json()
}

// Fetch and return trader statistics by ID
export async function fetchTraderStatistics(id: string): Promise<TraderStatistics> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderStatistics?leaderId=${id}`
  // Your fetch function here
  const response = await fetch(url) // Replace fetch with your HTTP client
  return response.json()
}

// Fetch and return trader history by ID
export async function fetchTraderHistory(id: string): Promise<LeaderHistory> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderHistory?leaderId=${id}&skipRecords=0&takeRecords=10`
  // Your fetch function here
  const response = await fetch(url) // Replace fetch with your HTTP client
  return response.json()
}
