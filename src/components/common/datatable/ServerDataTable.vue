<script setup>
/**
 * ServerDataTable.vue
 * - 서버 사이드 페이징/정렬/검색 패턴 캡슐화
 * - fetcher(params) => { rows, total } 형태를 기대
 */
import { ref, watch, computed, onMounted } from 'vue';
import BaseDataTable from './BaseDataTable.vue';

const props = defineProps({
  columns: { type: Array, required: true },
  fetcher: { type: Function, required: true },
  pageSize: { type: Number, default: 10 },
  initialPage: { type: Number, default: 1 },
  /** 초간단 검색어 (단일) */
  keyword: { type: String, default: '' }
});
const emit = defineEmits(['loaded','error','update:keyword']);

const page = ref(props.initialPage);
const total = ref(0);
const rows = ref([]);
const loading = ref(false);
const sort = ref({ column: null, dir: null });

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / props.pageSize)));

async function load() {
  try {
    loading.value = true;
    const { rows: r, total: t } = await props.fetcher({
      page: page.value,
      size: props.pageSize,
      sort: sort.value.column ? `${sort.value.column},${sort.value.dir}` : undefined,
      keyword: props.keyword || undefined
    });
    rows.value = r;
    total.value = t;
    emit('loaded', { rows: r, total: t });
  } catch (e) {
    emit('error', e);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([page, () => props.keyword, sort], load);

function setSort(col) {
  if (sort.value.column !== col) {
    sort.value = { column: col, dir: 'asc' };
  } else {
    sort.value.dir = sort.value.dir === 'asc' ? 'desc' : 'asc';
  }
}

defineExpose({ load });

const decoratedColumns = computed(() => props.columns.map(c => ({
  ...c,
  title: c.sortable ? `${c.title || c.data} ${sortIndicator(c)}` : (c.title || c.data),
  createdCell: (td, cellData, rowData, row, colIndex) => {
    if (c.sortable && td && !td.dataset.sortBound) {
      td.style.cursor = 'pointer';
      td.addEventListener('click', () => setSort(c.data));
      td.dataset.sortBound = '1';
    }
  }
})));

function sortIndicator(col) {
  if (sort.value.column !== col.data) return '';
  return sort.value.dir === 'asc' ? '▲' : '▼';
}
</script>

<template>
  <div class="server-datatable">
    <div class="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
      <div class="small text-muted">총 {{ total.toLocaleString() }}건</div>
      <div class="d-flex align-items-center gap-2">
        <slot name="actions" />
        <input
          v-if="$slots.search || true"
          type="text"
          class="form-control form-control-sm"
          style="width:200px"
          :value="keyword"
          placeholder="검색어"
          id="datatable-search-input"
          name="datatable-search-input"
          aria-label="테이블 검색"
          @input="$emit('update:keyword', $event.target.value)" />
      </div>
    </div>
    <BaseDataTable
      :columns="decoratedColumns"
      :data="rows"
      :loading="loading"
      bare
      @loaded="$emit('loaded',$event)"
      @error="$emit('error',$event)"
    >
      <template #loading><slot name="loading">로딩중...</slot></template>
      <template #empty><slot name="empty">데이터가 없습니다.</slot></template>
      <template #error="p"><slot name="error" v-bind="p">에러</slot></template>
      <slot v-for="(_, name) in $slots" v-if="name.startsWith('cell-')" :name="name" />
    </BaseDataTable>

    <nav class="mt-3" aria-label="Page navigation" v-if="totalPages > 1">
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="page>1 && (page--)">이전</button>
        </li>
        <li class="page-item" v-for="p in totalPages" :key="p" :class="{ active: p===page }">
          <button class="page-link" @click="page = p">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === totalPages }">
          <button class="page-link" @click="page<totalPages && (page++)">다음</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.server-datatable { width:100%; }
.pagination .page-link { cursor:pointer; }
</style>
