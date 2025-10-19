<script setup>
import { ref, onMounted } from 'vue';
import { getRefundStats } from '@/api/dashboard.js';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette } from '@/composables/useChartConfig';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const palette = useChartPalette();

// 차트 데이터 및 옵션
const refundStatusChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const refundStatusChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '환불/반품 상태별 현황' }
  }
});

const fetchRefundStats = async () => {
  loading.value = true;
  try {
    const response = await getRefundStats();
    stats.value = response;

    // 환불/반품 상태별 차트 데이터 구성
    const labels = [
      '요청됨', '회수 중', '검수 중', '승인됨', '거절됨', '완료됨', '사용자 취소'
    ];
    const data = [
      stats.value.requestedRefunds,
      stats.value.inTransitRefunds,
      stats.value.inspectingRefunds,
      stats.value.approvedRefunds,
      stats.value.rejectedRefunds,
      stats.value.completedRefunds,
      stats.value.userCancelledRefunds,
    ];
    const backgroundColors = [
      palette.primary, palette.info, palette.warning, palette.success, palette.danger, palette.dark, palette.secondary
    ];

    refundStatusChartData.value = {
      labels: labels.filter((_, i) => data[i] > 0),
      datasets: [{
        data: data.filter(val => val > 0),
        backgroundColor: backgroundColors.filter((_, i) => data[i] > 0),
        hoverOffset: 4
      }]
    };

  } catch (e) {
    console.error('환불/반품 통계 조회 실패:', e);
    error.value = '환불/반품 통계 데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchRefundStats);
</script>

<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">환불/반품 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="환불/반품 통계 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 요청 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalRefunds.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-undo-alt fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">요청됨</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.requestedRefunds.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-hourglass-start fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">검수 중</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.inspectingRefunds.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-search fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">승인됨</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.approvedRefunds.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
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
              <h6 class="m-0 font-weight-bold text-primary">환불/반품 상태 현황</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="refundStatusChartData" :options="refundStatusChartOptions" />
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6 mb-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">월별 환불/반품 추이 (더미)</h6>
            </div>
            <div class="card-body">
              <div class="chart-area">
                <BaseChart type="line" :data="{ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: '요청 수', data: [10, 12, 8, 15, 11, 18], backgroundColor: palette.primary, borderColor: palette.primary, fill: false }] }" />
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