import { fabric } from 'fabric'
import dayjs from 'dayjs'
import { initAligningGuidelines } from './Guidline'
const labels = [
  {
    id: 1,
    weight: 1,
    label: 'label1'
  },
  {
    id: 2,
    weight: 2,
    label: 'label2'
  }
]
export const FabricUtils = class {
  // 计算文本宽高
  currentLabel = 1
  labelGroup = null
  canvas= null
  selections = []
  canDrawRect = false
  static clockTimer = null
  static strokeStyle = {
    strokeWidth: 2,
    stroke: '#ff0'
  }

  static radiusStyle = {
    rx: 0,
    ry: 0
  }

  static clocks = {
    tick: 10
  }

  static target = null
  static layerNumber = 1
  static textStyle = {
    fontSize: 20,
    fontFamily: 'SimSum',
    fill: '#000'
  }

  size = {
    width: 0,
    height: 0
  }

  // 初始化
  static init (el, { changeScale }) {
    const canvas = new fabric.Canvas(el, {
      backgroundColor: '#eee',
      centeredScaling: true
    })
    const { width, height } = canvas
    this.size = {
      width, height
    }
    canvas.on('before:selection:cleared', options => {

    })
    canvas.on('selection:created', options => {
      this.selections = options.selected
      if (this.selections.length === 1) {
        // 处理 文本选择，默认样式问题
        if (['textbox', 'text'].includes(this.selections[0].get('type'))) {
          const target = this.selections[0]
          this.target = target
          this.textStyle = {
            fontSize: target.fontSize,
            fill: target.fill,
            styles: target.styles
          }
          return target
        }
      }
    })
    this.canvas = canvas
    this.initZoom(changeScale)
    this.initPan()
    this.initGuideline()
    this.initDropEvents()
    this.initAssistEvents()
    // this.initBound()
    return canvas
  }

  // 销毁实例及清空 事件监听
  static destory () {
    clearInterval(this.clockTimer)
    this.clockTimer = null
    this.canvas.dispose()
  }

  // 设置字体
  static setFont (type, value) {
    const activeObject = this.canvas.getActiveObject()
    this.textStyle[type] = value
    if (activeObject) {
      this.canvas.getActiveObject().set(type, value)
      this.canvas.requestRenderAll()
    }
  }

  // 添加物体边缘线
  static initBound () {
    this.canvas.on('after:render', function () {
      const self = this
      this.contextContainer.strokeStyle = '#555'

      this.forEachObject(function (obj) {
        var bound = obj.getBoundingRect()

        self.contextContainer.strokeRect(
          bound.left + 0.5,
          bound.top + 0.5,
          bound.width,
          bound.height
        )
      })
    })
  }

  // 辅助线
  static initGuideline () {
    initAligningGuidelines(this.canvas)
  }

  // 辅助事件
  static initAssistEvents () {
    window.addEventListener('keydown', this.handleKeyEvent.bind(this))
  }

  // 键盘事件
  static handleKeyEvent (evt) {
    if (evt.keyCode === 46) {
      this.deleteObject()
    }
  }

  // 删除物体
  static deleteObject () {
    const activeObjects = this.canvas.getActiveObjects()
    activeObjects.forEach(obj => {
      this.canvas.remove(obj)
    })
    this.canvas.discardActiveObject().renderAll()
  }

  // drop事件
  static initDropEvents () {
    this.canvas.on('drop', (options) => {
      const { e } = options
      const dragData = JSON.parse(e.dataTransfer.getData('data'))
      const { type } = dragData
      switch (type) {
        case 'text':
          this.createEditableText({
            text: '文啊啊啊啊啊啊啊啊啊啊阿啊啊啊啊啊阿啊啊啊啊本',
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

  // 平移功能
  static initPan () {
    this.canvas.on('mouse:down', function (opt) {
      const evt = opt.e
      if (evt.altKey === true) {
        this.isDragging = true
        this.selection = false
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
      this.selection = true
    })
  }

  // 缩放功能
  static initZoom (changeScale) {
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
      changeScale(zoom)
    })
  }

  // 计算宽度
  static calcWidth (text) {
    const tempText = new fabric.Textbox(text, {
      ...this.textStyle
    })
    return {
      width: tempText.width,
      height: tempText.height
    }
  }

  // 创建图片
  static createImg ({ el, left, top }) {
    const img = document.getElementById(el)
    const FImg = new fabric.Image(img, {
      left: left || this.width / 2,
      top: top || this.top / 2,
      layerNumber: this.layerNumber
    })
    this.addToCanvas(FImg)
  }

  // 创建下拉框选项
  static createTextLabel (left, top, targetText) {
    const labels = []
    for (let i = 0; i < 10; i++) {
      const top = i * 30
      const label = `label${i + 1}`
      const rect = new fabric.Rect({
        width: 100,
        height: 30,
        fill: '#fff',
        originX: 'center',
        originY: 'center'
      })

      const tempText = new fabric.Textbox(label, {
        fontSize: 20,
        height: 30,
        width: 100,
        lineHeight: 30,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      })
      const group = new fabric.Group([rect, tempText], {
        top
      })
      labels.push(group)
      group.on('mouseover', options => {
        options.target.item(0).set('fill', '#D51291')
        options.target.item(1).set({
          fill: '#fff'
        })
        this.canvas.renderAll()
      })
      group.on('mouseout', options => {
        options.target.item(0).set('fill', '#fff')
        options.target.item(1).set({
          fill: '#000'
        })
        this.canvas.renderAll()
      })
      group.on('mousedown', optioins => {
        targetText.set({
          text: label
        })
      })
    }
    const rectBox = new fabric.Rect({
      width: 100,
      height: 300,
      fill: 'transparent',
      stroke: 0.5,
      originX: 'center',
      originY: 'top'
    })
    const labelGroup = new fabric.Group([rectBox, ...labels], {
      hasBorders: false,
      hasControls: false,
      left,
      width: 100,
      top: top + 30,
      height: 300,
      subTargetCheck: true
    })
    return labelGroup
  }

  // 创建下拉框
  static createDropdown (value, canvas) {
    const label = labels.find(x => x.id === value)
    const tempText = new fabric.Textbox(label.label, {
      fontSize: 20,
      fill: '#000',
      originX: 'center',
      originY: 'center'
    })
    const rect = new fabric.Rect({
      width: 100,
      height: 30,
      fill: 'transparent',
      rx: 5,
      ry: 5,
      stroke: 0.5,
      originX: 'center',
      originY: 'center'
    })
    const group = new fabric.Group([rect, tempText], {
      width: 100,
      height: 30,
      hasBorders: false,
      hasControls: false,
      subTargetCheck: true,
      layerNumber: this.layerNumber
    })
    let labelGroup = null
    tempText.on('mousedown', options => {
      if (!labelGroup) {
        const { left, top } = options.target
        labelGroup = this.createTextLabel(left, top, tempText)
        canvas.add(labelGroup)
        group.set('lockMovementX', true)
        group.set('lockMovementY', true)
      }
    })
    canvas.on('mouse:down', options => {
      if (options.target !== tempText && labelGroup) {
        canvas.remove(labelGroup)
        labelGroup = null
        group.set('lockMovementX', false)
        group.set('lockMovementY', false)
      }
    })
    return group
  }

  // 取消选中
  static clearActiveOjbects () {
    const activeObjects = this.canvas.getActiveObjects()
    activeObjects.forEach(obj => {
      this.canvas.remove(obj)
    })
    this.canvas.discardActiveObject().renderAll()
  }

  // 编辑文本完成时事件，主要处理 超长文本，多行文本问题
  static afterEditText (options, settingWidth) {
    const { target } = options
    const { customData } = target
    const orginalText = target.text
    const maxWidth = settingWidth || this.size.width
    const { tText, hasClip } = this.clipText(target.text, maxWidth)

    if (hasClip) {
      target
        .set('customData', {
          ...customData,
          text: orginalText,
          width: maxWidth,
          style: this.textStyle
        })
        .set('text', tText)
        .set('width', maxWidth)
      this.renderAll()
    }
  }

  // 裁剪文本
  static clipText (text, maxWidth) {
    // 返回对应的文字和宽度
    const textList = text.split('')
    let i1 = textList.length
    let tWidth = this.calcWidth(text).width
    let tText = text
    while (i1 > 0 && tWidth > maxWidth) {
      tText = textList.slice(0, i1).join('') + '...'
      tWidth = this.calcWidth(tText).width
      i1--
    }
    return {
      tText,
      hasClip: tText !== text
    }
  }

  // 创建可以编辑文本
  static createEditableText ({ text, left = 100, top = 30, width = 100, addToCanvas = false }) {
    const textBox = new fabric.Textbox(text, {
      left,
      top,
      width,
      fill: this.textStyle.fill,
      layerNumber: this.layerNumber,
      ...this.textStyle,
      customData: {
        text,
        left,
        top,
        width
      }
    })
    textBox.on('editing:entered', () => this.handleEnterEditing(textBox))
    const { tText, hasClip } = this.clipText(textBox.text, width)
    const { customData } = textBox
    const orginalText = textBox.text
    if (hasClip) {
      textBox
        .set('customData', {
          ...customData,
          text: orginalText,
          width,
          style: this.textStyle
        })
        .set('text', tText)
        .set('width', width)
    }
    if (addToCanvas) {
      this.canvas.add(textBox)
    }
    return textBox
  }

  // 编辑时
  static handleEnterEditing (textBox) { // 编辑的时候需要展示完整的文本
    const customData = textBox.customData
    const { left, top, width } = customData
    textBox.exitEditing()
    this.canvas.remove(this.target)
    const newText = new fabric.Textbox(customData.text, {
      left,
      top,
      width,
      layerNumber: this.layerNumber,
      ...this.textStyle,
      customData
    })
    this.canvas.add(newText)
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

  // 将obj 添加到 canvas
  static addToCanvas (obj) {
    this.canvas.add(obj)
  }

  // 对齐操作
  static align (type) {
    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return
    const items = activeObject._objects
    this.canvas.remove(activeObject)
    let params = {
      left: 0,
      top: 0
    }
    items.forEach(item => {
      const location = item.getBoundingRect()
      console.log(location, activeObject, 'location')
      if (type === 'top') {
        params = {
          left: item.left,
          top: -activeObject.height / 2
        }
      } else if (type === 'centerV') {
        params = {
          left: item.left,
          top: -item.height / 2
        }
      } else if (type === 'centerH') {
        params = {
          left: -item.width / 2,
          top: item.top
        }
      } else if (type === 'bottom') {
        params = {
          left: item.left,
          top: activeObject.height / 2 - item.height
        }
      } else if (type === 'right') {
        params = {
          left: activeObject.width / 2 - location.width,
          top: location.top
        }
      } else if (type === 'left') {
        params = {
          left: -activeObject.width / 2,
          top: item.top
        }
      } else {
        params = {
          left: -activeObject.width / 2,
          top: item.top
        }
      }
      item.set(params)
    })
    this.canvas.renderAll()
  }

  // 画正方形
  static drawRect () {
    if (this.canDrawRect) return
    // 开始画矩形
    this.canDrawRect = true
    const self = this
    let started = false
    let x = 0
    let y = 0
    let square
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
      x = options.e.clientX
      y = options.e.offsetY
      square = new fabric.Rect({
        width: 0,
        height: 0,
        left: x,
        top: y,
        fill: '#fff',
        hasBorders: false,
        strokeWidth: self.strokeStyle.strokeWidth,
        stroke: self.strokeStyle.stroke,
        borderDashArray: [5, 2],
        layerNumber: self.layerNumber
      })
      this.add(square)
    }
    function oMouseMove (options) {
      if (!started || !self.canDrawRect) {
        return false
      }

      var w = Math.abs(options.e.clientX - x)
      var h = Math.abs(options.e.clientY - y)

      if (!w || !h) {
        return false
      }
      square.set('width', w).set('height', h)
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
    }
  }

  // 设置 层级
  static setLayerNumber (number) {
    this.layerNumber = number
  }

  // 隐藏当前layer的物体
  static hideLayerObjects (number) {
    const objs = this.canvas.getObjects()
    console.log(objs, 'objs')
    objs.forEach(obj => {
      if (obj.layerNumber === number) {
        // 隐藏它
        obj.visible = false
      }
    })
    this.canvas.renderAll()
  }

  // 创建 坐席
  static creatSeatWithLable () {
    const value = 1
    const seatImg = document.getElementById('seatImg')
    const seat = new fabric.Image(seatImg, {
      width: 50,
      height: 50,
      top: 70,
      borderColor: '#fff',
      strokeWidth: 0.5,
      originX: 'center',
      originY: 'center'
    })
    const label = labels.find(x => x.id === value)
    const tempText = new fabric.Textbox(label.label, {
      fontSize: 20,
      fill: '#000',
      originX: 'center',
      originY: 'center'
    })

    const rect = new fabric.Rect({
      width: 100,
      height: 30,
      fill: 'transparent',
      rx: 5,
      ry: 5,
      stroke: 0.5,
      originX: 'center',
      originY: 'center'
    })
    const group = new fabric.Group([seat, rect, tempText], {
      width: 100,
      left: 400,
      top: 300,
      hasBorders: false,
      subTargetCheck: true,
      layerNumber: this.layerNumber
    })
    group.snapAngle = 15
    // 创建下拉菜单
    let labelGroup = null
    const oHandleCreateLabelMenu = (options) => {
      if (!labelGroup) {
        const { left, top } = options.target
        labelGroup = this.createTextLabel(left, top, tempText)
        this.canvas.add(labelGroup)
        group.remove(seat)
        group.set('lockMovementX', true)
        group.set('lockMovementY', true)
      }
    }
    // 关闭 下拉菜单
    const oHandleDropDown = (options) => {
      if (options.target !== tempText && labelGroup) {
        this.canvas.remove(labelGroup)
        labelGroup = null
        seatImg.visible = true
        group.add(seat)
        group.set('lockMovementX', false)
        group.set('lockMovementY', false)
      }
    }
    tempText.on('mousedown', oHandleCreateLabelMenu)
    this.canvas.on('mouse:down', oHandleDropDown)
    this.addToCanvas(group)
  }

  static renderAll () {
    this.canvas.renderAll()
  }

  // rect
  static setBorder (key, value) {
    const activeObject = this.canvas.getActiveObject()
    this.strokeStyle[key] = value
    if (activeObject) {
      this.canvas.getActiveObject().set(key, value)
      this.canvas.requestRenderAll()
    }
  }

  static setRadius (key, value) {
    this.radiusStyle = {
      rx: value,
      ry: value
    }
    const activeObject = this.canvas.getActiveObject()
    console.log(value, 'value')
    if (activeObject) {
      this.canvas.getActiveObject()
        .set('rx', value)
        .set('ry', value)
      this.canvas.requestRenderAll()
    }
  }

  // 时间表盘
  static createClockPan ({ left, top }) {
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
        const hour = dayjs().hour()
        const minute = dayjs().minute()
        const second = dayjs().second()
        angel = (hour + minute / 60 + second / 3600) * 30
      } else if (type === 'minute') {
        const minute = dayjs().minute()
        const second = dayjs().second()
        angel = (minute + second / 60) * 6
        tick = 1.2 * tick
      } else if (type === 'second') {
        const second = dayjs().second()
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
    this.addToCanvas(group)
    this.clockTimer = setInterval(() => {
      movePointTimeFn()
    }, 1000)
  }

  // 时间文本
  static createTimeText ({ left, top }) {
    const text = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const fText = new fabric.Text(text, {
      left,
      top,
      editable: false,
      lockScalingX: true,
      lockScalingY: true,
      fill: this.textStyle.fill,
      layerNumber: this.layerNumber,
      ...this.textStyle
    })
    const changeText = () => {
      const text = dayjs().format('YYYY-MM-DD HH:mm:ss')
      fText.set('text', text)
      this.renderAll()
    }
    this.addToCanvas(fText)
    setInterval(() => {
      changeText()
    }, 1000)
  }

  // 视频
  static createVideo ({ left, top, el }) {
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

  static export () {
    // 序列化之后，丢失了事件
    const json = this.canvas.toJSON()
    this.canvas.clear()
    setTimeout(() => {
      this.canvas.loadFromJSON(json, () => {
        // 一般都可以展示，动态的展示不了
      })
    }, 3000)
  }

  static test () {

  }

  // 下面的 moving和scaling未使用到
  static moving (target, limitRect, canvas) {
    function calcMinValue (num, min, max) {
      return Math.min(Math.max(num, min), max)
    }
    canvas.on('object:moving', e => {
      const target = e.target
      target.setCoords()
      const limitBounding = limitRect.getBoundingRect()
      const targetBounding = target.getBoundingRect()
      const viewportTransform = canvas.viewportTransform
      const loc = {
        left: (calcMinValue(targetBounding.left, limitBounding.left, limitBounding.left + limitBounding.width - targetBounding.width) - viewportTransform[4]) / viewportTransform[0],
        top: (calcMinValue(targetBounding.top, limitBounding.top, limitBounding.top + limitBounding.top - targetBounding.height) - viewportTransform[5]) / viewportTransform[0]
      }
      target.set(loc)
    })
  }

  static scaling (target, limitRect, canvas) {
    canvas.on('object:scaling', e => {
      const target = e.target
      target.setCoords()
      const targetBounding = target.getBoundingRect()
      const limitBounding = limitRect.getBoundingRect()
      let loc = { // 这个值需要在moving事件中也拿到
        width: 0,
        height: 0,
        left: 0,
        top: 0,
        scaleX: 0,
        scaleY: 0
      }
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
          ...loc
        })
      } else {
        // 未超出边界
        loc = {
          width: targetBounding.width,
          height: targetBounding.height,
          left: targetBounding.left,
          top: targetBounding.top,
          scaleX: targetBounding.scaleX,
          scaleY: targetBounding.scaleY
        }
      }
    })
  }

  static modified (target, limitRect, canvas) {
    canvas.on('object:modified', e => {
      const action = e.action
      if (action === 'drag') {
        this.snapTest(target, [], limitRect, canvas)
        // 更新 scaling中的loc
        // loc.left = target.left
        // loc.top = target.top
      }
    })
  }

  // lines 边界线
  static snapTest (target, lines, limitRect, canvas, gap = 10) {
    const vpt = canvas.viewportTransform
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
}
