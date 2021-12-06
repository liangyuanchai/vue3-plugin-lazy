<template>
  <div ref="wrapper">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import BScroll from '@better-scroll/core'
import { onMounted, ref, defineProps, defineEmits } from 'vue'
const props = defineProps({
  probeType: {
    type: Number,
    default: 1,
  },
  click: Boolean,
})

const { probeType, click } = props
const emit = defineEmits(['scroll'])
const wrapper = ref(null)
onMounted(() => {
  const scroll = new BScroll(wrapper.value, {
    probeType,
    click,
  })

  scroll.on('scroll', (pos) => {
    emit('scroll', pos)
  })
})
</script>
