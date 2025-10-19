<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">회원 관리 대시보드</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="회원 대시보드 데이터를 불러오는 중..." />
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="row">
        <!-- 총 회원 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">총 회원 수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.memberStats?.totalMembers?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오늘 가입한 회원 수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">오늘 가입한 회원</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.memberStats?.todayRegisteredMembers?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-user-plus fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 총 신고 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">총 신고 건수</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.reportStats?.totalReports?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-exclamation-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 해결된 신고 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">해결된 신고</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.reportStats?.resolvedReports?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 접수된 신고 건수 -->
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">접수된 신고</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.reportStats?.receivedReports?.toLocaleString() || '0' }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-inbox fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMemberDashboardStats } from '@/api/dashboard.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchMemberDashboardStats = async () => {
  loading.value = true;
  try {
    console.log('API 호출 시작');
    const response = await getMemberDashboardStats();
    console.log('회원 대시보드 API 응답:', response);
    stats.value = {
      memberStats: response.memberStats || {},
      reportStats: response.reportStats || {},
    };
  } catch (e) {
    console.error('회원 대시보드 데이터 조회 실패:', e);
    console.error('API 호출 실패:', e);
    error.value = '데이터를 불러오는 데 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchMemberDashboardStats);
</script>

<style scoped>
/* 필요한 스타일 추가 */
</style>