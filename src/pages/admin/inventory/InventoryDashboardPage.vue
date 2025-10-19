<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">재고 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="재고 대시보드 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <!-- 총 재고 수 (DashboardStats에 직접적인 필드 없음, 통합 통계에서 파생 필요) -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 재고 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">0</div> <!-- API에 직접적인 필드 없음 -->
                </div>
                <div class="col-auto">
                  <i class="fas fa-boxes fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 재고 부족 품목 수 (DashboardStats에 직접적인 필드 없음) -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">재고 부족 품목</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">0</div> <!-- API에 직접적인 필드 없음 -->
                </div>
                <div class="col-auto">
                  <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오늘 입고된 품목 수 (DashboardStats에 직접적인 필드 없음) -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">오늘 입고된 품목</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">0</div> <!-- API에 직접적인 필드 없음 -->
                </div>
                <div class="col-auto">
                  <i class="fas fa-truck-loading fa-2x text-gray-300"></i>
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
import { getIntegratedDashboardStats } from '@/api/dashboard.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchInventoryDashboardStats = async () => {
  loading.value = true;
  try {
    // 통합 대시보드 통계 조회
    const integratedStatsResponse = await getIntegratedDashboardStats();
    
    // DashboardStats에는 재고 관련 개별 필드가 없으므로, 여기서는 직접적인 데이터 바인딩이 어렵습니다.
    // 필요하다면 integratedStatsResponse에서 재고 관련 데이터를 파싱하거나, 별도의 API가 필요합니다.
    stats.value = integratedStatsResponse; // 전체 응답을 stats에 저장 (현재는 사용하지 않음)

  } catch (e) {
    console.error('재고 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInventoryDashboardStats);
</script>

<style scoped>
/* 필요한 스타일 추가 */
</style>
