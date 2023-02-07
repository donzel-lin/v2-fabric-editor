<template>
    <div class="wrapper">
        <canvas width="800" height="800" id="editor"></canvas>
        <div class="tool-box">
          <div class="scale-box ">
            <el-slider v-model="scale" @change="setScale" :min="1" :step="0.1" :max="10"></el-slider>
          </div>
          <div class="">
            <span class="left-arrow" @click="add">新增按钮</span>
          <span class="left-arrow" @click="leftStraighten">左对齐</span>
          <span class="left-arrow" @click="topStraighten">上对齐</span>
          <span class="left-arrow" @click="centerVStraighten">水平居中对齐</span>
          <span class="left-arrow" @click="cebterHStraighten">垂直居中对齐</span>
          <span class="left-arrow" @click="bottomStraighten">下对齐</span>
          <span class="left-arrow" @click="rightStraighten">右对齐</span>
          <span class="left-arrow" @click="addImg">添加</span>
          <span class="left-arrow" @click="exportJson">导出</span>
          </div>
          <div class="section ">
            <span class="text" draggable @dragstart="choseText">文字</span>
            <img
              id="seatImg"
              class="seat-img"
              :src="require('../../assets/logo.png')" alt=""
              @dragstart="choseImg"
              @load="afterLoadSeat"
            >

          </div>
          <div class="">
            <span class="left-arrow" @click="drawRect">矩形</span>
          </div>
          <div class="layer ">
            <el-input-number
            v-model="layer"
            :min="1" :max="10"
            @change="setLayerNumber"
            />
            <span class="left-arrow" @click="hideLayer">隐藏</span>
          </div>
          <div class="buttons ">
            <el-select v-model="font" @change="setFontfamily" placeholder="请选择">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
            <el-color-picker
              v-model="color"
              @change="setColor"
              show-alpha
              :predefine="predefineColors">
            </el-color-picker>
          </div>
          <div class="">
            <el-switch
              @change='setFontWeight'
                v-model="isBold"
                active-text="加粗"
                inactive-text="常规">
            </el-switch>
          </div>
          <div class="rect">
            <p>矩形</p>
            <el-select v-model="border" @change="setBorder" placeholder="边框">
              <el-option
                v-for="item in borderOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
            <el-color-picker
              v-model="color"
              @change="setBorderColor"
              show-alpha
              :predefine="predefineColors">
            </el-color-picker>
            <div>
              <span>圆角</span>
              <el-slider v-model="borderRadius" @change="setRadius" :min="1" :step="1" :max="100"></el-slider>
            </div>
          </div>
          <div class="tools section">
            <span class="text" draggable @dragstart="choseClockPan">点我</span>
            <span class="text" draggable @dragstart="choseTimeText">时间文本</span>
            <span class="text" draggable @dragstart="choseVideo">aaaaaa</span>
            <span class="left-arrow" draggable @click="exportImage">导出</span>
          </div>
          <div class="video-box">
            <video width="400" height="300" id="video" src="/videos/dizzy.mp4"></video>
          </div>
          <span class="left-arrow" @click="test">测试</span>
        </div>
    </div>
</template>
<script>
import { FabricUtils } from './utils'
export default {
  name: 'Editor',
  data () {
    return {
      scale: 1,
      layer: 1,
      options: [
        {
          value: 'SimSun',
          label: '宋体'
        },
        {
          value: 'KaiTi',
          label: '楷体'
        },
        {
          value: 'FangSong',
          label: '仿宋'
        },
        {
          value: 'SimHei',
          label: '黑体'
        },
        {
          value: 'Macriosoft YaHei',
          label: '微软雅黑'
        },
        {
          value: 'SourceMedium',
          label: '思源黑体-中号'
        },
        {
          value: 'SourceRegular',
          label: '思源黑体-常规'
        }
      ],
      font: 'SimSun',
      color: 'rgba(255, 69, 0, 0.68)',
      predefineColors: [
        '#ff4500',
        '#ff8c00',
        '#ffd700',
        '#90ee90',
        '#00ced1',
        '#1e90ff',
        '#c71585',
        'rgba(255, 69, 0, 0.68)',
        'rgb(255, 120, 0)',
        'hsv(51, 100, 98)',
        'hsva(120, 40, 94, 0.5)',
        'hsl(181, 100%, 37%)',
        'hsla(209, 100%, 56%, 0.73)',
        '#c7158577'
      ],
      isBold: false,
      // 矩形
      border: 2,
      borderRadius: 1
    }
  },
  computed: {
    borderOptions () {
      const options = new Array(20).fill(0).reduce((all, item, index) => {
        const value = index + 2
        all.push({
          value,
          label: `${value}px`
        })
        return all
      }, [])

      return options
    }

  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      FabricUtils.init('editor', {
        changeScale: (scale) => {
          this.scale = scale
        }
      })
      // const group = FabricUtils.createDropdown(1, canvas)
      // const textBox1 = FabricUtils.createEditableText({ text: 'aaa' })
      // const textBox12 = FabricUtils.createEditableText({ text: 'bbb' })
      // canvas.add(group)
      // canvas.add(textBox1)
      // canvas.add(textBox12)
    },
    afterLoadSeat () {
      // FabricUtils.creatSeatWithLable()
    },
    add () {
      const textBox = FabricUtils.createEditableText({ text: 'cccccc' })
      FabricUtils.addToCanvas(textBox)
    },
    leftStraighten () {
      FabricUtils.align('left')
    },
    topStraighten () {
      FabricUtils.align('top')
    },
    centerVStraighten () {
      FabricUtils.align('centerV')
    },
    cebterHStraighten () {
      FabricUtils.align('centerH')
    },
    bottomStraighten () {
      FabricUtils.align('bottom')
    },
    rightStraighten () {
      FabricUtils.align('right')
    },
    setScale () {
      FabricUtils.canvas.setZoom(this.scale)
    },
    addImg () {
      FabricUtils.creatSeatWithLable()
    },
    exportJson () {
      const aaa = FabricUtils.canvas.toJSON()
      console.log(aaa, 'aaa', FabricUtils.canvas)
    },
    // 拖拽生成文字
    choseText (e) {
      e.dataTransfer.setData('data', JSON.stringify({
        type: 'text'
      }))
    },
    // 拖拽生成图片
    choseImg (e) {
      e.dataTransfer.setData('data', JSON.stringify({
        type: 'img',
        el: 'seatImg'
      }))
    },
    drawRect () {
      FabricUtils.drawRect()
    },
    setLayerNumber () {
      FabricUtils.setLayerNumber(this.layer)
    },
    hideLayer () {
      FabricUtils.hideLayerObjects(2)
    },
    setFontfamily () {
      this.setFont('fontFamily', this.font)
    },
    setColor () {
      this.setFont('fill', this.color)
    },
    setFont (key, value) {
      FabricUtils.setFont(key, value)
    },
    setFontWeight () {
      FabricUtils.setFont('fontWeight', this.isBold ? 'bold' : 'normal')
    },
    setBorder () {
      FabricUtils.setBorder('strokeWidth', this.border)
    },
    setBorderColor () {
      FabricUtils.setBorder('stroke', this.color)
    },
    setRadius () {
      FabricUtils.setRadius('radius', this.borderRadius)
    },
    // 生成 表盘
    choseClockPan (e) {
      e.dataTransfer.setData('data', JSON.stringify({
        type: 'clock'
      }))
    },
    choseTimeText (e) {
      e.dataTransfer.setData('data', JSON.stringify({
        type: 'timeText'
      }))
    },
    choseVideo (e) {
      e.dataTransfer.setData('data', JSON.stringify({
        type: 'video',
        el: 'video'
      }))
    },
    exportImage () {
      FabricUtils.export()
    },
    test () {
      FabricUtils.test()
    }
  },
  beforeDestroy () {
    FabricUtils.destory()
  }
}
</script>
<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  .tool-box {
    flex: 1;
    height: 100%;
    background-color: #fff;
    border: 1px solid #eee;
  }
}
.tool-box {
  .left-arrow{
    font-size: 12px;
    padding: 5px;
    border: 1px solid #eee;
    border-radius: 5px;
    cursor: pointer;
    &:hover {
      background-color: rgb(106, 137, 194);
      color: #fff;
    }
  }
  .scale-box{
    padding: 10px;
  }
}
.seat-img{
  width: 50px;
  height: 50px;
  // visibility: hidden;
}
.section {
  .text {
    display: inline-block;
    width: 100px;
    height: 30px;
    line-height: 30px;
    background-color: #eee;
    border: 1px solid #eee;
    border-radius: 2px;
  }
}
.video-box {
    video {
      display: none;
    }
}
</style>
