<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">CS 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="CS 대시보드 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <!-- 총 공지사항 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 공지사항 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.noticeStats?.totalNotices?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-bullhorn fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 활성 공지사항 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">활성 공지사항 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.noticeStats?.activeNotices?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 총 FAQ 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">총 FAQ 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.faqStats?.totalFaqs?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-question-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 활성 FAQ 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">활성 FAQ 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.faqStats?.activeFaqs?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-double fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 총 문의 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">총 문의 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.inquiryStats?.totalInquiries?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-comments fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 답변 대기 중인 문의 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-secondary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-secondary text-uppercase mb-1">답변 대기 중인 문의</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.inquiryStats?.pendingInquiries?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-hourglass-half fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오늘 접수된 문의 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-dark shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-dark text-uppercase mb-1">오늘 접수된 문의</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.inquiryStats?.todayInquiries?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-calendar-day fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 섹션은 API 데이터 부족으로 제거 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCSDashboardStats } from '@/api/dashboard.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchCSDashboardStats = async () => {
  loading.value = true;
  try {
    const response = await getCSDashboardStats();
    stats.value = {
      noticeStats: response.noticeStats || {},
      faqStats: response.faqStats || {},
      inquiryStats: response.inquiryStats || {},
    };
  } catch (e) {
    console.error('CS 대시보드 데이터 조회 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCSDashboardStats);
</script>

<style scoped>
.card-body .text-xs {
  font-size: 0.7rem;
}
</style>
