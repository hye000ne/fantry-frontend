<script setup>
import { onMounted } from 'vue'
import SearchBar from '../molecules/SearchBar.vue'
import NavigationBar from '../molecules/NavigationBar.vue'
import BrandLogo from '../atoms/BrandLogo.vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useModal } from '@/composables/useModal'

const router = useRouter()
const userStore = useUserStore()

// 검수 기준 확인 모달을 위한 로직 추가
const { initModal: initPolicyModal, show: showPolicyModal, hide: hidePolicyModal } = useModal('#policyCheckModal')

onMounted(() => {
  initPolicyModal()
})

// 판매하기 페이지 이동
const goToInspection = () => {
  hidePolicyModal()
  router.push('/inspection/step1')
}

// 검수기준 페이지 이동
const goToPolicy = () => {
  hidePolicyModal()
  router.push('/inspection/policy')
}
</script>
<template>
  <div class="container-fluid">
    <div class="row align-items-center py-3 px-xl-5 header-main-section">
      <div class="col-lg-auto d-none d-lg-block">
        <BrandLogo />
      </div>
      <div class="col-lg col-6 text-left">
        <slot name="searchBar"></slot>
      </div>
      <div class="col-lg-auto col-6 text-right">
        <template v-if="userStore.isLoggedIn">
          <a href="#" class="btn border" @click.prevent="showPolicyModal" style="margin-right: 0.5rem">
            <i class="fas fa-tags text-primary"></i>
            <span class="badge">판매하기</span>
          </a>
        </template>        
      </div>
    </div>
  </div>
  <div class="container-fluid mb-5 main-nav-wrapper">
    <div class="row main-nav-bar px-xl-5">
      <div class="col-lg-12">
        <NavigationBar />
      </div>
    </div>
  </div>

  <div class="modal fade" id="policyCheckModal" tabindex="-1" aria-labelledby="policyCheckModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="policyCheckModalLabel">검수 기준 확인</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        </div>
        <div class="modal-body">
          <p>정확하고 원활한 검수 진행을 위해, Fantry의 검수 기준을 먼저 확인해주세요.</p>
          <p class="text-muted small">검수 기준에 동의하지 않으실 경우, 검수 신청이 반려될 수 있습니다.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" @click="goToPolicy">검수 기준 보기</button>
          <button type="button" class="btn btn-primary" data-dismiss="modal" @click="goToInspection">신청 계속하기</button>
        </div>
      </div>
    </div>
  </div>
</template>
