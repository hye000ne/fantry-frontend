<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">주문 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="주문 통계 데이터를 불러오는 중..." />
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
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 주문 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalOrders?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-receipt fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">결제 완료</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.paidOrders?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">배송 중</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.shippedOrders?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-shipping-fast fa-2x text-gray-300"></i>
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
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">취소/환불 요청</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ (stats.cancelRequestedOrders + stats.refundRequestedOrders)?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
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
              <h6 class="m-0 font-weight-bold text-primary">주문 상태 현황</h6>
            </div>
            <div class="card-body">
              <div class="chart-pie pt-4 pb-2">
                <BaseChart type="doughnut" :data="orderStatusChartData" :options="orderStatusChartOptions" />
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
import { getOrderDashboardStats } from '@/api/dashboard.js';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette } from '@/composables/useChartConfig';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const palette = useChartPalette();

// 차트 데이터 및 옵션
const orderStatusChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [],
    hoverOffset: 4
  }]
});
const orderStatusChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: '주문 상태별 현황' }
  }
});

const fetchOrderDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await getOrderDashboardStats();
    stats.value = response;

    // 주문 상태별 차트 데이터 구성
    const labels = [
      '결제 대기', '결제 완료', '배송 준비중', '배송 중', '배송 완료',
      '구매 확정', '취소 요청', '취소 완료', '환불 요청', '환불 완료'
    ];
    const data = [
      stats.value.pendingPaymentOrders,
      stats.value.paidOrders,
      stats.value.preparingShipmentOrders,
      stats.value.shippedOrders,
      stats.value.deliveredOrders,
      stats.value.confirmedOrders,
      stats.value.cancelRequestedOrders,
      stats.value.cancelledOrders,
      stats.value.refundRequestedOrders,
      stats.value.refundedOrders,
    ];
    const backgroundColors = [
      palette.warning, palette.success, palette.info, palette.primary, palette.success,
      palette.dark, palette.danger, palette.danger, palette.danger, palette.dark
    ];

    orderStatusChartData.value = {
      labels: labels.filter((_, i) => data[i] > 0),
      datasets: [{
        data: data.filter(val => val > 0),
        backgroundColor: backgroundColors.filter((_, i) => data[i] > 0),
        hoverOffset: 4
      }]
    };

  } catch (e) {
    console.error('주문 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrderDashboardStats);
</script>

<style scoped>
.card-body .text-xs {
  font-size: 0.7rem;
}
.chart-pie, .chart-area {
  height: 300px;
}
</style>
