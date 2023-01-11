export default class Loop {
  constructor (cb, duration = 5000) {
    this.timer = null
    this.isPending = false
    this.duration = duration
    this.cb = cb
    this.loop()
  }

  loop () {
    clearTimeout(this.timer)
    if (!this.isPending && !this.timer) {
      this.timer = setTimeout(() => {
        this.isPending = true
        this.request()
      }, this.duration)
    }
  }

  async request () {
    try {
      await this.cb()
    } catch (e) {
      console.log('出错了')
    } finally {
      this.isPending = false
      this.loop()
    }
  }
}
