import { fabric } from 'fabric'
import Listener, { listenerTypes } from './Listener'
import Layer, { ZIndex } from './Layer'
import short from 'short-uuid'
import defaultStyles from './styles'
import objectTypes from './types'
const uid = short().generate
const canvasOptions = {
  backgroundColor: '#eee'
}
export default class Editor {
  constructor (el, options) {
    this.lastScale = { // 缩放时的位置信息
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      scaleX: 0,
      scaleY: 0
    }
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

    // 缩放
    this.initScaling()
    this.initResizing()
    this.initModified()
    this.initSelection()
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
    canvas.height = height
    canvas.id = 'canvas'
    elDom.append(canvas)
    this.canvasDom = canvas
    this.canvas = new fabric.Canvas('canvas', {
      ...this.editorOptions,
      selection: false // 单个选中
    })
    // 初始化 限制区域
    this.initLimtRect({ x: 0, y: 0, w: width, h: height })
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

  // 限制移动区域
  initLimtRect ({ x = 0, y = 0, w, h, styles }) {
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: w || this.canvas.width,
      height: h || this.canvas.height,
      fill: '#e9e9e9',
      strokeWidth: 0,
      zIndex: -1,
      hasBorders: false,
      hasControls: false,
      selectable: false
    })
    // 此处添加到canvas，不计算图层
    this.canvas.add(rect)
    this.limitRect = rect
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
      console.log(this.lastScale, 'asdf', targetBounding, limitBounding)
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
  remove (obj) {
    this.canvas.remove(obj)
    obj.layer.remove(obj)
  }

  // 给canvas设置属性
  set (obj) {
    // 设置某些属性
    Object.entries(obj).forEach(([key, value]) => {
      this[key] = value
    })
    // 然后可能需要更新某些内容
  }

  // 选中物体时，将其信息返回出去
  selectObject () {
    const objs = this.canvas.getActiveObjects()
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
      switch (key) {
        case 'text':
          this.createEditableText({
            text: title,
            left: e.offsetX,
            top: e.offsetY,
            addToCanvas: true
          })
          break
        case 'img':
          this.createImg({ el: dragData.el, left: e.offsetX, top: e.offsetY })
          break
        case 'clock':
          this.createClockPan({ left: e.offsetX, top: e.offsetY })
          break
        case 'timeText':
          this.createTimeText({ left: e.offsetX, top: e.offsetY })
          break
        case 'video':
          this.createVideo({ left: e.offsetX, top: e.offsetY, el: dragData.el })
          break
      }
    })
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
}
