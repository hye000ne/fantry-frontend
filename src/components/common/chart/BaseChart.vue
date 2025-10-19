<script setup>
/**
 * BaseChart.vue
 * - Chart.js 공통 래퍼
 * - props: type, data, options, plugins, height
 * - data/options deep watch 후 재렌더 (단순 destroy/create)
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  Chart,
  LineController, LineElement, PointElement,
  BarController, BarElement,
  DoughnutController, ArcElement, // DoughnutController와 ArcElement 추가
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js';

Chart.register(
  LineController, LineElement, PointElement,
  BarController, BarElement,
  DoughnutController, ArcElement, // DoughnutController와 ArcElement 추가
  CategoryScale, LinearScale, Tooltip, Legend, Filler
);

const props = defineProps({
  type: { type: String, required: true },
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({ responsive: true, maintainAspectRatio: false }) },
  plugins: { type: Array, default: () => [] },
  height: { type: [Number, String], default: 300 }
});

let chart;
const canvasRef = ref();
let lastSerialized = '';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function render(force = false) {
  if (!canvasRef.value) return;
  // 변경 감지 (얕은 비교 + serialize fallback)
  const serialized = JSON.stringify({ d: props.data, o: props.options, t: props.type });
  if (!force && serialized === lastSerialized) return; // 변경 없음
  lastSerialized = serialized;
  if (chart) chart.destroy();
  chart = new Chart(canvasRef.value.getContext('2d'), {
    type: props.type,
    data: clone(props.data || {}), // props.data가 undefined일 경우 빈 객체 전달
    options: clone(props.options || {}),
    plugins: props.plugins
  });
}

onMounted(() => render(true));
// 깊은 watch 대신 참조 변경(or 내부 mutate 시 상위 computed 재생성 전제) 감지
watch(() => [props.data, props.options, props.type], () => render(false));
onBeforeUnmount(() => { if (chart) chart.destroy(); });
</script>

<template>
  <div class="base-chart" :style="{ height: typeof height==='number' ? height+'px' : height }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.base-chart { position: relative; width:100%; }
</style>
