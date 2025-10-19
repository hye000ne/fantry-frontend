import { apiClient } from './index';
import { unwrap } from './InspectionHelper';

/* ==================================================================================
 * 어드민 - 환불/반품 관리 API
 * ================================================================================== */

/**
 * 관리자 대시보드에 표시될 환불/반품 요청 통계를 조회합니다.
 * GET /admin/returns/stats
 * @returns {Promise<ReturnStatsAdminResponse>}
 */
export const getAdminReturnStats = () => {
  return unwrap(apiClient.get('/admin/returns/stats'));
};

/**
 * 관리자가 사용자를 대신하여 환불/반품 요청을 생성합니다.
 * POST /admin/returns
 * @param {object} returnData - ReturnAdminCreateRequest
 * @returns {Promise<ReturnAdminResponse>}
 */
export const createAdminReturnRequest = (returnData) => {
  return unwrap(apiClient.post('/admin/returns', returnData));
};

/**
 * 검색 조건에 따라 페이징된 환불/반품 요청 목록을 조회합니다.
 * GET /admin/returns
 * @param {object} params - ReturnSearchRequest (ModelAttribute), Pageable
 * @returns {Promise<Page<ReturnSummaryResponse>>}
 */
export const getAdminReturnRequests = (params) => {
  const queryParams = {
    page: params.page > 0 ? params.page - 1 : 0,
    size: params.size,
    sort: params.sort,
    status: params.status,
    buyerName: params.buyerName,
  };
  return unwrap(apiClient.get('/admin/returns', { params: queryParams }));
};

/**
 * 특정 환불/반품 요청의 상세 정보를 조회합니다.
 * GET /admin/returns/{returnRequestId}
 * @param {number} returnRequestId - 조회할 환불/반품 요청의 ID
 * @returns {Promise<ReturnAdminResponse>}
 */
export const getAdminReturnRequestDetail = (returnRequestId) => {
  return unwrap(apiClient.get(`/admin/returns/${returnRequestId}`));
};

/**
 * 특정 환불/반품 요청의 상태를 변경하고 관련 정보를 업데이트합니다.
 * PATCH /admin/returns/{returnRequestId}
 * @param {number} returnRequestId - 처리할 환불/반품 요청의 ID
 * @param {object} returnData - ReturnAdminUpdateRequest
 * @returns {Promise<ReturnAdminResponse>}
 */
export const updateAdminReturnRequestStatus = (returnRequestId, returnData) => {
  return unwrap(apiClient.patch(`/admin/returns/${returnRequestId}`, returnData));
};

/**
 * 특정 환불/반품 요청을 논리적으로 삭제(숨김 처리)합니다.
 * DELETE /admin/returns/{returnRequestId}
 * @param {number} returnRequestId - 삭제할 환불/반품 요청의 ID
 * @returns {Promise<void>}
 */
export const deleteAdminReturnRequest = (returnRequestId) => {
  return unwrap(apiClient.delete(`/admin/returns/${returnRequestId}`));
};
