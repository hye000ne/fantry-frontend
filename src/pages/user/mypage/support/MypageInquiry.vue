<script setup>
  import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
  import { ref, nextTick, onMounted } from 'vue';
  import { getMyInquiryList, createInquiry, addInquiryAttachments } from '@/api/inquiry';
  import MypageInquiryDetail from './MypageInquiryDetail.vue';

  const dataTableRef = ref(null);
  const keyword = ref('');
  const loading = ref(false);
  const showForm = ref(false);

  //모달 상태
  const showDetail = ref(false);
  const selectedInquiryId = ref(null);

  const subject = ref('');
  const category = ref('deliver');
  const message = ref('');
  const email = ref('');
  const files = ref([]);
  const success = ref('');
  const error = ref('');

  const categories = [
    { value: 'deliver', label: '배송문의', csTypeId: 1 },
    { value: 'order', label: '결제문의', csTypeId: 2 },
    { value: 'etc', label: '기타문의', csTypeId: 3 },
    { value: 'product', label: '상품문의', csTypeId: 4 },
    { value: 'refund', label: '환불/반품 문의', csTypeId: 5 },
    { value: 'sell', label: '판매문의', csTypeId: 6 }
  ];

  // 날짜 포맷 함수
  function formatDate(dateArray) {
    if (!dateArray || !Array.isArray(dateArray)) return '';
    const [year, month, day, hour, minute] = dateArray;
    const pad = (n) => String(n).padStart(2, '0');
    return `${year}.${pad(month)}.${pad(day)} ${pad(hour)}:${pad(minute)}`;
  }

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
    return {
      'badge-pending': s === 'PENDING',
      'badge-progress': s === 'IN_PROGRESS',
      'badge-hold': s === 'ON_HOLD',
      'badge-rejected': s === 'REJECTED',
      'badge-answered': s === 'ANSWERED'
    };
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
        const classes = Object.entries(statusClass(data))
          .filter(([_, v]) => v)
          .map(([k, _]) => k)
          .join(' ');
        return `<span class="badge ${classes}">${label}</span>`;
      }
    },
    { 
      data: 'inquiredAt', 
      title: '날짜', 
      sortable: true,
      render: (data) => {
        return formatDate(data);
      }
    },
  ].map(col => ({ 
    ...col, 
    className: col.className || 'text-center',
  }));

  //상세 열기/닫기
  function openDetail(id) {
    selectedInquiryId.value = id;
    showDetail.value = true;
  }
  function closeDetail() {
    selectedInquiryId.value = null;
    showDetail.value = false;
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

  async function fetchInquiries({ page, size, sort, keyword }) {
    try {
      const res = await getMyInquiryList({ 
        page: page - 1,
        size, 
        sort: sort || 'inquiredAt,desc'
      });
      
      let allInquiries = [];
      const payload = res.data;
      
      // API 응답 구조에 따라 데이터 추출
      if (Array.isArray(payload.content)) {
        allInquiries = payload.content;
      } else if (Array.isArray(payload)) {
        allInquiries = payload;
      } else if (Array.isArray(payload.data)) {
        allInquiries = payload.data;
      }

      // 검색 필터링
      if (keyword) {
        allInquiries = allInquiries.filter(i => 
          i.title?.includes(keyword) || 
          i.inquiredByName?.includes(keyword) ||
          statusLabel(i.status)?.includes(keyword)
        );
      }

      // 전체 개수와 현재 페이지 데이터 반환
      // API가 이미 페이징된 데이터를 반환하는 경우
      return {
        rows: allInquiries,
        total: payload.totalElements || allInquiries.length
      };
    } catch (err) {
      console.error('fetch inquiries error', err);
      return { rows: [], total: 0 };
    }
  }

  function resetForm() {
    subject.value = '';
    category.value = 'deliver';
    message.value = '';
    email.value = '';
    files.value = [];
    success.value = '';
    error.value = '';
  }

  function openForm() {
    resetForm();
    showForm.value = true;
  }

  function closeForm() {
    showForm.value = false;
    success.value = '';
    error.value = '';
  }

  function onFilesChange(e) {
    const f = Array.from(e.target.files || []);
    files.value = f;
  }

  async function submitInquiry() {
    success.value = '';
    error.value = '';

    if (!subject.value.trim() || !message.value.trim()) {
      error.value = '제목과 문의 내용을 입력하세요.';
      return;
    }

    loading.value = true;
    try {
      const csType = categories.find(c => c.value === category.value);
      const payload = {
        csTypeId: csType.csTypeId ?? null,
        title: subject.value.trim(),
        content: message.value.trim()
      };

      const res = await createInquiry(payload);

      const createdId =
        res.data.inquiryId ||
        res.data.inquiryId === 0 ? res.data.inquiryId :
        (typeof res.data === 'number' ? res.data : null) ||
        (res.data.id ?? null);

      if (files.value && files.value.length > 0) {
        let inquiryId = createdId;
        if (inquiryId) {
          const form = new FormData();
          files.value.forEach(f => form.append('files', f));
          await addInquiryAttachments(inquiryId, form);
        } else {
          console.warn('inquiry created but no id returned; attachments skipped');
        }
      }

      success.value = '문의가 정상적으로 접수되었습니다.';
      resetForm();
      
      // 목록 갱신을 위해 잠시 후 폼 닫기
      setTimeout(() => {
        showForm.value = false;
        // DataTable 새로고침
        if (dataTableRef.value && dataTableRef.value.refresh) {
          dataTableRef.value.refresh();
        }
      }, 500);
    } catch (err) {
      console.error('inquiry submit error', err);
      error.value = err?.response?.data?.message || '문의 접수 중 오류가 발생했습니다.';
    } finally {
      loading.value = false;
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
      <button class="btn btn-primary" id="hidden-btn" @click="openForm" v-if="!showForm">문의하기</button>
      <button class="btn btn-secondary" @click="closeForm" v-else>목록으로</button>
    </div>
    <p class="page-description">관리자에게 문의사항이 있다면 해당 페이지를 이용해주세요.</p>

    <div v-if="!showForm">
      <ServerDataTable
        ref="dataTableRef"
        v-model:keyword="keyword"
        :columns="columns"
        :fetcher="fetchInquiries"
        :page-size="10"
        @loaded="attachClickHandlers"
      >
        <!-- 커스텀 셀: 날짜 포맷 -->
        <template #cell-inquiredAt="{ row }">
          {{ formatDate(row.inquiredAt) }}
        </template>

        <!-- 데이터가 없을 때 -->
        <template #empty>등록된 문의가 없습니다.</template>
      </ServerDataTable>
    </div>

    <!-- 문의 폼 -->
    <div v-if="showForm" class="card p-4 mt-3">
      <div v-if="success" class="alert alert-success">{{ success }}</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form @submit.prevent="submitInquiry">
        <div class="mb-3">
          <label class="form-label">카테고리</label>
          <select class="form-select" v-model="category" :disabled="loading">
            <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">제목 <span class="text-danger">*</span></label>
          <input class="form-control" v-model="subject" :disabled="loading" placeholder="문의 제목을 입력하세요" />
        </div>

        <div class="mb-3">
          <label class="form-label">연락처(이메일)</label>
          <input class="form-control" v-model="email" :disabled="loading" placeholder="회신 받을 이메일을 입력하세요 (선택)" />
        </div>

        <div class="mb-3">
          <label class="form-label">첨부파일</label>
          <input type="file" class="form-control" multiple @change="onFilesChange" :disabled="loading" />
        </div>

        <div class="mb-3">
          <label class="form-label">문의 내용 <span class="text-danger">*</span></label>
          <textarea class="form-control" v-model="message" :disabled="loading" rows="8" placeholder="문의 내용을 상세히 작성해 주세요"></textarea>
        </div>

        <div class="d-flex justify-content-end">
          <button type="button" class="btn btn-secondary me-2" @click="closeForm" :disabled="loading">취소</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            제출
          </button>
        </div>
      </form>
    </div>

    <!-- 상세 모달 -->
    <div v-if="showDetail" class="inquiry-modal-backdrop" @click.self="closeDetail">
      <div class="inquiry-modal">
        <MypageInquiryDetail
          v-if="selectedInquiryId !== null"
          :inquiryId="selectedInquiryId" 
          @close="closeDetail" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  #hidden-btn{    /*문의하기 비활성화*/
    display: none;
  }
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

  /* 상태별 배지 색상 */
  :deep(.badge-pending) { 
    background-color: #6c757d; 
  }
  
  :deep(.badge-progress) { 
    background-color: #007bff; 
  }
  
  :deep(.badge-hold) { 
    background-color: #ffc107; 
    color: #000; 
  }
  
  :deep(.badge-rejected) { 
    background-color: #dc3545; 
  }
  
  :deep(.badge-answered) { 
    background-color: #28a745; 
  }

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