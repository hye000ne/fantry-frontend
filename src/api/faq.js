// src/api/faq.js

import { apiClient } from './index';
import { unwrap } from './InspectionHelper';

/* -------------------------------------------------------------
  FAQ 기능 관련 API (사용자용)
---------------------------------------------------------------*/

/**
 * FAQ 목록을 검색 조건에 따라 페이징하여 조회합니다.
 * @param {object} params - { csTypeId, keyword, page, size, sort }
 * @returns {Promise<Page<FaqResponse>>}
 */
export const searchFaqs = (params) => {
    const queryParams = {
        csTypeId: params.csTypeId,
        keyword: params.keyword,
        page: params.page > 0 ? params.page - 1 : 0, // API는 0-based page
        size: params.size,
        sort: params.sort,
    };

    return unwrap(apiClient.get('/cs/faq', {
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
 * FAQ 상세 정보를 조회합니다. (사용자용)
 * @param {number} faqId - 조회할 FAQ의 ID
 * @returns {Promise<FaqResponse>}
 */
export const getFaqById = (faqId) => {
    return unwrap(apiClient.get(`/cs/faq/${faqId}`));
};