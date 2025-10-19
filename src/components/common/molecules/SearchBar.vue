<script setup>
import SearchButton from '../atoms/SearchButton.vue'

const props = defineProps({
  onSearch: {
    type: Function,
    default: () => (value) => {},
  },
})

const modelValue = defineModel({
  type: String,
  default: '',
})

const onSearch = () => {
  props.onSearch(modelValue.value)
}
</script>
<template>
  <div class="input-group">
    <input
      type="text"
      class="form-control"
      placeholder="(카테고리, 그룹명, 이름)"
      v-model="modelValue"
      v-bind="$attrs"
      @keyup.enter="onSearch"
    />
    <SearchButton @click="onSearch" />
  </div>
</template>
