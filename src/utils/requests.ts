import { BASE_URL, TOTAL_TRADERS } from '../constants'
import { LeaderboardResponse, LeaderHistory, TraderPerformance, TraderStatistics } from '../types'

// Fetch leaderboard and return a list of trader IDs
export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderboard?statsType=PNL&periodType=weekly&topCount=${TOTAL_TRADERS}&search=&leaderType=Public&skipLeaderCount=10&allTimeProfitable=true&atleastTrackingMonth=0&pnlHigherThan=0&noOfTradesLast7days=0&winRate=0&sort=Weekly&direction=desc`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.TYCOON_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })

  const data: LeaderboardResponse = await response.json()

  return data
}

// Fetch and return trader performance by ID
export async function fetchTraderPerformance(id: string): Promise<TraderPerformance[]> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderPerformance?leaderId=${id}&statisticType=PNL`
  console.log(`Fetching trader performance for ID: ${id}`)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch trader performance for ID ${id}: ${response.statusText}`)
    }
    console.log(`Successfully fetched trader performance for ID: ${id}`)
    return response.json()
  } catch (error) {
    console.error(`Error fetching trader performance for ID ${id}:`, error)
    throw error // Rethrow to handle the error further up if necessary
  }
}

// Fetch and return trader statistics by ID
export async function fetchTraderStatistics(id: string): Promise<TraderStatistics> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderStatistics?leaderId=${id}`
  console.log(`Fetching trader statistics for ID: ${id}`)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch trader statistics for ID ${id}: ${response.statusText}`)
    }
    console.log(`Successfully fetched trader statistics for ID: ${id}`)
    return response.json()
  } catch (error) {
    console.error(`Error fetching trader statistics for ID ${id}:`, error)
    throw error
  }
}

// Fetch and return trader history by ID
export async function fetchTraderHistory(id: string): Promise<LeaderHistory> {
  const url = `${BASE_URL}/LeaderboardApi/GetLeaderHistory?leaderId=${id}&skipRecords=0&takeRecords=10`
  console.log(`Fetching trader history for ID: ${id}`)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch trader history for ID ${id}: ${response.statusText}`)
    }
    console.log(`Successfully fetched trader history for ID: ${id}`)
    return response.json()
  } catch (error) {
    console.error(`Error fetching trader history for ID ${id}:`, error)
    throw error
  }
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function rateLimitedRequest<T>(fn: () => Promise<T>, delayMs: number): Promise<T> {
  await this.delay(delayMs)
  return fn()
}
