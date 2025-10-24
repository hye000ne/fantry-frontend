<template>
    <!-- 1. 데이터 로딩 상태 표시 -->
    <div v-if="isLoading" class="loading-container">
        <h2>경매 정보를 불러오는 중...</h2>
    </div>

    <!-- 2. 에러 발생 시 에러 메시지 표시 -->
    <div v-else-if="error" class="error-container">
        <h2>오류가 발생했습니다.</h2>
        <p>{{ error }}</p>
    </div>

    <!-- 3. 데이터 로드 완료 후 전체 화면 렌더링 -->
    <div v-else-if="auction" class="container">
        <div class="row g-6">
            <div class="col-md-6">
                <div class="product-image-container mb-3" :class="{ 'instant-buy-border': isInstantBuy, 'auction-border': isAuction }">
                    <img :src="mainImageSrc" alt="상품 이미지" class="product-image">
                    <span v-if="isAuction" class="badge bg-danger product-badge">경매 상품</span>
                    <span v-else-if="isInstantBuy" class="badge bg-primary product-badge">일반 판매</span>
                </div>
                
                <div class="thumbnail-gallery">
                    <img v-for="image in productImages"
                         :key="image.id"
                         :src="image.src"
                         alt="상품 썸네일"
                         class="thumbnail-item"
                         :class="{ 'active': image.src === mainImageSrc }"
                         @mouseover="changeMainImage(image.src)">
                </div>
            </div>

            <div class="col-md-6 d-flex flex-column bordered-section">
                
                <h2 class="product-title-main mb-5"><strong>{{ auction.itemName }}</strong></h2>

                <!-- ====================================================== -->
                <!-- 1. saleStatus가 ACTIVE일 때만 기존 경매/판매 로직 표시 -->
                <!-- ====================================================== -->
                <template v-if="['ACTIVE', 'REACTIVE', 'SOLD'].includes(auction.saleStatus)">
                    <!-- Case 1: 경매 상품일 경우 ('AUCTION') -->
                    <template v-if="isAuction">
                        <div class="countdown-timer mb-5">
                            <span class="countdown-label">경매 마감까지 남은 시간</span>
                            <span class="countdown-time">{{ timeRemaining }}</span>
                        </div>

                        <!-- 경매 진행 중일 때 UI -->
                        <template v-if="!isAuctionEnded">
                            <div class="bid-section-main text-center mb-5">
                                <h5 class="mb-3">현재 입찰가</h5>
                                <p v-if="hasBids" id="current-bid-price" :class="['current-bid-price-main', { 'bid-success-effect': isBidSuccess }]">
                                    <span v-if="isMyBidHighest" style="font-size: 1.5rem; color: #28a745; font-weight: 600;">내 입찰금 </span>
                                    {{ formatPrice(currentBidPrice) }}
                                </p>
                                <div v-else class="no-bids-info">
                                    <p class="no-bids-text">현재 입찰자가 없습니다.</p>
                                    <p class="start-price-info">(시작가: {{ formattedStartPrice }})</p>
                                </div>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                                <button class="btn btn-danger btn-lg flex-grow-1" @click="openBidModal" :disabled="!userStore.isLoggedIn"
                                    :title="!userStore.isLoggedIn ? '로그인이 필요합니다.' : '입찰에 참여하세요'">
                                    {{ userStore.isLoggedIn ? '경매 참여하기' : '로그인 후 참여 가능' }}
                                </button>
                                <button class="btn btn-outline-secondary btn-lg" @click="isPolicyModalVisible = true">경매 이용 가이드</button>
                            </div>
                        </template>

                        <!-- 경매 종료 후 UI -->
                        <template v-else>
                            <!-- Case 1-1: 낙찰자이며, 결제 대기 중 (PENDING_PAYMENT) -->
                            <div v-if="userAuctionState === '결제 대기중'" class="text-center">
                                <div class="bid-section-main text-center mb-5">
                                    <h5 class="mb-3" style="font-size: 1.5rem; color: #28a745;">🎉 축하드립니다! 🎉</h5>
                                    <p class="current-bid-price-main" style="font-size: 1.8rem;">회원님이 낙찰하셨습니다.</p>
                                </div>
                                <button class="btn btn-primary btn-lg w-100" @click="goToPayment">
                                    결제하기
                                </button>
                            </div>

                            <!-- Case 1-2: 미로그인 또는 미낙찰자 (USER) -->
                            <div v-else-if ="userAuctionState === 'USER'" class="text-center">
                                <div class="bid-section-main text-center mb-5">
                                    <h5 class="mb-3">경매 종료</h5>
                                    <p class="current-bid-price-main" style="font-size: 2rem;">경매가 마감되었습니다.</p>
                                </div>
                                <button class="btn btn-secondary btn-lg w-100" disabled>
                                    경매에 참여할 수 없습니다
                                </button>
                            </div>
                            
                            <!-- Case 1-3: 낙찰자이며, 결제 완료 이후 (PAID, SHIPPED 등) -->
                            <div v-else class="text-center">
                                <div class="bid-section-main text-center mb-5">
                                    <h5 class="mb-3" style="font-size: 1.5rem; color: #28a745;">🎉 축하드립니다! 🎉</h5>
                                    <p class="current-bid-price-main" style="font-size: 1.8rem;">회원님이 낙찰하셨습니다.</p>
                                </div>
                                <button class="btn btn-success btn-lg w-100" disabled>
                                    {{userAuctionState}}
                                </button>
                            </div>
                        </template>
                    </template>

                    <!-- Case 2: 즉시 구매 상품일 경우 ('INSTANT_BUY') -->
                    <template v-else-if="isInstantBuy">
                        <div class="countdown-timer mb-5">
                            <span class="countdown-label">판매 마감까지 남은 시간</span>
                            <span class="countdown-time">{{ timeRemaining }}</span>
                        </div>
                        <div class="bid-section-main text-center mb-5">
                            <h5 class="mb-3">즉시 구매가</h5>
                            <p class="current-bid-price-main">{{ formattedStartPrice }}</p>
                        </div>
                        <!-- 판매 진행 중일 때 -->
                        <template v-if="!isAuctionEnded">
                            <button class="btn btn-primary btn-lg w-100" @click="purchaseNow" :disabled="!userStore.isLoggedIn"
                                :title="!userStore.isLoggedIn ? '로그인이 필요합니다.' : '즉시 구매하세요'">
                                {{ userStore.isLoggedIn ? '즉시 구매하기' : '로그인 후 구매 가능' }}
                            </button>
                        </template>
                        <!-- 판매가 종료되었을 때 -->
                        <template v-else>
                            <button class="btn btn-secondary btn-lg w-100" disabled>
                                판매가 종료되었습니다
                            </button>
                        </template>
                    </template>
                </template>

                <!-- ====================================================== -->
                <!-- 2. saleStatus가 ACTIVE가 아닐 때 상태 표시 화면 -->
                <!-- ====================================================== -->
                <template v-else>
                    <div class="auction-status-overlay text-center">
                        <div class="bid-section-main text-center mb-5">
                            <h5 class="mb-3">{{ auctionStatusTitle }}</h5>
                            <p class="current-bid-price-main" style="font-size: 1.5rem;">{{ auctionStatusMessage }}</p>
                        </div>
                        <button class="btn btn-secondary btn-lg w-100" disabled>
                            {{ auctionStatusButtonText }}
                        </button>
                    </div>
                </template>
            </div>
        </div>

        <!-- ============================================= -->
        <!--           새로운 정보 섹션 (3단 구조)           -->
        <!-- ============================================= -->
        <div class="row mt-5">
            <div class="col-12">
                <!-- 1. 상품 정보 섹션 -->
                <section class="mb-5">
                    <h3 class="section-title">상품 정보</h3>
                    <div class="info-container">
                        <div class="info-row">
                            <div class="info-label">굿즈 카테고리</div>
                            <div class="info-content">{{ auction.categoryName }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">아티스트</div>
                            <div class="info-content">{{ koreanArtistGroupType }} / {{ auction.artistName }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">해시태그</div>
                            <div class="info-content">
                                <div v-if="auction.hashtags" class="hashtag-container">
                                    <span v-for="tag in auction.hashtags.split(',').map(t => t.trim())" :key="tag" class="hashtag">
                                        #{{ tag }}
                                    </span>
                                </div>
                                <span v-else>-</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">상품 설명</div>
                            <div class="info-content">{{ auction.itemDescription }}</div>
                        </div>
                    </div>
                </section>

                <!-- 2. 검수 정보 섹션 -->
                <section class="mb-5">
                    <h3 class="section-title">검수 정보</h3>
                    <div v-if="auction.checklist && auction.checklist.length" class="checklist-table">
                        <div v-for="item in auction.checklist" :key="item.checklistItem.checklistItemId" class="cl-row">
                            <div class="cl-col label">{{ item.checklistItem.label }}</div>
                            <div class="cl-col content">{{ parseChecklistAnswer(item.inspectorAnswer) }}</div>
                        </div>
                    </div>
                    <p v-else class="text-muted">검수 정보가 없습니다.</p>
                </section>

                <!-- 3. 경매/판매 정보 섹션 -->
                <section class="mb-5">
                    <h3 class="section-title">{{ isAuction ? '경매 정보' : '판매 정보' }}</h3>
                    <div class="info-container">
                        <div class="info-row">
                            <div class="info-label">{{ isAuction ? '경매 시작가' : '판매가' }}</div>
                            <div class="info-content">{{ formattedStartPrice }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">{{ isAuction ? '경매 시작시간' : '판매 시작시간' }}</div>
                            <div class="info-content">{{ formattedStartTime }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">{{ isAuction ? '경매 마감시간' : '판매 마감시간' }}</div>
                            <div class="info-content">{{ formattedEndTime }}</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <div v-if="isAuction && isBidModalVisible" class="modal-overlay" @click.self="closeBidModal">
            <div class="modal-content">
                <button class="modal-close-btn" @click="closeBidModal">&times;</button>
                <h3>경매 참여</h3>
                <hr class="my-4">

                <div class="bid-history-section">
                    <button class="btn btn-outline-secondary w-100 mb-3" @click="toggleBidHistory">
                        지난 입찰 기록 보기 {{ isBidHistoryVisible ? '▼' : '▶' }}
                    </button>
                    <div v-if="isBidHistoryVisible" class="bid-history-log">
                        <!-- 데이터가 없을 때 메시지 표시 -->
                        <p v-if="!bidHistory || bidHistory.length === 0" class="text-muted text-center my-3">
                            입찰 기록이 없습니다.
                        </p>
                        <!-- bidHistory 배열을 순회하며 입찰 기록 표시 -->
                        <div v-else>
                            <p v-for="(bid, index) in bidHistory" :key="index">
                                {{ formatPrice(bid.bidAmount) }} - {{ formatDate(bid.bidAt) }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="current-bid-modal mb-3">
                    <small>현재 입찰가</small>
                    <span>{{ formattedCurrentPrice }}</span>
                </div>

                <div class="quick-bid-buttons mb-3">
                    <button class="btn btn-outline-primary btn-sm" @click="quickBid(1000)">+ 1,000원</button>
                    <button class="btn btn-outline-primary btn-sm" @click="quickBid(5000)">+ 5,000원</button>
                    <button class="btn btn-outline-primary btn-sm" @click="quickBid(10000)">+ 10,000원</button>
                </div>
                
                <form @submit.prevent="validateAndConfirmBid()">
                    <div class="input-group">
                        <input type="number" class="form-control form-control-lg" placeholder="입찰 금액" v-model="bidAmount">
                        <button class="btn btn-danger btn-lg" type="submit">입찰하기</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 경매 이용 가이드 모달 -->
        <div v-if="isPolicyModalVisible" class="modal-overlay" @click.self="isPolicyModalVisible = false">
            <div class="modal-content policy-modal-content">
                <button class="modal-close-btn" @click="isPolicyModalVisible = false">&times;</button>
                <ProductAuctionPolicy />
            </div>
        </div>
    </div>
</template>

<script setup>
/* =============================================
 * 1. 임포트 (Import) & 초기 설정
 * ============================================= */
    import { ref, onMounted, onUnmounted, computed , watch} from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { getAuctionDetails, getAuctionWinnerStatus} from '@/api/auction';  //경매 관련 API 함수
    import { getBidsByAuctionId } from '@/api/bid';  //입찰 관련 API 함수
    import { useUserStore } from '@/stores/userStore';
    import { subscribe, unsubscribe, publish, disconnect, connect } from '@/services/websocketService';
    import { usePaymentStore } from '@/stores/paymentStore';
    import ProductAuctionPolicy from '@/components/product/ProductAuctionPolicy.vue'; // 경매 이용 안내 컴포넌트
    import { useNotification } from '@/utils/notificationComposable';
    import { useNotificationStore } from '@/stores/notificationStore';
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const route = useRoute();
    const router = useRouter();
    const userStore = useUserStore();
    const paymentStore = usePaymentStore();
    const notificationComposable = useNotification(userStore, useNotificationStore());
    const auctionId = route.params.id;
    const { showAlert: showAlertDialog } = useAlertDialog();

/* =============================================
* 2. 상태 (State)
* - API 데이터, 실시간 데이터, UI 제어용 데이터를 명확히 분리
* ============================================= */
    // --- API 데이터 상태 ---
    const auction = ref(null);
    const isLoading = ref(true);
    const error = ref(null);
    const bidHistory = ref([]);

    // --- 실시간 데이터 상태 ---
    const currentBidPrice = ref(0);
    const highestBidderId = ref(null); // 최고 입찰자 ID 설정
    const timeRemaining = ref('');
    let countdownInterval = null;

    // --- UI 제어 상태 ---
    const isBidModalVisible = ref(false);
    const bidAmount = ref('');
    const isBidSuccess = ref(false);
    const isBidHistoryVisible = ref(false);
    const userAuctionState = ref('USER'); // 경매 종료 후 유저 상태: PENDING_PAYMENT, PAID, USER
    const isAuctionEnded = ref(false); // 경매 종료 여부
    const isPolicyModalVisible = ref(false); // 경매 이용 안내 모달 표시 여부

    //썸네일 이미지 데이터
    const productImages = ref([]);

    //메인 썸네일 이미지 경로
    const mainImageSrc = ref('');

/* =============================================
* 3. 계산된 속성 (Computed)
* - 상태를 기반으로 동적인 값을 계산
* ============================================= */
    const isAuction = computed(() => auction.value?.saleType === 'AUCTION');
    const isInstantBuy = computed(() => auction.value?.saleType === 'INSTANT_BUY');

    const hasBids = computed(()=> {
        if (!auction.value) return false;
        // 현재 입찰가와 시작가가 다르면 입찰이 진행된 것으로 간주
        return currentBidPrice.value !== auction.value.startPrice;
    })
    const formatPrice = (price) => price != null ? price.toLocaleString() + '원' : '가격 정보 없음';

    const parseUtcDateArray = (dt) => {
        if (!Array.isArray(dt) || dt.length < 5) return null;
        const [year, month, day, hour, minute, second = 0] = dt;
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    };

    const formatDate = (dateArray) => {
        if (!dateArray) return '';
        const date = parseUtcDateArray(dateArray);
        if (!date || isNaN(date.getTime())) return '';
        return date.toLocaleString('ko-KR');
    };

    const endTimeMs = computed(() => {
        if (!auction.value?.endTime) return null;
        const dateObj = parseUtcDateArray(auction.value.endTime);
        return dateObj ? dateObj.getTime() : null;
    });

    const formattedCurrentPrice = computed(() => formatPrice(currentBidPrice.value));
    const formattedStartPrice = computed(() => formatPrice(auction.value?.startPrice));
    const formattedStartTime = computed(() => formatDate(auction.value?.startTime));
    const formattedEndTime = computed(() => formatDate(auction.value?.endTime));

    const isMyBidHighest = computed(() => {
        if (!userStore.isLoggedIn || !highestBidderId.value) {
            return false;
        }
        return userStore.currentUser.memberId === highestBidderId.value;
    });

    const auctionStatusTitle = computed(() => {
        if (!auction.value) return '';
        switch(auction.value.saleStatus) {
            case 'PREPARING':
            case 'REPREPARING': 
                return '판매 준비 중';
            case 'SOLD': return '판매 완료';
            case 'NOT_SOLD':
                return isAuction.value ? '유찰' : '미판매';
            case 'CANCELLED': return '판매 취소';
            default: return '안내';
        }
    });

    const auctionStatusMessage = computed(() => {
        if (!auction.value) return '';
        switch(auction.value.saleStatus) {
            case 'PREPARING':
            case 'REPREPARING': 
                return '판매가 곧 시작될 예정입니다.';
            case 'SOLD': return '이 상품은 판매가 완료되었습니다.';
            case 'NOT_SOLD':
                return isAuction.value ? '이 상품은 유찰되었습니다.' : '이 상품은 판매되지 않았습니다.';
            case 'CANCELLED': return '이 상품은 판매가 취소되었습니다.';
            default: return '현재 이 상품에 참여할 수 없습니다.';
        }
    });

    const auctionStatusButtonText = computed(() => {
        if (!auction.value) return '참여 불가';
        switch(auction.value.saleStatus) {
            case 'SOLD': return '판매 완료';
            case 'NOT_SOLD':
                return isAuction.value ? '유찰됨' : '미판매';
            case 'CANCELLED': return '판매 취소됨';
            default: return '참여 불가';
        }
    });

    const koreanArtistGroupType = computed(() => {
        if (!auction.value || !auction.value.artistGroupType) return '';
        switch (auction.value.artistGroupType) {
            case 'MALE_GROUP':
                return '보이그룹';
            case 'MALE_SOLO':
                return '솔로(남)';
            case 'FEMALE_GROUP':
                return '걸그룹';
            case 'FEMALE_SOLO':
                return '솔로(여)';
            case 'MIXED':
                return '혼성';
            case 'OTHER':
                return '기타';
            default:
                return auction.value.artistGroupType;
        }
    });

/* =============================================
* 4. 메서드 (Methods) 영역
* ============================================= */

    /**
     *  API를 호출하여 경매/판매 상세 정보를 가져오고, 후속 작업을 시작
     */
    const fetchAuctionData = async () => {
        try {
            isLoading.value = true;
            const response = await getAuctionDetails(auctionId);
            auction.value = response.data;
                        
            // --- 이미지 데이터 처리 ---
            if (response.data.fileInfos && response.data.fileInfos.length > 0) {
                const baseUrl = import.meta.env.VITE_FILE_BASE_URL || '';
                const images = [];
                response.data.fileInfos.forEach(file => {
                    images.push({
                        id: file.fileId,
                        src: `${baseUrl}/${file.fileUrl}`
                    });
                });
                productImages.value = images;
                mainImageSrc.value = productImages.value[0].src;
            } else {
                productImages.value = [        
                    { id: 1, src: '/images/ww.png' },
                    { id: 2, src: '/images/654.png' },
                    { id: 3, src: '/images/hy.png' },
                    { id: 4, src: '/images/hye.png' },
                    { id: 5, src: '/images/kr.png' },
                    { id: 6, src: '/images/sy.png' },
                    { id: 7, src: '/images/wt.png' }
                ];
                mainImageSrc.value = productImages.value[0].src;
            }

            highestBidderId.value = auction.value.highestBidderId; // 최고 입찰자 ID 설정
            currentBidPrice.value = auction.value.currentPrice;

            // --- 경매 종료 상태 결정 ---
            const endTime = parseUtcDateArray(auction.value.endTime);
            const isTimeOver = endTime && new Date() > endTime;
            const isStatusEnded = ['SOLD', 'NOT_SOLD', 'CANCELLED'].includes(auction.value.saleStatus);

            if (isTimeOver || isStatusEnded) {
                isAuctionEnded.value = true;
            } else {
                isAuctionEnded.value = false;
            }

            // --- 종료된 경매 처리 ---
            if (isAuctionEnded.value) {
                if (userStore.isLoggedIn && isAuction.value) {
                    try {
                        const statusResponse = await getAuctionWinnerStatus(auctionId, userStore.currentUser.memberId);
                        userAuctionState.value = getKoreanAuctionStatus(statusResponse.data);
                    } catch (e) {
                        console.error("낙찰자 상태 조회에 실패했습니다:", e);
                        userAuctionState.value = 'USER'; // 실패 시 기본값
                    }
                } else {
                    userAuctionState.value = 'USER'; // 비로그인 또는 경매 상품이 아님
                }
                if (countdownInterval) clearInterval(countdownInterval);
                timeRemaining.value = isAuction.value ? "경매 종료" : "판매 종료";
            } 
            // --- 진행 중인 경매 처리 ---
            else {
                if (['ACTIVE', 'REACTIVE'].includes(auction.value.saleStatus)) {
                    if (isAuction.value) {
                        setupWebSocketSubscription();
                        fetchBidHistory(auctionId);
                    }
                    startCountdown();
                }
            }

        } catch (err) {
            error.value = "상품 정보를 불러오는 데 실패했습니다. 페이지를 새로고침해주세요.";
            console.error("Fetch auction data failed:", err);
        } finally {
            isLoading.value = false;
            console.log("fetchAuctionData 완료");
        }
    };

    function getKoreanAuctionStatus(status) {
        switch (status) {
            case 'PENDING_PAYMENT':
            return '결제 대기중';
            case 'PAID':
            return '결제 완료';
            case 'PREPARING_SHIPMENT':
            return '배송 준비중';
            case 'SHIPPED':
            return '배송 중';
            case 'DELIVERED':
            return '배송 완료';
            case 'CONFIRMED':
            return '구매 확정';
            case 'CANCEL_REQUESTED':
            return '취소 요청';
            case 'CANCELLED':
            return '취소 완료';
            case 'REFUND_REQUESTED':
            return '환불 요청';
            case 'REFUNDED':
            return '환불 완료';
            case 'USER':
            return 'USER';
            default:
            return status;
        }
    }

    // WebSocket을 통해 현재 경매의 실시간 입찰 토픽을 구독
    const setupWebSocketSubscription = () => {
        subscribe(`/topic/auctions/${auctionId}`, (message) => {
            const broadcast = JSON.parse(message.body);
            currentBidPrice.value = broadcast.newPrice;
            highestBidderId.value = broadcast.memberId; // 실시간으로 최고 입찰자 ID 갱신

            //새로운 입찰이 생기면 입찰 기록 갱신
            const newHistoryEntry = {
                bidAmount: broadcast.newPrice,
                bidAt: new Date()
            };
            bidHistory.value.unshift(newHistoryEntry);

            isBidSuccess.value = true;
            setTimeout(() => { isBidSuccess.value = false; }, 500);
        });
    };

    //watch 로 로그인 여부 감지
    watch(
    () => userStore.authToken,
    (newToken) => {
        disconnect();
        connect(newToken);
    },
    {
        immediate: true
    }
    );

    /**
     * 현재 경매의 지난 입찰 기록을 API로 조회
     */
    const fetchBidHistory = async (auctionId) => {
        try {
            const response = await getBidsByAuctionId(auctionId);
            bidHistory.value = response.data.map(bid => ({
                bidAmount: bid.bidAmount,
                bidAt: bid.bidAt
            }));
        } catch (err) {
            console.error("Failed to fetch bid history:", err);
        }
    };

    // 입찰 금액 서버로 전송 (로그인 상태 확인 포함)
    const sendBid = () => {
        if (!userStore.isLoggedIn) {
            showAlertDialog("알림", "로그인이 필요한 기능입니다.");
            return;
        }

        const bidData = {
            memberId: userStore.currentUser.memberId,
            bidAmount: parseInt(bidAmount.value, 10),
        };

        publish({
            destination: `/app/auctions/${auctionId}/bids`,
            body: JSON.stringify(bidData)
        });

        bidAmount.value = '';
        closeBidModal();
    };

    /**
     *  즉시 구매 버튼 클릭 시 동작할 메서드
     */
    const purchaseNow = () => {
        if (!userStore.isLoggedIn) {
            showAlertDialog("알림", "로그인이 필요한 기능입니다.");
            return;
        }
        paymentStore.setAuctionContext(auctionId);
        router.push('/product/order/info');
    };

    /**
     * 낙찰 후 결제하기 버튼 클릭 시 동작
     */
    const goToPayment = () => {
        if (!userStore.isLoggedIn) {
            showAlertDialog("알림", "로그인이 필요한 기능입니다.");
            return;
        }
        paymentStore.setAuctionContext(auctionId);
        router.push('/product/order/info');
    };

    const validateAndConfirmBid = () => {
        const newBid = parseInt(bidAmount.value, 10);
        const numericCurrentPrice = currentBidPrice.value;
        const numericStartPrice = auction.value.price;

        if (isNaN(newBid) || newBid <= 0 || newBid % 100 !== 0) {
            showAlertDialog("알림", "입찰 금액을 100원 단위의 올바른 숫자로 입력해주세요.");
            return;
        }

        if(newBid > 200000000){
            showAlertDialog("알림", "입찰 금액은 최대 2억원까지만 가능합니다.");
            return;
        }
        
        if (numericCurrentPrice === numericStartPrice) {
            if (newBid <= numericStartPrice) {
                showAlertDialog("알림", `입찰 금액은 시작가(${formattedStartPrice.value})보다 높아야 합니다.`);
                return;
            }
        } else {
            if (newBid < numericCurrentPrice + 1000) {
                showAlertDialog("알림", `입찰 금액은 현재가(${formattedCurrentPrice.value})보다 1,000원 이상 높아야 합니다.`);
                return;
            }
        }

        const isConfirmed = confirm(`${newBid.toLocaleString()}원 입찰하시겠습니까?`);

        if (isConfirmed) {
            notificationComposable.subscribeAuction(auctionId)
            sendBid();
        }
 	  };

    //썸네일 이미지 호버 효과
    const changeMainImage = (newSrc) => {
        mainImageSrc.value = newSrc;
    };



    // 경매 마감까지 남은 시간 계산 및 표시
    const startCountdown = () => {
        if (!endTimeMs.value) return;

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTimeMs.value - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                timeRemaining.value = isAuction.value ? "경매 종료" : "판매 종료";
                isAuctionEnded.value = true;
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let remainingString = "";
            if (days > 0) remainingString += `${days}일 `;
            remainingString += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            timeRemaining.value = remainingString;
        }, 1000);
    };

    //모달 ui 영역
    const openBidModal = () => {
        // 경매 상태 선제적 확인
        if (!['ACTIVE', 'REACTIVE'].includes(auction.value.saleStatus) || isAuctionEnded.value) {
            showAlertDialog("알림", "경매가 진행중인 상품이 아닙니다.");
            // 최신 상태를 보여주기 위해 데이터 갱신
            fetchAuctionData();
            return;
        }
 	    isBidModalVisible.value = true;
 	  };

 	  const closeBidModal = () => {
 	    isBidModalVisible.value = false;
 	 	 isBidHistoryVisible.value = false; // 모달 닫을 때 기록도 닫기
 	  };

 	 	const toggleBidHistory = () => {
 	 	 	isBidHistoryVisible.value = !isBidHistoryVisible.value;
 	  };

    const quickBid = (amountToAdd) => {
 	 	 	bidAmount.value = currentBidPrice.value + amountToAdd;
 	  };

    /**
     * 체크리스트 답변(JSON 문자열 가능)을 파싱하는 함수
     */
    const parseChecklistAnswer = (answer) => {
        if (answer === null || answer === undefined) return 'N/A';
        try {
            // 예: '"없음"' -> '없음'
            return JSON.parse(answer);
        } catch (e) {
            // JSON이 아닌 일반 문자열이면 그대로 반환
            return answer;
        }
    };

/* =============================================
* 5. 라이프사이클 훅 (Lifecycle Hooks)
* ============================================= */
    onMounted(async () => {
        // 사용자 정보가 없으면 먼저 로드합니다.
        if (userStore.authToken && !userStore.currentUser) {
            await userStore.fetchUser();
        }
        // 사용자 정보를 기다린 후 경매 데이터를 가져옵니다.
        await fetchAuctionData();
        console.log("페이지 마운트 됨");
    });

    // 컴포넌트가 언마운트되면 WebSocket 및 카운트다운 타이머 연결 해제
    onUnmounted(() => {
        if (isAuction.value && !isAuctionEnded.value) {
            unsubscribe(`/topic/auctions/${auctionId}`);
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        disconnect();
    });
</script><style lang="scss" scoped>

    /* =============================================
    1. 기본 레이아웃 및 공통 스타일
    ============================================= */

    .container {
        max-width: 960px;
        margin-top: 30px;
    }

    .bordered-section {
        border: 2px solid #e9ecef; 
        border-radius: 12px;       
        padding: 25px;            
    }


    /* =============================================
    2. 좌측 - 상품 이미지 영역
    ============================================= */

    .product-image-container {
        position: relative;
        border: 2px solid #dee2e6; /* Border thickness increased to 2px */
        border-radius: 8px;
        overflow: hidden;
        background: #f8f9fa;
        transition: border-color 0.3s ease; /* Add a smooth transition effect */
    }

    .instant-buy-border {
        border-color: #a0c4ff;
    }

    .auction-border {
        border-color: #dc3545; /* Red border for auction items */
    }

    .product-badge {
        position: absolute;
        top: 1rem;
        left: 1rem;
        font-size: 1rem;
        font-weight: 600;
        padding: 0.5em 0.75em;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        color: white; /* Set text color to white for better visibility */
    }

    .product-image {
        display: block;
        width: 100%;
        height: 400px;
        object-fit: contain; /* 이미지 비율 유지하며 컨테이너에 맞춤 */
        padding: 1rem; /* Add some padding so the image doesn't touch the border */
    }

    .thumbnail-gallery {
        display: flex;
        gap: 10px; /* 썸네일 사이의 간격 */
        flex-wrap: wrap; /* 썸네일이 많아지면 다음 줄로 넘김 */
        min-height: 90px; 
        align-items: center;
    }

    .thumbnail-item {
        width: 80px;
        height: 80px;
        object-fit: cover; /* 이미지가 찌그러지지 않도록 비율 유지하며 채움 */
        border-radius: 4px;
        cursor: pointer;
        border: 2px solid transparent; /* 평소엔 투명한 테두리를 두어 active 시 레이아웃이 밀리는 현상 방지 */
        transition: all 0.2s ease-in-out;

        /* 마우스를 올렸을 때 스타일 */
        &:hover {
            transform: scale(1.05); /* 살짝 확대되는 효과 */
            border-color: #dc3545; /* 입찰 버튼과 동일한 색상으로 테두리 강조 */
        }

        /* 현재 활성화된(메인 이미지와 동일한) 썸네일 스타일 */
        &.active {
            border-color: #dc3545;
            box-shadow: 0 0 8px rgba(220, 53, 69, 0.5); /* 그림자 효과 */
        }
    }


    /* =============================================
    3. 우측 - 입찰 정보 영역
    ============================================= */

    .product-title-main {
        font-size: 1.75rem; 
    }

    .countdown-timer {
        text-align: center;
        padding: 15px;
        background-color: #f8f9fa; 
        border-radius: 8px;
        border: 2px solid #e9ecef;
    }

    .countdown-label {
        display: block;
        font-size: 1.1rem;
        color: #6c757d; 
        margin-bottom: 5px;
    }

    .countdown-time {
        font-size: 1.75rem;
        font-weight: 600;
        color: #343a40;
        letter-spacing: 1px; 
    }

    .bid-section-main {
        background-color: #f8f9fa;
        padding: 30px 20px;
        border-radius: 12px;
        border: 2px solid #e9ecef;
    }

    .current-bid-price-main {
        font-size: 3rem; 
        font-weight: bold;
        color: #dc3545;
        transition: color 0.3s, transform 0.3s;
    }

    /* 입찰 폼 관련 스타일 */
    .form-control-lg {
        padding: 0.8rem 1.2rem; 
        font-size: 1.1rem;   
    }

    .btn-lg {
        padding: 0.6rem 1.5rem;
        font-size: 1.1rem;
        margin-left: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap; /* 글씨가 두 줄로 바뀌는 것을 방지 */
    }

    .input-group .form-control {
        border-top-right-radius: 0.375rem;
        border-bottom-right-radius: 0.375rem;
    }

    .no-bids-info {
        padding: 1.2rem 0; 
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .no-bids-text {
        font-size: 1.3rem; 
        color: #6c757d;     
        font-weight: 500;
        margin-bottom: 0.25rem; 
    }

    .start-price-info {
        font-size: 1.4rem;
        color: #dc3545; 
        margin-bottom: 0;
    }


    /* =============================================
    4. 하단 - 상세 정보 및 상품 설명
    ============================================= */

    /* 상세 정보 섹션 */
    .details-section {
        background-color: #fff;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 25px 30px;
    }

    .details-title {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e9ecef;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .details-grid {
        display: grid;
        // 화면 너비에 따라 1~3개의 컬럼으로 자동 조절
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px 25px; // 세로, 가로 간격
    }

    .detail-item {
        display: flex;
        justify-content: space-between; // 이름과 값을 양쪽 끝으로
        align-items: center;
        padding: 10px 0;
        font-size: 1.1rem;
        color: #495057;

        // 값(value) 부분의 스타일
        span:last-child {
            color: #212529;
            font-weight: 500;
        }
    }

    /* 상품 설명 섹션 */
    .product-description {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
    
        h5 {
            margin-bottom: 10px;
            font-size: 1.6rem;
        }

        p {
            font-size: 1.2rem;
            color: #495057;
            line-height: 1.6;
            margin-bottom: 0;
        }
    }

    /* =============================================
    5. 기타 - 입찰 애니메이션 효과
    ============================================= */

    .bid-success-effect {
        animation: flash-and-pulse 0.5s ease-out;
    }

    @keyframes flash-and-pulse {
        0% {
            transform: scale(1);
            color: #dc3545; /* 원래 색상 */
        }
        50% {
            transform: scale(1.5); /* 1.5배 커짐 */
            color: #ffc107; /* 성공 색상 (노란색) */
        }
        100% {
            transform: scale(1);
            color: #dc3545; /* 원래 색상으로 복귀 */
        }
    }

    /* =============================================
     6. 경매 참여 모달 창 스타일
     ============================================= */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        padding: 30px 40px;
        border-radius: 12px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 500px;
        position: relative;
        animation: slide-down 0.3s ease-out;
    }

    @keyframes slide-down {
        from {
            transform: translateY(-30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-close-btn {
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        font-size: 2rem;
        color: #aaa;
        cursor: pointer;
        line-height: 1;
        &:hover {
            color: #333;
        }
    }
    
    .current-bid-modal {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        background-color: #f8f9fa;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 1.2rem;
        
        small {
            color: #6c757d;
        }
        span {
            font-weight: bold;
            font-size: 1.5rem;
            color: #dc3545;
        }
    }

    .bid-history-section {
        .btn-outline-secondary {
            text-align: left;
            padding: 10px 15px;
        }
    }

    .bid-history-log {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        max-height: 150px;
        overflow-y: auto;
        font-size: 0.95rem;
        color: #495057;

        p {
            margin-bottom: 8px;
            &:last-child {
                margin-bottom: 0;
            }
        }
    }

    .quick-bid-buttons {
        display: flex;
        gap: 10px; /* 버튼 사이 간격 */
        justify-content: flex-end; /* 버튼을 오른쪽으로 정렬 */
    }

    .policy-modal-content {
        max-width: 700px; /* 가이드 모달은 조금 더 넓게 */
        max-height: 80vh; /* 화면 높이의 80%로 최대 높이 제한 */
        overflow-y: auto; /* 내용이 길어지면 스크롤 생성 */
    }

    /* =============================================
    7. 새로운 정보 섹션 스타일
    ============================================= */
    .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #dee2e6;
        text-decoration: none; /* 텍스트에 밑줄이나 취소선이 생기는 것을 방지 */
    }

    .info-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        border-bottom: 1px solid #dee2e6; /* 구분선 색상 짙게 변경 */
    }

    .info-row > div {
        padding: 1rem;
    }

    .info-label {
        font-weight: 600;
        color: #495057;
        background-color: #f8f9fa;
    }

    .info-content {
        color: #212529;
        white-space: pre-wrap; /* 줄바꿈 유지를 위해 */
    }

    .info-content .hashtag-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .info-content .hashtag {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 16px;
        background-color: #f1f3f5;
        color: #495057;
        font-size: 0.9rem;
        font-weight: 500;
    }

    /* h3.section-title의 가상요소(::before)로 인한 취소선 제거 */
    h3.section-title::before {
        display: none;
    }

    /* 체크리스트 테이블 */
    .checklist-table {
        /* border-top을 제거하여 section-title의 border-bottom과 중복되지 않도록 함 */
    }

    .cl-row {
        display: grid;
        grid-template-columns: 200px 1fr; /* 항목과 내용만 표시 */
        border-bottom: 1px solid #dee2e6; /* 구분선 색상 짙게 변경 */
    }

    .cl-col {
        padding: 12px 10px;
        display: flex;
        align-items: center;
        font-size: 1rem;
    }

    .cl-col.label {
        font-weight: 600;
        background-color: #f8f9fa;
    }

    .cl-col.content {
        color: #343a40;
    }

</style>