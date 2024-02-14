import { Observable, filter } from 'rxjs'
import { QuantStats } from '../types'

export function filterKRatio(minKRatio: number) {
  return (source: Observable<QuantStats>) => source.pipe(filter((stats) => stats.kRatio >= minKRatio))
}
