// src/api/dashboard.js
import { apiClient } from './index';
import { unwrap } from './InspectionHelper'; // InspectionHelper는 API 응답을 처리하는 유틸리티로 가정

/* ==================================================================================
 * 어드민 - 대시보드 API
 * ================================================================================== */

/**
 * 통합 대시보드 통계를 조회합니다.
 * GET /dashboard/integrated
 * @returns {Promise<DashboardStats>}
 */
export const getIntegratedDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/integrated'));
};

/**
 * 회원 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/members
 * @returns {Promise<MemberDashboardStats>}
 */
export const getMemberDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/members'));
};

/**
 * 주문 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/orders
 * @returns {Promise<OrdersStats>}
 */
export const getOrderDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/orders'));
};

/**
 * 판매 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/sales
 * @returns {Promise<SalesStats>}
 */
export const getSalesDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/sales'));
};

/**
 * 입찰 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/bids
 * @returns {Promise<BidStats>}
 */
export const getBidDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/bids'));
};

/**
 * 검수 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/inspections
 * @returns {Promise<InspectionStats>}
 */
export const getInspectionDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/inspections'));
};

/**
 * 카탈로그 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/catalogs-overview
 * @returns {Promise<CatalogDashboardStats>}
 */
export const getCatalogDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/catalogs-overview'));
};

/**
 * CS 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/cs
 * @returns {Promise<CSDashboardStats>}
 */
export const getCSDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/cs'));
};

/**
 * 재무/운영 관리 대시보드 통계를 조회합니다.
 * GET /dashboard/finance-operations
 * @returns {Promise<FinanceOperationsDashboardStats>}
 */
export const getFinanceOperationsDashboardStats = () => {
  return unwrap(apiClient.get('/admin/dashboard/finance-operations'));
};
