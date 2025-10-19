<template>
  <div class="container-fluid">
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">전체 통합 대시보드</h1>
      <button @click="showSettings = !showSettings" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
        <i class="fas fa-cogs fa-sm text-white-50"></i> 대시보드 설정
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="통합 대시보드 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div v-for="category in uniqueCategories" :key="category" class="mb-4">
        <template v-if="hasVisibleMetrics(category)">
          <DashboardCardGroup :title="category">
            <div class="row">
              <template v-for="metric in metricsByCategory[category]" :key="metric.id">
                <div v-if="selectedMetrics.includes(metric.id)" class="col-xl-3 col-md-6 mb-4">
                  <div :class="`card border-left-${metric.color} shadow h-100 py-2`">
                    <div class="card-body">
                      <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                          <div :class="`text-xs font-weight-bold text-${metric.color} text-uppercase mb-1`">{{ metric.label }}</div>
                          <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <template v-if="metric.format === 'currency'">{{ formatCurrency(stats[metric.id]) }}</template>
                            <template v-else>{{ stats[metric.id]?.toLocaleString() || '0' }}</template>
                          </div>
                        </div>
                        <div class="col-auto">
                          <i :class="`fas ${metric.icon} fa-2x text-gray-300`"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </DashboardCardGroup>
        </template>
      </div>

      <!-- 차트 섹션은 API 데이터 부족으로 제거 -->
    </div>

    <!-- 대시보드 설정 모달/사이드바 -->
    <div v-if="showSettings" class="dashboard-settings-panel">
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 font-weight-bold text-primary">대시보드 설정</h6>
          <button @click="showSettings = false" class="btn btn-sm btn-secondary">
            <i class="fas fa-times"></i> 닫기
          </button>
        </div>
        <div class="card-body">
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="selectAll" :checked="isAllSelected" :indeterminate="isAllIndeterminate" @change="toggleAllMetrics">
            <label class="form-check-label font-weight-bold" for="selectAll">
              전체 선택/해제
            </label>
          </div>

          <div v-for="(category, index) in uniqueCategories" :key="category" class="mb-3">
            <h5 class="text-primary mb-2 d-flex align-items-center">
              <div class="form-check form-check-inline mr-2">
                <input class="form-check-input" type="checkbox" :id="`selectCategory-${category}`" :checked="isCategorySelected(category)" :indeterminate="isCategoryIndeterminate(category)" @change="toggleCategoryMetrics(category)">
              </div>
              {{ category }}
            </h5>
            <div class="form-group ml-3">
              <div v-for="metric in metricsByCategory[category]" :key="metric.id" class="form-check">
                <input class="form-check-input" type="checkbox" :id="metric.id" :value="metric.id" v-model="selectedMetrics">
                <label class="form-check-label" :for="metric.id">
                  {{ metric.label }}
                </label>
              </div>
            </div>
            <hr v-if="index < uniqueCategories.length - 1" class="my-3">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getIntegratedDashboardStats } from '@/api/dashboard.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import DashboardCardGroup from '@/components/common/dashboard/DashboardCardGroup.vue'; // DashboardCardGroup 임포트

const stats = ref(null);
const loading = ref(true);
const error = ref(null);
const showSettings = ref(false);

const metrics = [
  // 회원 관리
  { id: 'totalUsers', label: '총 사용자 수', icon: 'fa-users', color: 'primary', category: '회원 관리' },
  { id: 'todayRegisteredUsers', label: '오늘 가입한 사용자', icon: 'fa-user-plus', color: 'success', category: '회원 관리' },
  { id: 'totalAccounts', label: '총 계정 수', icon: 'fa-user-circle', color: 'dark', category: '회원 관리' },
  { id: 'activeAccounts', label: '활성 계정 수', icon: 'fa-user-check', color: 'light', category: '회원 관리' },
  { id: 'totalReports', label: '총 신고 건수', icon: 'fa-flag', color: 'secondary', category: '회원 관리' },
  { id: 'receivedReports', label: '접수된 신고 건수', icon: 'fa-inbox', color: 'dark', category: '회원 관리' },

  // 재고 관리
  { id: 'totalInventoryItems', label: '총 재고 수', icon: 'fa-boxes', color: 'primary', category: '재고 관리' }, // Placeholder
  { id: 'lowStockItems', label: '재고 부족 품목', icon: 'fa-exclamation-triangle', color: 'warning', category: '재고 관리' }, // Placeholder
  { id: 'todayReceivedItems', label: '오늘 입고된 품목', icon: 'fa-truck-loading', color: 'success', category: '재고 관리' }, // Placeholder

  // 판매 관리
  { id: 'totalSalesProducts', label: '총 판매된 상품 수', icon: 'fa-box', color: 'primary', category: '판매 관리' }, // Placeholder
  { id: 'totalSoldAmount', label: '총 판매 금액', icon: 'fa-dollar-sign', color: 'success', format: 'currency', category: '판매 관리' }, // Placeholder

  // 주문 관리
  { id: 'totalOrders', label: '총 주문 수', icon: 'fa-receipt', color: 'primary', category: '주문 관리' }, // Placeholder
  { id: 'todayOrders', label: '오늘 주문 수', icon: 'fa-calendar-day', color: 'success', category: '주문 관리' }, // Placeholder
  { id: 'cancelledOrders', label: '취소된 주문 수', icon: 'fa-times-circle', color: 'danger', category: '주문 관리' }, // Placeholder
  { id: 'refundedOrders', label: '환불된 주문 수', icon: 'fa-undo-alt', color: 'info', category: '주문 관리' }, // Placeholder

  // 입찰 관리
  { id: 'totalAuctions', label: '총 경매 수', icon: 'fa-gavel', color: 'info', category: '입찰 관리' },
  { id: 'ongoingAuctions', label: '진행 중인 경매', icon: 'fa-hourglass-half', color: 'warning', category: '입찰 관리' },
  { id: 'totalBids', label: '총 입찰 수', icon: 'fa-gavel', color: 'danger', category: '입찰 관리' },
  { id: 'bidsToday', label: '오늘 입찰 수', icon: 'fa-calendar-day', color: 'secondary', category: '입찰 관리' },

  // 검수 관리
  { id: 'totalInspections', label: '총 검수 건수', icon: 'fa-clipboard-check', color: 'info', category: '검수 관리' },
  { id: 'submittedInspections', label: '제출된 검수 건수', icon: 'fa-file-upload', color: 'warning', category: '검수 관리' },

  // 카탈로그 관리
  { id: 'totalArtists', label: '총 아티스트 수', icon: 'fa-microphone-alt', color: 'primary', category: '카탈로그 관리' },
  { id: 'approvedArtists', label: '승인된 아티스트 수', icon: 'fa-check-double', color: 'success', category: '카탈로그 관리' },
  { id: 'totalChecklistTemplates', label: '총 체크리스트 템플릿 수', icon: 'fa-list-alt', color: 'danger', category: '카탈로그 관리' },

  // CS 관리
  { id: 'totalInquiries', label: '총 문의 수', icon: 'fa-comments', color: 'danger', category: 'CS 관리' },
  { id: 'unansweredInquiries', label: '미답변 문의', icon: 'fa-question-circle', color: 'secondary', category: 'CS 관리' },
  { id: 'totalNotices', label: '총 공지사항 수', icon: 'fa-bullhorn', color: 'success', category: 'CS 관리' },
  { id: 'activeNotices', label: '활성 공지사항 수', icon: 'fa-check-circle', color: 'primary', category: 'CS 관리' },
  { id: 'totalFaqs', label: '총 FAQ 수', icon: 'fa-question-circle', color: 'info', category: 'CS 관리' },
  { id: 'activeFaqs', label: '활성 FAQ 수', icon: 'fa-check-double', color: 'warning', category: 'CS 관리' },

  // 재무/운영 관리
  { id: 'totalPayments', label: '총 결제 금액', icon: 'fa-credit-card', color: 'dark', format: 'currency', category: '재무/운영 관리' },
  { id: 'todayPayments', label: '오늘 결제 금액', icon: 'fa-money-bill-wave', color: 'light', format: 'currency', category: '재무/운영 관리' },
  { id: 'totalSettlements', label: '총 정산 건수', icon: 'fa-calculator', color: 'primary', category: '재무/운영 관리' },
  { id: 'pendingSettlements', label: '미정산 건수', icon: 'fa-hourglass-half', color: 'warning', category: '재무/운영 관리' },
  { id: 'totalRefunds', label: '총 환불 건수', icon: 'fa-undo-alt', color: 'danger', category: '재무/운영 관리' },
  { id: 'requestedRefunds', label: '환불 요청 건수', icon: 'fa-exclamation-circle', color: 'info', category: '재무/운영 관리' },
];

const selectedMetrics = ref(metrics.map(m => m.id)); // 모든 지표를 기본적으로 선택

const categoryOrder = [
  '회원 관리',
  '재고 관리',
  '판매 관리',
  '주문 관리',
  '입찰 관리',
  '검수 관리',
  '카탈로그 관리',
  'CS 관리',
  '재무/운영 관리',
];

const uniqueCategories = computed(() => {
  const categories = [...new Set(metrics.map(m => m.category))];
  return categories.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
});

const metricsByCategory = computed(() => {
  return metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});
});

// 전체 선택/해제 관련 computed 속성 및 함수
const isAllSelected = computed(() => selectedMetrics.value.length === metrics.length);
const isAllIndeterminate = computed(() => selectedMetrics.value.length > 0 && !isAllSelected.value);

const toggleAllMetrics = (event) => {
  if (event.target.checked) {
    selectedMetrics.value = metrics.map(m => m.id);
  } else {
    selectedMetrics.value = [];
  }
};

// 카테고리별 선택/해제 관련 computed 속성 및 함수
const isCategorySelected = (category) => {
  const categoryMetricIds = metricsByCategory.value[category].map(m => m.id);
  return categoryMetricIds.every(id => selectedMetrics.value.includes(id));
};

const isCategoryIndeterminate = (category) => {
  const categoryMetricIds = metricsByCategory.value[category].map(m => m.id);
  const selectedCategoryMetrics = categoryMetricIds.filter(id => selectedMetrics.value.includes(id));
  return selectedCategoryMetrics.length > 0 && selectedCategoryMetrics.length < categoryMetricIds.length;
};

const toggleCategoryMetrics = (category) => {
  const categoryMetricIds = metricsByCategory.value[category].map(m => m.id);
  if (isCategorySelected(category)) {
    // 현재 카테고리가 모두 선택되어 있으면 모두 해제
    selectedMetrics.value = selectedMetrics.value.filter(id => !categoryMetricIds.includes(id));
  } else {
    // 현재 카테고리가 모두 선택되어 있지 않으면 모두 선택
    selectedMetrics.value = [...new Set([...selectedMetrics.value, ...categoryMetricIds])];
  }
};

const hasVisibleMetrics = computed(() => (category) => {
  const categoryMetricIds = metricsByCategory.value[category].map(m => m.id);
  return categoryMetricIds.some(id => selectedMetrics.value.includes(id));
});

// 통화 형식 포맷터
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0';
  return `₩${new Intl.NumberFormat('ko-KR').format(value)}`;
};

const fetchOverallIntegratedDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await getIntegratedDashboardStats();
    stats.value = response;

  } catch (e) {
    console.error('전체 통합 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOverallIntegratedDashboardStats);
</script>

<style scoped>
.card-body .text-xs {
  font-size: 0.7rem;
}

.dashboard-settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px; /* 또는 원하는 너비 */
  height: 100%;
  background-color: white;
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
  z-index: 1050;
  padding: 20px;
  overflow-y: auto;
}

.dashboard-settings-panel .form-check-label {
  font-size: 0.9rem;
}
</style>