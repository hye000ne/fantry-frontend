<script setup>
import { ref, computed } from 'vue'
import { getInspectionsByInventoryStatus } from '@/api/adminInspection'
import { getAuctionByInspectionId } from '@/api/auction'
import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue'
import { currencyCol } from '@/composables/useDataTableColumns'
import { useRouter } from 'vue-router'
import { useAlertDialog } from '@/composables/useAlertDialog';

import { debounce } from 'lodash-es';

const router = useRouter()
const { showAlert: showAlertDialog } = useAlertDialog();

// 상태 변수
const loading = ref(false)
const keyword = ref('')
const tableKey = ref(0)
const allStatuses = ['PENDING_REGIST', 'PENDING_ACTIVE', 'ACTIVE', 'SOLD', 'NOT_SOLD', 'CANCELED', 'REACTIVE'];
const currentFilter = ref(allStatuses) // 기본값: 전체

// Debounce 적용
const triggerRefresh = () => tableKey.value++;
const debouncedRefresh = debounce(triggerRefresh, 300);

// 필터 목록
const filters = [
  { label: '전체', value: allStatuses },
  { label: '판매 등록 대기', value: ['PENDING_REGIST'] },
  { label: '판매 대기', value: ['PENDING_ACTIVE'] },
  { label: '판매중', value: ['ACTIVE', 'REACTIVE'] },
  { label: '판매 완료', value: ['SOLD'] },
  { label: '유찰/취소', value: ['NOT_SOLD', 'CANCELED'] },
]

// --- Status Label & Badge Mappers ---
const inventoryStatusMap = {
  PENDING_REGIST: '판매 등록 대기',
  PENDING_ACTIVE: '판매 대기',
  ACTIVE: '판매중',
  SOLD: '판매 완료',
  NOT_SOLD: '유찰',
  CANCELED: '판매 취소',
  REACTIVE: '재판매중',
}
const saleStatusMap = {
  PREPARING: '판매 준비중',
  REPREPARING: '재판매 준비중',
  ACTIVE: '판매 중',
  SOLD: '판매 완료',
  NOT_SOLD: '유찰',
  CANCELLED: '판매 취소',
  REACTIVE: '재판매중',
};

const getInventoryStatusLabel = (status) => inventoryStatusMap[status] || status;
const getSaleStatusLabel = (status) => status ? (saleStatusMap[status] || status) : '미등록';

const getInventoryStatusBadge = (status) => {
  const badgeMap = {
    PENDING_REGIST: 'bg-secondary',
    PENDING_ACTIVE: 'bg-info',
    ACTIVE: 'bg-success',
    REACTIVE: 'bg-primary',
    SOLD: 'bg-dark',
    NOT_SOLD: 'bg-warning',
    CANCELED: 'bg-danger',
  }
  return badgeMap[status] || 'bg-light text-dark'
}

const getSaleStatusBadge = (status) => {
  if (!status) return 'bg-light text-dark';
  const badgeMap = {
    PREPARING: 'bg-info',
    ACTIVE: 'bg-success',
    REACTIVE: 'bg-primary',
    SOLD: 'bg-dark',
    NOT_SOLD: 'bg-warning',
    CANCELLED: 'bg-danger',
  }
  return badgeMap[status] || 'bg-secondary'
}

// fetcher: API 호출 로직 수정
async function fetchInventoryItems({ page, size, sort, keyword }) {
  loading.value = true
  try {
    // 1. 기본 재고 목록 조회
    const inspectionRes = await getInspectionsByInventoryStatus({
      statuses: currentFilter.value,
      page: page,
      size,
      sort,
      keyword,
    });

    const inspectionItems = inspectionRes?.items || [];
    if (inspectionItems.length === 0) {
      return { rows: [], total: 0 };
    }

    // 2. 각 재고에 대한 판매 정보 동시 조회 (PENDING_REGIST 상태는 제외)
    const auctionPromises = inspectionItems.map(item => {
      if (item.inventoryStatus !== 'PENDING_REGIST') {
        return getAuctionByInspectionId(item.productInspectionId).catch(() => null); // 오류 발생 시 null 반환
      } 
      return Promise.resolve(null); // PENDING_REGIST는 판매 정보가 없으므로 즉시 null 반환
    });
    const auctionResults = await Promise.all(auctionPromises);

    // 3. 판매 정보를 productInspectionId 기준으로 맵으로 변환
    const auctionMap = new Map();
    auctionResults.forEach(result => {
      if (result && result.data) {
        auctionMap.set(result.data.productInspectionId, result.data);
      }
    });

    // 4. 재고 정보와 판매 정보 조합
    const combinedRows = inspectionItems.map(item => {
      const auctionData = auctionMap.get(item.productInspectionId);
      return {
        ...item,
        auctionId: auctionData?.auctionId || null,
        saleStatus: auctionData?.saleStatus || null,
      };
    });

    return {
      rows: combinedRows,
      total: inspectionRes?.meta?.totalElements || 0,
    }
  } catch (err) {
    console.error('재고 목록 조회 실패:', err)
    showAlertDialog('오류', err.message || '데이터를 불러오는 데 실패했습니다.')
    return { rows: [], total: 0 }
  } finally {
    loading.value = false
  }
}

// 테이블 컬럼 정의 수정
const columns = computed(() => [
  { data: 'memberName', title: '회원명', className: 'text-center' },
  { data: 'goodsCategoryName', title: '카테고리', className: 'text-center' },
  { data: 'artistName', title: '아티스트', className: 'text-center' },
  { data: 'itemName', title: '상품명', className: 'text-center text-truncate' },
  { ...currencyCol('expectedPrice', '예상가'), className: 'text-end' },
  {
    data: 'inventoryStatus',
    title: '재고 상태',
    className: 'text-center',
    render: (data) => `<span class="badge ${getInventoryStatusBadge(data)}">${getInventoryStatusLabel(data)}</span>`,
  },
  {
    data: 'saleStatus',
    title: '판매 상태',
    className: 'text-center',
    render: (data) => `<span class="badge ${getSaleStatusBadge(data)}">${getSaleStatusLabel(data)}</span>`,
  },
  {
    data: null,
    title: '관리',
    sortable: false,
    className: 'text-center',
    render: (data, type, row) => {
      // inventoryStatus에 따라 동적 버튼 생성
      if (row.inventoryStatus === 'PENDING_REGIST') {
        return `<button class="btn btn-sm btn-primary px-2 btn-register" data-id="${row.productInspectionId}" data-status="${row.inventoryStatus}">판매 등록</button>`
      } else if (row.inventoryStatus === 'NOT_SOLD' || row.inventoryStatus === 'CANCELED') {
        return `<button class="btn btn-sm btn-info px-2 btn-register" data-id="${row.productInspectionId}" data-status="${row.inventoryStatus}">재등록</button>`
      }
      // PENDING_ACTIVE, ACTIVE, REACTIVE, SOLD 등
      return `<button class="btn btn-sm btn-outline-secondary px-2 btn-manage" data-id="${row.productInspectionId}" data-status="${row.inventoryStatus}">판매 관리</button>`
    },
  },
]);

// 필터 변경 시 테이블 리로드
function changeFilter(statuses) {
  currentFilter.value = statuses
  debouncedRefresh()
}

// 이벤트 위임을 통해 동적 버튼 클릭 처리
function attachClickHandlers(event) {
  const target = event.target.closest('.btn-register, .btn-manage')
  if (!target) return

  const id = target.dataset.id;
  const status = target.dataset.status;

  if (id && status) {
    router.push(`/admin/inventory/detail/${id}?status=${status}`)
  }
}
</script>

<template>
  <main class="container-fluid p-4" @click="attachClickHandlers">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <!-- 헤더 -->
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <h4 class="fw-semibold text-dark mb-1">재고 상품 목록</h4>
        <p class="text-muted small">검수가 완료된 재고 상품의 판매 상태를 관리하고, 판매 등록을 진행합니다.</p>
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
          <ServerDataTable :key="tableKey" v-model:keyword="keyword" :columns="columns" :fetcher="fetchInventoryItems" :page-size="10" :loading="loading">
            <template #empty>현재 조건에 해당하는 재고 상품이 없습니다.</template>
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

/* 테이블 스타일 (참고 파일과 동일하게 유지) */
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

:deep(th.sorting),
:deep(th.sorting_asc),
:deep(th.sorting_desc) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 4px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>