<script setup>
import { ref, onMounted } from 'vue';
import { getChecklistStats } from '@/api/dashboard.js';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette } from '@/composables/useChartConfig';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const palette = useChartPalette();

// 차트 데이터 및 옵션
const checklistStatsChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const checklistStatsChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '체크리스트 현황' }
  }
});

const fetchChecklistStats = async () => {
  loading.value = true;
  try {
    const response = await getChecklistStats();
    stats.value = response;

    // 체크리스트 현황 차트 데이터 구성
    const labels = [
      '총 템플릿 수', '총 아이템 수'
    ];
    const data = [
      stats.value.totalChecklistTemplates,
      stats.value.totalChecklistItems,
    ];
    const backgroundColors = [
      palette.primary, palette.info
    ];

    checklistStatsChartData.value = {
      labels: labels.filter((_, i) => data[i] > 0),
      datasets: [{
        data: data.filter(val => val > 0),
        backgroundColor: backgroundColors.filter((_, i) => data[i] > 0),
        hoverOffset: 4
      }]
    };

  } catch (e) {
    console.error('체크리스트 통계 조회 실패:', e);
    error.value = '체크리스트 통계 데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchChecklistStats);
</script>

<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">체크리스트 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="체크리스트 통계 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <div class="col-xl-4 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 템플릿 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalChecklistTemplates.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-4 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">총 아이템 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalChecklistItems.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-tasks fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-4 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">완료된 체크리스트 (더미)</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ (Math.floor(Math.random() * 100) + 50).toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-double fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 -->
      <div class="row">
        <div class="col-lg-6 mb-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">체크리스트 현황 요약</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="checklistStatsChartData" :options="checklistStatsChartOptions" />
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6 mb-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">월별 체크리스트 생성 추이 (더미)</h6>
            </div>
            <div class="card-body">
              <div class="chart-area">
                <BaseChart type="line" :data="{ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: '생성 수', data: [20, 25, 22, 30, 28, 35], backgroundColor: palette.primary, borderColor: palette.primary, fill: false }] }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-body .text-xs {
  font-size: 0.7rem;
}
.chart-pie, .chart-area {
  height: 300px;
}
</style>
