<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">신고 상세 정보</h1>
      <button class="btn btn-secondary" @click="router.back()">목록으로</button>
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
            <!--신고된 회원 정보-->
            <tr>
              <th class="bg-light" style="width: 200px">신고번호</th>
              <td>{{ report.reportId }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고된 회원번호</th>
              <td>{{ report.memberId }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고 사유</th>
              <td>{{ report.reportReason }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고 일시</th>
              <td>{{ report.reportAt }}</td>
            </tr>
            <tr>
              <th class="bg-light">신고 처리 상태</th>
              <td> {{ report.reportStatus }}</td>
            </tr>
            <tr>
              <th class="bg-light">반려 사유</th>
              <td> {{ report.rejectedComment || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="alert alert-warning">
      신고된 회원 정보를 찾을 수 없습니다.
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { getReportDetail } from '@/api/report';
  import { useAlertDialog } from '@/composables/useAlertDialog';

  const { showAlert: showDialog } = useAlertDialog();
  const router = useRouter();

  const report = ref(null);
  const loading = ref(true);


  onMounted(async () => {
    const reportId = router.currentRoute.value.params.reportId;
    if (!reportId) {
      showDialog("🚫경고", "유효하지 않은 접근입니다.");
      router.back();
      return;
    }

    try {
      const response = await getReportDetail(reportId);
      if (!response.status == 200) throw new Error('신고 정보를 불러오는데 실패했습니다.');
      report.value = response.data.report;    
    } catch (error) {
      console.error(error);
      showDialog("🚫경고", "신고 정보를 불러오는데 실패했습니다.");
    } finally {
      loading.value = false;
    }
  });
</script>
<style scoped></style>