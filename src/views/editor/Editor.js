import { fabric } from 'fabric'
import { handleChangeDisplay, LoactionAndSize, isScaleResize } from './utils'
import { cDayjs } from './time'
import { initAligningGuidelines } from './Guidline'
import Listener, { listenerTypes } from './Listener'
import Layer, { ZIndex } from './Layer'
import short from 'short-uuid'
import defaultStyles from './styles'
import objectTypes from './types'
const uid = short().generate
const canvasOptions = {
  backgroundColor: 'rgb(96,125,175)',
  border: 'rgb(204,204,204)'
}
export default class Editor {
  constructor (el, options) {
    this.strokeStyle = {
      strokeWidth: 2,
      stroke: '#ff0'
    }
    this.canDrawRect = false
    this.display = {
      x: 1920,
      y: 1080
    }
    this.lastScale = { // 缩放时的位置信息
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      scaleX: 0,
      scaleY: 0
    }
    // 时钟属性
    this.clocks = {
      tick: 10
    }
    this.clockTimer = null
    this.limitRect = null
    this.zIndex = new ZIndex() // 新增时可能需要用到这个
    this.listener = new Listener()
    this.layers = (options && options.layers) || []
    this.layer = new Layer(this.layers[0])
    this.el = el
    this.editorOptions = Object.assign({}, canvasOptions, (options && options.canvas) || {})

    this.init()
  }

  init () {
    this.initDom()
    this.initPan()
    this.initZoom()
    this.initDropEvents()
    // 物体移动
    this.initMoving()
    this.initGuideline()
    // 缩放
    this.initScaling()
    this.initResizing()
    this.initModified()
    this.initSelection()
    // 删除操作
    this.initDeleteEvent()
  }

  initDom () {
    if (!this.el) {
      throw new Error('需要指定canvas的目标容器')
    }
    if (this.canvasDom) {
      throw new Error('元素已经初始化')
    }
    // 初始化元素
    const elDom = document.getElementById(this.el)
    if (!elDom) {
      //  报错
      throw new Error(`未找到id为${this.el}的元素`)
    }
    const { width, height } = elDom.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height - 30
    canvas.id = 'canvas'
    elDom.append(canvas)
    this.canvasDom = canvas
    this.canvas = new fabric.Canvas('canvas', {
      ...this.editorOptions,
      selection: false // 单个选中
    })
    // 初始化 限制区域
    this.getLimitParentScale()
    this.initLimtRect({ x: 0, y: 0, w: width, h: height })
  }

  // 求取 limis parent的缩放比例
  getLimitParentScale () {
    const { width, height } = this.canvas
    const { x, y } = this.display
    const vScale = width / x
    const hScale = height / y
    const scale = Math.min(vScale, hScale)
    // 可以算出缩放比例
    this.canvas.setZoom(scale)
  }

  // 辅助线
  initGuideline () {
    initAligningGuidelines(this.canvas)
  }

  // 平移功能
  initPan () {
    this.canvas.on('mouse:down', function (opt) {
      const evt = opt.e
      if (evt.altKey === true) {
        this.isDragging = true
        this.lastPosX = evt.clientX
        this.lastPosY = evt.clientY
      }
    })
    this.canvas.on('mouse:move', function (opt) {
      if (this.isDragging) {
        const e = opt.e
        const vpt = this.viewportTransform
        vpt[4] += e.clientX - this.lastPosX
        vpt[5] += e.clientY - this.lastPosY
        this.requestRenderAll()
        this.lastPosX = e.clientX
        this.lastPosY = e.clientY
      }
    })
    this.canvas.on('mouse:up', function (opt) {
      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      this.setViewportTransform(this.viewportTransform)
      this.isDragging = false
    })
  }

  // 缩放功能
  initZoom (changeScale) {
    this.canvas.on('mouse:wheel', function (opt) {
      var delta = opt.e.deltaY
      var zoom = this.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      this.setZoom(zoom)
      // this.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
      if (changeScale) {
        changeScale(zoom)
      }
    })
  }

  // 平移后可能需要做坐标转换
  transformAcoord (params) {
    if (!params) return
    const { x = 0, y = 0, w = 0, h = 0 } = params
    const vtr = this.canvas.viewportTransform
    return {
      x: x ? (x - vtr[4]) / vtr[0] : 0,
      y: y ? (y - vtr[5]) / vtr[3] : 0,
      w: w ? w / vtr[0] : 0,
      h: h ? h / vtr[3] : 0
    }
  }

  // 限制移动区域
  initLimtRect ({ x = 0, y = 0, w, h, styles }) {
    // 实际是需要根据分辨率来调整的，但是很有可能分辨率达不到那么大

    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: this.display.x,
      height: this.display.y,
      fill: 'rgb(204,204,204)',
      strokeWidth: 0,
      zIndex: -1, // 这里需要处理
      hasBorders: false,
      hasControls: false,
      selectable: false
    })
    // 此处添加到canvas，不计算图层
    this.canvas.add(rect)
    this.limitRect = rect
  }

  // 分辨率被修改
  changeDisplay ({ value }) {
    const values = value.replace(/\s+/g, '').split('*')
    this.display = {
      x: values[0] * 1,
      y: values[1] * 1
    }
    this.getLimitParentScale()
    // 重新设置limitRect的大小，都是分辨率的实际大小，但是位置没有居中？
    this.limitRect.set({
      height: this.display.y,
      width: this.display.x
    })
    this.limitRect.setCoords()
    // 需要重新计算所有元素的位置？
    // 需要处理边界情况
    const objs = this.canvas.getObjects()
    handleChangeDisplay(objs, this)
    this.renderAll()
  }

  // 处理移动
  initMoving () {
    let limitRect = this.limitRect
    function calcMinValue (num, min, max) {
      return Math.min(Math.max(num, min), max)
    }
    this.canvas.on('object:moving', e => {
      const target = e.target
      if (target.limitParent) { // 如果元素设置了 限制父级，那么就是在这个元素内
        limitRect = target.limitParent
      }
      target.setCoords()
      const limitBounding = limitRect.getBoundingRect()
      const targetBounding = target.getBoundingRect()
      const viewportTransform = this.canvas.viewportTransform
      const loc = {
        left: (calcMinValue(targetBounding.left, limitBounding.left, limitBounding.left + limitBounding.width - targetBounding.width) - viewportTransform[4]) / viewportTransform[0],
        top: (calcMinValue(targetBounding.top, limitBounding.top, limitBounding.top + limitBounding.height - targetBounding.height) - viewportTransform[5]) / viewportTransform[0]
      }
      target.set(loc)
    })
  }

  // 处理modified事件
  initModified () {
    this.canvas.on('mouse:down', e => {
      // console.log(e.target, e, 'mouse:down')
    })
    this.canvas.on('object:modified', e => {
      const action = e.action
      if (this[`${action}Handler`]) {
        // resizingHandler, dragHandler
        this[`${action}Handler`](e.target)
      }
    })
  }

  // 处理 按键delete
  initDeleteEvent () {
    document.onkeydown = e => {
      if (e.keyCode === 46) { // 删除激活的物体
        this.deleteActiveObjects()
      }
    }
  }

  // 处理选中，默认只能选中一个
  initSelection () {
    this.canvas.on('selection:created', e => {
      this.selectObject()
    })
    this.canvas.on('selection:updated', e => {
      this.selectObject()
    })
  }

  // resize
  resizingHandler (target) {
    console.log(target.get('type'), 'target')
    const type = target.get('type')
    if (objectTypes.text.includes(type)) {
      // 文字resize
      this.changeTextSize(target)
      this.renderAll()
    }
  }

  // drag 移动时的modified
  dragHandler (target) {
    // this.snapTest(target, [], limitRect, canvas)
    // 更新 scaling中的loc, 不然在边界时会跳跃
    this.lastScale.left = target.left
    this.lastScale.top = target.top
  }

  // 处理物体缩放边界问题
  initScaling () {
    let limitRect = this.limitRect
    this.canvas.on('object:scaling', e => {
      const target = e.target
      if (target.limitParent) {
        limitRect = target.limitParent
      }
      target.setCoords()
      const targetBounding = target.getBoundingRect()
      const limitBounding = limitRect.getBoundingRect()

      function isExceedBound (targetBounding, limitBounding) {
        if (
          targetBounding.left < limitBounding.left ||
          targetBounding.top < limitBounding.top ||
          targetBounding.left + targetBounding.width > limitBounding.left + limitBounding.width ||
          targetBounding.top + targetBounding.height > limitBounding.top + limitBounding.height
        ) {
          return true
        }
        return false
      }
      if (isExceedBound(targetBounding, limitBounding)) {
        // 有超出部分
        target.set({
          ...this.lastScale
        })
      } else {
        // 未超出边界
        this.lastScale = {
          width: target.width,
          height: target.height,
          left: target.left,
          top: target.top,
          scaleX: target.scaleX,
          scaleY: target.scaleY
        }
      }
    })
  }

  // 文字resizing 边界问题
  initResizing () {
    // textbox文字只触发了 垂直方向上的scaling,水平方向上不触发
    let limitRect = this.limitRect
    this.canvas.on('object:resizing', e => {
      const target = e.target
      if (target.limitParent) {
        limitRect = target.limitParent
      }
      target.setCoords()
      const targetBounding = target.getBoundingRect()
      const limitBounding = limitRect.getBoundingRect()
      function isExceedBound (targetBounding, limitBounding) {
        if (
          targetBounding.left < limitBounding.left ||
          targetBounding.top < limitBounding.top ||
          targetBounding.left + targetBounding.width > limitBounding.left + limitBounding.width ||
          targetBounding.top + targetBounding.height > limitBounding.top + limitBounding.height
        ) {
          return true
        }
        return false
      }
      if (isExceedBound(targetBounding, limitBounding)) {
        // 有超出部分
        target.set({
          width: this.lastScale.width,
          height: this.lastScale.height,
          left: this.lastScale.left,
          top: this.lastScale.top
        })
        // 文字还得做其他处理，resize后，编辑，再resize文本恢复了
      } else {
        // 未超出边界
        this.lastScale = {
          ...this.lastScale,
          width: target.width,
          height: target.height,
          left: target.left,
          top: target.top
        }
      }
    })
  }

  // lines 边界线
  snapTest (target, lines, gap = 10) {
    // 看需不需要吸附线及效果
    const vpt = this.canvas.viewportTransform
    const vtpX = vpt[4]
    const vtpY = vpt[5]
    const vtpScaleX = vpt[0]
    const vtpScaleY = vpt[3]

    const targetBounding = target.getBoundingRect()
    // 排除掉 平移和 缩放功能
    const left = (targetBounding.left - vtpX) / vtpScaleX
    const top = (targetBounding.top - vtpY) / vtpScaleY
    const width = (targetBounding.width) / vtpScaleX
    const height = (targetBounding.height) / vtpScaleY

    // 计算边界值
    const { vLines, hLines } = lines
    // 存放x,y边界坐标
    const edges = {
      x: [],
      y: []
    }
    vLines.forEach(line => {
      // 垂直方向的线，即横着的 有 x0,x1,y
      const minX = line.x1.toFixed(3) * 1
      const maxX = line.x2.toFixed(3) * 1
      const tempY = ((line.y1 + line.y2) / 2).toFixed(3) * 1
      if (!edges.x.includes(minX)) {
        edges.x.push(minX)
      }
      if (!edges.x.includes(maxX)) {
        edges.x.push(maxX)
      }
      if (!edges.y.includes(tempY)) {
        edges.y.push(tempY)
      }
    })
    hLines.forEach(line => {
      // 水平方向的线，即竖着的 有 y0,y1,x
      const minY = line.y1.toFixed(3) * 1
      const maxY = line.y2.toFixed(3) * 1
      const tempX = ((line.x1 + line.x2) / 2).toFixed(3) * 1
      if (!edges.y.includes(minY)) {
        edges.y.push(minY)
      }
      if (!edges.y.includes(maxY)) {
        edges.y.push(maxY)
      }
      if (!edges.x.includes(tempX)) {
        edges.x.push(tempX)
      }
    })
    // 计算最小值
    let accessX = false
    let accessY = false
    let minX = {
      value: gap, // 接近值，默认最大
      arrow: 'left', // 吸附方向
      tempX: 0 // 需要吸附的值
    }
    let minY = {
      value: gap, // 接近值，默认最大
      arrow: 'top', // 吸附方向
      tempY: 0 // 需要吸附的值
    }
    edges.x.forEach(tempX => {
      // 判断x
      // 判断左右两个方向
      const range = [tempX - gap, tempX + gap]
      // 左边接近
      if (left >= range[0] && left <= range[1]) {
        // 判断最小值
        const accessValue = Math.abs(left - tempX)
        if (accessValue <= minX.value) {
          minX = {
            value: accessValue,
            arrow: 'left',
            tempX
          }
        }
        accessX = true
      }
      // 右边接近
      if (left + width >= range[0] && left + width <= range[1]) {
        const accessValue = Math.abs(left + width - tempX)
        if (accessValue <= minX.value) {
          minX = {
            value: accessValue,
            arrow: 'right',
            tempX
          }
        }
        accessX = true
      }
    })
    edges.y.forEach(tempV => {
      // 判断x
      // 判断左右两个方向
      const range = [tempV - gap, tempV + gap]
      // 左边接近
      if (top >= range[0] && top <= range[1]) {
        // 判断最小值
        const accessValue = Math.abs(top - tempV)
        if (accessValue <= minY.value) {
          minY = {
            value: accessValue,
            arrow: 'top',
            accessValue: tempV
          }
        }
        accessY = true
      }
      // 右边接近
      if (top + height >= range[0] && top + height <= range[1]) {
        const accessValue = Math.abs(top + height - tempV)
        if (accessValue <= minY.value) {
          minY = {
            value: accessValue,
            arrow: 'bottom',
            accessValue: tempV
          }
        }
        accessY = true
      }
    })
    if (accessX) {
      // x方向有吸附
      const realLeft = minX.arrow === 'left' ? minX.tempX : minX.tempX - targetBounding.width / vtpScaleX
      target.set({
        left: realLeft
      })
    }
    if (accessY) {
      // Y方向有吸附,
      const realTop = minY.arrow === 'top' ? minY.tempV : minY.tempV - targetBounding.height / vtpScaleY
      target.set({
        top: realTop
      })
    }
    target.setCoords()
  }

  // 添加物体
  add (obj, layer) {
    if (!obj.zIndex) { // 如果物体没有zIndex才去新增
      this.zIndex.add(obj)
    }
    const id = uid()
    obj.set('id', id)
    this.canvas.add(obj)
    if (layer) {
      layer.addToLayer(obj)
    } else {
      this.layer.addToLayer(obj)
    }
  }

  // 移除物体
  remove (objs) {
    let temp = null
    if (Array.isArray(objs)) {
      temp = objs
    } else {
      temp = [objs]
    }
    this.canvas.remove(...temp)
    temp.forEach(obj => {
      obj.layer.remove(obj)
    })
  }

  // 给canvas设置属性
  set (obj) {
    // 设置某些属性
    Object.entries(obj).forEach(([key, value]) => {
      this[key] = value
    })
    // 然后可能需要更新某些内容
  }

  // 删除选中的物体
  deleteActiveObjects () {
    const objs = this.canvas.getActiveObjects()
    this.remove(objs)
  }

  // 选中物体时，将其信息返回出去
  selectObject () {
    const objs = this.canvas.getActiveObjects()
    console.log(objs, 'objs', objs[0].getScaledWidth())
    if (objs.length) {
      this.zIndex.set(objs[0].zIndex)
    }
    // 将样式信息发送出去
    this.listener.triggle(listenerTypes.SELECT_OBJECT, objs)
    return objs
  }

  // drop事件
  initDropEvents () {
    this.canvas.on('drop', (options) => {
      const { e } = options
      const dragData = JSON.parse(e.dataTransfer.getData('data'))
      const { key, title } = dragData
      const zoom = this.canvas.getZoom()
      const vtr = this.canvas.viewportTransform
      // 如果是缩放 + 移动后，再添加shape会有问题
      const left = (e.offsetX - vtr[4]) / zoom
      const top = (e.offsetY - vtr[5]) / zoom
      // Todo 需要将所有的选中元素清空掉
      switch (key) {
        case 'text':
          this.createEditableText({
            text: title,
            left,
            top,
            addToCanvas: true
          })
          break
        case 'img':
          this.createImg({ el: dragData.el, left, top })
          break
        case 'clock':
          this.createClockPan({ left, top })
          break
        case 'timeText':
          this.createTimeText({ left, top })
          break
        case 'video':
          this.createVideo({ left, top, el: dragData.el })
          break
      }
    })
  }

  // 画正方形
  drawRect () {
    // this.transformAcoord()
    if (this.canDrawRect) return
    // 开始画矩形
    this.canDrawRect = true
    const self = this
    let started = false
    let x = 0
    let y = 0
    let left = 0
    let top = 0
    let w = 0
    let h = 0
    let vtr = null
    // canvas的父元素
    const parentDom = document.getElementsByClassName('canvas-container')[0]
    let dom
    if (this.canvas.getActiveObject()) {
      // 将选中的元素取消 选中
      this.canvas.discardActiveObject().renderAll()
    }
    this.canvas.on('mouse:down', oMouseDown)
    this.canvas.on('mouse:move', oMouseMove)
    this.canvas.on('mouse:up', oMouseUp)
    function oMouseDown (options) {
      if (this.getActiveObject() || !self.canDrawRect || started) return
      started = true
      vtr = this.viewportTransform
      console.log(vtr, 'asdf', options.absolutePointer)
      x = options.absolutePointer.x
      y = options.absolutePointer.y
      left = x * vtr[0] + vtr[4]
      top = y * vtr[3] + vtr[5]
      dom = document.createElement('div')
      dom.className = 'rect drawing'
      dom.style = `left: ${left}px;top: ${top}px;width: ${w}px;height: ${h}px;`
      parentDom.append(dom)
    }
    function oMouseMove (options) {
      if (!started || !self.canDrawRect) {
        return false
      }
      // 负值需要处理下。。。
      w = Math.abs(options.absolutePointer.x - x) * vtr[0]
      h = Math.abs(options.absolutePointer.y - y) * vtr[3]
      if (!w || !h) {
        return false
      }
      dom.style = `left: ${left}px;top: ${top}px;width: ${w}px;height: ${h}px;`
    }
    function oMouseUp () {
      if (started) {
        started = false
      }
      if (self.canDrawRect) {
        self.canDrawRect = false
        // 绘制完，需要移除监听事件
        this.off('mouse:down', oMouseDown)
        this.off('mouse:move', oMouseMove)
        this.off('mouse:up', oMouseUp)
      }
      // 虚线框
      if (w > 5 && h > 5) { // 有值
        // 添加rect shape
        parentDom.removeChild(dom)
        const square = new fabric.Rect({
          width: w / vtr[0],
          height: h / vtr[3],
          left: x,
          top: y,
          fill: '#fff',
          hasBorders: false,
          strokeWidth: self.strokeStyle.strokeWidth,
          stroke: self.strokeStyle.stroke,
          borderDashArray: [5, 2]
        })
        self.add(square)
      }
    }
  }

  // 可编辑文本
  createEditableText ({ text, left = 100, top = 30, width = 100, addToCanvas = false }) {
    const { color } = defaultStyles.textStyle
    const style = {
      fill: color,
      ...defaultStyles.textStyle
    }
    const textBox = new fabric.Textbox(text, {
      left,
      top,
      width,
      height: 100,
      layer: this.layer,
      ...style,
      customData: {
        style,
        text,
        width
      }
    })
    textBox.on('editing:entered', () => this.handleEnterEditing(textBox))
    this.changeTextSize(textBox)
    if (addToCanvas) {
      this.add(textBox)
    }
    return textBox
  }

  // 编辑时
  handleEnterEditing (textBox) { // 编辑的时候需要展示完整的文本
    const customData = textBox.customData
    const { width, style } = customData
    const { left, top } = textBox
    textBox.exitEditing()
    this.remove(textBox)
    const newText = new fabric.Textbox(customData.text, {
      left,
      top,
      layer: this.layer,
      ...style,
      customData,
      zIndex: textBox.zIndex
    })
    this.add(newText)
    this.canvas.setActiveObject(newText)
    newText.enterEditing()
    const exitFn = () => {
      // 这里200 是具体的 文本宽度
      this.afterEditText({ target: newText }, width)
      newText.off('editing:exited', exitFn)
    }
    newText.on('editing:entered', () => this.handleEnterEditing(newText))
    newText.on('editing:exited', exitFn)
  }

  // 计算文本长度
  changeTextSize (textBox) {
    // 原始文本都在customData上面，主要是计算 文本是否省略的效果
    const { customData, width } = textBox
    textBox.set('customData', {
      ...customData,
      width
    })
    const tWidth = this.calcWidth(customData.text, customData).width
    if (tWidth < width) {
      // 不需要截取，直接展示全
      textBox
        .set('text', customData.text)
        .set('customData', {
          ...customData,
          width
        })
    } else {
      // 这里只考虑了 宽度较小的情况
      const { tText, hasClip } = this.clipText(textBox.customData.text, width, textBox.customData)
      if (hasClip) {
        textBox
          .set('width', width)
          .set('text', tText)
      }
    }
  }

  // 裁剪文本
  clipText (text, maxWidth, customData) {
    // 返回对应的文字和宽度
    const textList = text.split('')
    let i1 = textList.length
    let tWidth = this.calcWidth(text, customData).width
    let tText = text
    while (i1 > 0 && tWidth > maxWidth) {
      tText = textList.slice(0, i1).join('') + '...'
      tWidth = this.calcWidth(tText, customData).width
      i1--
    }
    return {
      tText,
      hasClip: tText !== text
    }
  }

  // 计算宽度
  calcWidth (text, customData) {
    const tempText = new fabric.Textbox(text, {
      ...customData.style
    })
    return {
      width: tempText.width,
      height: tempText.height
    }
  }

  // 编辑文本完成时事件，主要处理 超长文本，多行文本问题
  afterEditText (options, settingWidth) {
    const { target } = options
    const { customData } = target
    const orginalText = target.text
    const maxWidth = settingWidth
    const { tText, hasClip } = this.clipText(target.text, maxWidth, customData)

    if (hasClip) {
      target
        .set('customData', {
          ...customData,
          text: orginalText,
          width: maxWidth
        })
        .set('text', tText)
        .set('width', maxWidth)
    }
    target.setCoords()
    this.renderAll()
  }

  // 视频
  createVideo ({ left, top, el }) {
    const ele = document.getElementById(el)
    console.log(ele, el, 'ele')
    const video = new fabric.Image(ele, {
      left,
      top,
      width: 100,
      height: 100,
      originX: 'center',
      originY: 'center',
      objectCaching: false
    })
    this.addToCanvas(video)
    ele.play()
    const self = this
    fabric.util.requestAnimFrame(function render () {
      self.canvas.renderAll()
      fabric.util.requestAnimFrame(render)
    })
  }

  changeImage (obj, url) {
    // const { scaleX, scaleY } = obj
    obj.setSrc(url, oImg => {
      // const { naturalWidth, naturalHeight } = oImg.getElement()
      // console.log(naturalWidth, naturalHeight, oImg, scaleX, scaleY)
      this.renderAll()
    }, {
      left: obj.left,
      top: obj.top
    })
  }

  // 图片
  createImg ({ el, left, top }) {
    // 先生成默认的图片
    const url = require('../../assets/1.jpg')
    fabric.Image.fromURL(url, oImg => {
      const { naturalWidth } = oImg.getElement()
      const scale = 100 / naturalWidth
      oImg.scale(scale)
      this.add(oImg)
      console.log(oImg.width, oImg.height, '23', scale, oImg.getScaledWidth())
    }, {
      left,
      top
    })
  }

  // 时间表盘
  createClockPan ({ left, top }) {
    // 时间表盘
    // 1. 表盘
    const radius = 150
    const circlePanel = new fabric.Circle({
      // 默认宽高
      left,
      top,
      backgroundColor: 'transparent',
      stroke: '#000',
      strokeDashArray: [5, 2],
      fill: '#fff',
      strokeWidth: 2,
      radius
    })
    // 刻度
    // 小时，逢 5 变长
    const hourTicks = []
    for (let i = 0; i < 60; i++) {
      const tick = {
        angel: i * 6, // deg
        rotation: Math.PI / 180 * i * 6,
        tick: i % 5 === 0 ? 2 * this.clocks.tick : this.clocks.tick
      }
      const x = radius * Math.sin(tick.rotation) + left + radius - 3 / 2
      const y = radius * Math.cos(tick.rotation) + top + radius
      const tickIns = new fabric.Rect({
        centeredRotation: false,
        fill: '#000',
        width: 3,
        left: x,
        top: y,
        height: tick.tick
      })
      // 旋转是逆时针的
      tickIns.rotate(180 - tick.angel)
      hourTicks.push(tickIns)
    }
    // 时分秒指针
    const getAngelAndTick = (type) => {
      let angel = 0
      let tick = 80
      if (type === 'hour') {
        const hour = cDayjs().hour()
        const minute = cDayjs().minute()
        const second = cDayjs().second()
        angel = (hour + minute / 60 + second / 3600) * 30
      } else if (type === 'minute') {
        const minute = cDayjs().minute()
        const second = cDayjs().second()
        angel = (minute + second / 60) * 6
        tick = 1.2 * tick
      } else if (type === 'second') {
        const second = cDayjs().second()
        angel = second * 6
        tick = tick * 1.5
      }
      return {
        angel: Math.ceil(angel), tick
      }
    }
    const getPoint = (type) => {
      const { tick, angel } = getAngelAndTick(type)
      const fTick = new fabric.Rect({
        centeredRotation: false,
        fill: '#000',
        width: 4,
        height: tick,
        left: left + radius - 2,
        top: top + radius,
        customData: {
          key: 'time-pointer',
          type: `${type}-pointer`,
          angel
        }
      })
      fTick.rotate(180 + angel)
      return fTick
    }
    const generateTick = () => {
      const fHourTick = getPoint('hour')
      const fMinuteTick = getPoint('minute')
      const fSecondTick = getPoint('second')
      return {
        fHourTick,
        fMinuteTick,
        fSecondTick
      }
    }
    const { fHourTick, fMinuteTick, fSecondTick } = generateTick()
    const group = new fabric.Group([circlePanel, ...hourTicks, fHourTick, fMinuteTick, fSecondTick])
    // 更新指针位置
    const movePointTimeFn = () => {
      const hourAngelAndTick = getAngelAndTick('hour')
      const minuteAngelAndTick = getAngelAndTick('minute')
      const secondAngelAndTick = getAngelAndTick('second')
      // 在原来的基础上做处理
      // 旧值 originalSecondAngel.angel, 新值secondAngelAndTick.angel
      fSecondTick.rotate(180 + secondAngelAndTick.angel)
      fHourTick.rotate(180 + hourAngelAndTick.angel)
      fMinuteTick.rotate(180 + minuteAngelAndTick.angel)
      this.renderAll()
    }
    this.add(group)
    this.clockTimer = setInterval(() => {
      movePointTimeFn()
    }, 1000)
  }

  // 时间文本
  createTimeText ({ left, top }) {
    const text = cDayjs().format('YYYY-MM-DD HH:mm:ss')
    const fText = new fabric.Text(text, {
      left,
      top,
      editable: false,
      lockScalingX: true,
      lockScalingY: true
    })
    const changeText = () => {
      const text = cDayjs().format('YYYY-MM-DD HH:mm:ss')
      fText.set('text', text)
      this.renderAll()
    }
    this.add(fText)
    setInterval(() => {
      changeText()
    }, 1000)
  }

  // 修改 宽高和位置
  setLocationAndSize (type, value, obj) {
    const key = LoactionAndSize[type]
    if (isScaleResize(key)) {
      // 图片类型缩放，需要修改 scaleX scaleY
    } else {
      obj.set({
        [key]: value
      })
    }
    this.renderAll()
  }

  // 修改层级，区别于图层，控制 objects的顺序的
  changeZIndex () {
    // 找到当前激活的目标，修改其层级， 根据其zIndex来排序
    const activeObj = this.canvas.getActiveObject()
    if (activeObj) {
      activeObj.set('zIndex', this.zIndex.value)
      this.moveObj(activeObj)
    }
  }

  // 切换物体的层级
  moveObj (target) { // 切换层级
    const objs = this.canvas.getObjects()
    const sortObjects = objs.sort((a, b) => a.zIndex - b.zIndex)
    const index = sortObjects.findIndex(x => x.id === target.id)
    target.moveTo(index)
    this.renderAll()
  }

  // canvas更新
  renderAll () {
    this.canvas.renderAll()
  }

  // 销毁
  dispose () {
    // 销毁canvas
    this.canvas.dispose()
    document.onkeydown = null
  }
}
