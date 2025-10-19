<template>
<!-- Topbar -->
<nav class="navbar navbar-expand navbar-light topbar mb-4 static-top shadow">

    <!-- Sidebar Toggle (Topbar) -->
    <button id="sidebarToggleTop" class="btn btn-link d-md-none rounded-circle mr-3">
        <i class="fa fa-bars"></i>
    </button>

    <!-- Topbar Search -->
    <form
        class="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
        <div class="input-group">
            <input type="text" class="form-control bg-light border-0 small" placeholder="Search for..."
                aria-label="Search" aria-describedby="basic-addon2">
            <div class="input-group-append">
                <button class="btn btn-primary" type="button">
                    <i class="fas fa-search fa-sm"></i>
                </button>
            </div>
        </div>
    </form>

    <!-- Topbar Navbar -->
    <ul class="navbar-nav ml-auto">

        <!-- Nav Item - Search Dropdown (Visible Only XS) -->
        <li class="nav-item dropdown no-arrow d-sm-none">
            <a class="nav-link dropdown-toggle" href="#" id="searchDropdown" role="button"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-search fa-fw"></i>
            </a>
            <!-- Dropdown - Messages -->
            <div class="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in"
                aria-labelledby="searchDropdown">
                <form class="form-inline mr-auto w-100 navbar-search">
                    <div class="input-group">
                        <input type="text" class="form-control bg-light border-0 small"
                            placeholder="Search for..." aria-label="Search"
                            aria-describedby="basic-addon2">
                        <div class="input-group-append">
                            <button class="btn btn-primary" type="button">
                                <i class="fas fa-search fa-sm"></i>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </li>

        <!-- Nav Item - Alerts -->
        <li class="nav-item dropdown no-arrow mx-1">
            <a class="nav-link dropdown-toggle" href="#" id="alertsDropdown" role="button"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-bell fa-fw"></i>
                <!-- Counter - Alerts -->
                <span class="badge badge-danger badge-counter" v-if="notificationCount > 0">{{ notificationCount }}</span>
            </a>
            <!-- Dropdown - Alerts -->
            <div class="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="alertsDropdown">
                <h6 class="dropdown-header">
                    알림 센터
                </h6>
                <template v-if="notificationCount > 0">
                    <a v-for="(notification, index) in notifications" :key="index" class="dropdown-item d-flex align-items-center" :href="notification.link">
                        <div class="mr-3">
                            <div class="icon-circle" :class="notification.bgColor">
                                <i :class="notification.icon"></i>
                            </div>
                        </div>
                        <div>
                            <div class="small text-gray-500">{{ notification.date }}</div>
                            <span class="font-weight-bold">{{ notification.text }}</span>
                        </div>
                    </a>
                </template>
                <template v-else>
                    <a class="dropdown-item text-center small text-gray-500" href="#">새로운 알림이 없습니다.</a>
                </template>
                <a class="dropdown-item text-center small text-gray-500" href="#">모든 알림 보기</a>
            </div>
        </li>

        <!-- Nav Item - Messages -->
        <li class="nav-item dropdown no-arrow mx-1">
            <a class="nav-link dropdown-toggle" href="#" id="messagesDropdown" role="button"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-envelope fa-fw"></i>
                <!-- Counter - Messages -->
                <span class="badge badge-danger badge-counter" v-if="messageCount > 0">{{ messageCount }}</span>
            </a>
            <!-- Dropdown - Messages -->
            <div class="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="messagesDropdown">
                <h6 class="dropdown-header">
                    메시지 센터
                </h6>
                <template v-if="messageCount > 0">
                    <a v-for="(message, index) in messages" :key="index" class="dropdown-item d-flex align-items-center" href="#" @click.prevent="goToInquiryDetail(message.id)">
                        <div class="dropdown-list-image mr-3">
                            <img class="rounded-circle" :src="message.image" alt="...">
                        <div class="status-indicator" :class="message.isOnline ? 'bg-success' : ''"></div>
                        </div>
                        <div class="font-weight-bold">
                            <div class="text-truncate">{{ message.text }}</div>
                            <div class="small text-gray-500">{{ message.sender }} · {{ message.time }}</div>
                        </div>
                    </a>
                </template>
                <template v-else>
                    <a class="dropdown-item text-center small text-gray-500" href="#">새로운 메시지가 없습니다.</a>
                </template>
                <a class="dropdown-item text-center small text-gray-500" href="#">모든 메시지 읽기</a>
            </div>
        </li>

        <div class="topbar-divider d-none d-sm-block"></div>

        <li class="nav-item">
            <a class="nav-link" @click="goToMain" title="쇼핑몰 메인으로 이동" style="cursor: pointer;">
                <i class="fas fa-home fa-fw"></i>
                <span class="mr-2 d-none d-lg-inline text-gray-600 small">쇼핑몰 메인</span>
            </a>
        </li>

        <!-- Nav Item - User Information -->
        <li class="nav-item dropdown no-arrow">
            <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <!-- ⭐️ Pinia 스토어와 연동된 userName을 표시합니다. -->
                <span class="mr-2 d-none d-lg-inline text-gray-600 small">{{ userName }}</span>
                <img class="img-profile rounded-circle"
                    src="/images/undraw_profile.svg">
            </a>
            <!-- Dropdown - User Information -->
            <div class="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="userDropdown">
                <a class="dropdown-item" href="#">
                    <i class="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>
                    Profile
                </a>
                <a class="dropdown-item" href="#">
                    <i class="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                    Settings
                </a>
                <a class="dropdown-item" href="#">
                    <i class="fas fa-list fa-sm fa-fw mr-2 text-gray-400"></i>
                    Activity Log
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" @click="handleLogout" data-toggle="modal" data-target="#logoutModal">
                    <i class="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                    Logout
                </a>
            </div>
        </li>

    </ul>

</nav>
<!-- End of Topbar -->
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '@/api/login';
import { useUserStore } from '@/stores/userStore';
import { searchInquiries } from '@/api/adminInquiry.js';

const router = useRouter();
const userStore = useUserStore();

// --- 상태 관리 ---
const notifications = ref([]);
const messages = ref([]);

// --- Computed 속성 ---
const userName = computed(() => userStore.currentUser?.name || 'Guest');
const notificationCount = computed(() => notifications.value.length);
const messageCount = computed(() => messages.value.length);

// --- 데이터 로딩 ---

// 알림 데이터 (더미)
const setupDummyNotifications = () => {
  notifications.value = [
    {
      icon: 'fas fa-file-alt text-white',
      bgColor: 'bg-primary',
      date: '2025-10-18',
      text: '새로운 월간 리포트가 준비되었습니다.',
      link: '#'
    },
    {
      icon: 'fas fa-donate text-white',
      bgColor: 'bg-success',
      date: '2025-10-17',
      text: '새로운 판매 건이 정산 완료되었습니다.',
      link: '#'
    },
    {
      icon: 'fas fa-exclamation-triangle text-white',
      bgColor: 'bg-warning',
      date: '2025-10-16',
      text: '재고 부족 알림: 일부 상품의 재고가 부족합니다.',
      link: '#'
    },
  ];
};

// 메시지 데이터 (1:1 문의 API 연동)
const fetchMessages = async () => {
  try {
    const params = { page: 1, size: 5, status: 'PENDING', sort: 'inquiredAt,desc' };
    const response = await searchInquiries(params);
    messages.value = response.content.map(item => ({
      id: item.inquiryId,
      sender: item.inquiredByName,
      text: item.title,
      time: formatTimeAgo(item.inquiredAt),
      image: `/images/undraw_profile_${(item.inquiryId % 3) + 1}.svg`,
      isOnline: true, // 예시
    }));
  } catch (error) {
    console.error('메시지(문의) 목록 조회 실패:', error);
  }
};

onMounted(() => {
  setupDummyNotifications();
  fetchMessages();
});

// --- 유틸리티 함수 ---

// 시간 차이 계산 (예: 58분 전)
function formatTimeAgo(dateArray) {
  if (!dateArray) return '';
  const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4], dateArray[5] || 0);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "달 전";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "분 전";
  return Math.floor(seconds) + "초 전";
}

// --- 이벤트 핸들러 ---

const handleLogout = () => {
  logout().then(() => {
    userStore.logout();
    router.push('/admin/login');
  }).catch(error => {
    console.error('로그아웃 에러 : ', error);
  });
};

const goToMain = () => {
  router.push('/');
};

const goToInquiryDetail = (messageId) => {
  router.push(`/admin/cs/inquiry-detail/${messageId}`);
};

</script>
