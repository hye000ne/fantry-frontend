<script setup>
import { ref, onMounted } from 'vue'
import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue'
import { currencyCol, dateCol } from '@/composables/useDataTableColumns'
import { getMyInspections, startOfflineInspection } from '@/api/userInspection'
import { useAdminInspectionStore } from '@/stores/adminInspectionStore'
import { useModal } from '@/composables/useModal'
import { useAlertDialog } from '@/composables/useAlertDialog.js'

const adminStore = useAdminInspectionStore()
const { showAlert } = useAlertDialog()

const rootEl = ref(null)
const keyword = ref('')
const tableKey = ref(0)
const detail = ref(null)
const localRows = ref([])
const loading = ref(false)

const { initModal: initDetailModal, show: showDetailModal } = useModal('#inspectionDetailModal')

// 내 검수 목록 조회
async function fetchMyInspections({ page, size, sort }) {
  loading.value = true
  try {
    const res = await getMyInspections({ page, size, sort, keyword: keyword.value })
    const data = { rows: res?.items ?? [], total: res?.meta?.totalElements ?? 0 }

    localRows.value = data.rows
    return data
  } catch (e) {
    console.error('내 검수 목록 조회 실패', e)
    showAlert('오류', e?.message ?? '데이터를 불러오는 데 실패했습니다.')
    localRows.value = []
    return { rows: [], total: 0 }
  } finally {
    loading.value = false
  }
}

// 상세 모달 표시
function handleShowDetail(rowData) {
  detail.value = { ...rowData }
  showDetailModal()
}

// 발송 처리
async function handleStartOffline(productInspectionId) {
  const isConfirmed = await showAlert('확인', '해당 상품을 발송하시겠습니까?', true)
  if (!isConfirmed) return
  try {
    await startOfflineInspection(productInspectionId)
    showAlert('알림', '상품 발송이 처리되었습니다.')
    tableKey.value++
  } catch (e) {
    console.error('발송 처리 전환 실패', e)
    showAlert('오류', e?.message ?? '처리 중 오류가 발생했습니다.')
  }
}

// 테이블 컬럼 정의
const columns = [
  { data: 'productInspectionId', title: 'ID', className: 'text-center' },
  { data: 'itemName', title: '상품명', className: 'text-start text-truncate' },
  { data: 'goodsCategoryName', title: '카테고리', className: 'text-center' },
  { ...currencyCol('sellerHopePrice', '희망가'), className: 'text-end' },
  { ...dateCol('submittedAt', '제출일'), className: 'text-center', sortable: true },
  {
    data: 'inspectionStatus',
    title: '상태',
    className: 'text-center',
    render: (data) => `<span class="badge ${adminStore.getStatusBadge(data)}">${adminStore.getStatusLabel(data)}</span>`,
  },
  {
    data: 'productInspectionId',
    title: '동작',
    sortable: false,
    className: 'text-center',
    render: (id, type, row) => {
      const isShippable = (row?.inspectionStatus ?? '').toUpperCase() === 'ONLINE_APPROVED'
      let shipButtonHtml = ''
      if (isShippable) {
        shipButtonHtml = `<button class="btn btn-sm btn-outline-success px-2" data-action="ship" data-id="${id}">발송</button>`
      }
      const detailButtonHtml = `<button class="btn btn-sm btn-outline-primary px-2 ml-2" data-action="detail" data-id="${id}">상세</button>`
      return `<div class="d-flex justify-content-center gap-2">${shipButtonHtml} ${detailButtonHtml}</div>`
    },
  },
]

// 유틸리티
const formatDate = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '-')
const formatPrice = (v) => (v != null ? `${Number(v).toLocaleString()}원` : '-')

onMounted(() => {
  // 모달 초기화
  initDetailModal()

  if (!rootEl.value) return
  rootEl.value.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]')
    if (!button) return
    const action = button.dataset.action
    const id = parseInt(button.dataset.id, 10)
    const rowData = localRows.value.find((row) => row.productInspectionId === id)
    if (!rowData) return

    if (action === 'ship') {
      handleStartOffline(rowData.productInspectionId)
    } else if (action === 'detail') {
      handleShowDetail(rowData)
    }
  })
})
</script>

<template>
  <div class="content-page" ref="rootEl">
    <h1 class="page-title"><i class="fa-solid fa-square-check"></i> 검수 현황</h1>
    <p class="page-description">내가 신청한 상품의 검수 진행 상태를 확인하고 관리할 수 있습니다.</p>

    <ServerDataTable :key="tableKey" v-model:keyword="keyword" :columns="columns" :fetcher="fetchMyInspections" :page-size="10" :loading="loading">
      <template #empty>현재 조건에 해당하는 검수 내역이 없습니다.</template>
    </ServerDataTable>

    <!-- 로딩 오버레이 -->
    <transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
    </transition>

    <div class="modal fade" id="inspectionDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">검수 신청 상세 정보</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body" v-if="detail">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h5 class="mb-0 fw-bold">{{ detail.itemName }}</h5>
              <span class="badge fs-6" :class="adminStore.getStatusBadge(detail.inspectionStatus)">
                {{ adminStore.getStatusLabel(detail.inspectionStatus) }}
              </span>
            </div>

            <div class="info-section">
              <h6>상품 정보</h6>
              <dl class="row">
                <dt class="col-sm-3">검수 ID</dt>
                <dd class="col-sm-9">{{ detail.productInspectionId }}</dd>
                <dt class="col-sm-3">카테고리</dt>
                <dd class="col-sm-9">{{ detail.goodsCategoryName }}</dd>
                <dt class="col-sm-3">아티스트</dt>
                <dd class="col-sm-9">{{ detail.artistName }}</dd>
                <dt class="col-sm-3">상품 설명</dt>
                <dd class="col-sm-9">{{ detail.itemDescription || '-' }}</dd>
              </dl>
            </div>

            <div class="info-section">
              <h6>가격 정보</h6>
              <dl class="row">
                <dt class="col-sm-3">판매 희망가</dt>
                <dd class="col-sm-9">{{ formatPrice(detail.sellerHopePrice) }}</dd>
                <template v-if="detail.inspectionStatus === 'COMPLETED'">
                  <dt class="col-sm-3 text-primary">최종 매입가</dt>
                  <dd class="col-sm-9 fw-bold text-primary">{{ formatPrice(detail.finalBuyPrice) }}</dd>
                </template>
              </dl>
            </div>

            <div class="info-section">
              <h6>검수 상태 및 일자</h6>
              <dl class="row">
                <dt class="col-sm-3">제출일</dt>
                <dd class="col-sm-9">{{ formatDate(detail.submittedAt) || '-' }}</dd>
                <dt class="col-sm-3">1차 검수일</dt>
                <dd class="col-sm-9">{{ formatDate(detail.onlineInspectedAt) || '-' }}</dd>
                <dt class="col-sm-3">2차 검수일</dt>
                <dd class="col-sm-9">{{ formatDate(detail.offlineInspectedAt) || '-' }}</dd>
                <template v-if="detail.inspectionStatus === 'COMPLETED'">
                  <dt class="col-sm-3">최종 승인일</dt>
                  <dd class="col-sm-9">{{ formatDate(detail.completedAt) || '-' }}</dd>
                </template>
              </dl>
            </div>

            <div v-if="detail.inspectionStatus === 'ONLINE_REJECTED'" class="alert alert-danger mt-3"><strong>1차 반려 사유:</strong> {{ detail.firstRejectionReason || '사유 없음' }}</div>
            <div v-if="detail.inspectionStatus === 'OFFLINE_REJECTED'" class="alert alert-danger mt-3"><strong>최종 반려 사유:</strong> {{ detail.secondRejectionReason || '사유 없음' }}</div>
            <div v-if="detail.inspectionStatus === 'COMPLETED' && detail.priceDeductionReason" class="alert alert-info mt-3"><strong>감가 사유:</strong> {{ detail.priceDeductionReason }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-page {
  max-width: 900px;
  margin: 20px auto;
  padding: 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #f0f0f0;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.page-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 0.95rem;
}

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

/* 모달 스타일 개선 */
.modal-body {
  padding: 1.5rem;
}
.modal-title {
  font-weight: 600;
}
.info-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}
.info-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}
.info-section h6 {
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.modal-body dl {
  font-size: 0.9rem;
}
.modal-body dt {
  color: #6c757d;
  font-weight: 500;
}
.modal-body dd {
  color: #212529;
}
.alert {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}
</style>
