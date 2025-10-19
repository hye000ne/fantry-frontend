<script setup>
import { ref, onMounted } from 'vue'
import CarouselItemHolder from '@/components/common/atoms/CarouselItemHolder.vue'
import MainBannerCarousel from '@/components/common/molecules/MainBannerCarousel.vue'
import ProductCard from './ProductCard.vue'
import { getAuctionList, getHotDealAuctions } from '@/api/auction'

const newProducts = ref([])
const hotDeals = ref([])
const productSize = 10;

onMounted(async() => {
  try{
    const params = {
      size: productSize,
      sort: 'createdAt,asc',
      saleStatus: ['ACTIVE', 'REACTIVE']
    };
    const response = await getAuctionList(params);
    newProducts.value = response.data.content;
  } catch (error) {
    console.log("신규 상품 목록을 불러오는데 실패했습니다.", error);
  }

  try{
    const res = await getHotDealAuctions({size: productSize});
    hotDeals.value = res.data.content;
  } catch (error) {
    console.log("핫딜 상품 목록을 불러오는데 실패했습니다.", error);
  }
})
</script>

<template>
  <div class="homepage-wrapper">
    <!-- Main Banner Start -->
    <MainBannerCarousel>
      <CarouselItemHolder :isActive="true">
        <div class="banner-container">
          <!-- 배경 그라데이션 오버레이 -->
          <div class="banner-overlay"></div>
          
          <!-- 배경 이미지 -->
          <img
            class="banner-bg-image"
            src="/images/gemini_long_banner.png"
            alt="메인 배너"
            loading="lazy"
          />
          
          <!-- 컨텐츠 -->
          <div class="banner-content">
            <div class="content-wrapper">
              <!-- 메인 타이틀 -->
              <div class="title-section">
                <div class="badge-line">
                  <span class="premium-badge">
                    <i class="fa-solid fa-shield"></i>정품 보증
                  </span>
                  <span class="new-badge">NEW</span>
                </div>
                <h1 class="main-title">
                  Fantry
                  <span class="gradient-text">아이돌 굿즈</span>
                </h1>
                <p class="subtitle">
                  <i class="fa-solid fa-star"></i>
                  정품 검수 & 안전 거래로 믿을 수 있는 굿즈 마켓
                </p>
              </div>
              
              <!-- CTA 버튼 -->
              <div class="cta-buttons">
                <router-link to="/product/auction-policy" class="cta-btn primary">
                  <i class="fa-solid fa-book-open"></i>
                  <span>경매 이용 가이드</span>
                </router-link>
                <router-link to="/inspection/policy" class="cta-btn secondary">
                  <i class="fa-solid fa-check-double"></i>
                  <span>검수 기준 안내</span>
                </router-link>
              </div>

            </div>
          </div>
          
          <!-- 장식 요소 -->
          <div class="decorative-circles">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
          </div>
        </div>
      </CarouselItemHolder>
    </MainBannerCarousel>
    <!-- Main Banner End -->
    
    <div class="container main-content">
      <!-- 신상품 목록 Start -->
      <section class="product-section">
        <div class="section-header">
          <h3><i class="fa-solid fa-star"></i> 신규 상품</h3>
          <router-link to="/product" class="more-link">더보기 <i class="fa-solid fa-arrow-right"></i></router-link>
        </div>
        <div class="product-grid">
          <div v-for="item in newProducts" :key="item.itemId">
            <ProductCard :item="item" />
          </div>
        </div>
      </section>
      <!-- 신상품 목록 End -->

      <!-- 핫딜 목록 Start -->
      <section class="product-section">
        <div class="section-header">
          <h3><i class="fa-solid fa-fire"></i> 핫 딜 상품</h3>
          <router-link to="/product?saleType=AUCTION" class="more-link">더보기 <i class="fa-solid fa-arrow-right"></i></router-link>
        </div>
        <div class="product-grid">
          <div v-for="deal in hotDeals" :key="deal.itemId">
            <ProductCard :item="deal" />
          </div>
        </div>
      </section>
      <!-- 핫딜 목록 End -->
    </div>
  </div>
</template>

<style scoped>
/* 배너 컨테이너 */
.banner-container {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
/* 캐러셀 화살표 숨기기 */
:deep(.carousel-control-prev),
:deep(.carousel-control-next) {
  display: none !important;
}

/* 배경 이미지 */
.banner-bg-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}

/* 그라데이션 오버레이 */
.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, 
    rgba(92, 123, 255, 0.45) 0%, 
    rgba(138, 99, 255, 0.45) 50%,
    rgba(255, 107, 181, 0.4) 100%
  );
  z-index: 1;
}

/* 장식 원형 요소 */
.decorative-circles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -50px;
  animation: float 6s ease-in-out infinite;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: 10%;
  animation: float 8s ease-in-out infinite reverse;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 15%;
  animation: float 7s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 배너 컨텐츠 */
.banner-content {
  position: relative;
  z-index: 3;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.content-wrapper {
  max-width: 800px;
  text-align: center;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 타이틀 섹션 */
.title-section {
  margin-bottom: 40px;
}

.badge-line {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
  animation: fadeIn 1s ease-out 0.2s both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.premium-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.new-badge {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff6b9d 0%, #feca57 100%);
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.main-title {
  font-size: 56px;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  line-height: 1.2;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease-out 0.4s both;
}

.gradient-text {
  display: inline-block;
  background: linear-gradient(135deg, #fff 0%, #ffd89b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: fadeInUp 1s ease-out 0.6s both;
}

.subtitle i {
  color: #ffd89b;
}

/* CTA 버튼 */
.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  animation: fadeInUp 1s ease-out 0.8s both;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cta-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.cta-btn:hover::before {
  width: 300px;
  height: 300px;
}

.cta-btn span,
.cta-btn i {
  position: relative;
  z-index: 1;
}

.cta-btn.primary {
  background: white;
  color: #5C7BFF;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cta-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.cta-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  backdrop-filter: blur(10px);
}

.cta-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 반응형 */
@media (max-width: 768px) {
  .banner-container {
    height: 450px;
  }
  
  .main-title {
    font-size: 36px;
  }
  
  .subtitle {
    font-size: 16px;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .cta-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .banner-container {
    height: 400px;
  }
  
  .main-title {
    font-size: 28px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  .badge-line {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

<style>
.homepage-wrapper {
  background-color: #f8f9fa;
}
.main-content {
  padding-top: 40px;
  padding-bottom: 60px;
}
.product-section {
  margin-bottom: 60px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-header h3 {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-header h3 i {
  color: #5C7BFF;
}
.more-link {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
}
.more-link:hover {
  color: #000;
}
.product-grid {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 16px;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f1f1f1;
}
.product-grid::-webkit-scrollbar {
  height: 8px;
}
.product-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.product-grid::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}
.product-grid::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>