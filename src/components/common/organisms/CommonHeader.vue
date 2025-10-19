<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useModal } from '@/composables/useModal';
import { logout } from '@/api/login'; // NavigationBar에서 이동

import BrandLogo from '../atoms/BrandLogo.vue';
import NavigationItem from '../atoms/NavigationItem.vue'; // NavigationBar에서 이동
import NavigationBar from '../molecules/NavigationBar.vue'; // NavigationBar는 여전히 별도 컴포넌트로 사용

const router = useRouter();
const userStore = useUserStore();

// --- NavigationBar에서 이동된 로직 ---
const handleLogout = () => {
  logout().then(() => {
    userStore.logout();
    router.push('/');
  }).catch(error => {
    console.error('로그아웃 에러 : ', error);
  });
};

const goToMyPage = () => {
  router.push('/mypage');
};

// --- 기존 CommonHeader.vue 로직 ---
const { initModal: initPolicyModal, show: showPolicyModal, hide: hidePolicyModal } = useModal('#policyCheckModal');

onMounted(() => {
  initPolicyModal();
});

const goToInspection = () => {
  hidePolicyModal();
  router.push('/inspection/step1');
};

const goToPolicy = () => {
  hidePolicyModal();
  router.push('/inspection/policy');
};
</script>

<template>
  <div class="container-fluid">
    <div class="top-header-section">
      <!-- 좌측: 로고 & 검색창 -->
      <div class="left-group">
        <BrandLogo type="text" />
        <div class="search-area">
          <slot name="searchBar"></slot>
        </div>
      </div>

      <!-- 우측: 사용자 액션 (판매하기, 로그아웃/마이페이지/로그인) -->
      <div class="right-group">
        <template v-if="userStore.isLoggedIn">
          <a href="#" class="btn-sell" @click.prevent="showPolicyModal">
            <i class="fas fa-tags"></i>
            <span>판매하기</span>
          </a>
          <NavigationItem @click="handleLogout">로그아웃</NavigationItem>
          <NavigationItem @click="goToMyPage">마이페이지</NavigationItem>
        </template>
        <template v-else>
          <NavigationItem @click="router.push('/login')">로그인</NavigationItem>
        </template>
      </div>
    </div>
  </div>
  <div class="container-fluid main-nav-wrapper">
    <div class="row main-nav-bar px-xl-5">
      <div class="col-lg-12">
        <NavigationBar />
      </div>
    </div>
  </div>

  <!-- 판매하기 모달 -->
  <div class="modal fade" id="policyCheckModal" tabindex="-1" aria-labelledby="policyCheckModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="policyCheckModalLabel">검수 기준 확인</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        </div>
        <div class="modal-body">
          <p>정확하고 원활한 검수 진행을 위해, Fantry의 검수 기준을 먼저 확인해주세요.</p>
          <p class="text-muted small">검수 기준에 동의하지 않으실 경우, 검수 신청이 반려될 수 있습니다.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" @click="goToPolicy">검수 기준 보기</button>
          <button type="button" class="btn btn-primary" data-dismiss="modal" @click="goToInspection">신청 계속하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0rem 2rem; /* 상하 여백 줄임 */
  border-bottom: 1px solid #eee;
}

.left-group {
  display: flex;
  align-items: center;
  gap: 1rem; /* 로고와 검색창 사이 간격 */
}

.search-area {
  flex-grow: 1; /* 검색창이 남는 공간을 차지 */
  /* max-width: 400px; */ /* 검색창 최대 너비 */
}

.right-group {
  display: flex;
  align-items: center;
  gap: 1rem; /* 버튼들 사이 간격 */
}

.btn-sell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
}

.btn-sell:hover {
  background-color: #f5f5f5;
}

.main-nav-wrapper {
  margin-bottom: 0 !important; /* 네비게이션 바 아래 여백 제거 */
}
</style>
