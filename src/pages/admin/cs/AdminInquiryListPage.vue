<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
import { searchInquiries } from '@/api/adminInquiry.js';
import { debounce } from 'lodash-es';

const router = useRouter();
const route = useRoute();
const table = ref(null);

const tableKey = ref(0);
const keyword = ref('');
const currentStatusFilter = ref(null);
const currentTypeFilter = ref(null);

// Debounce 적용
const triggerRefresh = () => tableKey.value++;
const debouncedRefresh = debounce(triggerRefresh, 300); // 300ms 지연

const statusFilters = [
  { label: '전체', value: null },
  { label: '답변 대기', value: 'PENDING' },
  { label: '처리 중', value: 'IN_PROGRESS' },
  { label: '보류 중', value: 'ON_HOLD' },
  { label: '답변 완료', value: 'ANSWERED' },
  { label: '거절됨', value: 'REJECTED' },
];

const typeFilters = [
  { label: '전체', value: null },
  { label: '배송문의', value: 1 },
  { label: '결제문의', value: 2 },
  { label: '기타문의', value: 3 },
  { label: '상품문의', value: 4 },
  { label: '환불/반품 문의', value: 5 },
  { label: '판매 문의', value: 6 },
];

function handleStatusFilterClick(value) {
  currentStatusFilter.value = value;
  debouncedRefresh();
}

function handleTypeFilterClick(value) {
  currentTypeFilter.value = value;
  debouncedRefresh();
}

async function fetcher({ page, size, sort, keyword }) {
  const unwrappedResponse = await searchInquiries({
    page: page,
    size: size,
    sort: sort,
    status: currentStatusFilter.value,
    csTypeId: currentTypeFilter.value,
    memberName: keyword || null,
  });
  return {
    rows: unwrappedResponse.content,
    total: unwrappedResponse.totalElements,
  };
}

const formatDateTime = (dt) => {
  if (!dt || !Array.isArray(dt) || dt.length < 5) return '-';
  const [year, month, day, hour, minute] = dt;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const columns = [
  { data: 'inquiryId', title: '#', className: 'text-center' },
  {
    data: 'csType',
    title: '문의 유형',
    className: 'text-center',
    render: (data) => {
      let typeName = 'N/A';
      if (typeof data === 'string') {
        typeName = data;
      } else if (data && data.name) {
        typeName = data.name;
      }
      let badgeClass = 'bg-secondary text-white'; // Default to white text
      if (typeName === '환불/반품 문의') {
        badgeClass = 'bg-danger text-white';
      }
      return `<span class="badge ${badgeClass}">${typeName}</span>`;
    },
  },
  {
    data: 'title',
    title: '제목',
    className: 'text-left clickable-title-cell',
    render: (data, type, row) => {
      return `<span class="inquiry-title" data-inquiry-id="${row.inquiryId}" style="color: blue; cursor: pointer; text-decoration: underline;">${data}</span>`;
    }
  },
  { data: 'inquiredByName', title: '작성자', className: 'text-center' },
  {
    data: 'status',
    title: '상태',
    className: 'text-center',
    render: (data) => {
      let badgeClass = 'bg-secondary';
      let text = data;
      switch (data) {
        case 'PENDING':
          badgeClass = 'bg-primary';
          text = '답변 대기';
          break;
        case 'IN_PROGRESS':
          badgeClass = 'bg-info';
          text = '처리 중';
          break;
        case 'ANSWERED':
          badgeClass = 'bg-success';
          text = '답변 완료';
          break;
        case 'ON_HOLD':
          badgeClass = 'bg-warning text-dark';
          text = '보류 중';
          break;
        case 'REJECTED':
          badgeClass = 'bg-dark';
          text = '거절됨';
          break;
      }
      return `<span class="badge ${badgeClass}">${text}</span>`;
    },
  },
  {
    data: 'inquiredAt',
    title: '등록일',
    className: 'text-center',
    render: (val) => formatDateTime(val)
  },
];

function handleRowClick(row) {
  // This function is now redundant as click handling is done via attachClickHandlers
  // but kept for reference or if other parts of the row need to be clickable.
  console.log("handleRowClick (redundant for title click):", row);
}

function attachClickHandlers() {
  nextTick(() => {
    const titleElements = document.querySelectorAll('.inquiry-title');
    titleElements.forEach(el => {
      if (el.dataset.bound) return;
      el.dataset.bound = 'true';
      
      el.addEventListener('click', (e) => {
        const inquiryId = e.target.dataset.inquiryId;
        router.push({
          name: 'AdminInquiryDetail',
          params: { inquiryId }
        });
      });
    });
  });
}

onMounted(() => {
  if (route.query.status) {
    const initialStatus = route.query.status.toString();
    const isValidStatus = statusFilters.some(f => f.value === initialStatus);
    if (isValidStatus) {
      currentStatusFilter.value = initialStatus;
      tableKey.value++;
    }
  }
  // 초기 로드 후에도 바인딩
  setTimeout(attachClickHandlers, 500);
});
</script>

<template>
  <main class="container-fluid p-4">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <h4 class="fw-semibold text-dark mb-1">1:1 문의 목록</h4>
        <p class="text-muted small">사용자들이 등록한 1:1 문의를 확인하고 답변을 관리합니다.</p>
      </div>

      <div class="card-body p-4">
        <div class="d-flex flex-column gap-3 mb-4">
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
          <div class="input-group input-group-sm">
            <span class="input-group-text fw-bold">유형</span>
            <div class="btn-group" role="group">
              <button
                v-for="filter in typeFilters"
                :key="filter.label"
                type="button"
                class="btn btn-outline-secondary"
                :class="{ active: currentTypeFilter === filter.value }"
                @click="handleTypeFilterClick(filter.value)"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>

        <ServerDataTable
          ref="table"
          :key="tableKey"
          v-model:keyword="keyword"
          :columns="columns"
          :fetcher="fetcher"
          @loaded="attachClickHandlers"
        >
          <template #empty>현재 조건에 해당하는 문의 내역이 없습니다.</template>
        </ServerDataTable>
      </div>
    </div>
  </main>
</template>

<style scoped>
:deep(table td){
  pointer-events: none;
}

:deep(table td .inquiry-title){
  pointer-events: auto;
}

:deep(table tbody tr:hover) {
  background-color: #f8f9fa;
  cursor: pointer;
}
</style>