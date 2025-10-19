<script setup>
import { ref } from 'vue'
import { getInspectionsByStatus } from '@/api/adminInspection'
import { useAdminInspectionStore } from '@/stores/adminInspectionStore'
import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue'
import { currencyCol, dateCol } from '@/composables/useDataTableColumns'
import { useAlertDialog } from '@/composables/useAlertDialog.js';

import { debounce } from 'lodash-es';

const {showAlert} = useAlertDialog();
const adminStore = useAdminInspectionStore()

// 상태 변수
const loading = ref(false) // 로딩 상태
const keyword = ref('')
const tableKey = ref(0) // 필터 변경 시 테이블을 강제로 리로드하기 위한 키
const currentFilter = ref(['OFFLINE_INSPECTING']) // 기본값: 진행 중

// Debounce 적용
const triggerRefresh = () => tableKey.value++;
const debouncedRefresh = debounce(triggerRefresh, 300);

// 필터 목록
const filters = [
  { label: '전체', value: ['ONLINE_APPROVED', 'OFFLINE_INSPECTING', 'OFFLINE_REJECTED', 'COMPLETED'] },
  { label: '대기', value: ['ONLINE_APPROVED'] },
  { label: '진행 중', value: ['OFFLINE_INSPECTING'] },
  { label: '승인', value: ['COMPLETED'] },
  { label: '반려', value: ['OFFLINE_REJECTED'] },
]

// fetcher : 2차 검수 신청 목록 조회
async function fetchInspections({ page, size, sort, keyword }) {
  loading.value = true
  try {
    const res = await getInspectionsByStatus({
      statuses: currentFilter.value,
      page: page,
      size,
      sort,
      keyword,
    })

    return {
      rows: res?.items || [],
      total: res?.meta?.totalElements || 0,
    }
  } catch (err) {
    console.error('2차 검수 목록 조회 실패:', err)
    showAlert('오류', err.message || '데이터를 불러오는 데 실패했습니다.')
    return { rows: [], total: 0 }
  } finally {
    loading.value = false
  }
}

// 테이블 컬럼 정의
const columns = [
  { data: 'productInspectionId', title: 'ID', className: 'text-center w-5' },
  { data: 'memberName', title: '회원명', className: 'text-center' },
  { data: 'goodsCategoryName', title: '카테고리', className: 'text-center' },
  { data: 'artistName', title: '아티스트', className: 'text-center' },
  { data: 'itemName', title: '상품명', className: 'text-center text-truncate' },
  { ...currencyCol('expectedPrice', '예상가'), className: 'text-end' },
  { ...currencyCol('sellerHopePrice', '희망가'), className: 'text-end' },
  { ...dateCol('submittedAt', '제출일'), className: 'text-center' },
  {
    data: 'inspectionStatus',
    title: '상태',
    className: 'text-center',
    render: (data) => `<span class="badge ${adminStore.getStatusBadge(data)}">${adminStore.getStatusLabel(data)}</span>`,
  },
  {
    data: null,
    title: '관리',
    sortable: false,
    className: 'text-center',
    render: (data, type, row) => `<a href="/admin/inspection/offline/${row.productInspectionId}" class="btn btn-sm btn-outline-primary px-2">상세</a>`,
  },
]

// 필터 변경 시 테이블 리로드
function changeFilter(statuses) {
  currentFilter.value = statuses
  debouncedRefresh()
}
</script>

<template>
  <main class="container-fluid p-4">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <!-- 헤더 -->
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <h4 class="fw-semibold text-dark mb-1">2차 오프라인 검수 목록</h4>
        <p class="text-muted small">1차 검수 완료된 상품의 2차 오프라인 검수 내역을 확인하고 상세 검수(승인/반려)를 진행합니다.</p>
      </div>

      <!-- 필터 버튼 -->
      <div class="card-body p-4">
        <div class="btn-group mb-3" role="group">
          <button
            v-for="filter in filters"
            :key="filter.label"
            type="button"
            class="btn btn-sm fw-medium px-3 py-1"
            :class="JSON.stringify(currentFilter) === JSON.stringify(filter.value) ? 'btn-dark text-white' : 'btn-outline-secondary text-muted hover-btn'"
            @click="changeFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- 테이블 -->
        <div class="position-relative">
          <ServerDataTable :key="tableKey" v-model:keyword="keyword" :columns="columns" :fetcher="fetchInspections" :page-size="10" :loading="loading">
            <template #empty>현재 조건에 해당하는 검수 내역이 없습니다.</template>
          </ServerDataTable>

          <!-- 로딩 오버레이 -->
          <transition name="fade">
            <div v-if="loading" class="loading-overlay">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped lang="scss">
/* 카드 타이틀 */
.card-header h4 {
  font-size: 1.25rem;
}

/* hover 버튼 */
.hover-btn:hover {
  background-color: #f3f3f3;
  border-color: #bbb;
  color: #222 !important;
}

/* 테이블 정렬/디자인 통일 */
:deep(.datatable-wrapper) {
  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #333;
    text-align: center !important;
    vertical-align: middle;
  }
  td {
    text-align: center !important;
    vertical-align: middle !important;
    padding: 0.9rem 0.75rem;
    white-space: nowrap;
  }
  td.text-end {
    text-align: right !important;
  }
  tr:hover td {
    background-color: #f8f9fa;
  }
}

/* 정렬 화살표 중앙 배치 */
:deep(th.sorting),
:deep(th.sorting_asc),
:deep(th.sorting_desc) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 4px;
}

/* 로딩 오버레이 */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
  z-index: 10;
}

/* 페이드 전환 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
