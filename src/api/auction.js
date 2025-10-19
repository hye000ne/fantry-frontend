import { apiClient,publicApiClient } from './index'

/* -------------------------------------------------------------
  Auction(상품) 기능 관련 API
---------------------------------------------------------------*/

/**
 * 특정 상품의 상세 정보를 조회합니다.
 * @param {number} auctionId - 조회할 상품의 ID
 * @returns {Promise<AuctionDetailResponse>}
 */
export const getAuctionDetails = (auctionId) => {
    return publicApiClient.get(`/auctions/${auctionId}`);
};

/**
 * 특정 상품에 대한 회원의 낙찰 여부 및 결제 여부를 조회합니다.
 * @param {number} auctionId 
 * @param {number} memberId 
 * @returns {Promise<string>}
 */
export const getAuctionWinnerStatus = (auctionId, memberId) => {
    return publicApiClient.get(`/auctions/${auctionId}/winner-status`, {
        params: { memberId }
    });
}

/**
 * 특정 회원이 입찰에 참여한 현재 진행중인 경매 목록을 조회합니다.
 * @param memberId 조회할 회원의 ID
 * @return 해당 회원이 입찰한 활성 경매 목록. (pk list)
 */

export const getActiveAuctionsByBidder = (memberId) => {
    return apiClient.get(`/auctions/member/${memberId}/bids`);
}

/**
 * 상품 목록을 조건에 따라 페이징하여 조회합니다.
 * @param {object} params - 페이징 및 필터 정보
 * @param {number} params.page - 조회할 페이지 번호 (0부터 시작)
 * @param {number} params.size - 한 페이지에 보여줄 개수
 * @param {string} [params.sort] - 정렬 기준 (예: 'createdAt,desc')
 * @param {string} [params.saleType] - 판매 유형 (AUCTION, INSTANT_BUY)
 * @param {string} [params.saleStatus] - 판매 상태 (ACTIVE, SOLD 등)
 * @param {string} [params.artistGroupType] - 아티스트 그룹 유형
 * @param {string} [params.keyword] - 검색 키워드
 * @returns {Promise<Page<AuctionSummaryResponse>>}
 */
export const getAuctionList = ({ page, size, sort, saleType, saleStatus, artistGroupType, keyword }) => {
    return publicApiClient.get('/auctions', {
        params: { page, size, sort, saleType, saleStatus, artistGroupType, keyword }
    });
}

/**
 * 특정 회원이 등록한 모든 판매 상품 목록을 조회합니다.
 * @param {number} memberId - 조회할 회원의 ID
 * @returns {Promise<List<AuctionSummaryResponse>>}
 */
export const getAuctionsByMember = (memberId) => {
    return apiClient.get(`/auctions/member/${memberId}`);
}

/**
 * 특정 회원의 판매 상태별 상품 목록을 조회합니다.
 * @param {object} params - 조회 조건
 * @param {number} params.memberId - 조회할 회원의 ID
 * @param {string} params.saleStatus - 조회할 판매 상태
 * @returns {Promise<List<AuctionSummaryResponse>>}
 */
export const getAuctionsByMemberAndStatus = ({ memberId, saleStatus }) => {
    return apiClient.get(`/auctions/member/${memberId}/status`, {
        params: { saleStatus }
    });
}

/**
 * 새로운 판매 상품을 등록합니다.
 * @param {object} payload - 상품 등록에 필요한 데이터 (AuctionRequest)
 * @returns {Promise<string>} - 성공 메시지
 */
export const createAuction = (payload) => {
    return apiClient.post('/auctions', payload);
}

/**
 * 등록된 판매 상품을 삭제합니다.
 * @param {number} auctionId - 삭제할 상품의 ID
 * @returns {Promise<string>} - 성공 메시지
 */
export const deleteAuction = (auctionId) => {
    return apiClient.delete(`/auctions/${auctionId}`);
}

/**
 * 상품을 판매 완료 상태로 변경합니다.
 * @param {object} params - 요청 정보
 * @param {number} params.auctionId - 처리할 상품의 ID
 * @param {number} params.finalPrice - 최종 판매 가격
 * @returns {Promise<string>} - 성공 메시지
 */
export const markAuctionAsSold = ({ auctionId, finalPrice }) => {
    return apiClient.patch(`/auctions/${auctionId}/status/sold`, null, {
        params: { finalPrice }
    });
}

/**
 * 상품을 판매 실패(유찰) 상태로 변경합니다.
 * @param {number} auctionId - 처리할 상품의 ID
 * @returns {Promise<string>} - 성공 메시지
 */
export const markAuctionAsNotSold = (auctionId) => {
    return apiClient.patch(`/auctions/${auctionId}/status/not-sold`);
}

/**
 * 상품을 판매 취소 상태로 변경합니다.
 * @param {number} auctionId - 처리할 상품의 ID
 * @returns {Promise<string>} - 성공 메시지
 */
export const cancelAuction = (auctionId) => {
    return apiClient.patch(`/auctions/${auctionId}/status/cancelled`);
}

/**
 * 상품을 다시 판매 중(활성) 상태로 변경합니다.
 * @param {number} auctionId - 처리할 상품의 ID
 * @returns {Promise<string>} - 성공 메시지
 */
export const activateAuction = (auctionId) => {
    return apiClient.patch(`/auctions/${auctionId}/status/active`);
}

/**
 * 상품의 판매 유형을 변경합니다.
 * @param {object} params - 요청 정보
 * @param {number} params.auctionId - 처리할 상품의 ID
 * @param {string} params.newSaleType - 새로운 판매 유형 (AUCTION, INSTANT_BUY)
 * @returns {Promise<string>} - 성공 메시지
 */
export const changeAuctionSaleType = ({ auctionId, newSaleType }) => {
    return apiClient.patch(`/auctions/${auctionId}/sale-type`, null, {
        params: { newSaleType }
    });
}

/**
 * 검수 ID를 기준으로 최신 경매/판매 정보를 조회합니다.
 * @param {number} productInspectionId - 조회할 검수 ID
 * @returns {Promise<AuctionDetailResponse>} - 조회된 경매 상세 정보
 */
export const getAuctionByInspectionId = (productInspectionId) => {
    return apiClient.get(`/auctions/inspection/${productInspectionId}`);
}

/**
 * 핫딜 상품 목록을 조회합니다. (활성 상태, 입찰 수 기준 정렬)
 * <p>현재 활성(ACTIVE) 상태인 경매 중에서 입찰이 가장 많은 순서대로 상품을 조회합니다.
 * @param {object} params - 페이징 정보
 * @param {number} params.page - 조회할 페이지 번호 (0부터 시작)
 * @param {number} params.size - 한 페이지에 보여줄 개수
 * @returns {Promise<Page<AuctionSummaryResponse>>} 핫딜 상품 요약 정보의 페이지 객체
 */
export const getHotDealAuctions = ({ page, size }) => {
    return publicApiClient.get('/auctions/hotdeal', {
        params: { page, size }
    });
}