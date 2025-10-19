// src/router/userRoutes.js

/**
 * 사용자(User) 영역의 라우팅 설정입니다.
 * '/' 경로 하위의 모든 페이지를 관리합니다.
 */

// --- 레이아웃 ---
import UserLayout from '@/layouts/UserLayout.vue'

// --- 페이지 컴포넌트 (Lazy Loading) ---
const CSPageLayout = () => import('@/layouts/CSPageLayout.vue');
const CheckoutPage = () => import('@/pages/payment/CheckoutPage.vue');
const UserInfoPage = () => import('@/pages/payment/UserInfoPage.vue');
const PaymentCompletePage = () => import('@/pages/payment/PaymentCompletePage.vue');
const HomePage = () => import('@/pages/HomePage.vue');
const LoginPage = () => import('@/pages/user/access/LoginPage.vue');
const LoginFind = () => import('@/pages/user/access/LoginFind.vue');
const LoginFindSuccess = () => import('@/pages/user/access/LoginFindSuccess.vue');
const LoginResetPwd = () => import('@/pages/user/access/LoginResetPwd.vue');
const LoginFail = () => import('@/pages/user/access/LoginFail.vue');
const SignupTerms = () => import('@/pages/user/access/SignupTerms.vue');
const SignupForm = () => import('@/pages/user/access/SignupForm.vue');
const SignupComplete = () => import('@/pages/user/access/SignupComplete.vue');
const SignupFail = () => import('@/pages/user/access/SignupFail.vue');
const ProductListPage = () => import('@/pages/product/ProductListPage.vue');
const ProductDetailPage = () => import('@/pages/product/ProductDetailPage.vue');
const ProductAuctionPolicyPage = () => import('@/pages/product/ProductAuctionPolicyPage.vue');
// 검수 페이지 컴포넌트
const InspectionStep1Page = () => import('@/pages/user/inspection/Step1Page.vue')
const InspectionStep2Page = () => import('@/pages/user/inspection/Step2Page.vue')
const InspectionStep3Page = () => import('@/pages/user/inspection/Step3Page.vue')
const InspectionPolicyPage = () => import('@/pages/user/inspection/InspectionPolicyPage.vue')
// 마이페이지
const MyPageLayout = () => import('@/pages/user/mypage/MyPage.vue')
// 고객센터

const FaqPage = () => import('@/pages/user/cs/FaqPage.vue')
const NoticePage = () => import('@/pages/user/cs/NoticePage.vue')
const NoticeDetailPage = () => import('@/pages/user/cs/NoticeDetailPage.vue')
const InquiryWritePage = () => import('@/pages/user/cs/InquiryWritePage.vue')
const InquiryListPage = () => import('@/pages/user/cs/InquiryListPage.vue')
const InquiryDetailPage = () => import('@/pages/user/cs/InquiryDetailPage.vue')

const userRoutes = {
  path: '/',
  component: UserLayout,
  children: [
    {
      path: '',
      name: 'Home',
      component: HomePage,
    },
    {
      path: 'login',
      children: [
        {
          path: '',
          name: 'Login',
          component: LoginPage,
          meta: { requiredLogin: false },
        },
        {
          path: 'find',
          name: 'LoginFind',
          component: LoginFind,
          meta: { requiredLogin: false },
        },
        {
          path: 'findSuccess/:foundEmail',
          name: 'LoginFindSuccess',
          component: LoginFindSuccess,
          meta: { requiredLogin: false },
        },
        {
          path: 'resetPwd',
          name: 'LoginResetPwd',
          component: LoginResetPwd,
          meta: { requiredLogin: false },
        },
        {
          path: 'fail',
          name: 'LoginFail',
          component: LoginFail,
          meta: { requiredLogin: false },
        },
      ],
    },
    {
      path: 'signup',
      children: [
        {
          path: 'terms',
          name: 'SignupTerms',
          component: SignupTerms,
          meta: { requiredLogin: false },
        },
        {
          path: 'form',
          name: 'SignupForm',
          component: SignupForm,
          meta: { requiredLogin: false },
        },
        {
          path: 'complete',
          name: 'SignupComplete',
          component: SignupComplete,
          meta: { requiredLogin: false },
        },
        {
          path: 'fail',
          name: 'SignupFail',
          component: SignupFail,
          meta: { requiredLogin: false },
        },
      ],
    },
    {
      path: 'product',
      name: 'ProductList',
      component: ProductListPage,
      meta: { requiredLogin: false },
    },
    {
      path: 'product/:id',
      name: 'ProductDetail',
      component: ProductDetailPage,
      meta: { requiresAuth: false },
    },
    {
      path: 'product/auction-policy',
      name: 'ProductAuctionPolicy',
      component: ProductAuctionPolicyPage,
      meta: { requiresAuth: false },
    },
    // 검수
    {
      path: 'inspection/step1',
      name: 'InspectionStep1',
      component: InspectionStep1Page,
      meta: { requiresAuth: true },
    },
    {
      path: 'inspection/step2',
      name: 'InspectionStep2',
      component: InspectionStep2Page,
      meta: { requiresAuth: true },
    },
    {
      path: 'inspection/step3',
      name: 'InspectionStep3',
      component: InspectionStep3Page,
      meta: { requiresAuth: true },
    },
    {
      path: 'inspection/policy',
      name: 'InspectionPolicy',
      component: InspectionPolicyPage,
      meta: { requiresAuth: false },
    },
    // 마이페이지
    {
      path: 'mypage',
      name: 'MyPageLayout',
      component: MyPageLayout,
      meta: { requiresAuth: true },
    },
    {
      path: 'mypage/refund/:orderId',
      name: 'RefundRequest',
      component: () => import('@/pages/user/mypage/refund/RefundRequestPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: 'cs',
      component: CSPageLayout,
      redirect: '/cs/notice',
      children: [
        {
          path: 'faq',
          name: 'FaqPage',
          component: FaqPage,
        },
        {
          path: 'notice',
          name: 'NoticePage',
          component: NoticePage,
        },
        {
          path: 'notice/:id',
          name: 'NoticeDetail',
          component: NoticeDetailPage,
        },
        {
          path: 'inquiry-write',
          name: 'InquiryWritePage',
          component: InquiryWritePage,
          meta: { requiresAuth: true },
        },
        {
          path: 'inquiry-list',
          name: 'InquiryListPage',
          component: InquiryListPage,
          meta: { requiresAuth: true },
        },
        {
          path: 'inquiry/:id',
          name: 'InquiryDetail',
          component: InquiryDetailPage,
          meta: { requiresAuth: true },
        },
      ]
    },
    {
      path: 'product/order/info',
      name: 'Info',
      component: UserInfoPage,
      meta: { requiredLogin: false },
    },
    {
      path: 'product/order/checkout',
      name: 'Checkout',
      component: CheckoutPage,
      meta: { requiredLogin: false },
    },
    {
      path: 'product/order/complete',
      name: 'Complete',
      component: PaymentCompletePage,
      meta: { requiredLogin: false },
    },
  ],
}

export default userRoutes
