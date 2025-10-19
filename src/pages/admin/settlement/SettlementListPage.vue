<script setup>
/**
 * SettlementListPage.vue
 * - 정산 목록 (실사용) : ServerDataTable + BaseChart 통합
 */
import { ref, computed } from 'vue';
import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
import BaseChart from '@/components/common/chart/BaseChart.vue';
import { useChartPalette, makeLineDataset } from '@/composables/useChartConfig';
import { currencyCol, dateTimeCol, textCol } from '@/composables/useDataTableColumns';
import { getAdminSettlements } from '@/api/adminSettlement.js'; // API 임포트
import { debounce } from 'lodash-es';

const keyword = ref('');
const currentStatusFilter = ref(null);
const tableKey = ref(0);

// Debounce 적용
const triggerRefresh = () => tableKey.value++;
const debouncedRefresh = debounce(triggerRefresh, 300);

const statusFilters = [
  { label: '전체', value: null },
  { label: '요청됨', value: 'REQUESTED' },
  { label: '처리중', value: 'IN_PROGRESS' },
  { label: '완료됨', value: 'COMPLETED' },
  { label: '실패', value: 'FAILED' },
];

function handleStatusFilterClick(value) {
  currentStatusFilter.value = value;
  keyword.value = ''; // 검색어 초기화
  debouncedRefresh();
}

// fetcher: 실제 API 연동 시 axios 호출로 교체
async function fetchSettlements({ page, size, sort }) {
  const params = {
    page: page,
    size: size,
    sort: sort,
    status: currentStatusFilter.value,
    sellerName: keyword.value || null, // keyword를 sellerName으로 매핑
  };
  const response = await getAdminSettlements(params);
  return {
    rows: response.data.content,
    total: response.data.totalElements,
  };
}

const columns = [
  textCol('settlementId', '#'),
  textCol('sellerName', '판매자'),
  currencyCol('settlementAmount', '정산금액'),
  {
    data: 'status',
    title: '상태',
    sortable: true,
    render: (data) => {
      let badgeClass = 'bg-secondary';
      let koreanText = data;
      switch (data) {
        case 'REQUESTED': badgeClass = 'bg-primary'; koreanText = '요청됨'; break;
        case 'IN_PROGRESS': badgeClass = 'bg-info'; koreanText = '처리중'; break;
        case 'COMPLETED': badgeClass = 'bg-success'; koreanText = '완료됨'; break;
        case 'FAILED': badgeClass = 'bg-danger'; koreanText = '실패'; break;
      }
      return `<span class="badge ${badgeClass}">${koreanText}</span>`;
    },
  },
  dateTimeCol('requestedAt', '요청일'),
  dateTimeCol('completedAt', '완료일'),
];

// Chart 데이터
const palette = useChartPalette();
const chartData = computed(() => {
  const labels = Array.from({ length: 7 }).map((_, i) => `${i+1}일`);
  const dataset = makeLineDataset('일별 정산액', labels.map(() => Math.round(Math.random()*500)+200), palette.primary);
  return { labels, datasets: [dataset] };
});
const chartOptions = { scales: { y: { beginAtZero: true } } };
</script>

<template>
  <div class="settlement-list-page">
    <h1 class="h3 mb-2 text-gray-800">정산 목록</h1>
    <p class="mb-4">정산 관련 데이터를 테이블 형태로 조회하는 페이지입니다.</p>

    <div class="row g-4 mb-4">
      <div class="col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header py-2"><strong>최근 7일 정산 추이</strong></div>
          <div class="card-body">
            <BaseChart type="line" :data="chartData" :options="chartOptions" height="240" />
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 rounded-3 overflow-hidden mb-4">
      <div class="card-body p-4">
        <div class="d-flex flex-column gap-3 mb-4">
          <!-- 상태 필터 -->
          <div class="input-group input-group-sm">
            <span class="input-group-text fw-bold">상태</span>
            <div class="btn-group" role="group">
              <button
                v-for="filter in statusFilters"
                :key="filter.label"
                type="button"
                class="btn btn-outline-secondary"
                :class="{ active: currentStatusFilter === filter.value }"
                @click="handleStatusFilterClick(filter.value)"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>

        <ServerDataTable
          :key="tableKey"
          v-model:keyword="keyword"
          search-placeholder="판매자 이름으로 검색"
          :columns="columns"
          :fetcher="fetchSettlements"
          :page-size="10"
          @loaded="info => console.log('loaded', info)"
        >
          <template #empty>정산 데이터가 없습니다.</template>
          <template #cell-status="{ row }">
            <span class="badge" :class="badgeClass(row.status)">{{ row.status }}</span>
          </template>
        </ServerDataTable>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settlement-list-page {
  .badge { font-weight: 500; }
  .badge.REQUESTED { background:#007bff; } // primary
  .badge.IN_PROGRESS { background:#17a2b8; } // info
  .badge.COMPLETED { background:#28a745; } // success
  .badge.FAILED { background:#dc3545; } // danger
}
</style>
