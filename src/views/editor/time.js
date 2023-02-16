
// 基本的时间功能
class Dayjs {
  constructor (date) {
    if (date) {
      this.date = new Date(date)
    } else {
      this.date = new Date()
    }
  }

  // 获取小时
  hour () {
    const hour = this.date.getHours()
    return hour
  }

  // 获取分钟
  minute () {
    return this.date.getMinutes()
  }

  // 获取秒
  second () {
    return this.date.getSeconds()
  }

  // 格式化
  format (formatter) {
    return this.date.format(formatter)
  }
}

export const cDayjs = (date) => {
  return new Dayjs(date)
}
