<script setup>
import { router } from '@/router/index.js';
import NavigationItem from '../atoms/NavigationItem.vue'
import NavigationDropdownButton from '../atoms/NavigationDropdownButton.vue'

//상품 목록 페이지로 이동 (그룹 타입 필터링 포함)
const goToProductList = (groupType) => {
  router.push({ path: '/product', query: { groupType: groupType } });
}

</script>

<template>
  <nav class="navbar navbar-expand-lg bg-light navbar-light py-2 py-lg-0 px-0">
    <a href="" class="text-decoration-none d-block d-lg-none">
      <h1 class="m-0 display-5 font-weight-semi-bold">
        <span class="text-primary font-weight-bold border px-3 mr-1">E</span>Shopper
      </h1>
    </a>
    <button
      type="button"
      class="navbar-toggler"
      data-toggle="collapse"
      data-target="#navbarCollapse"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse justify-content-between" id="navbarCollapse">
      <div class="navbar-nav mr-auto py-0">
        <NavigationItem @click="goToProductList('ALL')">전체</NavigationItem>
        <NavigationItem @click="goToProductList('MALE_GROUP')">남자 그룹</NavigationItem>
        <NavigationItem @click="goToProductList('FEMALE_GROUP')">여자 그룹</NavigationItem>
        <NavigationItem @click="goToProductList('MALE_SOLO')">남자 솔로</NavigationItem>
        <NavigationItem @click="goToProductList('FEMALE_SOLO')">여자 솔로</NavigationItem>
        <NavigationItem @click="goToProductList('MIXED')">혼성 그룹</NavigationItem>
        <NavigationItem @click="goToProductList('OTHER')">기타</NavigationItem>
      </div>
    </div>
  </nav>
</template>
