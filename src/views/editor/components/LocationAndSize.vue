<template>
    <div class="flex flex-column">
        <div class="row flex flex-end align-center">
            <span class="labe text-right">位置</span>
            <div class="inputs m-l-10 flex align-center">
                <el-input-number
                class="no-buttons"
                    v-model="location.x"
                    :min="maxSize.x"
                    :max="maxSize.x + maxSize.w - location.w"
                />
                <el-input-number
                    class="no-buttons"
                    v-model="location.y"
                    :min="0"
                    :max="maxSize.y + maxSize.h - location.h"
                />
            </div>
        </div>
        <div class="row flex flex-end align-center">
            <span class="labe">宽高</span>
            <div class="inputs m-l-10 flex align-center">
                <el-input-number
                class="no-buttons"
                    v-model="location.w"
                    :min="0"
                    :max="maxSize.w"
                />
                <el-input-number
                class="no-buttons"
                    v-model="location.h"
                    :min="0"
                    :max="maxSize.h"
                />
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'LocationAndSize',
  props: {
    location: {
      type: Object,
      default: () => ({
        x: 0,
        y: 0,
        w: 100,
        h: 100
      })
    },
    maxSize: {
      type: Object,
      default: () => ({
        x: 0, // 最左侧值
        y: 0, // 最右侧值
        w: 1920,
        h: 1080
      })
    }
  }
}

</script>

<style lang="scss" scoped>
.inputs {
    width: 115px;
}

::v-deep {
    .no-buttons {
        .el-input__inner {
            width: 50px;
            height: 30px;
            display: inline-block;
            padding: 0 3px;
        }
        .el-input-number__increase, .el-input-number__decrease{
            display: none;
        }
    }
}
</style>
