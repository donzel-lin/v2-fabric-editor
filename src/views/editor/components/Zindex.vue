<template>
    <div class="row">
        <span class="label">层级</span>
        <el-input-number
        class="number-input"
        @change="change"
            v-model="showValue"
            :min="1"
            :max="500"
        />
    </div>
</template>

<script>
export default {
  name: 'Zindex',
  props: {
    zIndex: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      showValue: 1
    }
  },
  watch: {
    zIndex: {
      handler () {
        this.showValue = this.zIndex
      },
      immediate: true
    }
  },

  methods: {
    change () {
      this.$emit('update:zIndex', this.showValue)
      this.$emit('changeZindex')
    }
  }
}

</script>

<style lang="scss" scoped>

</style>
