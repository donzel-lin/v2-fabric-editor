export default class Layer {
  constructor (layer) {
    this.id = layer.id
    this.title = layer.title
    this.objs = new Map()
  }

  addToLayer (obj) {
    // 此处obj需要有唯一的id
    this.objs.set(obj.id, obj)
    // 将 物体和layer关联起来
    obj.set('layer', this)
  }

  // 从图层移除
  remove (obj) {
    if (this.objs.get(obj.id)) {
      this.objs.delete(obj.id)
    }
  }
}
