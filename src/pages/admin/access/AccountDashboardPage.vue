<script setup>
import { ref, onMounted } from 'vue';
import { getAccountStats } from '@/api/dashboard.js';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette } from '@/composables/useChartConfig';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const palette = useChartPalette();

// 차트 데이터 및 옵션
const accountStatusChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const accountStatusChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '계좌 상태 현황' }
  }
});

const fetchAccountStats = async () => {
  loading.value = true;
  try {
    const response = await getAccountStats();
    stats.value = response;

    // 계좌 상태별 차트 데이터 구성
    const labels = [
      '총 계좌 수', '활성화된 계좌', '비활성화된 계좌', '환불 가능 계좌', '환불 불가능 계좌'
    ];
    const data = [
      stats.value.totalAccounts,
      stats.value.activeAccounts,
      stats.value.inactiveAccounts,
      stats.value.refundableAccounts,
      stats.value.nonRefundableAccounts,
    ];
    const backgroundColors = [
      palette.primary, palette.success, palette.danger, palette.info, palette.warning
    ];

    accountStatusChartData.value = {
      labels: labels.filter((_, i) => data[i] > 0),
      datasets: [{
        data: data.filter(val => val > 0),
        backgroundColor: backgroundColors.filter((_, i) => data[i] > 0),
        hoverOffset: 4
      }]
    };

  } catch (e) {
    console.error('계좌 통계 조회 실패:', e);
    error.value = '계좌 통계 데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAccountStats);
</script>

<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">계좌 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="계좌 통계 데이터를 불러오는 중..." />
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
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 계좌 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalAccounts.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-wallet fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">활성화된 계좌</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.activeAccounts.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">비활성화된 계좌</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.inactiveAccounts.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-times-circle fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">환불 가능 계좌</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.refundableAccounts.toLocaleString() }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-exchange-alt fa-2x text-gray-300"></i>
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
              <h6 class="m-0 font-weight-bold text-primary">계좌 상태 현황</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="accountStatusChartData" :options="accountStatusChartOptions" />
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6 mb-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">월별 계좌 등록 추이 (더미)</h6>
            </div>
            <div class="card-body">
              <div class="chart-area">
                <BaseChart type="line" :data="{ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: '등록 수', data: [10, 15, 12, 18, 16, 20], backgroundColor: palette.primary, borderColor: palette.primary, fill: false }] }" />
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
