// src/api/adminNotice.js
import { apiClient } from './index';
import { unwrap } from './InspectionHelper';

/**
 * 공지사항 목록을 검색 조건에 따라 페이징하여 조회합니다. (관리자용)
 * @param {object} params - { page, size, sort, noticeTypeId, status, keyword }
 * @returns {Promise<Page<NoticeSummaryResponse>>}
 */
export const searchNotices = (params) => {
  const queryParams = {
    page: params.page > 0 ? params.page - 1 : 0,
    size: params.size,
    sort: params.sort,
    status: params.status,
    noticeTypeId: params.noticeTypeId,
    keyword: params.keyword,
  };

  return unwrap(apiClient.get('/admin/cs/notices', {
    params: queryParams,
    paramsSerializer: (p) => {
      const qs = new URLSearchParams();
      for (const key in p) {
        if (p[key] !== undefined && p[key] !== null && p[key] !== '') {
          qs.append(key, p[key]);
        }
      }
      return qs.toString();
    },
  }));
};

/**
 * 특정 ID의 공지사항 상세 정보를 조회합니다. (관리자용)
 * @param {number} noticeId - 조회할 공지사항의 ID
 * @returns {Promise<NoticeDetailResponse>}
 */
export const getNoticeById = (noticeId) => {
  return unwrap(apiClient.get(`/admin/cs/notices/${noticeId}`));
};

/**
 * 새로운 공지사항을 등록합니다.
 * @param {object} noticeData - { noticeTypeId, title, content, status }
 * @returns {Promise<NoticeDetailResponse>}
 */
export const createNotice = (noticeData) => {
  return unwrap(apiClient.post('/admin/cs/notices', noticeData));
};

/**
 * 특정 ID의 공지사항을 수정합니다.
 * @param {number} noticeId - 수정할 공지사항의 ID
 * @param {object} noticeData - { noticeTypeId, title, content, status }
 * @returns {Promise<NoticeDetailResponse>}
 */
export const updateNotice = (noticeId, noticeData) => {
  return unwrap(apiClient.patch(`/admin/cs/notices/${noticeId}`, noticeData));
};

/**
 * 특정 ID의 공지사항을 삭제합니다.
 * @param {number} noticeId - 삭제할 공지사항의 ID
 * @returns {Promise<void>}
 */
export const deleteNotice = (noticeId) => {
  return unwrap(apiClient.delete(`/admin/cs/notices/${noticeId}`));
};

/**
 * 공지사항 상태별 통계를 조회합니다.
 * @returns {Promise<NoticeStatsAdminResponse>}
 */
export const getNoticeStats = () => {
  return unwrap(apiClient.get('/admin/cs/notices/stats'));
};

/**
 * 특정 공지사항에 파일을 첨부합니다.
 * @param {number} noticeId - 파일을 첨부할 공지사항의 ID
 * @param {File[]} files - 첨부할 파일 목록
 * @returns {Promise<void>}
 */
export const addNoticeAttachments = (noticeId, files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  return unwrap(apiClient.post(`/admin/cs/notices/${noticeId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }));
};