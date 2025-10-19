<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">재무/운영 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="재무/운영 대시보드 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <!-- 총 정산 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 정산 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.settlementStats?.totalSettlements?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-calculator fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 미정산 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">미정산 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.settlementStats?.pendingSettlements?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-hourglass-half fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 정산 완료 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">정산 완료 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.settlementStats?.paidSettlements?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 총 환불 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">총 환불 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.refundStats?.totalRefunds?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-undo-alt fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 환불 요청 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">환불 요청 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.refundStats?.requestedRefunds?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-exclamation-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 환불 처리 중인 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-secondary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-secondary text-uppercase mb-1">환불 처리 중인 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.refundStats?.inTransitRefunds?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-truck-loading fa-2x text-gray-300"></i>
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
              <h6 class="m-0 font-weight-bold text-primary">정산 상태별 분포</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="settlementStatusDistributionChartData" :options="settlementStatusDistributionChartOptions" />
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6 mb-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">반품 사유별 분포</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="returnReasonDistributionChartData" :options="returnReasonDistributionChartOptions" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFinanceOperationsDashboardStats } from '@/api/dashboard.js';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette } from '@/composables/useChartConfig';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const palette = useChartPalette();

// 정산 상태별 분포 차트 데이터 및 옵션
const settlementStatusDistributionChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const settlementStatusDistributionChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '정산 상태별 분포' }
  }
});

// 반품 사유별 분포 차트 데이터 및 옵션
const returnReasonDistributionChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const returnReasonDistributionChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '반품 사유별 분포' }
  }
});

// 통화 형식 포맷터
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0';
  return `₩${new Intl.NumberFormat('ko-KR').format(value)}`;
};

const fetchFinanceOperationsDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await getFinanceOperationsDashboardStats();
    stats.value = {
      settlementStats: response.settlementStats || {},
      refundStats: response.refundStats || {},
    };

    // 정산 상태별 분포
    const settlementStatusLabels = [
      '총 정산 건수', '미정산 건수', '정산 완료 건수', '취소된 정산 건수', '실패한 정산 건수'
    ];
    const settlementStatusData = [
      stats.value.settlementStats.totalSettlements,
      stats.value.settlementStats.pendingSettlements,
      stats.value.settlementStats.paidSettlements,
      stats.value.settlementStats.cancelledSettlements,
      stats.value.settlementStats.failedSettlements,
    ];
    const settlementStatusColors = [
      palette.primary, palette.warning, palette.success, palette.danger, palette.dark
    ];

    settlementStatusDistributionChartData.value = {
      labels: settlementStatusLabels.filter((_, i) => settlementStatusData[i] > 0),
      datasets: [{
        data: settlementStatusData.filter(val => val > 0),
        backgroundColor: settlementStatusColors.filter((_, i) => settlementStatusData[i] > 0),
        hoverOffset: 4
      }]
    };

    // 반품 사유별 분포 (RefundStats에는 사유별 데이터가 없으므로, 상태별로 대체)
    const returnReasonLabels = [
      '총 환불 건수', '환불 요청 건수', '환불 처리 중인 건수', '환불 검수 중인 건수', '승인된 환불 건수', '거부된 환불 건수', '완료된 환불 건수', '사용자 취소 환불 건수'
    ];
    const returnReasonData = [
      stats.value.refundStats.totalRefunds,
      stats.value.refundStats.requestedRefunds,
      stats.value.refundStats.inTransitRefunds,
      stats.value.refundStats.inspectingRefunds,
      stats.value.refundStats.approvedRefunds,
      stats.value.refundStats.rejectedRefunds,
      stats.value.refundStats.completedRefunds,
      stats.value.refundStats.userCancelledRefunds,
    ];
    const returnReasonColors = [
      palette.primary, palette.warning, palette.info, palette.secondary, palette.success, palette.danger, palette.dark, palette.light
    ];

    returnReasonDistributionChartData.value = {
      labels: returnReasonLabels.filter((_, i) => returnReasonData[i] > 0),
      datasets: [{
        data: returnReasonData.filter(val => val > 0),
        backgroundColor: returnReasonColors.filter((_, i) => returnReasonData[i] > 0),
        hoverOffset: 4
      }]
    };

  } catch (e) {
    console.error('재무/운영 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchFinanceOperationsDashboardStats);
</script>

<style scoped>
.card-body .text-xs {
  font-size: 0.7rem;
}
.chart-pie, .chart-area {
  height: 300px;
}
</style>
