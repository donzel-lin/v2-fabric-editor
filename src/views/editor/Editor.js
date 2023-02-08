import { fabric } from 'fabric'
import Listener, { listenerTypes } from './Listener'
import Layer from './Layer'
import short from 'short-uuid'
import defaultStyles from './styles'
import objectTypes from './types'
const uid = short().generate
const canvasOptions = {
  backgroundColor: '#eee'
}
export default class Editor {
  constructor (el, options) {
    this.listener = new Listener()
    this.layers = (options && options.layers) || []
    this.layer = new Layer(this.layers[0])
    this.el = el
    this.editorOptions = Object.assign({}, canvasOptions, (options && options.canvas) || {})
    this.init()
  }

  init () {
    this.initDom()
    this.initDropEvents()
    // this.initMoving()
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
  }

  // 处理移动
  // initMoving () {
  // this.canvas.on('object:modified', e => {
  //   console.log(e.target, e, 'e')
  // })
  // }
  // 处理modified事件
  initModified () {
    this.canvas.on('mouse:down', e => {
      // console.log(e.target, e, 'mouse:down')
    })
    this.canvas.on('object:modified', e => {
      const action = e.action
      if (this[`${action}Handler`]) {
        // resizingHandler
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

  resizingHandler (target) {
    console.log(target.get('type'), 'target')
    const type = target.get('type')
    if (objectTypes.text.includes(type)) {
      // 文字resize
      this.changeTextSize(target)
      this.renderAll()
    }
  }

  // 添加物体
  add (obj, layer) {
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
    console.log(objs, 'objs')
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
      customData
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

  // canvas更新
  renderAll () {
    this.canvas.renderAll()
  }
}
