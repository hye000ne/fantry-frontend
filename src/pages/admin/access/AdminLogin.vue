<script setup>
    import { useRouter } from 'vue-router';
    import { ref } from 'vue';
    import { login } from '@/api/login';
    import { useUserStore } from '@/stores/userStore'
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const { showAlert: showDialog } = useAlertDialog();
    const userStore = useUserStore();

    const router = useRouter();

    const username = ref(''); // 관리자 이메일/ID
    const password = ref('');
    const isPwdVisible = ref(true);

    const pushShowPwd = () => {
        isPwdVisible.value = !isPwdVisible.value;
    };

    // 관리자 로그인 처리
    const gotoAdminLogin = async () => {
      try{
        const response = await login(username.value, password.value);

        // 관리자 인증 성공 시 처리
        const userRole = response.data.tokenMemberResponse.role;
        if (userRole !== 'ADMIN' && userRole !== 'SADMIN') {
            showDialog("⚠️주의", "관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.");
            return;
        }
        // 관리자 토큰 저장
        localStorage.setItem("accessToken", response.data.accessToken); 
        userStore.setLoginInfo(response.data.tokenMemberResponse, response.data.accessToken); 
        
        // 관리자 메인 페이지로 이동
        router.push('/admin'); 
      } catch(error) {
            // 로그인 실패 처리
            console.log("로그인에 실패함: " + error);
            showDialog("🚫오류", '관리자 로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        }
    }

    // 관리자용 비밀번호 찾기 페이지로 이동
    const goToFind = () => {
        console.log("관리자 비밀번호 찾기 클릭됨");
        showDialog("✅안내", "슈퍼 관리자에게 문의하세요.");
        //router.push('/admin/login/find');
    }

</script>
<template>
  <div class="login-page">
    <!-- Login Header Start -->
    <div class="login-header">
      <!-- 관리자 페이지임을 명확히 합니다 -->
      <h1>ADMINISTRATION PANEL</h1>
      <h4>FANTRY 관리 시스템에 오신 것을 환영합니다.</h4>
    </div>
    <!-- Login Header End -->

    <!-- Login contenxt Start -->
    <form class="login-form" @submit.prevent="gotoAdminLogin">
      <input type="input" name="username" placeholder="관리자 아이디" v-model="username" required>
      <div class="password-wrapper">
        <input :type='isPwdVisible ? "password" : "text"' name="password" placeholder="비밀번호" v-model="password" required>
        <!-- 실제 이미지 경로에 맞게 수정해주세요 -->
        <img class="toggle-visibility" :src="isPwdVisible ? '/images/eyeSlash.png' : '/images/eyeView.png'" @click="pushShowPwd" alt="비밀번호 보이기/숨기기" />
      </div>
      <button type="submit" class="login-btn" name="login">관리자 로그인</button>
      
      <!-- 관리자용 비밀번호 찾기 -->
      <div class="forgot-wrap">
        <span @click="goToFind">비밀번호를 잊으셨나요?</span>
      </div>

      <!-- 회원 가입 -->
      <div class="signup-wrap" style="text-align: center; margin-top: 20px;">
        <span><router-link to="/admin/signup">관리자 계정이 없으신가요?</router-link></span>
      </div>
    </form>
    <!-- Login contenxt End -->
    
  </div>
</template>
<style scoped>
  /* 페이지 기본 */
  .login-page {
    background: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* 헤더 */
  .login-header {
    width: 100%;
    padding: 40px 20px;
    text-align: center;
    color: #fff;
    background: linear-gradient(52deg, rgba(30, 50, 100, 1) 0%, rgba(50, 80, 150, 1) 50%, rgba(100, 150, 250, 1) 100%);
  }

  .login-header h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #fff;
  }

  .login-header h4 {
    font-size: 14px;
    font-weight: 400;
    color: #fff
  }

  /* 로그인 폼 */
  .login-form {
    width: 100%;
    max-width: 320px;
    margin-top: 50px; /* SNS 및 회원가입 섹션이 사라진 만큼 여백 증가 */
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .login-form input {
    padding: 14px;
    border: 1px solid silver;
    border-radius: 6px;
    font-size: 14px;
  }

  .password-wrapper {
    position: relative;
    width: 100%;
  }

  .password-wrapper input {
    width: 100%;
    padding-right: 40px;
  }

  .password-wrapper .toggle-visibility {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    cursor: pointer;
    opacity: 0.6;
  }

  .password-wrapper .toggle-visibility:hover {
    opacity: 1;
  }

  /* 로그인 버튼 색상도 관리자 톤에 맞게 수정 가능 */
  .login-btn {
    background: #1e3264; /* 다크 블루 */
    color: #fff;
    padding: 14px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
  }

  .login-btn:hover {
    background: #325096;
  }

  .forgot-wrap {
    text-align: left;
    margin-top: 6px;
  }

  .forgot-wrap span {
    font-size: 12px;
    color: #5C7BFF;
    text-decoration: none;
  }

  .signup-wrap span {
    font-size: 13px;
    color: #1e3264;
    text-decoration: none;
  }

  .forgot-wrap span:hover {
    color: #3C4DFF;
    cursor: pointer;
  }
</style>
