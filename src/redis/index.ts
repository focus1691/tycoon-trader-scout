import { createClient, RedisClientType } from 'redis'

export class CacheService {
  private redis: RedisClientType

  public async connect(): Promise<void> {
    const url = process.env.REDIS_URI
    try {
      this.redis = createClient({ url })
      await this.redis.connect()
      console.log(`Redis connection established @ ${url}.`)
    } catch (e) {
      console.error(`Could not connect to Redis @ ${url}! Reason: ${e.message}`)
    }

    throw new Error('Could not connect to cache!')
  }

  public async setData(): Promise<void> {
    //
  }
}
