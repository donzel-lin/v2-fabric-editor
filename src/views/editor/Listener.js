export const listenerTypes = {
  SELECT_OBJECT: 'selectObject',
  ADD_Z_INDEX: 'addZIndex'
}

export default class Listener {
  constructor () {
    this.events = new Map()
  }

  on (type, cb) {
    // 监听
    const events = this.events.get(type) || []
    this.events.set(type, [].concat(events, [cb]))
  }

  triggle (type, data) {
    // 触发动作
    const events = this.events.get(type) || []
    events.forEach(cb => {
      // 触发监听函数
      cb(data)
    })
  }

  off (type, cb) {
    // 取消监听
    const events = this.events.get(type)

    if (events.includes(cb)) {
      const index = events.findIndex(x => x === cb)
      if (index > -1) { // 如果有,那么就删掉
        const newEvents = events.splice(index, 1)
        this.events.set(type, newEvents)
      }
    }
  }
}
