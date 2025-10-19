import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';
import { apiClient } from '@/api/index.js'; // 로그아웃 API 호출을 위해 사용
import { useAlertDialog } from '@/composables/useAlertDialog';

/**
 * 사용자 미활동(Idle Time)을 감지하여 자동 로그아웃을 처리하는 Vue Composable
 * * @param {number} timeoutMinutes - 미활동으로 간주할 시간 (분 단위)
 * Refresh Token 만료 시간(120분)보다 짧게 설정하는 것이 권장
 * @returns {{ showLogoutMessage: Ref<boolean> }} - 로그아웃 메시지 표시 상태
 */
export function useIdleTimer(timeoutMinutes) {
  // 1. 설정: 분 단위를 밀리초로 변환
  const IDLE_TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  
  const userStore = useUserStore();
  const router = useRouter();
  const { showAlert } = useAlertDialog();

  let idleTimer = null; // 미활동 타이머 ID
  const showLogoutMessage = ref(false); // 미활동 메시지 표시 상태

  // 미활동으로 인한 클라이언트 측 강제 로그아웃을 처리
  const forceLogout = async () => {
    showAlert("알림", "미활동 시간 초과: 장시간 활동하지 않아 자동 로그아웃 처리되었습니다. 다시 로그인해주세요.");
    clearTimeout(idleTimer);
    
    // 1. 사용자에게 알림
    showLogoutMessage.value = true; 

    // 2. 서버에 로그아웃 요청 (Refresh Token 무효화)
    try {
      // Refresh Token이 담긴 HTTP Only Cookie를 서버에 요청하여 삭제
      await apiClient.post('/logout'); 
    } catch (error) {
      console.error("서버 로그아웃 요청 실패 (이미 만료되었을 수 있음):", error);
    } finally {
      // 3. 클라이언트 상태 정리 (Soft Logout)
      userStore.logout(); 
      
      // 4. 메시지 숨김 및 리디렉션
      setTimeout(() => { showLogoutMessage.value = false; }, 3000);
      router.push('/login'); 
    }
  };
  
  // 사용자 활동이 감지되면 타이머를 재설정
  const resetIdleTimer = () => {
    // 사용자가 로그인 상태일 때만 타이머를 관리
    if (!userStore.isLoggedIn) {
      clearTimeout(idleTimer);
      return;
    }
    
    clearTimeout(idleTimer);
    idleTimer = setTimeout(forceLogout, IDLE_TIMEOUT_MS);
  };

  /**
   * 활동 이벤트 리스너 등록
   */
  const addActivityListeners = () => {
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
  };

  /**
   * 활동 리스너 해제 및 타이머 정리
   */
  const removeActivityListeners = () => {
    window.removeEventListener('mousemove', resetIdleTimer);
    window.removeEventListener('keydown', resetIdleTimer);
    window.removeEventListener('scroll', resetIdleTimer);
    window.removeEventListener('click', resetIdleTimer);
    clearTimeout(idleTimer);
  };
  
  // 컴포넌트 생명 주기 관리
  onMounted(() => {
    addActivityListeners();
    if (userStore.isLoggedIn) {
      resetIdleTimer();
    }
  });

  onUnmounted(() => {
    removeActivityListeners();
  });

  // 로그인 상태 변화 감지 (로그인/로그아웃 시 타이머 시작/중지)
  watch(
    () => userStore.isLoggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        resetIdleTimer();
      } else {
        removeActivityListeners();
      }
    },
  );

  return { 
    showLogoutMessage
  };
}
