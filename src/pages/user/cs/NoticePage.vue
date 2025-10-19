<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">공지사항</h2>
      <ul class="nav nav-pills">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentType === 'ALL' }" href="#" @click.prevent="changeType('ALL')">전체</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentType === 'NOTICE' }" href="#" @click.prevent="changeType('NOTICE')">공지</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentType === 'EVENT' }" href="#" @click.prevent="changeType('EVENT')">이벤트</a>
        </li>
      </ul>
    </div>

    <table class="table table-hover notice-table">
      <tbody>
        <tr v-if="loading">
          <td colspan="2" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="notices.length === 0">
          <td colspan="2" class="text-center py-5">공지사항이 없습니다.</td>
        </tr>
        <tr v-for="notice in notices" :key="notice.noticeId" @click="goToNoticeDetail(notice.noticeId)">
          <td>
            <span class="notice-type">{{ notice.noticeType }}</span>
            <p class="notice-title mb-0">{{ notice.noticeType ? `(${notice.noticeType}) ` : '' }}{{ notice.title }}</p>
          </td>
          <td class="text-right notice-date">{{ formatDate(notice.createdAt) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">이전</a>
        </li>
        <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
          <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">다음</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { searchNotices } from '@/api/notice';

const router = useRouter();

const notices = ref([]);
const loading = ref(false);
const currentType = ref('ALL'); // 'ALL', 'NOTICE', 'EVENT'
const currentPage = ref(1);
const totalPages = ref(1);

// NOTE: 이 매핑은 api.md에 명시되어 있지 않아 가정한 값입니다.
const noticeTypeMapping = {
  NOTICE: 1,
  EVENT: 2,
};

const fetchNotices = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: 10,
      noticeTypeId: currentType.value === 'ALL' ? null : noticeTypeMapping[currentType.value],
    };
    console.log('Notice API Request Params:', params);
    const response = await searchNotices(params);
    console.log('Notice API Response:', response);
    notices.value = response.content;
    totalPages.value = response.totalPages;
    notices.value.forEach(notice => {
      console.log('Notice noticeType:', notice.noticeType);
    });
  } catch (error) {
    console.error('공지사항을 불러오는 중 오류가 발생했습니다:', error);
    notices.value = [];
  } finally {
    loading.value = false;
  }
};

const changeType = (type) => {
  currentType.value = type;
  currentPage.value = 1; // 카테고리 변경 시 1페이지로 리셋
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

// formatDate 함수 복원
const formatDate = (dateArray) => {
  if (!dateArray || !Array.isArray(dateArray)) return '';
  const [year, month, day, hour, minute] = dateArray;
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}.${pad(month)}.${pad(day)} ${pad(hour)}:${pad(minute)}`;
};

// goToNoticeDetail 함수 복원
const goToNoticeDetail = (id) => {
  router.push(`/cs/notice/${id}`);
};

onMounted(() => {
  fetchNotices();
});

watch([currentType, currentPage], () => {
  fetchNotices();
});
</script>

<style scoped>
.nav-pills .nav-link {
  color: #6c757d;
  background-color: #f8f9fa;
  margin-left: 0.5rem;
  font-weight: 500;
}

.nav-pills .nav-link.active {
  color: #fff;
  background-color: #007bff;
}

.notice-table {
  border-top: 2px solid #212529;
  min-height: 600px !important; /* 10개 항목 기준 대략적인 높이 */
}

.notice-table tr {
  border-bottom: 1px solid #dee2e6;
}

.notice-table td {
  padding: 1.25rem 0.75rem;
  vertical-align: middle;
}

.notice-table tr:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

.notice-type {
  font-size: 0.8rem;
  font-weight: 600;
  color: #007bff;
  display: block;
  margin-bottom: 0.25rem;
}

.notice-title {
  font-weight: 600;
  color: #212529;
  font-size: 1.1rem;
}

.notice-date {
  color: #6c757d;
  font-size: 0.9rem;
}

.pagination {
  margin-top: 2rem;
}
</style>
