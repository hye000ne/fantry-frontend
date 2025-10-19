import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useUiStore } from '@/stores/uiStore';
import userRoutes from './userRoutes';
import adminRoutes from '././adminRoutes';
import { useAlertDialog } from '@/composables/useAlertDialog';

/**
 * Vue Router 설정의 중심 파일입니다.
 * - router 인스턴스는 다른 컴포넌트에서 import하여 사용할 수 있도록 명명된 export됩니다.
 */

// 라우트 정의 통합
const routes = [userRoutes, ...adminRoutes];

// 💡 라우터 인스턴스를 명명된 export로 정의하여 컴포넌트에서 가져갈 수 있게 합니다.
export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    // 페이지 전환 시 항상 최상단으로 스크롤
    scrollBehavior: () => ({ top: 0 }), 
});

/**
 * 전역 네비게이션 가드를 설정하는 함수입니다.
 * 이 함수는 Pinia가 앱에 등록된 후 main.js에서 단 1회 호출되어야 합니다.
 */
export function setupRouter() {
    // 💡 중요: Pinia가 앱에 등록된 후 이 함수가 호출되므로,
    // 스토어 인스턴스를 가드 외부에 한 번만 생성하여 안전하게 접근합니다.
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const { showAlert } = useAlertDialog();

    // 전역 네비게이션 가드: 모든 페이지 이동 전에 실행됩니다.
    // 💡 Updated upstream의 비동기 로직을 포함하기 위해 async/await을 추가합니다.
    router.beforeEach(async (to, from, next) => {
        
        // 1. 페이지 이동 시작 시 로딩 인디케이터를 활성화합니다.
        uiStore.startLoading();

        // --- 인증 및 권한 검사 ---
        
        // 💡 Updated upstream의 복구 로직: 토큰은 있지만 사용자 정보가 없는 경우 복구 시도
        if(userStore.authToken && !userStore.currentUser) {
            // fetchUser가 비동기 함수이므로 await을 사용합니다.
            await userStore.fetchUser(); 
        }

        // 2. 인증이 필요한 페이지에 비로그인 상태로 접근하는 경우를 처리합니다.
        if (to.meta.requiresAuth && !userStore.isLoggedIn) {
            showAlert('알림', '로그인이 필요한 서비스입니다.');
            const loginPath = to.path.startsWith('/admin') ? '/admin/login' : '/login';
            return next(loginPath);
        }

        // 3. 관리자 페이지에 일반 사용자가 접근하는 경우를 처리합니다.
        if (to.meta.isAdmin && !userStore.isAdmin) {
            showAlert('경고', '접근 권한이 없습니다.');
            return next('/'); // 메인 페이지로 리디렉션합니다.
        }

        // 4. 모든 검사를 통과한 경우, 요청된 라우트로 정상적으로 이동합니다.
        next();
    });

    // 전역 후행 가드: 모든 페이지 이동이 완료된 후 실행됩니다.
    router.afterEach(() => {
        uiStore.stopLoading();
    });

    // 라우트 에러 시 로딩 상태가 남지 않도록 처리
    router.onError(() => {
        uiStore.stopLoading();
    });

    return router;
}
