<template>
    <div class="wrapper">
        <div class="left-items h-100">
          <drag-item
            @clickEvent="clickEvent"
          />
        </div>
        <div class="content">
          <div class="upper-tool w-100">
            <ul class="flex align-center">
              <li
                v-for="layer in  layers"
                :key="layer.id"
                class="m-l-5 m-r-5"
                :class="{
                  'is-active': currentLayer && currentLayer.id === layer.id
                }"
                @click="setLayer(layer)"
              >{{ layer.title }}</li>
            </ul>
            <!-- 分辨率 -->
            <display-setting
              :display.sync="currentDisplay"
              @change="setDisplay"
            />
          </div>
          <div class="canvas w-100" id="canvasBox">
          </div>
        </div>

        <div class="right-properties p-r-10 h-100">
          <template v-if="targetObj">
            <location-and-size :location="targetLocation"/>
            <z-index
              :z-index.sync="currentZIndex.value"
              @changeZindex="changeZindex"
            />
          </template>
        </div>
    </div>
</template>
<script>
import { listenerTypes } from './Listener'
import Editor from './Editor'
import DragItem from './components/DragItem.vue'
import DisplaySetting from './components/DisplaySetting.vue'
import LocationAndSize from './components/LocationAndSize.vue'
import ZIndex from './components/Zindex.vue'
export default {
  name: 'Editor',
  components: {
    DragItem,
    LocationAndSize,
    ZIndex,
    DisplaySetting
  },
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
      borderRadius: 1,
      // 编辑器
      editor: null,
      targetObj: null,
      layers: [
        {
          id: 1,
          title: 'layer1'
        },
        {
          id: 2,
          title: 'layer2'
        },
        {
          id: 3,
          title: 'layer3'
        },
        {
          id: 4,
          title: 'layer4'
        }
      ],
      currentDisplay: 1 // 当前分辨率
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
    },
    currentLayer () {
      return this.editor && this.editor.layer
    },
    currentZIndex () {
      return this.editor && this.editor.zIndex
    },
    targetLocation () {
      return this.targetObj && {
        x: this.targetObj.left,
        y: this.targetObj.top,
        w: this.targetObj.width,
        h: this.targetObj.height
      }
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      this.editor = new Editor('canvasBox', {
        layers: this.layers,
        canvas: {}
      })
      // 处理监听时间
      this.editor.listener.on(listenerTypes.SELECT_OBJECT, this.selectObject)
    },
    selectObject (data) {
      this.targetObj = data[0]
    },
    setLayer (layer) {
      this.editor.set({
        layer
      })
    },
    // 修改了分辨率
    setDisplay (display) {
      // 需要将limit parent的区域修改下
      if (display) {
        this.editor.changeDisplay(display)
      }
    },
    changeZindex () {
      // 组件修改 层级
      // 如果有选中的目标，那么也需要将其 层级修改掉
      this.editor.changeZIndex()
    },
    // 点击事件
    clickEvent (item) {
      this.editor[item.event] && this.editor[item.event]()
    }
  },
  beforeDestroy () {
    this.editor.dispose()
  }
}
</script>
<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  .left-items {
    width: 130px;
  }
  .right-properties {
    width: 230px;
  }
  .content {
    width: calc(100vw - 360px);
    .upper-tool{
      height: 60px;
    }
    .canvas{
      height: calc(100% - 60px);
    }
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
.video-box {
    video {
      display: none;
    }
}

::v-deep {
  .rect.drawing {
    position: absolute;
    border: 1px dashed red;
    background-color: #fff;
  }
}
</style>
