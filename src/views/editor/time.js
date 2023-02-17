
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
    var o = {
      'M+': this.date.getMonth() + 1, // 月份
      'd+': this.date.getDate(), // 日
      'h+': this.date.getHours(), // 小时
      'm+': this.date.getMinutes(), // 分
      's+': this.date.getSeconds(), // 秒
      'q+': Math.floor((this.date.getMonth() + 3) / 3), // 季度
      S: this.date.getMilliseconds() // 毫秒
    }
    if (/(y+)/i.test(formatter)) {
      formatter = formatter.replace(RegExp.$1, (this.date.getFullYear() + '').substring(4 - RegExp.$1.length))
    }
    for (var k in o) {
      if (new RegExp('(' + k + ')', 'i').test(formatter)) {
        formatter = formatter.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substring(('' + o[k]).length)))
      }
    }
    return formatter
  }
}

export const cDayjs = (date) => {
  return new Dayjs(date)
}
