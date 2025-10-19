<template>
  <div class="product-list-page container">

    <div class="sale-type-nav mb-4">
      <span @click="selectSaleType(null)" :class="{ 'active': selectedSaleType === null }">전체</span>
      <span class="separator">|</span>
      <span @click="selectSaleType('AUCTION')" :class="{ 'active': selectedSaleType === 'AUCTION' }">경매상품</span>
      <span class="separator">|</span>
      <span @click="selectSaleType('INSTANT_BUY')" :class="{ 'active': selectedSaleType === 'INSTANT_BUY' }">일반 판매</span>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <p>상품 목록을 불러오는 중입니다...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <p>오류가 발생했습니다: {{ error }}</p>
    </div>

    <!-- 상품 목록 -->
    <div v-else>
      <div v-if="auctions.length > 0" class="row product-grid">
        <div v-for="auction in auctions" :key="auction.auctionId" class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="product-card" @click="goToProductDetail(auction.auctionId)">
            <!-- 이미지 및 뱃지 -->
            <div class="product-image-container" :class="{ 'instant-buy-border': auction.saleType === 'INSTANT_BUY', 'auction-border': auction.saleType === 'AUCTION' }">
              <img :src="getThumbnailSrc(auction.fileInfos[1]?.fileUrl)" alt="상품 썸네일" class="product-image">
              <span v-if="auction.saleType === 'AUCTION'" class="badge bg-danger product-badge">경매 상품</span>
              <span v-else-if="auction.saleType === 'INSTANT_BUY'" class="badge bg-primary product-badge">일반 판매</span>
            </div>

            <!-- 상품 정보 -->
            <div class="product-info p-3">
              <h5 class="product-name">{{ auction.itemName }}</h5>
              <div v-if="auction.hashTags" class="hashtag-container my-2">
                <span v-for="tag in auction.hashTags.split(',').map(t => t.trim())" :key="tag" class="hashtag">
                  #{{ tag }}
                </span>
              </div>
              <p class="product-price">
                <template v-if="auction.saleType === 'AUCTION'">
                  <span class="text-muted">시작가: {{ formatPrice(auction.startPrice) }}</span><br>
                  <span v-if="auction.currentPrice > auction.startPrice">현재가: {{ formatPrice(auction.currentPrice) }}</span>
                  <span v-else class="text-muted">입찰자 없음</span>
                </template>
                <template v-else>
                  <span>{{ formatPrice(auction.currentPrice) }}</span>
                </template>
              </p>
              <div class="product-times">
                <p class="mb-0"><small class="text-muted">시작: {{ formatDate(auction.startTime) }}</small></p>
                <p class="mb-0"><small class="text-muted">마감: {{ formatDate(auction.endTime) }}</small></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-products">
        <p>해당 조건에 맞는 상품이 없습니다.</p>
      </div>

      <!-- 페이징 처리 -->
      <nav v-if="totalPages > 1" aria-label="Page navigation">
        <ul class="pagination justify-content-center mt-4">
          <li class="page-item" :class="{ disabled: currentPage === 0 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">이전</a>
          </li>
          <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: currentPage === page - 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(page - 1)">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages - 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">다음</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAuctionList } from '@/api/auction';

const route = useRoute();
const router = useRouter();

// --- 상태 변수 ---
const auctions = ref([]);
const isLoading = ref(true);
const error = ref(null);
const currentPage = ref(0); // 0-based page index
const totalPages = ref(0);
const pageSize = 12; // 한 페이지에 보여줄 상품 개수 (3~5개씩 3줄 = 9~15개, 12개로 설정)
const selectedSaleType = ref(null); // null: 전체, 'AUCTION': 경매, 'INSTANT_BUY': 일반 판매

// --- Computed 속성 ---
const filterGroupType = computed(() => route.query.groupType || null);
const searchQuery = computed(() => route.query.keyword || null);

// --- 메서드 ---
const fetchAuctions = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize,
      sort: 'endTime,asc', // 마감 임박순으로 정렬
      saleStatus: ['ACTIVE', 'REACTIVE'] // 활성 상태의 상품만 가져옴
    };

    if (filterGroupType.value && filterGroupType.value !== 'ALL') {
      params.artistGroupType = filterGroupType.value;
    }
    if (selectedSaleType.value) {
      params.saleType = selectedSaleType.value;
    }
    if (searchQuery.value) {
      params.keyword = searchQuery.value;
    }

    const response = await getAuctionList(params);
    auctions.value = response.data.content;
    totalPages.value = response.data.totalPages;
  } catch (err) {
    console.error('상품 목록을 불러오는 데 실패했습니다:', err);
    error.value = '상품 목록을 불러오는 데 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const formatPrice = (price) => {
  return price != null ? price.toLocaleString() + '원' : '가격 정보 없음';
};

const formatDate = (dateArray) => {
  const date = parseJavaLocalDateTime(dateArray);
  if (!date) return '';
  return date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getThumbnailSrc = (thumbnailImageUrl) => {
  if (thumbnailImageUrl) {
    const baseUrl = import.meta.env.VITE_FILE_BASE_URL || '';
    return `${baseUrl}/${thumbnailImageUrl}`;
  }
  return '/images/ww.png';
};

//Java LocalDateTime 배열을 JS Date 객체로 변환
const parseJavaLocalDateTime = (dt) => {
    if (!Array.isArray(dt) || dt.length < 5) {
        return null;
    }
    const [year, month, day, hour, minute, second = 0] = dt;
    return new Date(year, month - 1, day, hour, minute, second);
};

const goToProductDetail = (auctionId) => {
  router.push(`/product/${auctionId}`);
};

const changePage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const selectSaleType = (type) => {
  selectedSaleType.value = type;
  currentPage.value = 0; // 필터 변경 시 첫 페이지로 리셋
};

// --- 라이프사이클 훅 ---
onMounted(() => {
  fetchAuctions();
});

// 라우트 쿼리(groupType) 변경 감지
watch(
  () => route.query.groupType,
  () => {
    currentPage.value = 0; // 필터 변경 시 첫 페이지로 리셋
    fetchAuctions();
  }
);

// 라우트 쿼리(keyword) 변경 감지
watch(
  () => route.query.keyword,
  () => {
    currentPage.value = 0; // 검색어 변경 시 첫 페이지로 리셋
    fetchAuctions();
  }
);

// 현재 페이지 변경 감지
watch(currentPage, () => {
  fetchAuctions();
});

// 판매 타입 변경 감지
watch(selectedSaleType, () => {
  fetchAuctions();
});
</script>

<style lang="scss" scoped>
.product-list-page {
  padding-top: 30px;
  padding-bottom: 50px;

  .sale-type-nav {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;

    span {
      font-size: 1.1rem;
      color: #6c757d;
      cursor: pointer;
      transition: color 0.2s ease-in-out;

      &:hover {
        color: #FF69B4; // Using a color from the theme
      }

      &.active {
        font-weight: bold;
        color: #FF69B4;
      }
    }

    .separator {
      color: #e0e0e0;
      cursor: default;
       &:hover {
        color: #e0e0e0;
      }
    }
  }

  .page-title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 30px;
    text-align: center;
  }

  .loading-container, .error-container, .no-products {
    text-align: center;
    padding: 50px 0;
    font-size: 1.2rem;
    color: #6c757d;
  }

  .product-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px 0; // 세로 간격만 조정
  }

  .product-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;
    height: 100%; // 카드 높이 통일
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .product-image-container {
      position: relative;
      width: 100%;
      height: 200px; // 썸네일 이미지 높이 고정
      overflow: hidden;
      background-color: #f8f9fa;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 2px solid #e0e0e0; // 기본 테두리
      
      // ProductDetailPage에서 정의된 border 스타일 재사용
      &.instant-buy-border {
        border-color: #a0c4ff;
      }
      &.auction-border {
        border-color: #dc3545;
      }
    }

    .product-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }

    .product-badge {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.4em 0.6em;
      border-radius: 0.25rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      color: white;
    }

    .product-info {
      flex-grow: 1; // 남은 공간 채우기
      display: flex;
      flex-direction: column;
      justify-content: space-between; // 가격과 시간 정보를 위아래로 분리
    }

    .product-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      line-height: 1.4;
      height: 2.8em; // 두 줄까지 표시, 넘치면 ...
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .hashtag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      // 해시태그가 많을 경우 1줄만 보이도록 처리
      max-height: 2.2em;
      overflow: hidden;
    }

    .hashtag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 14px;
      background-color: #f1f3f5;
      color: #495057;
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
      transition: color 0.2s ease-in-out;

      &:hover {
        color: #FF69B4;
      }
    }

    .product-price {
      font-size: 1.2rem;
      font-weight: bold;
      color: #343a40;
      margin-bottom: 0.5rem;

      span.text-muted {
        font-size: 0.9rem;
        font-weight: normal;
      }
    }

    .product-times {
      font-size: 0.85rem;
      color: #6c757d;
      margin-top: auto; // 항상 하단에 위치
    }
  }

  .pagination {
    .page-item {
      .page-link {
        color: #007bff;
        &:hover {
          color: #0056b3;
        }
      }
      &.active .page-link {
        background-color: #007bff;
        border-color: #007bff;
        color: white;
      }
      &.disabled .page-link {
        color: #6c757d;
      }
    }
  }
}
</style>