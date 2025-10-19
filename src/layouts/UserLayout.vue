<script setup>
import { computed, ref, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 컴포넌트 Import
import CommonHeader from '@/components/common/organisms/CommonHeader.vue';
import CommonFooter from '@/components/common/organisms/CommonFooter.vue';
import SearchBar from '@/components/common/molecules/SearchBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'; // HEAD (uiStore 관련)
// Store Import
import { useUiStore } from '@/stores/uiStore'; // HEAD (로딩 스피너 제어)
import { useUserStore } from '@/stores/userStore'; // develop (알림 시스템 사용)
import { useNotificationStore } from '@/stores/notificationStore'; // develop (알림 시스템 사용)
// Util Import
import { useNotification } from '@/utils/notificationComposable'; // develop (알림 시스템)
// Style Import
import '@/styles/scss/main-user.scss'; // User 전용 번들

// Hooks & Stores 초기화
const route = useRoute();
const uiStore = useUiStore(); // HEAD
const router = useRouter()
const userStore = useUserStore(); // develop
const notificationStore = useNotificationStore(); // develop

/**
 * 검색 기능
 */
const searchInput = ref(''); // 중복 제거
const onSearch = (keyword) => { // 중복 제거
  if (keyword) {
    router.push({ path: '/product', query: { keyword } })
  } else {
    router.push({ path: '/product' })
  }
};

/**
 * 로그인, 회원가입 페이지에서는 헤더/푸터를 숨깁니다.
 */
const isShowChrome = computed(() => {
  const hiddenPaths = ['/login', '/admin/login', '/signup'];  // 헤더/푸터 숨길 페이지
  return !hiddenPaths.some(path => route.path.startsWith(path));
});

/**
 * 알림 시스템 초기화 (develop 브랜치 추가 내용)
 */
useNotification(userStore, notificationStore);

/**
 * 레이아웃 활성화 스타일 적용
 */
document.body.classList.add('user-layout-active');
onUnmounted(() => {
  document.body.classList.remove('user-layout-active');
});
</script>
<template>
  <div>
    <template v-if="isShowChrome">
      <CommonHeader>
        <template #searchBar>
          <SearchBar v-model="searchInput" :onSearch="onSearch" />
        </template>
      </CommonHeader>
    </template>
    <router-view />
    <template v-if="isShowChrome">
      <CommonFooter />
    </template>
    <LoadingSpinner :show="uiStore.isLoading" />   </div>
</template>

<style scoped></style>