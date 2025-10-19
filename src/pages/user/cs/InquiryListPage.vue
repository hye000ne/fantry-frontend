<script setup>
  import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
  import { ref, nextTick, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { getMyInquiryList } from '@/api/inquiry';
  import { formatDateTime } from '@/utils/tableFormatters.js';

  const router = useRouter();
  const dataTableRef = ref(null);
  const keyword = ref('');
  const loading = ref(false);

  function statusLabel(status) {
    if (!status) return '기타';
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PENDING': return '답변대기';
      case 'IN_PROGRESS': return '처리중';
      case 'ON_HOLD': return '보류';
      case 'REJECTED': return '거절(스팸)';
      case 'ANSWERED': return '답변완료';
      default: return status;
    }
  }

  function statusClass(status) {
    const s = (status || '').toString().toUpperCase();
    switch (s) {
      case 'PENDING': return 'bg-primary';
      case 'IN_PROGRESS': return 'bg-info';
      case 'ON_HOLD': return 'bg-warning text-dark';
      case 'REJECTED': return 'bg-dark';
      case 'ANSWERED': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  // 테이블 컬럼 정의
  const columns = [
    {
      data: 'inquiryId',
      title: 'No.',
      sortable: false,
      render: (data, type, row, meta) => {
        return meta.row + 1 + (meta.settings._iDisplayStart || 0);
      }
    },
    {
      data: 'title',
      title: '제목',
      sortable: false,
      className: 'text-start',
      render: (data, type, row) => {
        let html = `<div class="inquiry-title" data-inquiry-id="${row.inquiryId}" style="cursor: pointer;">`;
        html += `<div class="fw-bold text-primary">${data}</div>`;
        if (row.answerContent) {
          html += `<div class="text-muted small mt-1">답변: ${row.answerContent}</div>`;
        }
        html += `</div>`;
        return html;
      }
    },
    {
      data: 'inquiredByName',
      title: '작성자',
      sortable: true,
      render: (data) => data || '-'
    },
    {
      data: 'status',
      title: '상태',
      sortable: true,
      render: (data) => {
        const label = statusLabel(data);
        const badgeClass = statusClass(data);
        return `<span class="badge ${badgeClass}">${label}</span>`;
      }
    },
    {
      data: 'inquiredAt',
      title: '날짜',
      sortable: true,
      render: (data) => formatDateTime(data)
    },
  ].map(col => ({
    ...col,
    className: col.className || 'text-center',
  }));

  //상세 열기/닫기
  function openDetail(id) {
    router.push({
      name: 'InquiryDetail',
      params: { id: id }
    });
  }

  // 테이블 렌더링 후 클릭 이벤트 바인딩
  function attachClickHandlers() {
    nextTick(() => {
      const titleElements = document.querySelectorAll('.inquiry-title');
      titleElements.forEach(el => {
        if (el.dataset.bound) return;
        el.dataset.bound = 'true';
        
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // 이벤트 버블링 방지
          const inquiryId = e.currentTarget.dataset.inquiryId;
          // 상세 페이지로 모달을 띄우기
          openDetail(inquiryId);
        });
      });
    });
  }

  async function fetchInquiries({ page, size, sort }) {
    try {
            const requestParams = {
              page: page,
              size,
              sort: sort || 'inquiredAt,desc'
            };
            console.log('getMyInquiryList Request Params:', requestParams);
            const res = await getMyInquiryList(requestParams);
            console.log('getMyInquiryList Response:', res);
      
            const payload = res;
      
            return {
              rows: payload.content,
              total: payload.totalElements
            };
    } catch (err) {
      console.error('fetch inquiries error', err);
      return { rows: [], total: 0 };
    }
  }

  onMounted(() => {
    setTimeout(attachClickHandlers, 500);
  })
</script>

<template>
  <div class="content-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="page-title">
        <i class="fa-solid fa-headphones"></i> 문의 내역
      </h1>
    </div>
    <p class="page-description">나의 문의 내역을 확인하고 상세 내용을 조회할 수 있습니다.</p>

    <div>
      <ServerDataTable
        ref="dataTableRef"
        v-model:keyword="keyword"
        :columns="columns"
        :fetcher="fetchInquiries"
        :page-size="10"
        @loaded="attachClickHandlers"
      >
        <!-- 데이터가 없을 때 -->
        <template #empty>등록된 문의가 없습니다.</template>
      </ServerDataTable>
    </div>

  </div>
</template>

<style scoped>
  .content-page {
    max-width: 1200px;
    margin: 20px auto;
    padding: 24px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
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

  .card { 
    border: 1px solid #e9ecef; 
    border-radius: 6px; 
  }

  /* 배지 기본 스타일 */
  :deep(.badge) {
    display: inline-block;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 12px;
    color: #fff;
    text-align: center;
  }

  /* 상태별 배지 색상은 이제 스크립트에서 Bootstrap 클래스로 동적 관리됩니다. */

  /* 테이블 셀 정렬 */
  :deep(table th),
  :deep(table td) {
    text-align: center;
    vertical-align: middle;
  }

  :deep(table td.text-start) {
    text-align: left !important;
  }

  /* 클릭 이벤트 제어 */
  :deep(table td) {
    pointer-events: none;
  }

  :deep(table td .inquiry-title) {
    pointer-events: auto;
  }

  /* 호버 효과 */
  :deep(table tbody tr:hover) {
    background-color: #f8f9fa;
  }

  :deep(.inquiry-title:hover) {
    text-decoration: underline;
  }

  /* 간단한 모달 스타일 */
  .inquiry-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
  }
  .inquiry-modal {
    width: 90%;
    max-width: 900px;
    max-height: 85vh;
    overflow: auto;
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  }
  .modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
  }
</style>