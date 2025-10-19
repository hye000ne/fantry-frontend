import { apiClient } from './index';
import { unwrap } from './InspectionHelper';

/* ==================================================================================
 * 사용자 - 환불/반품 API
 * ================================================================================== */

/**
 * 새로운 환불/반품 요청을 생성합니다.
 * POST /returns
 * @param {object} returnData - ReturnCreateRequest
 * @returns {Promise<ReturnDetailResponse>}
 */
export const createReturnRequest = (returnData) => {
  return unwrap(apiClient.post('/returns', returnData));
};

/**
 * 환불/반품 요청에 증빙 자료를 첨부합니다.
 * POST /returns/{returnRequestId}/attachments
 * @param {number} returnRequestId - 환불/반품 요청 ID
 * @param {FormData} formData - 파일 데이터
 * @returns {Promise<string>}
 */
export const addReturnAttachments = (returnRequestId, formData) => {
  return unwrap(apiClient.post(`/returns/${returnRequestId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }));
};

/**
 * 현재 로그인한 사용자의 환불/반품 요청 목록을 페이징하여 조회합니다.
 * GET /returns
 * @param {object} params - Pageable
 * @returns {Promise<Page<ReturnSummaryResponse>>}
 */
export const getMyReturnRequests = (params) => {
  return unwrap(apiClient.get('/returns', { params }));
};

/**
 * 현재 로그인한 사용자의 특정 환불/반품 요청 상세 정보를 조회합니다.
 * GET /returns/{returnRequestId}
 * @param {number} returnRequestId - 환불/반품 요청 ID
 * @returns {Promise<ReturnDetailResponse>}
 */
export const getMyReturnRequestDetail = (returnRequestId) => {
  return unwrap(apiClient.get(`/returns/${returnRequestId}`));
};

/**
 * 사용자가 직접 자신의 환불/반품 요청을 철회합니다.
 * PATCH /returns/{returnRequestId}/cancel
 * @param {number} returnRequestId - 환불/반품 요청 ID
 * @returns {Promise<void>}
 */
export const cancelMyReturnRequest = (returnRequestId) => {
  return unwrap(apiClient.patch(`/returns/${returnRequestId}/cancel`));
};