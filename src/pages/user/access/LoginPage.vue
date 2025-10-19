<script setup>
  import { useRouter } from 'vue-router';
  import { ref } from 'vue';
  import { login } from '@/api/login';
  import { useUserStore } from '@/stores/userStore'
  import { useAlertDialog } from '@/composables/useAlertDialog.js';
  
  const { showAlert } = useAlertDialog();
  const userStore = useUserStore();
  const router = useRouter();

  const username = ref('');
  const password = ref('');
  const isPwdVisible = ref(true);
  const pushShowPwd = () => {
    isPwdVisible.value = !isPwdVisible.value;
  };

  const gotoLogin= async ()=>{
    try{
      const response = await login(username.value, password.value);
      localStorage.setItem("accessToken", response.data.accessToken);
      userStore.setLoginInfo(response.data.tokenMemberResponse, response.data.accessToken);
      
      if (userStore.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error) {
      showAlert("🚫로그인 오류", error.response.data.message);
      console.log("로그인결과: ", error);
      //초기화
      username.value = null;
      password.value = null;
    }
  }

  const goToSignup=()=>{
    router.push('/signup/terms');
  }

  const goToFind=()=>{
    router.push('/login/find');
  }

  const snsLogin = () => {
    showAlert("⚠️주의", "현재 버전에서는 지원하지 않습니다. 일반 로그인을 진행해주세요.");
  }

</script>
<template>
  <div class="login-page">
    <!--Login Header Start-->
    <div class="login-header">
      <h1>WELCOME! FANTRY</h1>
      <h4>팬들끼리 만드는 굿즈 유니버스! 팬트리에 오신 걸 환영합니다.</h4>
    </div>
    <!--Login Header End-->

    <!--Login contenxt Start-->
    <form class="login-form" @submit.prevent="gotoLogin">
      <input type="text" name="username" placeholder="username" v-model="username" required>
      <div class="password-wrapper">
        <input :type='isPwdVisible?"password":"text"' name="password" placeholder="password" v-model="password" required>
        <img class="toggle-visibility" :src="isPwdVisible ? '/images/eyeSlash.png' : '/images/eyeView.png'" @click="pushShowPwd" />
      </div>
      <button type="submit" class="login-btn" name="login">LOGIN</button>
      <div class="forgot-wrap">
        <span @click="goToFind">Forgot your password?</span>
      </div>
    </form>
    <!--Login contenxt End-->

    <!--Sing up Start-->
    <div class="signup-wrap">
      <div class="signup-divider">
        <span>or</span>
      </div>
      <button type="button" class="signup-btn" name="signup" @click="goToSignup">Create an Account</button>
    </div>
    <!--Sing up End-->

    <!--SNS Login Start-->
    <div class="sns-wrap">
      <div class="sns-divider">
        <span>sns login</span>
      </div>
      <div class="sns-btns">
        <button type="button" class="sns-btn naver" name="naver" @click="snsLogin"></button>
        <button type="button" class="sns-btn kakao" name="kakao" @click="snsLogin"></button>
      </div>
    </div>
    <!--SNS Login End-->

    <!-- 메인으로 돌아가기 -->
    <div class="go-main-wrap">
      <button class="go-main-btn" type="button" @click="router.push('/')">메인으로 돌아가기</button>
    </div>
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
    background: linear-gradient(52deg, rgba(60, 77, 255, 1) 0%, rgba(92, 123, 255, 1) 50%, rgba(191, 212, 255, 1) 100%);
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
    margin-top: 30px;
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
    padding-right: 40px; /* 오른쪽 아이콘 공간 확보 */
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

  .login-btn {
    background: #3C4DFF;
    color: #fff;
    padding: 14px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }

  .login-btn:hover {
    background: #5C7BFF;
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

  .forgot-wrap span:hover {
    color: #3C4DFF;
    cursor: pointer;
  }

  /* 회원가입 */
  .signup-wrap {
    margin-top: 20px;
    width: 100%;
    max-width: 320px;
  }

  .signup-divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #aaa;
    font-size: 14px;
    margin: 20px 0;
  }

  .signup-divider::before,
  .signup-divider::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #ddd;
  }

  .signup-divider:not(:empty)::before {
    margin-right: 0.75em;
  }

  .signup-divider:not(:empty)::after {
    margin-left: 0.75em;
  }


  .signup-btn {
    width: 100%;
    background: #f2f4ff;
    color: #3C4DFF;
    padding: 14px;
    border: 1px solid #5C7BFF;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }

  /* SNS 버튼 */
  .sns-wrap {
    margin-top: 30px;
    width: 100%;
    max-width: 320px;
    text-align: center;
  }

  /* divider */
  .sns-divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #aaa;
    font-size: 14px;
    margin: 20px 0;
  }

  .sns-divider::before,
  .sns-divider::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #ddd;
  }

  .sns-divider:not(:empty)::before {
    margin-right: 0.75em;
  }

  .sns-divider:not(:empty)::after {
    margin-left: 0.75em;
  }

  /* sns 버튼 */
  .sns-btns {
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .sns-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .sns-btn.naver {
    background-image: url("/images/login_naver_btn.png");
  }

  .sns-btn.kakao {
    background-image: url("/images/login_kakao_btn.png");
  }

  /* 메인으로 돌아가기 버튼 */
  .go-main-wrap {
    margin-top: 30px;
    width: 100%;
    max-width: 320px;
    text-align: center;
  }

  .go-main-btn {
    background: transparent;
    color: #3C4DFF;
    padding: 10px 20px;
    border: 1px solid #3C4DFF;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .go-main-btn:hover {
    background: #5C7BFF;
    color: #fff;
    border-color: #3C4DFF;
  }
</style>