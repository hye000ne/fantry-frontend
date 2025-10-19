<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">판매 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="판매 대시보드 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <!-- 총 판매된 상품 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 판매된 상품 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalSalesProducts?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-box fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 총 판매 금액 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">총 판매 금액</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(stats.totalSoldAmount) }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 섹션은 API 데이터 부족으로 제거 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSalesDashboardStats } from '@/api/dashboard.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);

// 통화 형식 포맷터
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0';
  return `₩${new Intl.NumberFormat('ko-KR').format(value)}`;
};

const fetchSalesDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await getSalesDashboardStats();
    stats.value = response;

  } catch (e) {
    console.error('판매 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSalesDashboardStats);
</script>

<style scoped>
/* 필요한 스타일 추가 */
</style>