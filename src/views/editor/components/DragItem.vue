<template>
    <div>
        <ul>
            <li
              v-for="item in showItems"
              :key="item.id"
              draggable="true"
              @dragstart="dragItem(item)"
              @click="clickItem(item)"
            >{{  item.title }}</li>
        </ul>
    </div>
</template>
<script>
export default {
  name: 'DragItems',
  props: {
    items: {
      type: Array,
      default: () => ([])
    }
  },
  data () {
    return {
      allItems: {
        text: {
          id: 1,
          key: 'text',
          type: 'drag',
          title: '文本'
        },
        image: {
          id: 2,
          key: 'img',
          type: 'drag',
          title: '图片'
        },
        varable: {
          id: 3,
          key: 'varable',
          type: 'drag',
          title: '变量'
        },
        clock: {
          id: 4,
          key: 'clock',
          type: 'drag',
          title: '时钟表盘'
        },
        timeText: {
          id: 5,
          key: 'timeText',
          type: 'drag',
          title: '时间文本'
        },
        rect: {
          id: 6,
          key: 'rect',
          type: 'click',
          event: 'drawRect',
          title: '正方向'
        }
      }
    }
  },
  computed: {
    showAll () {
      return !this.items.length
    },
    showItems () {
      return this.showAll
        ? this.allItems
        : this.items.reduce((all, key) => {
          const item = this.allItems[key]
          if (item) {
            all.push(item)
          }
          return all
        }, [])
    }
  },
  methods: {
    dragItem (item) {
      if (item.type === 'click') return
      const evt = window.event
      evt.dataTransfer.setData('data', JSON.stringify(item))
    },
    clickItem (item) {
      if (item.type === 'drag') return
      this.$emit('clickEvent', item)
    }
  }
}
</script>
