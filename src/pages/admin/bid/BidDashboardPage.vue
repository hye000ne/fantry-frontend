<script setup>
import { ref, onMounted } from 'vue';
import { getBidDashboardStats } from '@/api/dashboard.js';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette } from '@/composables/useChartConfig';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const palette = useChartPalette();

// 차트 데이터 및 옵션
const bidStatusChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const bidStatusChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '입찰 현황 요약' }
  }
});

const fetchBidDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await getBidDashboardStats();
    stats.value = response;

    // 입찰 현황 차트 데이터 구성
    const labels = [
      '총 입찰 수', '진행 중인 경매 입찰 수', '오늘 입찰 수'
    ];
    const data = [
      stats.value.totalBids,
      stats.value.bidsOnActiveAuctions,
      stats.value.bidsToday,
    ];
    const backgroundColors = [
      palette.primary, palette.info, palette.success
    ];

    bidStatusChartData.value = {
      labels: labels.filter((_, i) => data[i] > 0),
      datasets: [{
        data: data.filter(val => val > 0),
        backgroundColor: backgroundColors.filter((_, i) => data[i] > 0),
        hoverOffset: 4
      }]
    };

  } catch (e) {
    console.error('입찰 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchBidDashboardStats);
</script>

<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">입찰 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="입찰 통계 데이터를 불러오는 중..." />
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
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 입찰 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalBids?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-gavel fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">진행 중 경매 입찰</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.bidsOnActiveAuctions?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-hourglass-half fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">오늘 입찰 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.bidsToday?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-calendar-day fa-2x text-gray-300"></i>
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
              <h6 class="m-0 font-weight-bold text-primary">입찰 현황 요약</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="bidStatusChartData" :options="bidStatusChartOptions" />
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
