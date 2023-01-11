<template>
    <div class="box">
        <canvas id="canvas" width="800" height="500"></canvas>
        <span @click="add">添加</span>
        <span class="test-span">aaaaaaaa</span>
    </div>
</template>
<script>
export default {
  name: 'Test',
  methods: {
    add () {
      const txt = 'aaaaaaaa'
      const canvas = document.getElementById('canvas')
      const ctx = canvas.getContext('2d')
      ctx.rotate(6.10) // 水印旋转角度
      // ctx.translate(0, 0);
      ctx.font = '14px Arial'
      ctx.fillStyle = 'red'
      const { width } = ctx.measureText(txt)
      console.log(width, 'width')
      ctx.fillText(txt, 100, 100) // 水印在画布的位置x，y轴
      const gap = canvas.height / 8
      console.log(gap, gap)
    }
  }
}
</script>
<style lagn="scss" scoped>
.box {
    margin: 0 auto;
    width: 800px;
    height: 500px;
    background-color: #eee;
}
.span{
    font-size: 14px;
    font-family: Arial, Helvetica, sans-serif;
}
</style>
