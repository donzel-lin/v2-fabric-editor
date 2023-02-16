<template>
    <div>
        <ul>
            <li
                v-for="item in showItems"
                :key="item.id"
                draggable="true"
                @dragstart="dragItem(item)"
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
          title: '文本'
        },
        image: {
          id: 2,
          key: 'image',
          title: '图片'
        },
        varable: {
          id: 3,
          key: 'varable',
          title: '变量'
        },
        clock: {
          id: 4,
          key: 'clock',
          title: '时钟表盘'
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
      const evt = window.event
      evt.dataTransfer.setData('data', JSON.stringify(item))
    }
  }
}
</script>
