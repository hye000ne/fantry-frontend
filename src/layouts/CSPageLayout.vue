<template>
  <div class="container-fluid my-5">
    <div class="row px-xl-5">
      <div class="col-lg-3 col-md-4">
        <h1 class="mb-5 font-weight-bold">고객센터</h1>
        <nav class="nav flex-column cs-nav">
          <router-link to="/cs/notice" class="nav-link">공지사항</router-link>
          <router-link to="/cs/faq" class="nav-link">자주 묻는 질문</router-link>
          <router-link to="/cs/inquiry-write" class="nav-link">문의하기</router-link>
          <router-link to="/cs/inquiry-list" class="nav-link">나의 문의내역</router-link>
        </nav>
      </div>
      <div class="col-lg-9 col-md-8">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
// No script needed
</script>

<style scoped>
.cs-nav .nav-link {
  color: #6c757d; /* Lighter text for inactive links */
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem; /* Add space between links */
}

.cs-nav .nav-link:hover {
  background-color: #f8f9fa; /* Subtle hover effect */
  color: #212529;
}

.cs-nav .nav-link.router-link-active,
.cs-nav .nav-link.router-link-exact-active {
  background-color: #007bff; /* Prominent background for active link */
  color: #fff; /* White text for active link */
  font-weight: 600;
}
</style>