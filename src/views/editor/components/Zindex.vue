<template>
    <div class="row">
        <span class="label">层级</span>
        <el-input-number
        class="number-input"
            v-model="zIndex"
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
  }
}

</script>

<style lang="scss" scoped>

</style>
