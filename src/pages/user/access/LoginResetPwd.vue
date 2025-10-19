<script setup>
  import { reactive, watch } from 'vue';
  import { useAlertDialog } from '@/composables/useAlertDialog';

  const { showAlert: showDialog } = useAlertDialog();
  //바인드 변수 선언
  const formState = reactive({
    password: '',
    passwordConfirm: ''
  });

  //유효성 검사 상태
  const validation = reactive({
    password: {isValid: true, message: ''},
    passwordConfirm : {isValid: true, message: ''}
  });

  //비밀번호 유효성 검사
  const validatePassword = (password) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      validation.password.isValid = regex.test(password);
      validation.password.message = validation.password.isValid ? '' : '비밀번호는 대소문자, 숫자, 특수문자 포함 8자 이상입니다.';
  }
  const validatePasswordConfirm = (password, confirm) => {
      validation.passwordConfirm.isValid = password === confirm;
      validation.passwordConfirm.message = validation.passwordConfirm.isValid ? '' : '비밀번호가 일치하지 않습니다.';
  }

  //실시간 비밀번호 검사
  watch(()=> formState.password, (newVal)=>{
      validatePassword(newVal);
      validatePasswordConfirm(newVal, formState.passwordConfirm);
  });
  watch(()=> formState.passwordConfirm, (newVal)=>{
      validatePasswordConfirm(formState.password, newVal);
  });

  //비밀번호 재설정
  const resetPwd = async() => {
    //최종 유효성 검사
    const isFormValid = Object.values(validation).every(v=>v.isValid);

    if(!isFormValid){
      showDialog("⚠️주의", "모든 정보를 올바르게 입력해주세요.");
      return;
    }

    //서버에 password와 member_id 전송

  }

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
    <div class="login-reset-password-content">
      <label>새 비밀번호 입력</label>
      <input type="password" placeholder="대소문자, 숫자, 특수문자 포함 8자 이상의 비밀번호 입력" v-model="formState.password"/>
      <label class="input-error" v-if="!validation.password.isValid">{{ validation.password.message }}</label>

      <label>비밀번호 재확인</label>
      <input type="password" placeholder="비밀번호를 한번 더 입력해주세요." v-model="formState.passwordConfirm"/>
      <label class="input-error" v-if="!validation.passwordConfirm.isValid">{{ validation.passwordConfirm.message }}</label>

      <button type="button">비밀번호 변경</button>
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
.login-reset-password-content {
  background: #fff;width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 20px;
  border-radius: 0 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

  /* 입력창 스타일 */
  .login-reset-password-content input {
    padding: 12px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease-in-out;
  }

  .login-reset-password-content input:focus {
    border-color: #3c4dff;
    box-shadow: 0 0 5px rgba(60, 77, 255, 0.5);
  }

  .login-reset-password-content label {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .login-reset-password-content .input-error{
    display: block;
    color: #dc3545;
    font-size: 12px;
    margin-top: 0px;
    margin-bottom: 8px;
    height: 18px;
  }

  /* 버튼 스타일 */
  .login-reset-password-content button {
    padding: 12px;
    font-size: 16px;
    font-weight: 600;
    background-color: #3c4dff;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .login-reset-password-content button:hover {
    background-color: #5C7BFF;
  }

  .login-reset-password-content button:focus {
    outline: none;
  }
</style>