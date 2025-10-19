<script setup>
import BrandLogo from '../atoms/BrandLogo.vue'
import FooterQuickLink from '../molecules/FooterQuickLink.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="container-fluid app-footer text-dark pt-3">
    <div class="row px-xl-5 pt-3">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-3 col-md-6 mb-4 company-info">
            <h5 class="font-weight-bold text-dark mb-2">(주)팬트리</h5>
            <p>대표: OOO | 개인정보보호책임자: OOO</p>
            <p>사업자등록번호: 000-00-00000 | 통신판매업신고: 제0000-서울강남-00000호</p>
            <p>사업장 주소: 서울특별시 삼성로 000</p>
            <div class="social-links mt-3">
              <a href="#" class="btn btn-outline-primary btn-social mr-2"><i class="fab fa-twitter"></i></a>
              <a href="#" class="btn btn-outline-primary btn-social mr-2"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="btn btn-outline-primary btn-social"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
          <div class="col-lg-3 col-md-6 mb-4">
            <h5 class="font-weight-bold text-dark mb-2">고객 센터</h5>
            <div class="d-flex flex-column justify-content-start">
              <FooterQuickLink text="공지사항" @click="router.push('/cs/notice')" />
              <FooterQuickLink text="자주 묻는 질문" @click="router.push('/cs/faq')" />
              <FooterQuickLink text="문의" @click="router.push('/cs/inquiry-write')" />
              <p class="mb-2"><i class="fa fa-envelope text-primary mr-3"></i>support@fantry.co.kr</p>
              <p class="mb-0"><i class="fa fa-phone-alt text-primary mr-3"></i>02-1234-5678</p>
              <p class="text-dark mt-2 mb-0 small">운영시간: 평일 10:00 - 18:00</p>
              <p class="text-dark small">(주말, 공휴일 제외)</p>
            </div>
          </div>
          <div class="col-lg-3 col-md-6 mb-4">
            <h5 class="font-weight-bold text-dark mb-2">이용 안내</h5>
            <div class="d-flex flex-column justify-content-start">
              <FooterQuickLink text="경매 이용 방법" @click="router.push('/product/auction-policy')" />
              <FooterQuickLink text="검수 기준 안내" @click="router.push('/inspection/policy')" />
              <FooterQuickLink text="이용약관" @click="router.push('/policies/terms')" />
              <FooterQuickLink text="개인정보처리방침" @click="router.push('/policies/privacy')" />
            </div>
          </div>
          <div class="col-lg-3 col-md-6 mb-4 text-right">
            <BrandLogo />
          </div>
        </div>
      </div>
    </div>
    <div class="row footer-bottom-bar mx-xl-5 py-2">
      <div class="col-md-6 px-xl-0">
        <p class="mb-md-0 text-center text-md-left text-dark">
          &copy; <a class="text-dark font-weight-semi-bold" href="#">Fantry Corp.</a> All Rights Reserved.
        </p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.app-footer {
  background: #ffffff;
  border-top: 1px solid #e5e7ea;
}
.app-footer p, .app-footer a {
  color: #343a40; /* 다크 계열로 가독성 확보 */
  font-size: 0.85rem; /* Reduced font size */
}
.app-footer a:hover {
  color: #D19C97; /* Primary color */
}
.footer-bottom-bar {
  border-top: 1px solid #eceff2;
}
</style>