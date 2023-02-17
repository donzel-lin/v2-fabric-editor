
export const handleChangeDisplay = (objs, editor) => {
  console.log(objs, editor, 'asdf')
}

export const LoactionAndSize = {
  w: 'width',
  h: 'height',
  x: 'left',
  y: 'top'
}

const scaleResize = ['image', 'group', 'video']
// 宽高设置是否为 缩放
export const isScaleResize = (type) => {
  return scaleResize.includes(type)
}
