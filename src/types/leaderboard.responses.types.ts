export interface LeaderboardEntry {
  id: string
  encryptedUid: string
  nickName: string
  userPhotoUrl: string
  dailyPNL: number
  dailyROI: number
  weeklyPNL: number
  weeklyROI: number
  monthlyPNL: number
  monthlyROI: number
  yearlyPNL: number | null
  yearlyROI: number | null
  allPNL: number
  allROI: number
  profitabilityPNL30Days: number
  profitabilityROI30Days: number
  followers: number
  openPositions: number
  isFollowed: boolean
  isFavorite: boolean
}

export interface Leaderboard {
  statsType: string
  periodType: string
  entries: LeaderboardEntry[]
  totalRecord: number
  leadersRecentUpdateTime: string
}
