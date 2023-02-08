
const defaultProperty = {
  fontSize: '20',
  fontFamily: 'SimSun',
  color: '#000',
  fontWeight: 'normal', // normal ,bold
  align: 'center',
  borderWidth: 2,
  borderColor: '#000',
  borderRadius: 0,
  fill: '#fff'
}
// 每种type对应的默认样式，其实都会保存到 customData中去
const styleMap = {
  text: ['fontSize', 'fontFamily', 'color', 'fontWeight', 'align'],
  rect: ['borderWidth', 'borderColor', 'borderRadius', 'fill'],
  variable: ['fontSize', 'fontFamily', 'color', 'fontWeight', 'align'],
  clock: ['pan', 'hour', 'minute', 'second']
}

export const textStyle = styleMap.text.reduce((all, key) => {
  all[key] = defaultProperty[key]
  return all
}, {})

export default {
  textStyle
}
