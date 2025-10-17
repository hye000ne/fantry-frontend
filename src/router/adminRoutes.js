// src/router/adminRoutes.js

/**
 * 관리자(Admin) 영역의 라우팅 설정입니다.
 * '/admin' 경로 하위의 모든 페이지를 관리합니다.
 */

// --- 레이아웃 ---
import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminContentLayout from '@/pages/admin/AdminContentLayout.vue'

// --- 페이지 컴포넌트 (Lazy Loading) ---

// 대시보드
const MainDashboardPage = () => import('@/pages/admin/dashboard/MainDashboardPage.vue')

// 정산 관리
const SettlementDashboardPage = () => import('@/pages/admin/settlement/SettlementDashboardPage.vue')
const SettlementListPage = () => import('@/pages/admin/settlement/SettlementListPage.vue')
const SettlementSettingPage = () => import('@/pages/admin/settlement/SettlementSettingPage.vue') // 새로 추가

// 반품 관리
const AdminReturnListPage = () => import('@/pages/admin/return/AdminReturnListPage.vue')
const AdminReturnDetailPage = () => import('@/pages/admin/return/AdminReturnDetailPage.vue')
const AdminReturnCreatePage = () => import('@/pages/admin/return/AdminReturnCreatePage.vue') // 새로 추가

// CS 관리
const InquiryDashboardPage = () => import('@/pages/admin/cs/InquiryDashboardPage.vue')
// const CsListPage = () => import('@/pages/admin/cs/CsListPage.vue') // 기존 것 주석 처리
const AdminInquiryListPage = () => import('@/pages/admin/cs/AdminInquiryListPage.vue') // 새로 추가
const AdminInquiryDetailPage = () => import('@/pages/admin/cs/AdminInquiryDetailPage.vue') // 새로 추가

const FaqListPage = () => import('@/pages/admin/cs/FaqListPage.vue')
const FaqDetailPage = () => import('@/pages/admin/cs/FaqDetailPage.vue')
const FaqCreatePage = () => import('@/pages/admin/cs/FaqCreatePage.vue')
const FaqEditPage = () => import('@/pages/admin/cs/FaqEditPage.vue')

const NoticeListPage = () => import('@/pages/admin/cs/NoticeListPage.vue')
const NoticeDetailPage = () => import('@/pages/admin/cs/NoticeDetailPage.vue')
const NoticeCreatePage = () => import('@/pages/admin/cs/NoticeCreatePage.vue')
const NoticeEditPage = () => import('@/pages/admin/cs/NoticeEditPage.vue')
const NoticeDashboardPage = () => import('@/pages/admin/cs/NoticeDashboardPage.vue')
const CsWritePage = () => import('@/pages/admin/cs/CsWritePage.vue')

const FaqDashboardPage = () => import('@/pages/admin/cs/FaqDashboardPage.vue')

// 검수 관리
const InspectionDashboardPage = () => import('@/pages/admin/inspection/InspectionDashboardPage.vue')
const OnlineInspectionListPage = () => import('@/pages/admin/inspection/OnlineInspectionListPage.vue')
const OnlineInspectionDetailPage = () => import('@/pages/admin/inspection/OnlineInspectionDetailPage.vue')
const OfflineInspectionListPage = () => import('@/pages/admin/inspection/OfflineInspectionListPage.vue')
const OfflineInspectionDetailPage = () => import('@/pages/admin/inspection/OfflineInspectionDetailPage.vue')

// 재고 관리
const InventoryDashboardPage = () => import('@/pages/admin/inventory/InventoryDashboardPage.vue')
const InventoryListPage = () => import('@/pages/admin/inventory/InventoryListPage.vue')

// 회원 관리
const MemberDashboardPage = () => import('@/pages/admin/member/MemberDashboardPage.vue')
const MemberListPage = () => import('@/pages/admin/member/MemberListPage.vue')
const MemberDetailPage = () => import('@/pages/admin/member/MemberDetailPage.vue')
const MemberEditPage = () => import('@/pages/admin/member/MemberEditPage.vue')
const MemberCreatePage = () => import('@/pages/admin/member/MemberCreatePage.vue')
// 회원 관리 - 신고 관련
const ReportListPage = () => import('@/pages/admin/member/ReportListPage.vue')
const ReportDetailPage = () => import('@/pages/admin/member/ReportDetailPage.vue')
const ReportCreatePage = () => import('@/pages/admin/member/ReportCreatePage.vue')
const ReportReceiveListPage = () => import('@/pages/admin/member/ReportReceivedListPage.vue')
const ReportReceiveEditPage = () => import('@/pages/admin/member/MemberReceivedEditPage.vue')

// 경매 관리
const AuctionDashboardPage = () => import('@/pages/admin/auction/AuctionDashboardPage.vue')
const AuctionListPage = () => import('@/pages/admin/auction/AuctionListPage.vue')

// 로그인
const AdminLogin = () => import('@/pages/admin/access/AdminLogin.vue')
const AdminSignUp = () => import('@/pages/admin/access/AdminSignup.vue')

// 카탈로그 관리
const CategoryListPage = () => import('@/pages/admin/catalog/CategoryListPage.vue')
const ArtistListPage = () => import('@/pages/admin/catalog/ArtistListPage.vue')

const adminRoutes = [
  // 1. 로그인/회원가입 페이지 (인증이 필요 없는 페이지)
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { requiresAuth: false, isAdmin: false },
  },
  {
    path: '/admin/signup',
    name: 'AdminSignUp',
    component: AdminSignUp,
    meta: { requiresAuth: false, isAdmin: false },
  },
  // 2. 관리자 전용 페이지 (인증이 필요한 페이지)
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, isAdmin: true },
    children: [
      {
        path: '', // '/admin' 경로에 대한 기본 페이지
        component: AdminContentLayout,
        redirect: { name: 'AdminDashboard' }, // 대시보드로 리디렉션
        children: [
          // --- 대시보드 ---
          {
            path: '',
            name: 'AdminDashboard',
            component: MainDashboardPage,
            meta: { title: 'Dashboard', icon: 'fas fa-fw fa-tachometer-alt', menu: true }, // ⭐️ menu: true 추가
          },
          // --- 회원 관리 ---
          {
            path: 'member',
            redirect: { name: 'AdminMemberDashboard' },
            meta: { title: '회원관리', icon: 'fas fa-fw fa-users', menu: true },
            children: [
              { path: 'dashboard', name: 'AdminMemberDashboard', component: MemberDashboardPage },
              {
                path: 'list',
                name: 'AdminMemberList',
                component: MemberListPage,
                meta: { title: '회원목록' },
              },
              {
                path: 'create',
                name: 'AdminMemberCreate',
                component: MemberCreatePage,
                meta: { title: '회원등록' },
              },
              {
                path: 'reportList',
                name: 'AdminReportList',
                component: ReportListPage,
                meta: { title: '신고관리' },
              },
              {
                path: 'reportReceiveList',
                name: 'AdminReportReceiveList',
                component: ReportReceiveListPage,
                meta: { title: '접수된 신고' },
              },
              {
                path: 'detail/:memberId',
                name: 'AdminMemberDetail',
                component: MemberDetailPage,
                props: true,
                meta: { menu: false, hidden: true },
              },
              {
                path: 'edit/:memberId',
                name: 'AdminMemberEdit',
                component: MemberEditPage,
                props: true,
                meta: { menu: false, hidden: true },
              },
              {
                path: 'reportDetail/:reportId',
                name: 'AdminReportDetail',
                component: ReportDetailPage,
                props: true,
                meta: { menu: false, hidden: true },
              },
              {
                path: 'reportCreate',
                name: 'AdminReportCreate',
                component: ReportCreatePage,
                meta: { menu: false, hidden: true },
              },
              {
                path: 'reportReceiveEdit/:reportId',
                name: 'AdminReportReceiveEdit',
                component: ReportReceiveEditPage,
                props: true,
                meta: { menu: false, hidden: true },
              },
            ],
          },
          
          // --- 재고 관리 ---
          {
            path: 'inventory',
            redirect: { name: 'AdminInventoryDashboard' },
            meta: { title: '재고관리', icon: 'fas fa-fw fa-boxes', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminInventoryDashboard',
                component: InventoryDashboardPage,
                meta: { title: '재고 대시보드' },
              },
              {
                path: 'list',
                name: 'AdminInventoryList',
                component: InventoryListPage,
                meta: { title: '재고 목록' },
              },
              {
                path: 'detail/:id',
                name: 'AdminInventoryDetail',
                component: () => import('@/pages/admin/inventory/InventoryDetailPage.vue'),
                props: true,
                meta: { title: '재고 상세', hidden: true },
              },
            ],
          },
          
          // --- 판매 관리 ---
          {
            path: 'sale',
            redirect: { name: 'AdminSaleDashboard' },
            meta: { title: '판매 관리', icon: 'fas fa-fw fa-gavel', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminSaleDashboard',
                component: AuctionDashboardPage,
                meta: { title: '판매 대시보드' },
              },
              {
                path: 'list',
                name: 'AdminSaleList',
                component: AuctionListPage,
                meta: { title: '판매 상품 목록' },
              },
            ],
          },
          
          // --- 주문 관리 (추가) ---
          {
            path: 'order',
            redirect: { name: 'AdminOrderList' },
            meta: { title: '주문관리', icon: 'fas fa-fw fa-receipt', menu: true },
            children: [
              {
                path: 'list',
                name: 'AdminOrderList',
                component: () => import('@/pages/admin/order/OrderListPage.vue'),
                meta: { title: '주문 목록' },
              },
              {
                path: 'detail/:orderId',
                name: 'AdminOrderDetail',
                component: () => import('@/pages/admin/order/OrderDetailPage.vue'),
                props: true,
                meta: { menu: false, hidden: true, title: '주문 상세' },
              },
            ],
          },

          // --- 입찰 관리 (추가) ---
          {
            path: 'bid',
            redirect: { name: 'AdminBidList' },
            meta: { title: '입찰관리', icon: 'fas fa-fw fa-hand-paper', menu: true },
            children: [
              {
                path: 'list',
                name: 'AdminBidList',
                component: () => import('@/pages/admin/bid/BidListPage.vue'),
                meta: { title: '입찰 목록' },
              },
            ],
          },
          
          // --- 검수 관리 ---
          {
            path: 'inspection',
            redirect: { name: 'AdminInspectionDashboard' },
            meta: { title: '검수관리', icon: 'fas fa-fw fa-check-circle', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminInspectionDashboard',
                component: InspectionDashboardPage,
              },
              {
                path: 'online',
                name: 'AdminOnlineInspectionList',
                component: OnlineInspectionListPage,
                meta: { title: '온라인 1차 검수' },
              },
              {
                path: 'online/:id',
                name: 'AdminOnlineInspectionDetail',
                component: OnlineInspectionDetailPage,
                meta: { title: '온라인 1차 상세', hidden: true },
              },
              {
                path: 'offline',
                name: 'AdminOfflineInspectionList',
                component: OfflineInspectionListPage,
                meta: { title: '오프라인 2차 검수' },
              },
              {
                path: 'offline/:id',
                name: 'AdminOfflineInspectionDetail',
                component: OfflineInspectionDetailPage,
                meta: { title: '오프라인 2차 상세', hidden: true },
              },
            ],
          },
          // --- 정산 관리 ---
          {
            path: 'settlement',
            redirect: { name: 'AdminSettlementDashboard' },
            meta: { title: '정산관리', icon: 'fas fa-fw fa-dollar-sign', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminSettlementDashboard',
                component: SettlementDashboardPage,
                meta: { title: '정산 대시보드' },
              },
              {
                path: 'list',
                name: 'AdminSettlementList',
                component: SettlementListPage,
                meta: { title: '정산 내역' },
              },
              {
                path: 'settings',
                name: 'AdminSettlementSettings',
                component: SettlementSettingPage,
                meta: { title: '정산 설정', menu: true },
              }, // 새로 추가
              // { path: 'sample', name: 'AdminSettlementListSample', component: SettlementListSamplePage, meta: { title: '샘플 목록' } }, // 샘플 페이지는 필요 없으므로 주석 처리 또는 삭제
            ],
          },
          // --- 문의 관리 ---
          {
            path: 'inquiry',
            redirect: { name: 'AdminInquiryDashboard' },
            meta: { title: '문의 관리', icon: 'fas fa-fw fa-headset', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminInquiryDashboard',
                component: InquiryDashboardPage,
                meta: { title: '문의 현황' },
              },
              {
                path: 'list',
                name: 'AdminInquiryList',
                component: AdminInquiryListPage,
                meta: { title: '1:1 문의 목록' },
              },
              {
                path: 'detail/:inquiryId',
                name: 'AdminInquiryDetail',
                component: AdminInquiryDetailPage,
                props: true,
                meta: { title: '1:1 문의 상세', hidden: true },
              },
            ],
          },
          // --- FAQ 관리 ---
          {
            path: 'faq',
            redirect: { name: 'AdminFaqDashboard' },
            meta: { title: 'FAQ 관리', icon: 'fas fa-fw fa-question-circle', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminFaqDashboard',
                component: FaqDashboardPage,
                meta: { title: 'FAQ 현황' },
              },
              {
                path: 'list',
                name: 'AdminFaqList',
                component: FaqListPage,
                meta: { title: 'FAQ 목록' },
              },
              {
                path: 'detail/:faqId',
                name: 'AdminFaqDetail',
                component: FaqDetailPage,
                props: true,
                meta: { title: 'FAQ 상세', hidden: true },
              },
              {
                path: 'create',
                name: 'AdminFaqCreate',
                component: FaqCreatePage,
                meta: { title: 'FAQ 등록', menu: true },
              },
              {
                path: 'edit/:faqId',
                name: 'AdminFaqEdit',
                component: FaqEditPage,
                props: true,
                meta: { title: 'FAQ 수정', hidden: true },
              },
            ],
          },
          // --- 공지사항 관리 ---
          {
            path: 'notice',
            redirect: { name: 'AdminNoticeDashboard' },
            meta: { title: '공지사항 관리', icon: 'fas fa-fw fa-bullhorn', menu: true },
            children: [
              {
                path: 'dashboard',
                name: 'AdminNoticeDashboard',
                component: NoticeDashboardPage,
                meta: { title: '공지사항 현황' },
              },
              {
                path: 'list',
                name: 'AdminNoticeList',
                component: NoticeListPage,
                meta: { title: '공지사항 목록' },
              },
              {
                path: 'detail/:noticeId',
                name: 'AdminNoticeDetail',
                component: NoticeDetailPage,
                props: true,
                meta: { title: '공지사항 상세', hidden: true },
              },
              {
                path: 'create',
                name: 'AdminNoticeCreate',
                component: NoticeCreatePage,
                meta: { title: '공지 등록', menu: true },
              },
              {
                path: 'edit/:noticeId',
                name: 'AdminNoticeEdit',
                component: NoticeEditPage,
                props: true,
                meta: { title: '공지사항 수정', hidden: true },
              },
              {
                path: 'write',
                name: 'AdminCsWrite',
                component: CsWritePage,
                props: true,
                meta: { title: '새 글 작성', hidden: true },
              },
            ],
          },
          // --- 반품 관리 ---
          {
            path: 'return', // 'returns' 대신 'return'으로 통일
            redirect: { name: 'AdminReturnList' },
            meta: { title: '반품관리', icon: 'fas fa-fw fa-undo', menu: true },
            children: [
              {
                path: 'list',
                name: 'AdminReturnList',
                component: AdminReturnListPage,
                meta: { title: '반품 목록' },
              },
              {
                path: 'detail/:returnRequestId',
                name: 'AdminReturnDetail',
                component: AdminReturnDetailPage,
                props: true,
                meta: { title: '반품 상세', hidden: true },
              },
              {
                path: 'create',
                name: 'AdminReturnCreate',
                component: AdminReturnCreatePage,
                meta: { title: '반품 등록', hidden: true },
              }, // 새로 추가
            ],
          },
          // --- 카탈로그 관리 ---
          {
            path: 'catalog',
            redirect: { name: 'AdminCategoryList' },
            meta: { title: '카탈로그관리', icon: 'fas fa-fw fa-book', menu: true },
            children: [
              {
                path: 'categories',
                name: 'AdminCategoryList',
                component: CategoryListPage,
                meta: { title: '카테고리 관리' },
              },
              {
                path: 'artists',
                name: 'AdminArtistList',
                component: ArtistListPage,
                meta: { title: '아티스트 관리' },
              },
            ],
          },
        ],
      },
    ],
  },
]

export default adminRoutes
