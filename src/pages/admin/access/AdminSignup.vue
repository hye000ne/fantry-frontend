<script setup>
    import { reactive, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { sendAuthCode, signup, checkDuplicateUsername, verifyAuthCode } from '@/api/login';
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const { showAlert: showDialog } = useAlertDialog();
    const router = useRouter();

    // 이전 페이지로 이동 (관리자 로그인 페이지로 설정)
    const goToPrev = () => {
        router.push("/admin/login");
    }

    /*-----------------------------------------------------------
        바인드 변수 선언
    -----------------------------------------------------------*/
    // 폼 데이터
    const formState = reactive({
        id: '',
        password: '',
        passwordConfirm: '',
        name: '', // 관리자 이름 (실명)
        phone: '', // 관리자 연락처
        emailLocal: '', // 회사 내부 이메일 사용 가정
        emailDomain: 'fantry.co.kr', // 회사 도메인으로 기본 설정
        verificationCode: ''
    });

    // 유효성 검사 상태 (default: true)
    const validation = reactive({
        id: {isValid: true, message: ''},
        password: {isValid: true, message: ''},
        passwordConfirm: {isValid: true, message: ''},
        phone: {isValid: true, message: ''},
        email: {isValid: true, message: ''},
        verificationCode: {isValid: true, message: ''}
    });

    // UI 관련 상태
    const uiState = reactive({
        isIdChecked: false,
        isEmailVerified: false,
        verificationSent: false,
        remainingTime: '',
        timer: null,
        isEmailSendLoading: false,
    });

    /*-----------------------------------------------------------
        유효성 검사 함수 (기존 로직 유지)
    -----------------------------------------------------------*/
    // 아이디 유효성 검사
    const validateId = (id) => {
        const regex = /^[a-zA-Z0-9]{6,20}$/;
        validation.id.isValid = regex.test(id);
        validation.id.message = validation.id.isValid ? '' : '아이디는 6~20자의 영문, 숫자만 가능합니다.';
        uiState.isIdChecked = false; // 입력값이 변경되면 중복확인 상태 초기화
    }

    // 비밀번호 유효성 검사
    const validatePassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        validation.password.isValid = regex.test(password);
        validation.password.message = validation.password.isValid ? '' : '비밀번호는 대소문자, 숫자, 특수문자 포함 8자 이상입니다.';
    }
    const validatePasswordConfirm = (password, confirm) => {
        validation.passwordConfirm.isValid = password === confirm;
        validation.passwordConfirm.message = validation.passwordConfirm.isValid ? '' : '비밀번호가 일치하지 않습니다.';
    }

    // 전화번호 유효성 검사
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

        validation.phone.isValid = true;
        validation.phone.message = '';
    }

    // 이메일 유효성 검사
    const validateEmail = (local, domain) => {
        const fullEmail = `${local}@${domain}`;
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        validation.email.isValid = regex.test(fullEmail);
        validation.email.message = validation.email.isValid ? '' : '유효한 이메일 주소를 입력해주세요.';
        uiState.isEmailVerified = false;     // 이메일 변경 시 인증상태 초기화
    }

    /*-----------------------------------------------------------
        실시간 유효성 검사 (기존 로직 유지)
    -----------------------------------------------------------*/
    // 아이디 검사
    watch(()=> formState.id, (newVal)=>{
        validateId(newVal);
    });

    // 비밀번호 검사
    watch(()=> formState.password, (newVal)=>{
        validatePassword(newVal);
        validatePasswordConfirm(newVal, formState.passwordConfirm);
    });
    watch(()=> formState.passwordConfirm, (newVal)=>{
        validatePasswordConfirm(formState.password, newVal);
    });

    // 전화번호 검사
    watch(()=> formState.phone, (newVal)=>{
        // 자동 하이픈('-') 추가
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

    // 이메일 검사
    watch(()=>[formState.emailLocal, formState.emailDomain], ([local, domain])=>{
        validateEmail(local, domain);
    });

    // 아이디 중복 확인 (기존 로직 유지)
    const checkIdDuplicate = async()=>{
        if(!validation.id.isValid){
            showDialog("⚠️주의", "유효한 아이디를 입력해주세요.");
            return;
        }

        try{
            // 서버에 중복 확인 요청
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
            showDialog("🚫오류", "아이디 중복 확인 중 오류가 발생했습니다.");
            uiState.isIdChecked = false;
        }
    };

    /*-----------------------------------------------------------
        인증코드 발급 및 검사 (기존 로직 유지)
    -----------------------------------------------------------*/
    // 타이머 시작
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
                showDialog("🚫경고", "인증 시간이 만료되었습니다.");
            }
        }, 1000);
    };

    // 인증 코드 발송
    const sendVerificationCode = async()=>{
        if(!validation.email.isValid){
            showDialog("⚠️주의", "유효한 이메일을 입력해주세요.");
            return;
        }
        uiState.isEmailSendLoading = true;
        if(uiState.timer) clearInterval(uiState.timer);

        try{
            // 서버에 인증번호 발송 요청
            const response = await sendAuthCode(formState.emailLocal + '@' + formState.emailDomain);

            // 서버 응답에서 TTL(초) 받기
            const ttlSeconds = response.data.ttl;

            uiState.verificationSent = true;
            startTimer(ttlSeconds);
            showDialog("✅안내", "인증번호가 발송되었습니다.");
        }catch(error){
            showDialog("🚫오류", "인증번호 발송 중 오류가 발생했습니다.");
            console.log(error);
        }finally{
            uiState.isEmailSendLoading = false;
        }
    };

    // 인증번호 확인
    const verifyCode = async()=>{
        try{
            // 서버에 인증 번호 확인 요청
            const response = await verifyAuthCode(formState.emailLocal+"@"+formState.emailDomain, formState.verificationCode);
            if(response) {
                validation.verificationCode.isValid = true;
                validation.verificationCode.message = "인증 성공";
                uiState.isEmailVerified = true;

                // 타이머 정지
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
        최종 가입 처리 (ADMIN ROLE 추가)
    -----------------------------------------------------------*/
    const submitForm = async()=>{
        // 최종 유효성 검사
        const isFormValid = Object.values(validation).every(v=>v.isValid) && uiState.isIdChecked && uiState.isEmailVerified;

        if(!isFormValid){
            showDialog("⚠️주의", "모든 정보를 올바르게 입력하고 필수 절차(중복확인, 이메일 인증)를 완료해주세요.");
            return;
        }

        try{
            // 서버로 관리자 회원가입 요청
            const payload = {
                username: formState.id,
                password: formState.password,
                name: formState.name,
                email: formState.emailLocal + "@" + formState.emailDomain,
                phone: formState.phone
            };
            
            const response = await signup(payload, 'admin'); 
            console.log("관리자 회원가입 성공: ", response);

            // 관리자 가입 완료 페이지 또는 관리자 로그인 페이지로 리디렉션
            showDialog("✅안내", "관리자 계정이 성공적으로 등록되었습니다. 관리자 로그인 페이지로 이동합니다.");
            router.push('/admin/login');
        }catch(error){
            console.log(error);
            showDialog("🚫오류", error.response.data.code + ": "+ error.response.data.message);
            console.log("관리자 회원가입 실패: ", error.response.data || error.message);
            router.push('/admin/login');
        }
    };

</script>
<template>
    <div class="content-page">
        <!--Banner Start: 관리자 테마 적용-->
        <div class="banner">
            <img src="../../../../public/images/fantry_logo.png" />
        </div>
        <!--Banner End-->
        
        <!-- 안내문 -->
        <h1>관리자 계정 등록</h1>
        <h4>FANTRY 관리 시스템에 접근할 계정 정보를 등록합니다.</h4>

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
                <label class="input-error" v-if="!uiState.isIdChecked && validation.id.isValid && formState.id.length > 0">중복확인이 필요합니다.</label><br></br>
                
                <label>비밀번호</label>
                <input type="password" placeholder="비밀번호 입력(대소문자, 숫자, 특수문자 포함 8자 이상)" v-model="formState.password"/>
                <label class="input-error" v-if="!validation.password.isValid">{{ validation.password.message }}</label><br></br>

                <label>비밀번호 확인</label>
                <input type="password" placeholder="비밀번호 재입력" v-model="formState.passwordConfirm"/>
                <label class="input-error" v-if="!validation.passwordConfirm.isValid">{{ validation.passwordConfirm.message }}</label><br></br>

                <label>이름</label>
                <input type="text" placeholder="담당자 실명을 입력해주세요" v-model="formState.name"/>

                <label>전화번호</label>
                <input type="text" maxlength="13" placeholder="휴대폰 번호 입력('-' 제외 11자리 입력)" v-model="formState.phone"/>
                <label class="input-error" v-if="!validation.phone.isValid">{{ validation.phone.message }}</label>

                <label>회사 이메일 주소</label>
                <div class="email">
                    <input type="text" placeholder="이메일 주소" v-model="formState.emailLocal" :disabled="uiState.isEmailVerified"/>
                    <label>@</label>
                    <!-- 관리자이므로 도메인 선택지를 회사 도메인으로 한정하거나 제거할 수 있습니다. 여기서는 선택지 유지 -->
                    <select v-model="formState.emailDomain" :disabled="uiState.isEmailVerified">
                        <option value="">선택하세요</option>
                        <option value="fantry.co.kr">fantry.co.kr</option>
                        <option value="gmail.com">gmail.com</option>
                    </select>
                </div>
                <label class="input-error" v-if="!validation.email.isValid">{{ validation.email.message }}</label>

                <button type="button" v-if="!uiState.verificationSent && !uiState.isEmailVerified" @click="sendVerificationCode" :disabled="!validation.email.isValid || uiState.isEmailSendLoading">
                    {{ uiState.isEmailSendLoading ? '이메일 전송 중...' : '인증코드 발송' }}
                </button>
                <label class="input-error" v-if="!validation.verificationCode.isValid">{{ validation.verificationCode.message }}</label>
                <label class="input-success" v-if="validation.verificationCode.isValid">{{ validation.verificationCode.message }}</label>
                
                <div v-if="uiState.verificationSent && !uiState.isEmailVerified">
                    <div>
                        <!-- 인증코드 입력 칸과 확인 버튼을 flex-row로 배치 -->
                        <div class="code-input-group">
                            <input type="text" placeholder="인증번호 6자리 입력" maxlength="6" v-model="formState.verificationCode" class="code-input"/>
                            <button type="button" @click="verifyCode" class="code-verify-btn">확인</button>
                        </div>
                    </div>

                    <div class="verification-info">
                        <span>남은 시간: {{ uiState.remainingTime }}</span>
                        <a href="#" class="send-link" @click.prevent="sendVerificationCode">이메일이 오지 않을 경우 재전송</a>
                    </div>
                </div>

                <!--버튼-->
                <div class="btn-wrapper">
                    <button type="button" class="prev-btn" @click="goToPrev">이전 (로그인)</button>
                    <button type="button" class="sign-btn" @click="submitForm">계정 등록</button>
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
        background-color: #f7f7f7; /* 배경색 변경 */
        min-height: 100vh;
        padding: 0;
        margin: 0;
    }

    /* 배너 (관리자 테마: admin_login.vue의 다크 블루 계열) */
    .banner {
        width: 100%;
        /* admin_login.vue의 그라데이션 색상 사용 */
        background: linear-gradient(52deg, rgba(30, 50, 100, 1) 0%, rgba(50, 80, 150, 1) 50%, rgba(100, 150, 250, 1) 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 32px 0;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .banner img {
        height: 80px;
        filter: brightness(1.2); /* 밝게 조정 */
    }

    /* Header (단계 표시) 제거 - 관리자 가입은 단일 페이지로 */
    .header {
        display: none; /* 단계 표시 숨김 */
    }

    /* 안내문 */
    .content-page h1 {
        font-size: 24px;
        margin-bottom: 8px;
        margin-top: 50px;
        color: #1e3264; /* 관리자 테마 색상 */
        font-weight: 700;
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
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        margin-bottom: 50px;
    }

    .input-wrapper label {
        font-size: 14px;
        font-weight: 600; /* 조금 더 강조 */
        color: #333;
        margin-bottom: 4px;
    }

    /* 에러 메시지 */
    .input-wrapper .input-error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 0px;
        margin-bottom: 8px;
        height: 18px;
    }

    /* 성공 메시지 */
    .input-wrapper .input-success {
        color: #28a745;
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
        border-color: #1e3264; /* 관리자 테마 포커스 색상 */
        box-shadow: 0 0 0 3px rgba(30, 50, 100, 0.2);
    }

    /* 아이디 중복 확인 버튼 그룹 */
    .input-wrapper form > div:first-of-type {
        display: flex;
        gap: 10px;
    }
    .input-wrapper form > div:first-of-type input {
        flex-grow: 1;
        width: auto; /* flex 때문에 width: 100% 무시 */
    }
    .input-wrapper form > div:first-of-type button {
        flex-shrink: 0;
        width: 120px;
        padding: 0 16px; /* 높이는 input과 맞추기 위해 0으로 설정, 내부 버튼 스타일이 높이를 조정 */
        margin-top: 0;
    }

    /* 공통 버튼 스타일 (중복확인, 인증코드 발송/확인 버튼) */
    .input-wrapper button[type="button"] {
        padding: 14px 16px;
        background-color: #f8f9fa;
        color: #1e3264; /* 관리자 테마 색상 */
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid #1e3264;
        transition: background-color 0.2s ease, color 0.2s ease;
    }
    .input-wrapper button[type="button"]:hover:not(:disabled) {
        background-color: #1e3264;
        color: white;
    }
    .input-wrapper button[type="button"]:disabled {
        background-color: #ccc;
        border-color: #aaa;
        color: #777;
        cursor: not-allowed;
    }


    /* 이메일 주소 입력 */
    .email {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .email input[type="text"] {
        flex-grow: 1;
    }
    .email label {
        font-size: 18px;
        font-weight: bold;
        color: #343a40;
    }
    .email select {
        width: 150px;
        flex-shrink: 0;
    }

    /* 인증 코드 발송 버튼 (form 바로 아래에 있는 버튼) */
    .input-wrapper form > button:not(.btn-wrapper button) {
        width: 100%;
        padding: 14px 16px;
        border: none;
        background-color: #1e3264; /* 관리자 테마 메인 색상 */
        color: white;
        font-size: 16px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 10px;
    }
    .input-wrapper form > button:not(.btn-wrapper button):hover:not(:disabled) {
        background-color: #325096;
    }

    /* 인증 코드 입력 영역 */
    .code-input-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .code-input {
        flex-grow: 1;
    }
    .code-verify-btn {
        flex-shrink: 0;
        width: 120px;
        margin-top: 0 !important; /* 위쪽 버튼 마진 덮어쓰기 */
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
        color: #325096; /* 관리자 테마 링크 색상 */
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
    }
    .verification-info .send-link:hover {
        color: #1e3264;
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
        color: #333;
    }

    .btn-wrapper .sign-btn {
        flex-grow: 1;
        color: white;
        font-weight: 700;
        border: none;
        background-color: #1e3264; /* 관리자 테마 메인 색상 */
    }
    .btn-wrapper .sign-btn:hover {
        background-color: #325096;
    }

    /* 버튼 공통 스타일 (폼 안의 모든 버튼에 적용) */
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
