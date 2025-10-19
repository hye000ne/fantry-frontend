<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

const isAuction = computed(() => props.item.saleType === 'AUCTION')

const formatPrice = (price) => {
  if (price == null) return '가격 정보 없음'
  return price.toLocaleString() + '원'
}

const goToDetail = () => {
  if (props.item.auctionId) {
    router.push(`/product/${props.item.auctionId}`)
  }
}

const getTimeRemaining = (endTimeArr) => {
    if (!endTimeArr || !Array.isArray(endTimeArr)) return '';
    
    // 배열 → Date 객체 변환 (month - 1 주의)
    const [year, month, day, hour, minute, second] = endTimeArr;
    const end = new Date(year, month - 1, day, hour, minute, second);

    const now = new Date();
    const diff = end - now;

    if (diff < 0) return '경매 종료';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) return `${days}일 남음`;
    if (hours > 0) return `${hours}시간 남음`;
    return `${minutes}분 남음`;
}

const getThumbnailSrc = (thumbnailImageUrl) => {
  if (thumbnailImageUrl) {
    const baseUrl = import.meta.env.VITE_FILE_BASE_URL || '';
    return `${baseUrl}/${thumbnailImageUrl}`;
  }
  return '/images/ww.png';
};

</script>

<template>
  <div class="product-card" @click="goToDetail">
    <div class="product-image-wrapper">
      <img :src="getThumbnailSrc(item.fileInfos[1]?.fileUrl)" class="product-image" :alt="item.itemName" loading="lazy" />
      <span v-if="isAuction" class="badge-auction">경매</span>
      <span v-else class="badge-instant">즉시구매</span>
    </div>
    <div class="product-info">
      <h6 class="product-name">{{ item.itemName }}</h6>
      <div class="product-hashtags" v-if="item.hashTags">
        <span v-for="(tag, index) in item.hashTags.split(',')" :key="index" class="hashtag">
          #{{ tag.trim() }}
        </span>
      </div>
      <div class="product-price">
        <span v-if="isAuction" class="price-label">현재가</span>
        <span v-else class="price-label">구매가</span>
        <span class="price-value" :class="{ 'auction': isAuction }">
          {{ formatPrice(item.currentPrice) }}
        </span>
      </div>
      <div class="product-endtime">
        <i class="fa-regular fa-clock"></i>
        <span>{{ getTimeRemaining(item.endTime) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 Aspect Ratio */
}
.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.badge-auction {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.badge-instant {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: navy;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.product-info { padding: 16px; text-align: left; }
.product-name { font-size: 15px; font-weight: 600; margin-bottom: 8px; height: 44px; overflow: hidden; }
.product-hashtags {
  margin: 4px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.hashtag {
  font-size: 0.8rem;
  color: #5f0c15;
}
.product-price { margin-bottom: 8px; }
.price-label { font-size: 12px; color: #666; margin-right: 4px; }
.price-value { font-size: 18px; font-weight: 700; color: #dc3545; }
.product-endtime { font-size: 12px; color: #888; display: flex; align-items: center; gap: 4px; }
</style>