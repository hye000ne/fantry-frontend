<script setup>
  import { ref, reactive, watch } from "vue";
  import { useRouter } from "vue-router";
  import { sendAuthCode, verifyAuthCode, findUserId } from "@/api/login";
  import { useAlertDialog } from '@/composables/useAlertDialog.js';
  
  const { showAlert } = useAlertDialog();
  const router = useRouter();

  /*-----------------------------------------------------------
      바인드 변수 선언
  -----------------------------------------------------------*/
  const activeTab = ref("id");  //기본 아이디찾기
  const email = ref("");
  const code = ref(""); //인증번호 (아이디 찾기 전용)

  //탭 전환
  const setTab = (tab)=>{
    activeTab.value = tab;
    email.value = "";
    code.value = "";
  };

  //유효성 검사 상태
  const validation = reactive({
    email: {isValid: true, message: ''},
    verificationCode: {isValid: true, message:''}
  });

  //UI 관련 상태
  const uiState = reactive({
    isEmailVerified : false,
    isCodeVerified : false,
    isEmailSendLoading: false,
    timer: null,
    remainingTime: '',
    verificationSent: false,
    isTimerLable: false
  });

  //실패 메시지 관리
  const errorMessages = reactive({
    emailSendError: '',
    verifyCodeError: '',
    findIdError: ''
  });

  /*-----------------------------------------------------------
      유효성 검사
  -----------------------------------------------------------*/
  //유효성 검사
  const validateEmail = (email) =>{
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    validation.email.isValid = regex.test(email);
    validation.email.message = validation.email.isValid ? '' : '유효한 이메일 주소를 입력해주세요.';
    uiState.isEmailVerified = validation.email.isValid;
  }

  //실시간 유효성 검사
  watch(()=> email.value, (newVal)=>{
    validateEmail(newVal);
  });

  /*-----------------------------------------------------------
      인증코드 발급 및 검사
  -----------------------------------------------------------*/
  //타이머 시작
  const startTimer = (time)=>{
    uiState.timer = setInterval(()=>{
      time--;
      const minutes = Math.floor(time/60);
      const seconds = time % 60;
      uiState.remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if(time <= 0){
        clearInterval(uiState.timer);
        uiState.verificationSent = false;
        uiState.isEmailVerified = false;
        errorMessages.verifyCodeError = "인증 시간이 만료되었습니다.";
      }
    }, 1000);
  };

  //인증번호 요청
  const sendCode = async()=>{
    if(!email.value){
      showAlert("⚠️주의", "이메일을 입력해주세요.");
      return;
    }
    uiState.isEmailSendLoading = true;
    if(uiState.timer) clearInterval(uiState.timer);
    errorMessages.emailSendError = '';

    try{
      uiState.isTimerLable = true;
      //서버 요청
      const response = await sendAuthCode(email.value);
      
      const ttlSeconds = response.data.ttl;
      startTimer(ttlSeconds);
      uiState.verificationSent = true;
      showAlert("✅안내", "인증번호가 발송되었습니다.");
    } catch(err){
      errorMessages.emailSendError = "인증번호 발송에 실패하였습니다.";
      console.log(err);
    } finally {
      uiState.isEmailSendLoading = false;
    }
  };

  //아이디 찾기 요청
  const findId = async()=>{
    if(!email.value || !code.value){
      errorMessages.findIdError = "이메일과 인증번호를 입력해주세요.";
      return;
    }

    errorMessages.verifyCodeError = '';
    errorMessages.findIdError = '';

    try{
      //인증번호 확인
      const response = await verifyAuthCode(email.value, code.value);
      if(response){
        //인증 성공 시
        validation.verificationCode.isValid = true;
        uiState.isEmailVerified = true;

        //타이머 정지
        if(uiState.timer){
          clearInterval(uiState.timer);
          uiState.timer = null;
          uiState.isTimerLable = false;
        }

        //아이디 가져오기
        try {
          const res = await findId(email.value);
          const data = res.data;

          if (data.result === "회원 찾기 완료") {
            const member = data.member; // member DTO 데이터
            router.push({
              name: 'LoginFindSuccess',
              params: {
                foundEmail: member.email
              }
            });
          } else {
            //회원 찾기 실패 시(아이디가 없는 경우 등)
            errorMessages.findIdError = "해당 정보와 일치하는 아이디가 없습니다.";
          }
        } catch (error) {
          errorMessages.findIdError = "아이디를 찾는 중 오류가 발생했습니다. 다시 시도해주세요.";
          console.error("API 호출 중 오류 발생", error);
        }
      }else{
        errorMessages.verifyCodeError = "인증 번호가 올바르지 않습니다.";
      }
    } catch(err){
      errorMessages.verifyCodeError = "인증번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.";
      console.log(err);
    }
  }

  //비밀번호 찾기 요청
  const findPwd = async()=>{
    if(!email.value){
      showAlert("⚠️주의", "이메일을 입력해주세요.");
      return;
    }
    try{
      // 서버 요청
      // await axios.post('');
      showAlert("✅안내", "비밀번호 재설정 메일을 발송했습니다.");
    }catch(err){
      showAlert("🚫오류", "비밀번호 찾기 실패");
      console.log(err);
    }
  };

  //공용 제출 함수
  const handleSubmit = ()=>{
    if(activeTab.value === "id"){
      findId();
    }else{
      findPwd();
    }
  };

  const backLogin = ()=>{
    router.push('/login');
  };

</script>
<template>
  <div class="content-page">
    <!--Login Header Start-->
    <div class="login-header">
      <h1>WELCOME! FANTRY</h1>
      <h4>팬들끼리 만드는 굿즈 유니버스! 팬트리에 오신 걸 환영합니다.</h4>
    </div>
    <!--Login Header End-->
    
    <!--Content Start-->
    <div class="login-find-content">
      <!--select header start-->
      <div class="login-select-header">
        <button type="button" :class="{ active: activeTab === 'id' }"
          @click="setTab('id')">아이디</button>
        <button type="button" :class="{ active: activeTab === 'pwd' }"
          @click="setTab('pwd')">비밀번호</button>
      </div>
      <!--select header end-->
      <!--input start-->
      <div class="login-find-input">
        <!-- 아이디 찾기 -->
        <template v-if="activeTab === 'id'">
          <div>
            <input type="text" v-model="email" placeholder="Email" />
            <button type="button" @click="sendCode">인증번호</button>
          </div>
          <label class="input-error" v-if="!validation.email.isValid">{{ validation.email.message }}</label>
          <label class="input-error" v-if="errorMessages.findIdError">{{ errorMessages.findIdError }}</label>
          <label class="input-error" v-if="errorMessages.emailSendError">{{ errorMessages.emailSendError }}</label>
          
          <input type="text" v-model="code" placeholder="인증번호 입력" />
          <div v-if="uiState.isTimerLable" class="verification-status">
            <span>{{ uiState.isEmailSendLoading ? '이메일 전송 중...' : '인증코드 발송 완료!' }}</span>
            <span class="verification-info" v-if="uiState.verificationSent">남은 시간: {{ uiState.remainingTime }}</span>
          </div>
          <label class="input-error" v-if="errorMessages.verifyCodeError.length>0">{{ errorMessages.verifyCodeError }}</label>
        </template>

        <!-- 비밀번호 찾기 -->
        <template v-else>
          <input type="text" v-model="email" placeholder="Email" />
        </template>
      </div>
      <!--input end-->

      <button type="button" @click="handleSubmit">{{ activeTab === "id" ? "아이디 찾기" : "비밀번호 찾기" }}</button>
      <span class="back-login" @click="backLogin">← 로그인으로 돌아가기</span>
    </div>
    <!--Content End-->
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

  /* 전체 컨텐츠 영역 */
.login-find-content {
  background: #fff;width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 20px;
  border-radius: 0 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 탭 버튼 */
.login-select-header {
  display: flex;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
}

.login-select-header button {
  flex: 1;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
  border: none;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
}

.login-select-header button:first-child {
  border-right: 1px solid #ddd;
}

.login-select-header button.active {
  background: #5c7bff; /* 활성화된 탭 색상 */
  color: #fff;
}

/* 입력 영역 */
.login-find-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-find-input div {
  display: flex;
  gap: 8px;
}

.login-find-input input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  background: #fff;
  color: #333;
}

.login-find-input button {
  padding: 0 16px;
  background: #5c7bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.login-find-input .input-error {
  display: block;
  color: #dc3545;
  font-size: 12px;
  margin-top: 0px;
  margin-bottom: 8px;
  height: 18px;
}

.login-find-input .verification-status {
  display: block;
  color: #28a745;
  font-size: 12px;
  margin-top: 0px;
  margin-bottom: 8px;
  height: 18px;
}

.login-find-input .verification-info {
    display: block;
    color: #007bff;
    font-size: 12px;
    margin-top: 0px;
    margin-bottom: 8px;
    height: 18px;
}
.login-find-input .verification-info span {
    font-weight: 500;
}

/* 아이디 찾기 버튼 */
.login-find-content > button {
  width: 100%;
  padding: 14px;
  background: #5c7bff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 로그인으로 돌아가기 태그 */
.back-login {
  font-size: 12px;
  color: #5C7BFF;
  text-decoration: none;
}

.back-login:hover {
  cursor: pointer;
  color: #3C4DFF;
}

</style>