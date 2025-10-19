<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAlertDialog } from '@/composables/useAlertDialog';

  const { showAlert } = useAlertDialog();
  const router = useRouter();

  //필수 체크박스 상태
  const terms1 = ref(false);
  const terms2 = ref(false);
  const terms3 = ref(false);
  const terms4 = ref(false);

  //선택 체크박스 상태
  const terms5 = ref(false);

  //전체 동의
  const termsAll = ref(false);

  //전체 동의 체크 시, 개별 체크박스 모두 토글
  const toggleAllTerms=()=>{
    const value = termsAll.value;
    terms1.value = value;
    terms2.value = value;
    terms3.value = value;
    terms4.value = value;
    terms5.value = value;
  }
  const nextSign=()=>{
    if (terms1.value && terms2.value && terms3.value && terms4.value) {
      router.push('/signup/form');
    } else {
      showAlert("⚠️주의", "필수 약관에 모두 동의해주세요.");
    }
  }
</script>

<template>
  <div class="content-page">
    <!--Banner Start-->
    <div class="banner">
      <img src="../../../../public/images/fantry_logo.png" />
    </div>
    <!--Banner End-->
    
    <!--Header Start-->
    <div class="header">
      <div class="header-term active">
        <label>01</label>
        <label>약관 동의</label>
      </div>
      <label>></label>
      <div class="header-form">
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
    <h1>회원가입 약관</h1>
    <h4>FANTRY 서비스 이용을 위해 아래 이용약관 및 정보 이용에 동의해주세요.</h4>

    <!--Content Start-->
    <div class="content">
      <!-- 전체 동의 -->
      <div class="terms-row">
        <h2>전체 동의</h2>
        <input type="checkbox" id="terms-all" v-model="termsAll" @change="toggleAllTerms"/>
      </div>

      <!-- 개별 약관 -->
      <div class="terms-row">
        <label>서비스 이용 약관 동의(필수)</label>
        <div class="actions">
          <button type="button" class="view-btn">전문보기</button>
          <input type="checkbox" id="terms1" v-model="terms1"/>
        </div>
      </div>

      <div class="terms-row">
        <label>개인(신용)정보 수집 및 이용 동의(필수)</label>
        <div class="actions">
          <button type="button" class="view-btn">전문보기</button>
          <input type="checkbox" id="terms2" v-model="terms2"/>
        </div>
      </div>

      <div class="terms-row">
        <label>전자상거래 중개자로서의 책임 고지(필수)</label>
        <div class="actions">
          <button type="button" class="view-btn">전문보기</button>
          <input type="checkbox" id="terms3" v-model="terms3"/>
        </div>
      </div>

      <div class="terms-row">
        <label>개인정보 취급 위탁 동의(필수)</label>
        <div class="actions">
          <button type="button" class="view-btn">전문보기</button>
          <input type="checkbox" id="terms4" v-model="terms4"/>
        </div>
      </div>

      <div class="terms-row">
        <label>마케팅 정보 수신 동의(선택)</label>
        <div class="actions">
          <button type="button" class="view-btn">전문보기</button>
          <input type="checkbox" id="terms5" v-model="terms5"/>
        </div>
      </div>

      <!-- 다음 버튼 -->
      <button type="button" class="next-btn" @click="nextSign">다음</button>
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
  .header-term.active {
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

  /* 약관 박스 */
  .content {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 12px;
    width: 90%;
    max-width: 480px;
    padding: 24px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }
  .terms-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
  }
  .terms-row:last-child {
    border-bottom: none;
  }
  .content h2 {
    font-size: 16px;
    font-weight: bold;
  }

  /* 오른쪽 영역 (전문보기 버튼 + 체크박스) */
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 체크박스 */
  .content input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #2f4dca;
    cursor: pointer;
  }

  /* 전문보기 버튼 */
  .view-btn {
    padding: 4px 10px;
    font-size: 12px;
    border: 1px solid #aaa;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }
  .view-btn:hover {
    background: #f4f4f4;
  }

  /* 다음 버튼 */
  .next-btn {
    margin-top: 32px;
    width: 100%;
    padding: 14px 0;
    border: none;
    border-radius: 8px;
    background-color: #5c7cff;
    color: #fff;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  }
  .next-btn:hover {
    background-color: #4b68d1;
  }
</style>