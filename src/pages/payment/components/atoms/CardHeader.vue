<script setup></script>
<template>
  <div class="custom-header border-0 p-2">
    <h4 class="font-weight-semi-bold m-0"><slot></slot></h4>
  </div>
</template>
<style scoped>
.custom-header {
  height: 50px;
  align-content: center;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #333;
  border-radius: 12px 12px 0px 0px;
}
</style>
