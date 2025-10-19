// src/api/notice.js

import { apiClient } from './index';
import { unwrap } from './InspectionHelper';

/* -------------------------------------------------------------
  공지사항 기능 관련 API (사용자용)
---------------------------------------------------------------*/

/**
 * 공개된(ACTIVE, PINNED) 공지사항 목록을 검색 조건에 따라 페이징하여 조회합니다.
 * @param {object} params - 검색 조건 및 페이징 정보
 * @returns {Promise<Page<NoticeSummaryResponse>>}
 */
export const searchNotices = (params) => {
    const queryParams = {
        page: params.page > 0 ? params.page - 1 : 0, // API는 0-based page
        size: params.size,
        sort: params.sort,
        noticeTypeId: params.noticeTypeId,
        keyword: params.keyword,
    };

    return unwrap(apiClient.get('/cs/notices', {
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
 * 특정 공지사항의 상세 정보를 조회합니다.
 * @param {number} noticeId - 조회할 공지사항의 ID
 * @returns {Promise<NoticeDetailResponse>}
 */
export const getNoticeDetail = (noticeId) => {
    console.log(`Fetching notice detail for ID: ${noticeId}`);
    return unwrap(apiClient.get(`/cs/notices/${noticeId}`));
};