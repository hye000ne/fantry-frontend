<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">신고 상세 정보</h1>
      <button class="btn btn-secondary" @click="gotoList">목록으로</button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="report" class="card">
      <div class="card-body">
        <table class="table table-bordered">
          <tbody>
            <tr>
              <th class="bg-light" style="width: 200px">신고 번호</th>
              <td>{{ report.reportId }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고된 회원 번호</th>
              <td>{{ report.memberId }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고 사유</th>
              <td>{{ report.reportReason }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고 일시</th>
              <td>{{ formatDate(report.reportAt) }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고 처리 상태</th>
              <td>{{ formatReportStatus(report.reportStatus) }}</td>
            </tr>
            <tr>
              <th class="bg-light">반려 사유</th>
              <td>{{ report.rejectedComment || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="alert alert-warning">
      신고된 회원 정보를 찾을 수 없습니다.
    </div>

    <!-- 관리자 작업 버튼 -->
    <div class="card mt-4">
      <div class="card-body">
        <h5 class="card-title">신고 처리</h5>
        
        <div class="form-group">
          <label for="status">신고 처리 상태</label>
          <select id="status" class="form-control" v-model="newStatus">
            <option value="WITHDRAWN">신고 철회</option>
            <option value="REJECTED">구제 신청 반려</option>
          </select>
        </div>

        <div class="form-group mt-3">
          <label for="rejectedComment">반려 사유</label>
          <textarea 
            id="rejectedComment" 
            class="form-control" 
            v-model="rejectedComment" 
            rows="3" 
            placeholder="반려 사유를 입력해주세요." 
            required
          ></textarea>
        </div>

        <button class="btn btn-primary mt-4" @click="updateReportStatus">변경 사항 저장</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getReportDetail, updateReceiveReport } from '@/api/report';
import { useAlertDialog } from '@/composables/useAlertDialog';

const { showAlert: showDialog } = useAlertDialog();
const router = useRouter();

const report = ref(null);
const loading = ref(true);
const newStatus = ref('WITHDRAWN');  // 기본값은 'WITHDRAWN' (신고 철회)
const rejectedComment = ref('');
let reportId = null;

const gotoList = () => {
  router.push("/admin/member/reportReceiveList");
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatReportStatus(status) {
  switch (status) {
    case 'RESOLVED': return '신고 승인 (제재 완료)';
    case 'RECEIVED': return '구제 신청 접수중';
    case 'WITHDRAWN': return '신고 철회됨';
    case 'REJECTED': return '구제 신청 반려';
    default: return status;
  }
}

onMounted(async () => {
  reportId = router.currentRoute.value.params.reportId;
  if (!reportId) {
    showDialog("🚫오류", "유효하지 않은 접근입니다.");
    router.back();
    return;
  }

  try {
    const response = await getReportDetail(reportId);
    if (!response.status == 200) throw new Error('신고 정보를 불러오는데 실패했습니다.');
    report.value = response.data.report;    
  } catch (error) {
    console.error(error);
    showDialog("🚫오류", "신고 정보를 불러오는데 실패했습니다.");
  } finally {
    loading.value = false;
  }
});

// 신고 상태 변경
async function updateReportStatus() {
  if (!rejectedComment.value && newStatus.value === 'REJECTED') {
    showDialog("⚠️주의", "반려 사유를 입력해주세요.");
    return;
  }

  const updatedReport = {
    // reportId: report.value.reportId,
    reportReason: report.value.reportReason,
    reportStatus: newStatus.value,
    rejectedComment: rejectedComment.value || null,
    memberId: report.value.memberId
  };

  try {
    const response = await updateReceiveReport(reportId, updatedReport);

    if (!response.status == 200) {
      throw new Error('신고 상태 업데이트 실패');
    }

    showDialog("✅안내", "신고 상태가 성공적으로 업데이트되었습니다.");
    router.push({ name: 'AdminReportReceiveList' });  // 목록 페이지로 돌아감
  } catch (error) {
    console.error(error);
    showDialog("🚫오류", "신고 상태 업데이트 실패");
  }
}
</script>

<style scoped>
/* 스타일은 이전 페이지와 동일하게 적용 */
:deep(table th),
:deep(table td) {
  text-align: center;
}

:deep(table tbody tr:hover) {
  background-color: #f8f9fa;
  cursor: default;
}

.badge-primary {
    background-color: #007bff;
    color: white;
}
.badge-warning {
    background-color: #ffc107;
    color: #333;
}
.badge-success {
    background-color: #28a745;
    color: white;
}
.badge-danger {
    background-color: #dc3545;
    color: white;
}
.badge-secondary {
    background-color: #6c757d;
    color: white;
}
.badge {
    padding: 0.35em 0.65em;
    font-size: 75%;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 0.35rem;
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.bottom {
    right: 0px;
}
</style>
