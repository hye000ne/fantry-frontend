# Fantry API Documentation

이 문서는 Fantry 백엔드 시스템의 API 명세를 정의합니다. 프론트엔드 개발자는 이 문서를 참고하여 API를 호출하고 데이터를 처리할 수 있습니다.

**참고:**
- 모든 요청과 응답의 Body는 JSON 형식을 따릅니다.
- `Page<T>` 형식은 Spring Data의 페이징 처리 결과를 나타내며, 다음과 같은 구조를 가집니다.
  ```json
  {
    "content": [
      // ... T 타입의 객체 배열 ...
    ],
    "pageable": {
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      },
      "offset": 0,
      "pageNumber": 0,
      "pageSize": 10,
      "paged": true,
      "unpaged": false
    },
    "last": true,
    "totalPages": 1,
    "totalElements": 5,
    "size": 10,
    "number": 0,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "first": true,
    "numberOfElements": 5,
    "empty": false
  }
  ```
- 인증이 필요한 API는 요청 헤더에 `Authorization: Bearer <JWT_TOKEN>`을 포함해야 합니다.

---

## 1. 공지사항 (Notice)

### 1.1. 사용자 API

#### `GET /api/cs/notices`
- **설명:** 공개된 공지사항 목록을 검색 조건에 따라 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `noticeTypeId` (Integer, Optional): 카테고리 ID
  - `keyword` (String, Optional): 검색 키워드 (제목 또는 내용)
  - `page` (Integer, Optional): 페이지 번호 (0부터 시작)
  - `size` (Integer, Optional): 페이지 크기
  - `sort` (String, Optional): 정렬 기준 (예: `createdAt,desc`)
- **응답 (`200 OK`):** `Page<NoticeSummaryResponse>`
  ```json
  // NoticeSummaryResponse
  {
    "noticeId": 1, // Integer
    "noticeType": "공지", // String
    "title": "서비스 점검 안내", // String
    "status": "ACTIVE", // String (Enum: DRAFT, ACTIVE, PINNED, INACTIVE)
    "createdBy": "관리자", // String
    "createdAt": "2025-10-17T10:00:00" // LocalDateTime (String)
  }
  ```

#### `GET /api/cs/notices/{noticeId}`
- **설명:** 특정 공지사항의 상세 정보를 조회합니다.
- **요청 (Path Variable):**
  - `noticeId` (Integer): 공지사항 ID (1:공지, 2:이벤트)
- **응답 (`200 OK`):** `NoticeDetailResponse`
  ```json
  {
    "noticeId": 1, // Integer
    "noticeType": "공지", // String
    "title": "서비스 점검 안내", // String
    "content": "<p>서비스 점검 안내입니다...</p>", // String (HTML)
    "status": "ACTIVE", // String (Enum: DRAFT, ACTIVE, PINNED, INACTIVE)
    "createdBy": "관리자", // String
    "createdAt": "2025-10-17T10:00:00", // LocalDateTime (String)
    "updatedBy": "관리자", // String
    "updatedAt": "2025-10-17T11:00:00", // LocalDateTime (String)
    "attachmentUrls": [ // List<String>
      "https://.../attachment1.jpg"
    ]
  }
  ```

### 1.2. 관리자 API

#### `GET /api/admin/cs/notices`
- **설명:** 모든 공지사항 목록을 검색 조건에 따라 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `noticeTypeId` (Integer, Optional): 카테고리 ID
  - `keyword` (String, Optional): 검색 키워드
  - `status` (String, Optional): `DRAFT`, `ACTIVE`, `PINNED`, `INACTIVE`
  - `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<NoticeSummaryResponse>` (1.1. 사용자 API 참고)

#### `POST /api/admin/cs/notices`
- **설명:** 새로운 공지사항을 등록합니다.
- **요청 (Request Body):** `NoticeCreateRequest`
  ```json
  {
    "noticeTypeId": 1, // Integer
    "title": "새로운 공지사항", // String
    "content": "<p>내용입니다.</p>", // String (HTML)
    "status": "DRAFT" // String (Enum: DRAFT, ACTIVE, PINNED, INACTIVE)
  }
  ```
- **응답 (`201 Created`):** `NoticeDetailResponse` (1.1. 사용자 API 참고)

#### `PATCH /api/admin/cs/notices/{noticeId}`
- **설명:** 특정 공지사항을 수정합니다.
- **요청 (Path Variable & Request Body):**
  - `noticeId` (Integer)
  - `NoticeUpdateRequest`
    ```json
    {
      "noticeTypeId": 1, // Integer
      "title": "수정된 공지사항", // String
      "content": "<p>수정된 내용입니다.</p>", // String (HTML)
      "status": "ACTIVE" // String (Enum)
    }
    ```
- **응답 (`200 OK`):** `NoticeDetailResponse` (1.1. 사용자 API 참고)

#### `DELETE /api/admin/cs/notices/{noticeId}`
- **설명:** 특정 공지사항을 삭제합니다.
- **요청 (Path Variable):** `noticeId` (Integer)
- **응답 (`204 No Content`)**

#### `POST /api/admin/cs/notices/{noticeId}/attachments`
- **설명:** 특정 공지사항에 파일을 첨부합니다.
- **요청 (Path Variable & Form Data):**
  - `noticeId` (Integer)
  - `files`: `List<MultipartFile>`
- **응답 (`200 OK`)**

#### `GET /api/admin/cs/notices/stats`
- **설명:** 공지사항 통계를 조회합니다.
- **응답 (`200 OK`):** `NoticeStatsAdminResponse`
  ```json
  {
    "draft": 1, // long
    "active": 15, // long
    "pinned": 2, // long
    "inactive": 3, // long
    "total": 21 // long
  }
  ```

---

## 2. FAQ

### 2.1. 사용자 API

#### `GET /api/cs/faq`
- **설명:** 공개된 FAQ 목록을 검색 조건에 따라 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `csTypeId` (Integer, Optional): 카테고리 ID
  - `keyword` (String, Optional): 검색 키워드
  - `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<FaqResponse>`
  ```json
  // FaqResponse
  {
    "faqId": 1, // Integer
    "csType": "결제", // String
    "title": "결제는 어떻게 하나요?", // String
    "content": "<p>결제 방법 안내입니다...</p>", // String (HTML)
    "status": "ACTIVE", // String (Enum: DRAFT, ACTIVE, PINNED, INACTIVE)
    "createdBy": "관리자", // String
    "createdAt": "2025-10-17T10:00:00", // LocalDateTime (String)
    "modifiedBy": "관리자", // String
    "updatedAt": "2025-10-17T11:00:00", // LocalDateTime (String)
    "attachmentUrls": [] // List<String>
  }
  ```

### 2.2. 관리자 API

#### `GET /api/admin/cs/faq`
- **설명:** 모든 FAQ 목록을 검색 조건에 따라 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `csTypeId` (Integer, Optional)
  - `keyword` (String, Optional)
  - `status` (String, Optional): `DRAFT`, `ACTIVE`, `PINNED`, `INACTIVE`
  - `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<FaqResponse>` (2.1. 사용자 API 참고)

#### `POST /api/admin/cs/faq`
- **설명:** 새로운 FAQ를 등록합니다.
- **요청 (Request Body):** `FaqCreateRequest`
  ```json
  {
    "csTypeId": 2, // Integer
    "title": "새로운 FAQ", // String
    "content": "<p>내용입니다.</p>" // String (HTML)
  }
  ```
- **응답 (`201 Created`):** `FaqResponse` (2.1. 사용자 API 참고)

#### `PATCH /api/admin/cs/faq/{faqId}`
- **설명:** 특정 FAQ를 수정합니다.
- **요청 (Path Variable & Request Body):**
  - `faqId` (Integer)
  - `FaqUpdateRequest`
    ```json
    {
      "csTypeId": 2, // Integer
      "title": "수정된 FAQ", // String
      "content": "<p>수정된 내용입니다.</p>", // String (HTML)
      "status": "ACTIVE" // String (Enum)
    }
    ```
- **응답 (`200 OK`):** `FaqResponse` (2.1. 사용자 API 참고)

#### `DELETE /api/admin/cs/faq/{faqId}`
- **설명:** 특정 FAQ를 삭제합니다.
- **요청 (Path Variable):** `faqId` (Integer)
- **응답 (`204 No Content`)**

#### `GET /api/admin/cs/faq/{faqId}`
- **설명:** FAQ 상세 정보를 조회합니다.
- **요청 (Path Variable):** `faqId` (Integer)
- **응답 (`200 OK`):** `FaqResponse` (2.1. 사용자 API 참고)

#### `POST /api/admin/cs/faq/{faqId}/attachments`
- **설명:** 특정 FAQ에 파일을 첨부합니다.
- **요청 (Path Variable & Form Data):**
  - `faqId` (Integer)
  - `files`: `List<MultipartFile>`
- **응답 (`200 OK`)**

#### `GET /api/admin/cs/faq/stats`
- **설명:** FAQ 통계를 조회합니다.
- **응답 (`200 OK`):** `FaqStatsAdminResponse`
  ```json
  {
    "draft": 2, // long
    "active": 25, // long
    "pinned": 3, // long
    "inactive": 5, // long
    "total": 35 // long
  }
  ```

---

## 3. 1:1 문의 (Inquiry)

### 3.1. 사용자 API

#### `POST /api/cs/inquiry`
- **설명:** 새로운 1:1 문의를 등록합니다.
- **요청 (Request Body):** `InquiryCreateRequest`
  ```json
  {
    "csTypeId": 3, // Integer (1:배송, 2:결제, 3:기타, 4:상품, 5:환불/반품, 6:판매)
    "title": "문의합니다.", // String
    "content": "문의 내용입니다." // String
  }
  ```
- **응답 (`201 Created`):** `InquirySummaryResponse`
  ```json
  {
    "inquiryId": 1, // Integer
    "title": "문의합니다.", // String
    "content": "문의 내용입니다.", // String
    "inquiredByName": "사용자명", // String
    "status": "PENDING", // String (Enum: PENDING, IN_PROGRESS, ON_HOLD, ANSWERED, REJECTED)
    "inquiredAt": "2025-10-17T10:00:00", // LocalDateTime (String)
    "answerContent": null, // String
    "answeredByName": null, // String
    "csType": "기타" // String
  }
  ```

#### `POST /api/cs/inquiry/{inquiryId}/attachments`
- **설명:** 특정 1:1 문의에 파일을 첨부합니다.
- **요청 (Path Variable & Form Data):**
  - `inquiryId` (Integer)
  - `files`: `List<MultipartFile>`
- **응답 (`200 OK`)**

#### `GET /api/cs/inquiry`
- **설명:** 나의 1:1 문의 목록을 페이징하여 조회합니다.
- **요청 (Query Parameters):** `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<InquirySummaryResponse>` (3.1. 사용자 API 참고)

#### `GET /api/cs/inquiry/{inquiryId}`
- **설명:** 나의 특정 1:1 문의 상세 내용을 조회합니다.
- **요청 (Path Variable):** `inquiryId` (Integer)
- **응답 (`200 OK`):** `InquiryDetailUserResponse`
  ```json
  {
    "inquiryId": 1, // Integer
    "title": "문의합니다.", // String
    "content": "문의 내용입니다.", // String
    "inquiredByName": "사용자명", // String
    "status": "ANSWERED", // String (Enum)
    "inquiredAt": "2025-10-17T10:00:00", // LocalDateTime (String)
    "answerContent": "답변 내용입니다.", // String
    "answeredByName": "관리자", // String
    "answeredAt": "2025-10-17T11:00:00", // LocalDateTime (String)
    "attachmentUrls": [ // List<String>
      "https://.../attachment1.jpg"
    ]
  }
  ```

### 3.2. 관리자 API

#### `GET /api/admin/cs/inquiry`
- **설명:** 1:1 문의 목록을 검색 조건에 따라 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `status` (String, Optional): `PENDING`, `IN_PROGRESS`, `ON_HOLD`, `ANSWERED`, `REJECTED`
  - `csTypeId` (Integer, Optional)
  - `memberName` (String, Optional)
  - `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<InquirySummaryResponse>` (3.1. 사용자 API 참고)

#### `GET /api/admin/cs/inquiry/{inquiryId}`
- **설명:** 특정 1:1 문의의 상세 내용을 관리자용으로 조회합니다.
- **요청 (Path Variable):** `inquiryId` (Integer)
- **응답 (`200 OK`):** `InquiryDetailAdminResponse`
  ```json
  {
    "inquiryId": 1, // Integer
    "title": "문의합니다.", // String
    "content": "문의 내용입니다.", // String
    "inquiredByName": "사용자명", // String
    "status": "ANSWERED", // String (Enum)
    "inquiredAt": "2025-10-17T10:00:00", // LocalDateTime (String)
    "answerContent": "답변 내용입니다.", // String
    "answeredByName": "관리자", // String
    "answeredAt": "2025-10-17T11:00:00", // LocalDateTime (String)
    "attachmentUrls": [], // List<String>
    "comment": "관리자용 메모", // String
    "csType": { // CsType Object
      "csTypeId": 3,
      "name": "기타"
    }
  }
  ```

#### `PATCH /api/admin/cs/inquiry/{inquiryId}/answer`
- **설명:** 특정 1:1 문의에 답변을 등록하고 처리 상태를 변경합니다.
- **요청 (Path Variable & Request Body):**
  - `inquiryId` (Integer)
  - `InquiryAnswerRequest`
    ```json
    {
      "answerContent": "답변입니다.", // String
      "reqStatus": "ANSWERED", // String (Enum)
      "comment": "처리 완료" // String
    }
    ```
- **응답 (`200 OK`):** `InquiryDetailAdminResponse` (3.2. 관리자 API 참고)

#### `GET /api/admin/cs/inquiry/stats`
- **설명:** 1:1 문의 통계를 조회합니다.
- **응답 (`200 OK`):** `InquiryStatsAdminResponse`
  ```json
  {
    "pending": 12, // long
    "inProgress": 3, // long
    "onHold": 1, // long
    "answered": 150, // long
    "rejected": 5, // long
    "total": 171 // long
  }
  ```

---

## 4. 환불/반품 (Refund/Return)

### 4.1. 사용자 API

#### `POST /api/returns`
- **설명:** 새로운 환불/반품을 요청합니다.
- **요청 (Request Body):** `ReturnCreateRequest`
  ```json
  {
    "orderId": "ORDER-12345", // String
    "reason": "PRODUCT_DEFECT", // String (Enum: SIMPLE_CHANGE_OF_MIND, PRODUCT_DEFECT, SHIPPING_ERROR, ETC)
    "detailReason": "상품에 흠집이 있습니다." // String
  }
  ```
- **응답 (`201 Created`):** `ReturnDetailResponse`
  ```json
  {
    "returnRequestId": 1, // Integer
    "orderId": 123, // Integer
    "reason": "PRODUCT_DEFECT", // String (Enum)
    "detailReason": "상품에 흠집이 있습니다.", // String
    "status": "REQUESTED", // String (Enum: REQUESTED, IN_TRANSIT, INSPECTING, APPROVED, REJECTED, COMPLETED, USER_CANCELLED, DELETED)
    "finalRefundAmount": null, // BigDecimal
    "requestedAt": "2025-10-17T10:00:00", // LocalDateTime (String)
    "completedAt": null, // LocalDateTime (String)
    "attachmentUrls": [], // List<String>
    "statusHistories": [ // List<ReturnHistoryResponse>
      {
        "previousStatus": null,
        "newStatus": "REQUESTED",
        "updatedBy": "사용자명",
        "updatedAt": "2025-10-17T10:00:00",
        "memo": null
      }
    ]
  }
  ```

#### `POST /api/returns/{returnRequestId}/attachments`
- **설명:** 특정 환불/반품 요청에 증빙 자료(파일)를 첨부합니다.
- **요청 (Path Variable & Form Data):**
  - `returnRequestId` (Integer)
  - `files`: `List<MultipartFile>`
- **응답 (`200 OK`)**

#### `GET /api/returns`
- **설명:** 나의 환불/반품 요청 목록을 페이징하여 조회합니다.
- **요청 (Query Parameters):** `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<ReturnSummaryResponse>`
  ```json
  // ReturnSummaryResponse
  {
    "returnRequestId": 1, // Integer
    "orderId": 123, // Integer
    "buyerName": "사용자명", // String
    "status": "REQUESTED", // String (Enum)
    "requestedAt": "2025-10-17T10:00:00" // LocalDateTime (String)
  }
  ```

#### `GET /api/returns/{returnRequestId}`
- **설명:** 나의 특정 환불/반품 요청 상세 정보를 조회합니다.
- **요청 (Path Variable):** `returnRequestId` (Integer)
- **응답 (`200 OK`):** `ReturnDetailResponse` (4.1. 사용자 API 참고)

#### `PATCH /api/returns/{returnRequestId}/cancel`
- **설명:** 환불/반품 요청을 철회합니다.
- **요청 (Path Variable):** `returnRequestId` (Integer)
- **응답 (`204 No Content`)**

### 4.2. 관리자 API

#### `GET /api/admin/returns/stats`
- **설명:** 환불/반품 요청 통계를 조회합니다.
- **응답 (`200 OK`):** `ReturnStatsAdminResponse`
  ```json
  {
    "requested": 10, // long
    "inTransit": 2, // long
    "inspecting": 3, // long
    "approved": 50, // long
    "rejected": 5, // long
    "completed": 48, // long
    "userCancelled": 4, // long
    "total": 122 // long
  }
  ```

#### `POST /api/admin/returns`
- **설명:** 관리자가 사용자를 대신하여 환불/반품 요청을 생성합니다.
- **요청 (Request Body):** `ReturnAdminCreateRequest`
  ```json
  {
    "orderId": "ORDER-12345", // String
    "memberId": 1, // Integer
    "reason": "ETC", // String (Enum)
    "detailReason": "고객센터 문의 건" // String
  }
  ```
- **응답 (`201 Created`):** `ReturnAdminResponse`
  ```json
  {
    "returnRequestId": 2, // Integer
    "orderId": 123, // Integer
    "buyerName": "사용자명", // String
    "createdBy": "관리자명", // String
    "updatedBy": "관리자명", // String
    "reason": "ETC", // String (Enum)
    "detailReason": "고객센터 문의 건", // String
    "status": "REQUESTED", // String (Enum)
    "originalPaymentAmount": 100000, // BigDecimal
    "deductedShippingFee": 0, // BigDecimal
    "finalRefundAmount": 100000, // BigDecimal
    "rejectReason": null, // String
    "comment": null, // String
    "requestedAt": "2025-10-17T12:00:00", // LocalDateTime (String)
    "completedAt": null, // LocalDateTime (String)
    "attachmentUrls": [], // List<String>
    "statusHistories": [] // List<ReturnHistoryResponse>
  }
  ```

#### `GET /api/admin/returns`
- **설명:** 환불/반품 요청 목록을 검색 조건에 따라 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `status` (String, Optional): `REQUESTED`, `IN_TRANSIT`, `INSPECTING`, `APPROVED`, `REJECTED`, `COMPLETED`, `USER_CANCELLED`, `DELETED`
  - `buyerName` (String, Optional)
  - `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<ReturnSummaryResponse>` (4.1. 사용자 API 참고)

#### `GET /api/admin/returns/{returnRequestId}`
- **설명:** 특정 환불/반품 요청의 상세 정보를 조회합니다.
- **요청 (Path Variable):** `returnRequestId` (Integer)
- **응답 (`200 OK`):** `ReturnAdminResponse` (4.2. 관리자 API 참고)

#### `PATCH /api/admin/returns/{returnRequestId}`
- **설명:** 특정 환불/반품 요청의 상태를 변경하고 관련 정보를 업데이트합니다.
- **요청 (Path Variable & Request Body):**
  - `returnRequestId` (Integer)
  - `ReturnAdminUpdateRequest`
    ```json
    {
      "status": "APPROVED", // String (Enum)
      "deductedShippingFee": 5000, // BigDecimal
      "rejectReason": null, // String
      "memo": "검수 완료 후 환불 승인" // String
    }
    ```
- **응답 (`200 OK`):** `ReturnAdminResponse` (4.2. 관리자 API 참고)

#### `DELETE /api/admin/returns/{returnRequestId}`
- **설명:** 환불/반품 요청을 논리적으로 삭제합니다.
- **요청 (Path Variable):** `returnRequestId` (Integer)
- **응답 (`204 No Content`)**

---

## 5. 정산 (Settlement)

### 5.1. 판매자 API

#### `GET /api/my/settlements`
- **설명:** 나의 정산 내역 목록을 페이징하여 조회합니다.
- **요청 (Query Parameters):** `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<SettlementSummaryResponse>`
  ```json
  // SettlementSummaryResponse
  {
    "settlementId": 1, // Integer
    "sellerName": "판매자명", // String
    "settlementAmount": 95000, // BigDecimal
    "status": "COMPLETED", // String (Enum: PENDING, PROCESSING, COMPLETED, FAILED)
    "requestedAt": "2025-10-15T00:00:00", // LocalDateTime (String)
    "completedAt": "2025-10-16T15:00:00" // LocalDateTime (String)
  }
  ```

#### `GET /api/my/settlements/{settlementId}`
- **설명:** 나의 특정 정산 건 상세 내역을 조회합니다.
- **요청 (Path Variable):** `settlementId` (Integer)
- **응답 (`200 OK`):** `SettlementDetailResponse`
  ```json
  {
    "settlementId": 1, // Integer
    "sellerName": "판매자명", // String
    "totalAmount": 100000, // BigDecimal
    "commissionAmount": 5000, // BigDecimal
    "settlementAmount": 95000, // BigDecimal
    "status": "COMPLETED", // String (Enum)
    "requestedAt": "2025-10-15T00:00:00", // LocalDateTime (String)
    "completedAt": "2025-10-16T15:00:00", // LocalDateTime (String)
    "failureReason": null, // String
    "bankName": "팬트리은행", // String
    "accountNumber": "123-456-789", // String
    "items": [ // List<SettlementItemDto>
      {
        "orderId": 101, // Integer
        "productName": "상품 A", // String
        "itemSaleAmount": 100000, // BigDecimal
        "commissionRate": 5.0, // BigDecimal
        "commissionAmount": 5000, // BigDecimal
        "totalAmount": 95000, // boolean
        "isReturned": false // boolean
      }
    ]
  }
  ```

### 5.2. 관리자 API

#### `GET /api/admin/settlement/dashboard`
- **설명:** 대시보드에 표시될 정산 KPI 요약 정보를 조회합니다.
- **응답 (`200 OK`):** `SettlementDashboardResponse`
  ```json
  {
    "monthlyScheduledAmount": 12000000, // BigDecimal
    "yesterdaySettledAmount": 800000, // BigDecimal
    "pendingOrFailedCount": 5, // long
    "cumulativeSettlementAmount": 250000000 // BigDecimal
  }
  ```

#### `GET /api/admin/settlement`
- **설명:** 정산 내역 목록을 검색 조건과 함께 페이징하여 조회합니다.
- **요청 (Query Parameters):**
  - `sellerName` (String, Optional)
  - `status` (String, Optional): `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
  - `startDate` (String, Optional): `YYYY-MM-DD`
  - `endDate` (String, Optional): `YYYY-MM-DD`
  - `page`, `size`, `sort`
- **응답 (`200 OK`):** `Page<SettlementSummaryResponse>` (5.1. 판매자 API 참고)

#### `GET /api/admin/settlement/{settlementId}`
- **설명:** 특정 정산 건의 상세 내역을 조회합니다.
- **요청 (Path Variable):** `settlementId` (Integer)
- **응답 (`200 OK`):** `SettlementDetailResponse` (5.1. 판매자 API 참고)

#### `GET /api/admin/settlement/settings`
- **설명:** 현재 적용 중인 정산 설정을 조회합니다.
- **응답 (`200 OK`):** `SettlementSettingResponse`
  ```json
  {
    "settlementSettingId": 1, // Integer
    "commissionRate": 5.0, // BigDecimal
    "settlementCycleType": "MONTHLY", // String (Enum: DAILY, WEEKLY, MONTHLY)
    "settlementDay": 15, // Integer
    "createdAt": "2025-01-01T10:00:00", // LocalDateTime (String)
    "createdBy": "최고관리자", // String
    "updatedAt": "2025-09-01T14:00:00", // LocalDateTime (String)
    "updatedBy": "운영관리자" // String
  }
  ```

#### `POST /api/admin/settlement/settings`
- **설명:** 정산 설정을 생성하거나 수정합니다.
- **요청 (Request Body):** `SettlementSettingRequest`
  ```json
  {
    "commissionRate": 5.5, // BigDecimal
    "settlementCycleType": "MONTHLY", // String (Enum)
    "settlementDay": 10 // Integer
  }
  ```
- **응답 (`200 OK`):** `SettlementSettingResponse` (5.2. 관리자 API 참고)
