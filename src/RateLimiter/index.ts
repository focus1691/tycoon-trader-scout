export class RateLimiter {
  constructor(public requestsPerMinute: number) {
    this.intervalDuration = 60000 / this.requestsPerMinute // Duration between requests to evenly spread them
  }

  private requestQueue: (() => void)[] = []
  private intervalDuration: number
  private processing = false

  private async processQueue() {
    if (this.processing) return // Prevent concurrent execution
    this.processing = true

    while (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift()
      if (nextRequest) {
        nextRequest()
        // Wait for the calculated interval duration before processing the next request
        await new Promise((resolve) => setTimeout(resolve, this.intervalDuration))
      }
    }

    this.processing = false
  }

  public schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(() => fn().then(resolve).catch(reject))
      this.processQueue()
    })
  }
}
