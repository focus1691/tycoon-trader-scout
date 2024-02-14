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
      throw new Error('Could not connect to cache!')
    }
  }

  public async getData(key: string): Promise<any> {
    try {
      const data = await this.redis.json.get(key)
      return data
    } catch (e) {
      console.error(`Error retrieving data for key ${key}: ${e.message}`)
      return null
    }
  }

  public async setData(key: string, value: any): Promise<void> {
    try {
      await this.redis.json.set(key, '.', value)
      console.log(`Data set for key ${key}`)
    } catch (e) {
      console.error(`Error setting data for key ${key}: ${e.message}`)
    }
  }
}
