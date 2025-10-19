<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">자주 묻는 질문</h2>
      <ul class="nav nav-pills">
        <li class="nav-item" @click.prevent="changeCategory('ALL')"><a class="nav-link" :class="{ active: currentCategory === 'ALL' }" href="#">전체</a></li>
        <li class="nav-item" @click.prevent="changeCategory('SHIPPING')"><a class="nav-link" :class="{ active: currentCategory === 'SHIPPING' }" href="#">배송</a></li>
        <li class="nav-item" @click.prevent="changeCategory('PAYMENT')"><a class="nav-link" :class="{ active: currentCategory === 'PAYMENT' }" href="#">결제</a></li>
        <li class="nav-item" @click.prevent="changeCategory('PRODUCT')"><a class="nav-link" :class="{ active: currentCategory === 'PRODUCT' }" href="#">상품</a></li>
        <li class="nav-item" @click.prevent="changeCategory('RETURN')"><a class="nav-link" :class="{ active: currentCategory === 'RETURN' }" href="#">환불/반품</a></li>
        <li class="nav-item" @click.prevent="changeCategory('SELL')"><a class="nav-link" :class="{ active: currentCategory === 'SELL' }" href="#">판매</a></li>
        <li class="nav-item" @click.prevent="changeCategory('ETC')"><a class="nav-link" :class="{ active: currentCategory === 'ETC' }" href="#">기타</a></li>
      </ul>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </div>
    <div v-else-if="faqs.length === 0" class="text-center py-5">
      <p>자주 묻는 질문이 없습니다.</p>
    </div>
    <div v-else class="accordion faq-accordion" id="faqAccordion">
      <div class="card" v-for="(faq, index) in faqs" :key="faq.faqId">
        <div class="card-header" :id="'heading' + index">
          <h2 class="mb-0">
            <button class="btn btn-link btn-block text-left d-flex justify-content-between align-items-center" type="button" data-toggle="collapse" :data-target="'#collapse' + index" :aria-expanded="index === 0" :aria-controls="'collapse' + index">
              <span><span class="faq-category">[{{ faq.csType }}]</span> {{ faq.title }}</span>
              <i class="fas fa-chevron-down"></i>
            </button>
          </h2>
        </div>
        <div :id="'collapse' + index" class="collapse" :class="{ show: index === 0 }" :aria-labelledby="'heading' + index" data-parent="#faqAccordion">
          <div class="card-body" v-html="faq.content"></div>
        </div>
      </div>
    </div>

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
import { searchFaqs } from '@/api/faq';

const faqs = ref([]);
const loading = ref(false);
const currentCategory = ref('ALL');
const currentPage = ref(1);
const totalPages = ref(1);

const categoryMapping = {
  SHIPPING: 1,
  PAYMENT: 2,
  ETC: 3,
  PRODUCT: 4,
  RETURN: 5,
  SELL: 6,
};

const fetchFaqs = async () => {
  loading.value = true;
  try {
    const params = {
      csTypeId: currentCategory.value === 'ALL' ? null : categoryMapping[currentCategory.value],
      page: currentPage.value,
      size: 10, // 페이지 당 10개씩 표시
    };
    const response = await searchFaqs(params);
    faqs.value = response.content;
    totalPages.value = response.totalPages;
  } catch (error) {
    console.error('FAQ를 불러오는 중 오류가 발생했습니다:', error);
    faqs.value = [];
  } finally {
    loading.value = false;
  }
};

const changeCategory = (category) => {
  currentCategory.value = category;
  currentPage.value = 1; // 카테고리 변경 시 1페이지로 리셋
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

onMounted(() => {
  fetchFaqs();
});

watch([currentCategory, currentPage], () => {
  fetchFaqs();
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

.faq-accordion {
  border-top: 2px solid #212529;
  min-height: 600px !important; /* 10개 항목 기준 대략적인 높이 */
}

.faq-accordion .card {
  border: none;
  border-bottom: 1px solid #dee2e6;
  border-radius: 0;
}

.card-header {
  padding: 0;
  background-color: #fff;
}

.btn-link {
  color: #212529;
  text-decoration: none;
  width: 100%;
  padding: 1.5rem 1rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.btn-link:hover {
  text-decoration: none;
  background-color: #f8f9fa;
}

.btn-link .faq-category {
    color: #007bff;
    font-weight: 700;
    margin-right: 0.5rem;
}

.btn-link i {
  transition: transform 0.3s ease;
}

.btn-link[aria-expanded="true"] i {
  transform: rotate(180deg);
}

.card-body {
  padding: 1.5rem 2rem;
  background-color: #f8f9fa;
  white-space: pre-wrap;
  line-height: 1.6;
}

.pagination {
  margin-top: 2rem;
}
</style>
