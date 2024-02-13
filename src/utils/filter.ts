import { Observable, filter } from 'rxjs'
import { TraderInfo } from '../types'

export function filterKRatio(minKRatio: number) {
  return (source: Observable<TraderInfo>) => source.pipe(filter((trader) => trader.computedStats.kRatio >= minKRatio))
}
