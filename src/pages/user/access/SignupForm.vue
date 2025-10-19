<script setup>
    import { reactive, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { sendAuthCode, signup, checkDuplicateUsername, verifyAuthCode } from '@/api/login';
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const { showAlert } = useAlertDialog();
    const router = useRouter();

    //이전으로 페이지 이동
    const goToPrev=()=>{
        router.push("/signup/terms");
    }

    /*-----------------------------------------------------------
        바인드 변수 선언
    -----------------------------------------------------------*/
    //폼 데이터
    const formState = reactive({
        id: '',
        password: '',
        passwordConfirm: '',
        name: '',
        phone: '',
        emailLocal: '',
        emailDomain: '',
        customEmailDomain: '', // 직접 입력을 위한 상태 추가
        verificationCode: ''
    });

    //유효성 검사 상태 (default: true)
    const validation = reactive({
        id: {isValid: true, message: ''},
        password: {isValid: true, message: ''},
        passwordConfirm: {isValid: true, message: ''},
        phone: {isValid: true, message: ''},
        email: {isValid: true, message: ''},
        verificationCode: {isValid: true, message: ''}
    });

    //UI 관련 상태
    const uiState = reactive({
        isIdChecked: false,
        isEmailVerified: false,
        verificationSent: false,
        remainingTime: '',
        timer: null,
        isEmailSendLoading: false,
    });

    /*-----------------------------------------------------------
        유효성 검사 함수
    -----------------------------------------------------------*/
    //아이디 유효성 검사
    const validateId = (id) => {
        const regex = /^[a-zA-Z0-9]{6,20}$/;
        validation.id.isValid = regex.test(id);
        validation.id.message = validation.id.isValid ? '' : '아이디는 6~20자의 영문, 숫자만 가능합니다.';
        uiState.isIdChecked = false; // 입력값이 변경되면 중복확인 상태 초기화
    }

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

    //전화번호 유효성 검사
    const validatePhone = (phone) => {
        const cleaned = phone.replace(/\D/g, ''); // 숫자만 추출

        if (!cleaned.startsWith('01')) {
            validation.phone.isValid = false;
            validation.phone.message = "휴대폰 번호는 01로 시작해야 합니다.";
            return;
        }
        if (!/^01[016789]\d{7,8}$/.test(cleaned)) {
            validation.phone.isValid = false;
            validation.phone.message = "'-'를 제외한 11자리의 올바른 휴대폰 번호를 입력해주세요.";
            return;
        }

        // 유효한 번호인 경우
        validation.phone.isValid = true;
        validation.phone.message = '';
    }

    //이메일 유효성 검사
    const validateEmail = (local, domain, customDomain) => {
        const finalDomain = domain === 'custom' ? customDomain : domain;

        if (!local || !finalDomain) {
            validation.email.isValid = false;
            validation.email.message = '이메일 주소를 모두 입력해주세요.';
            uiState.isEmailVerified = false;
            return;
        }
        const fullEmail = `${local}@${finalDomain}`;
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        validation.email.isValid = regex.test(fullEmail);
        validation.email.message = validation.email.isValid ? '' : '유효한 이메일 주소를 입력해주세요.';
        uiState.isEmailVerified = false;    //이메일 변경 시 인증상태 초기화
    }

    /*-----------------------------------------------------------
        실시간 유효성 검사
    -----------------------------------------------------------*/
    //아이디 검사
    watch(()=> formState.id, (newVal)=>{
        validateId(newVal);
    });

    //비밀번호 검사
    watch(()=> formState.password, (newVal)=>{
        validatePassword(newVal);
        validatePasswordConfirm(newVal, formState.passwordConfirm);
    });
    watch(()=> formState.passwordConfirm, (newVal)=>{
        validatePasswordConfirm(formState.password, newVal);
    });

    //전화번호 검사
    watch(()=> formState.phone, (newVal)=>{
        //자동 하이픈('-') 추가
        let cleaned = newVal.replace(/\D/g, "");
        let formatted = cleaned;
        if (cleaned.length > 3 && cleaned.length <= 7) {
            formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        } else if (cleaned.length > 7) {
            formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
        }
        formState.phone = formatted;
        validatePhone(formatted);
    });

    //이메일 검사
    watch(()=>[formState.emailLocal, formState.emailDomain, formState.customEmailDomain], ([local, domain, customDomain])=>{
        if (domain !== 'custom') {
            formState.customEmailDomain = ''; // 다른 옵션 선택 시 직접입력 필드 초기화
        }
        validateEmail(local, domain, customDomain);
    });

    //아이디 중복 확인
    const checkIdDuplicate = async()=>{
        if(!validation.id.isValid){
            showAlert("⚠️주의", "유효한 아이디를 입력해주세요.");
            return;
        }

        try{
            //서버에 중복 확인 요청
            const response = await checkDuplicateUsername(formState.id);

            if(response.data){
                validation.id.isValid = false;
                validation.id.message = "이미 사용 중인 아이디입니다.";
                uiState.isIdChecked = false;
            }else{
                validation.id.isValid = true;
                validation.id.message = "사용 가능한 아이디입니다.";
                uiState.isIdChecked = true;
            }
        }catch(error){
            console.log("아이디 중복 확인 실패: ", error);
            showAlert("🚫오류", "아이디 중복 확인 중 오류가 발생했습니다.");
            uiState.isIdChecked = false;
        }
    };

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
                showAlert("🚫경고", "인증 시간이 만료되었습니다.");
            }
        }, 1000);
    };

    // 전체 이메일 주소 가져오기 헬퍼 함수
    const getFullEmail = () => {
        return formState.emailDomain === 'custom' ? `${formState.emailLocal}@${formState.customEmailDomain}` : `${formState.emailLocal}@${formState.emailDomain}`;
    }

    //인증 코드 발송
    const sendVerificationCode = async()=>{
        if(!validation.email.isValid){
            showAlert("⚠️주의", "유효한 이메일을 입력해주세요.");
            return;
        }
        uiState.isEmailSendLoading = true;
        if(uiState.timer) clearInterval(uiState.timer);

        try{
            //서버에 인증번호 발송 요청
            const response = await sendAuthCode(getFullEmail());

            //서버 응답에서 TTL(초) 받기
            const ttlSeconds = response.data.ttl;

            uiState.verificationSent = true;
            startTimer(ttlSeconds);
            showAlert("✅안내", "인증번호가 발송되었습니다.");
        }catch(error){
            showAlert("🚫경고", "인증번호 발송에 실패하였습니다.");
            console.log(error);
        }finally{
            uiState.isEmailSendLoading = false;
        }
    };

    //인증번호 확인
    const verifyCode = async()=>{
        try{
            //서버에 인증 번호 확인 요청
            const response = await verifyAuthCode(getFullEmail(), formState.verificationCode);
            if(response) {
                validation.verificationCode.isValid = true;
                validation.verificationCode.message = "인증 성공";
                uiState.isEmailVerified = true;

                //타이머 정지
                if(uiState.timer){
                    clearInterval(uiState.timer);
                    uiState.timer = null;
                }
            }else{
                validation.verificationCode.isValid = false;
                validation.verificationCode.message = "인증번호가 일치하지 않습니다.";
                uiState.isEmailVerified = false;
            }
        }catch(error){
            console.log(error);
        }
    };

    /*-----------------------------------------------------------
        최종 가입 처리
    -----------------------------------------------------------*/
    const submitForm = async()=>{
        //최종 유효성 검사
        const isFormValid = Object.values(validation).every(v=>v.isValid) && uiState.isIdChecked && uiState.isEmailVerified;

        if(!isFormValid){
            showAlert("⚠️주의", "모든 정보를 올바르게 입력하고 필수 절차(중복확인, 이메일 인증)를 완료해주세요.")
            return;
        }

        try{
            //서버로 회원가입 요청
            const payload = {
                username: formState.id,
                password: formState.password,
                name: formState.name,
                email: getFullEmail(),
                phone: formState.phone
            };

            await signup(payload, 'user');
            router.push('/signup/complete');
        }catch(error){
            console.log(error);
            showAlert("🚫경고",`[${error.response.data.code}] 회원가입 실패 : ${error.response.data.message}`);
            console.log("회원가입 실패: ", error.response.data || error.message);
            router.push('/signup/fail');
        }
    };

</script>
<template>
  <div class="content-page">
    <!--Banner Start-->
    <div class="banner">
      <img src="/images/fantry_logo.png" />
    </div>
    <!--Banner End-->
    
    <!--Header Start-->
    <div class="header">
      <div class="header-term">
        <label>01</label>
        <label>약관 동의</label>
      </div>
      <label>></label>
      <div class="header-form active">
        <label>02</label>
        <label>회원 가입</label>
      </div>
      <label>></label>
      <div class="header-done">
        <label>03</label>
        <label>가입 완료</label>
      </div>
    </div>
    <!--Header End-->

    <!-- 안내문 -->
    <h1>회원가입</h1>
    <h4>회원이 되어 다양한 서비스를 경험해보세요!</h4>

    <!--Content Start-->
    <div class="input-wrapper">
        <!--정보 입력 부분-->
        <form @submit.prevent="submitForm">
            <label>아이디</label>
            <div>
                <input type="text" placeholder="아이디 입력(6~20자)" v-model="formState.id"/>
                <button type="button" @click="checkIdDuplicate">중복확인</button>
            </div>
            <label class="input-error" v-if="!uiState.isIdChecked && !validation.id.isValid">{{ validation.id.message }}</label>
            <label class="input-success" v-if="uiState.isIdChecked && validation.id.isValid">{{ validation.id.message }}</label> 
            <label class="input-error" v-if="!uiState.isIdChecked && validation.id.isValid && formState.id.length > 0">중복확인이 필요합니다.</label>
            
            <label>비밀번호</label>
            <input type="password" placeholder="비밀번호 입력(대소문자, 숫자, 특수문자 포함 8자 이상)" v-model="formState.password"/>
            <label class="input-error" v-if="!validation.password.isValid">{{ validation.password.message }}</label>

            <label>비밀번호 확인</label>
            <input type="password" placeholder="비밀번호 재입력" v-model="formState.passwordConfirm"/>
            <label class="input-error" v-if="!validation.passwordConfirm.isValid">{{ validation.passwordConfirm.message }}</label>

            <label>이름</label>
            <input type="text" placeholder="이름을 입력해주세요" v-model="formState.name"/>

            <label>전화번호</label>
            <input type="text" maxlength="13" placeholder="휴대폰 번호 입력('-' 제외 11자리 입력)" v-model="formState.phone"/>
            <label class="input-error" v-if="!validation.phone.isValid">{{ validation.phone.message }}</label>

            <label>이메일 주소</label>
            <div class="email">
                <input type="text" placeholder="이메일 주소" v-model="formState.emailLocal" :disabled="uiState.isEmailVerified"/>
                <label>@</label>
                <select v-model="formState.emailDomain" :disabled="uiState.isEmailVerified" class="form-select">
                    <option value="">선택하세요</option>
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="daum.net">daum.net</option>
                    <option value="custom">직접입력</option>
                </select>
                <input 
                    v-if="formState.emailDomain === 'custom'" 
                    type="text" v-model="formState.customEmailDomain" 
                    placeholder="도메인 입력" class="form-control custom-domain-input" :disabled="uiState.isEmailVerified"/>
            </div>
            <label class="input-error" v-if="!validation.email.isValid">{{ validation.email.message }}</label>

            <button type="button" v-if="!uiState.verificationSent && !uiState.isEmailVerified" @click="sendVerificationCode" :disabled="!validation.email.isValid || uiState.isEmailSendLoading">
                {{ uiState.isEmailSendLoading ? '이메일 전송 중...' : '인증코드 발송' }}
            </button>
            <label class="input-error" v-if="!validation.verificationCode.isValid">{{ validation.verificationCode.message }}</label>
            <label class="input-success" v-if="validation.verificationCode.isValid">{{ validation.verificationCode.message }}</label>
            
            <div v-if="uiState.verificationSent && !uiState.isEmailVerified">
                <div>
                    <input type="text" placeholder="인증번호 6자리 입력" maxlength="6" v-model="formState.verificationCode" />
                    <button type="button" @click="verifyCode">확인</button>
                </div>

                <div class="verification-info">
                    <span>남은 시간: {{ uiState.remainingTime }}</span>
                    <a href="#" class="send-link" @click.prevent="sendVerificationCode">이메일이 오지 않을 경우 재전송</a>
                </div>
            </div>

            <!--버튼-->
            <div class="btn-wrapper">
                <button type="button" class="prev-btn" @click="goToPrev">이전</button>
                <button type="button" class="sign-btn" @click="submitForm">가입하기</button>
            </div>
        </form>
    </div>
    <!--Content End-->
  </div>
</template>
<style scoped>
    /* 기본 레이아웃 */
    .content-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Pretendard', sans-serif;
        background-color: #fff;
        min-height: 100vh;
        padding: 0;
        margin: 0;
    }

    /* 배너 */
    .banner {
        width: 100%;
        background-color: #f2f3fb;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 32px 0;
        border-radius: 0 0 12px 12px;
    }
    .banner img {
        height: 80px;
    }

    /* 헤더 (단계 표시) */
    .header {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 24px 0;
        font-size: 16px;
        font-weight: 500;
        gap: 16px;
    }
    .header div {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #999;
    }
    .header div label:first-child {
        font-weight: bold;
    }
    .header-form.active {
        color: #2f4dca;
        font-weight: bold;
    }

    /* 안내문 */
    .content-page h1 {
        font-size: 20px;
        margin-bottom: 8px;
        margin-top: 50px;
    }
    .content-page h4 {
        font-size: 14px;
        color: #555;
        font-weight: 400;
        margin-bottom: 24px;
    }

    /* 입력 폼 컨테이너 */
    .input-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 450px;
        gap: 16px;
        background-color: #ffffff;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }

    .input-wrapper label {
        font-size: 14px;
        font-weight: 500;
        color: #000;
        font-style: bold;
        margin-bottom: 4px;
    }

    /* 에러 메시지 */
    .input-wrapper .input-error {
        display: block;
        color: #dc3545;
        font-size: 12px;
        margin-top: 0px;
        margin-bottom: 8px;
        height: 18px;
    }

    /* 성공 메시지 */
    .input-wrapper .input-success {
        display: block;
        color: green;
        font-size: 12px;
        margin-top: 0px;
        margin-bottom: 8px;
        height: 18px;
    }

    /* 입력 창 */
    .input-wrapper input[type="text"],
    .input-wrapper input[type="password"],
    .input-wrapper select {
        width: 100%;
        padding: 14px 16px;
        border: 1px solid #ced4da;
        border-radius: 8px;
        font-size: 16px;
        box-sizing: border-box;
        transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .input-wrapper input[type="text"]:focus,
    .input-wrapper input[type="password"]:focus,
    .input-wrapper select:focus {
        outline: none;
        border-color: #2f4dca;
        box-shadow: 0 0 0 3px rgba(47, 77, 202, 0.2);
    }

    /* 아이디 중복 확인 버튼 */
    .input-wrapper button[type="button"] {
        width: 100%;
        padding: 14px 16px;
        background-color: #f8f9fa;
        color: #2f4dca;
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid #2f4dca;
        margin-top: 8px;
    }
    .input-wrapper button[type="button"]:hover {
        background-color: #2f4dca;
        color: white;
    }

    /* 이메일 주소 입력 */
    .email {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .email input[type="text"] {
        flex-grow: 1; /* 남은 공간 채우기 */
    }
    .email label {
        font-size: 18px;
        font-weight: bold;
        color: #343a40;
    }
    .email select {
        width: auto;
        padding: 14px 16px;
        border: 1px solid #ced4da;
        border-radius: 8px;
        font-size: 16px;
        background-color: #fff;
        cursor: pointer;
        flex-shrink: 0; /* 줄어들지 않도록 */
    }
    .email select:focus {
        border-color: #2f4dca;
        box-shadow: 0 0 0 3px rgba(47, 77, 202, 0.2);
    }

    /* 인증 코드 발송 버튼 */
    .input-wrapper > button {
        width: 100%;
        padding: 14px 16px;
        border: none;
        background-color: #2f4dca;
        color: white;
        font-size: 16px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 10px;
        transition: background-color 0.2s ease;
    }
    .input-wrapper > button:hover {
        background-color: #273a9a;
    }

    /* 인증 코드 입력 영역 */
    .input-wrapper > div > div {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 12px;
    }
    .input-wrapper > div > div .input-error {
        margin-top: -8px;
        margin-bottom: 4px;
    }
    .input-wrapper > div > div input[type="text"] {
        width: calc(100% - 110px);
        margin-right: 10px;
        display: inline-block;
        vertical-align: top;
    }
    .input-wrapper > div > div button[type="button"] {
        width: 100px;
        padding: 14px 16px;
        border: none;
        background-color: #6c757d;
        color: white;
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    .input-wrapper > div > div button[type="button"]:hover {
        background-color: #5a6268;
    }

    .verification-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        color: #6c757d;
        margin-top: 8px;
        margin-bottom: 10px;
    }
    .verification-info span {
        font-weight: 500;
    }
    .verification-info .send-link {
        color: #007bff;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
    }
    .verification-info .send-link:hover {
        color: #0056b3;
        text-decoration: underline;
    }

    /* 이전/가입하기 버튼 */
    .btn-wrapper {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        gap: 16px;
    }
    .btn-wrapper .prev-btn {
        flex-grow: 1;
        background-color: #e9ecef;
        color: #495057;
        border: 1px solid #ced4da;
    }
    .btn-wrapper .prev-btn:hover {
        background-color: #d3d9df;
    }

    .btn-wrapper .sign-btn {
        flex-grow: 1;
        color: white;
        font-weight: 700;
        border: none;
    }

    /* 버튼 공통 스타일 */
    .input-wrapper button[type="button"],
    .input-wrapper button {
        padding: 14px 16px;
        border: none;
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;
        text-align: center;
    }
</style>