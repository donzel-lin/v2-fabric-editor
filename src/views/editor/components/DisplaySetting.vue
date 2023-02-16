<template>
    <div>
        <el-select
            v-model="showDisplay"
            @change="change"
        >
            <el-option
                v-for="item in displays"
                :key="item.id"
                :value="item.id"
                :label="item.value"
            ></el-option>
        </el-select>
    </div>
</template>

<script>
export default {
  name: 'DisplaySetting',
  props: {
    display: {
      type: [Number],
      default: 1
    }
  },
  data () {
    return {
      showDisplay: 1,
      displays: [
        {
          id: 1,
          value: '1920 * 1080'
        },
        {
          id: 2,
          value: '1600 * 900'
        },
        {
          id: 3,
          value: '1366 * 768'
        },
        {
          id: 4,
          value: '1280 * 800'
        },
        {
          id: 5,
          value: '1024 * 768'
        },
        {
          id: 6,
          value: '800 * 600'
        },
        {
          id: 7,
          value: '1080 * 1920'
        }
      ]
    }
  },

  watch: {
    display: {
      handler () {
        this.showDisplay = this.display
      },
      immediate: true
    }
  },
  methods: {
    change () {
      this.$emit('update:display', this.showDisplay)
      const display = this.displays.find(x => x.id === this.showDisplay)
      this.$emit('change', display)
    }
  }
}

</script>
