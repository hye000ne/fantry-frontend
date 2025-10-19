<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { getReportsMember, setReceivedReport } from '@/api/report';
import { useAlertDialog } from '@/composables/useAlertDialog';

const { showAlert } = useAlertDialog();
const userStore = useUserStore();

const reports = ref([]);
const isLoading = ref(false);
const error = ref(null);
const memberId = ref('');

//리스트 가져오기
const fetchMyReports = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    memberId.value = userStore.currentUser.memberId;
    const res = await getReportsMember(memberId.value);

    reports.value = res.data.reportList;
  } catch (e) {
    console.error('Fetch reports failed', e);
    error.value = '신고 내역을 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

//구제 신청
const requestReceive = async (reportId) => {
  if (!confirm('이 신고에 대해 구제(접수) 요청을 하시겠습니까?')) return;
  isLoading.value = true;
  try {
    const payload = { receiveRequested: true };
    // await updateReceiveReport(report.reportId, payload);
    await setReceivedReport(reportId);
    await fetchMyReports();
    showAlert("✅안내", "구제 요청이 접수되었습니다.");
  } catch (e) {
    console.error('Request receive failed', e);
    showAlert("🚫오류", "구제 요청 중 오류가 발생했습니다.");
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchMyReports);

const statusLabel = (status) => {
  if (!status) return '대기';
  const s = String(status).toUpperCase();
  switch (s) {
    case 'RESOLVED': return '신고접수됨';
    case 'RECEIVED': return '구제 신청 접수';
    case 'WITHDRAWN': return '구제 신청 완료';
    case 'REJECTED': return '구제 신청 거절';
    default: return status;
  }
};

const statusClass = (status) => {
  const s = (status || '').toString().toUpperCase();
  return {
    'badge-resolved': s === 'RESOLVED',
    'badge-received': s === 'RECEIVED',
    'badge-withdrawn': s === 'WITHDRAWN',
    'badge-rejected': s === 'REJECTED',
    'badge-wait': s === '' || s === 'WAIT' || s === 'PENDING'
  };
};

const isReceiveRequested = (r) => {
  const s = (r.reportStatus || '').toString().toUpperCase();
  // 구제 요청 버튼 비활성화 조건: 이미 구제 접수되었거나 완료/거절된 경우 혹은 플래그가 세팅된 경우
  return !!(r.receiveRequested || r.received || s === 'RECEIVED' || s === 'WITHDRAWN' || s === 'REJECTED');
};

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleString();
};
</script>

<template>
  <div class="content-page report-page">
    <h1 class="page-title">
      <i class="fa-solid fa-fire"></i> 내 신고 내역
    </h1>
    <p class="page-description">나의 신고된 내역을 확인하고 관리자에게 구제 신청을 할 수 있습니다.</p>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      조회 중...
    </div>

    <div v-if="error" class="error-state">{{ error }}</div>

    <div v-if="!isLoading && reports.length === 0" class="empty-state">
      신고 내역이 없습니다.
    </div>

    <div v-if="!isLoading && reports.length > 0" class="report-list">
      <div v-for="r in reports" :key="r.reportId" class="report-card">
        <div class="card-head">
          <div class="title">
            신고 ID: {{ r.reportId }} 
            <span class="badge" :class="statusClass(r.reportStatus)">{{ statusLabel(r.reportStatus) }}</span>
          </div>
          <div class="meta">신고일: {{ formatDate(r.reportAt) }}</div>
        </div>

        <div class="card-body">
          <p class="report-target"><strong>내용:</strong> {{ r.reportReason || '정보 없음' }}</p>
          <p class="report-content"><strong>거절사유:</strong> {{ r.rejectedComment || '-' }}</p>
        </div>

        <div class="card-actions">
          <button
            class="btn-request"
            :disabled="isReceiveRequested(r)"
            @click="() => requestReceive(r.reportId)"
          >
            {{ isReceiveRequested(r) ? '구제 요청됨' : '구제 요청' }}
          </button>
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

.loading-state, .error-state, .empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #eee;
  border-top-color: #3498db;
  border-radius: 50%;
  margin: 0 auto 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.report-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

/* 카드 */
.report-card {
  border: 1px solid #eef2f6;
  padding: 14px;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.title {
  font-weight: 600;
  color: #222;
}

.meta {
  color: #888;
  font-size: 0.9rem;
}

.badge {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 999px;
  color: #fff;
}

/* 상태별 배지 색상 */
.badge-resolved { background: #007bff; }   /* yellow - 신고접수됨 */
.badge-received { background: #ffc107; }   /* yellow - 구제 신청 접수 */
.badge-withdrawn { background: #28a745; }  /* green - 구제 신청 완료 */
.badge-rejected { background: #dc3545; }   /* red - 구제 신청 거절 */
.badge-wait { background: #6c757d; }       /* gray - 대기/미정 */

.card-body p {
  margin: 6px 0;
  color: #333;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn-view, .btn-request {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-view {
  background: #f3f4f6;
  color: #333;
}

.btn-request {
  background: #007bff;
  color: #fff;
}

.btn-request[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
  background: #6c757d;
}
</style>