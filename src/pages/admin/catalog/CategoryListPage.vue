<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import BaseDataTable from '@/components/common/datatable/BaseDataTable.vue'
import { getGoodsCategories, createGoodsCategory, updateGoodsCategory, deleteGoodsCategory } from '@/api/catalog'
import { useModal } from '@/composables/useModal'
import { useAlertDialog } from '@/composables/useAlertDialog.js'

const { showAlert } = useAlertDialog()

// --- 상태 관리 ---
const keyword = ref('')
const loading = ref(false)
const allCategories = ref([])
const pageRef = ref(null)

// --- 모달 관련 ---
const isEditMode = ref(false)
const selectedCategory = ref({ GoodsCategoryId: null, code: '', name: '' })
const { initModal, show, hide } = useModal('#categoryModal')

// --- 유효성 검증 상태 ---
const validation = ref({
  code: { isValid: true, message: '' },
  name: { isValid: true, message: '' },
})

// --- 유틸리티 함수 ---
const parseJavaLocalDateTime = (dt) => {
  if (!dt || !Array.isArray(dt) || dt.length < 5) return '-'
  const [year, month, day, hour, minute] = dt
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

watch(
  selectedCategory,
  (newVal) => {
    // 코드 유효성 검사 (영문 대문자와 _ 만 허용)
    const codeRegex = /^[A-Z_]*$/
    if (newVal.code && !codeRegex.test(newVal.code)) {
      validation.value.code.isValid = false
      validation.value.code.message = '코드에는 영문 대문자와 언더스코어(_)만 입력할 수 있습니다.'
    } else {
      validation.value.code.isValid = true
      validation.value.code.message = ''
    }

    // 이름 유효성 검사 (한글, 영문, 숫자, 공백 허용)
    const nameRegex = /^[a-zA-Z0-9가-힣\s]*$/
    if (newVal.name && !nameRegex.test(newVal.name)) {
      validation.value.name.isValid = false
      validation.value.name.message = '이름에는 한글, 영문, 숫자, 공백만 입력할 수 있습니다.'
    } else {
      validation.value.name.isValid = true
      validation.value.name.message = ''
    }
  },
  { deep: true },
)

// --- 데이터 로딩 ---
const loadCategories = async () => {
  loading.value = true
  try {
    allCategories.value = await getGoodsCategories()
  } catch (e) {
    showAlert('오류', e.message || '카테고리 목록 조회에 실패했습니다.')
    allCategories.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initModal()
  loadCategories()

  // 테이블 내 버튼 클릭에 대한 이벤트 위임 설정
  nextTick(() => {
    if (pageRef.value) {
      pageRef.value.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-id]')
        if (!button) return

        const id = parseInt(button.dataset.id, 10)
        const category = allCategories.value.find((c) => c.GoodsCategoryId === id)
        if (!category) return

        if (button.classList.contains('btn-edit')) {
          openEditModal(category)
        } else if (button.classList.contains('btn-delete')) {
          handleDelete(category)
        }
      })
    }
  })
})

// --- 검색 기능 ---
const filteredCategories = computed(() => {
  if (!keyword.value) {
    return allCategories.value
  }
  const lowerKeyword = keyword.value.toLowerCase()
  return allCategories.value.filter((cat) => cat.name.toLowerCase().includes(lowerKeyword) || cat.code.toLowerCase().includes(lowerKeyword))
})

const openAddModal = () => {
  isEditMode.value = false
  selectedCategory.value = { GoodsCategoryId: null, code: '', name: '' }
  validation.value = { code: { isValid: true, message: '' }, name: { isValid: true, message: '' } }
  show()
}

const openEditModal = (category) => {
  isEditMode.value = true
  selectedCategory.value = { ...category }
  validation.value = { code: { isValid: true, message: '' }, name: { isValid: true, message: '' } }
  show()
}

const handleDelete = async (category) => {
  if (!confirm(`'${category.name}' 카테고리를 정말 삭제하시겠습니까?`)) return

  try {
    await deleteGoodsCategory(category.GoodsCategoryId)
    showAlert('알림', `'${category.name}' 카테고리가 삭제되었습니다.`)
    await loadCategories()
  } catch (e) {
    showAlert('오류', e.message || '삭제 처리 중 오류가 발생했습니다.')
  }
}

const saveCategory = async () => {
  // 저장 전 유효성 검사
  if (!validation.value.code.isValid || !validation.value.name.isValid) {
    showAlert('알림', '입력 값을 확인해주세요.')
    return
  }
  if (!selectedCategory.value.name || !selectedCategory.value.code) {
    showAlert('알림', '코드와 이름을 모두 입력해주세요.')
    return
  }

  try {
    const payload = {
      code: selectedCategory.value.code.toUpperCase(), // 대문자로 변환
      name: selectedCategory.value.name,
    }
    if (isEditMode.value) {
      await updateGoodsCategory(selectedCategory.value.GoodsCategoryId, payload)
      showAlert('알림', `'${payload.name}' 카테고리가 수정되었습니다.`)
    } else {
      await createGoodsCategory(payload)
      showAlert('알림', `'${payload.name}' 카테고리가 추가되었습니다.`)
    }
    hide()
    await loadCategories()
  } catch (e) {
    showAlert('오류', e.message || '저장 처리 중 오류가 발생했습니다.')
  }
}

// --- 테이블 컬럼 및 옵션 ---
const columns = [
  { data: 'GoodsCategoryId', title: 'ID', className: 'text-center' },
  { data: 'code', title: '코드', className: 'text-center' },
  { data: 'name', title: '이름', className: 'text-center' },
  { data: 'createdAt', title: '등록일', className: 'text-center', render: (data) => parseJavaLocalDateTime(data) },
  { data: 'updatedAt', title: '수정일', className: 'text-center', render: (data) => parseJavaLocalDateTime(data) },
  {
    data: null,
    title: '관리',
    sortable: false,
    className: 'text-center',
    render: (data, type, row) => `
        <button class="btn btn-sm btn-outline-primary px-2 btn-edit" data-id="${row.GoodsCategoryId}">수정</button>
        <button class="btn btn-sm btn-outline-danger px-2 ml-2 btn-delete" data-id="${row.GoodsCategoryId}">삭제</button>
      `,
  },
]

// 페이지당 10개 고정, 'entries per page' 드롭다운 숨기기
const tableOptions = {
  pageLength: 10,
  lengthChange: false,
  order: [[0, 'desc']],
}
</script>
<template>
  <main class="container-fluid p-4" ref="pageRef">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="fw-semibold text-dark mb-1">카테고리 관리</h4>
            <p class="text-muted small">상품 분류에 사용될 카테고리를 관리합니다.</p>
          </div>
          <button class="btn btn-primary" @click="openAddModal"><i class="fas fa-plus fa-sm"></i> 추가</button>
        </div>
      </div>

      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="small text-muted">총 {{ filteredCategories.length }}건</div>
          <input type="text" class="form-control form-control-sm" style="width: 250px" v-model="keyword" placeholder="코드 또는 이름으로 검색" />
        </div>

        <BaseDataTable :columns="columns" :data="filteredCategories" :loading="loading" :options="tableOptions">
          <template #empty> 등록된 카테고리가 없습니다. </template>
        </BaseDataTable>
      </div>
    </div>

    <div class="modal fade" id="categoryModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? '카테고리 수정' : '카테고리 추가' }}</h5>
            <button type="button" class="close" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCategory">
              <div class="form-group">
                <label for="categoryCode">코드 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="categoryCode" v-model="selectedCategory.code" @input="selectedCategory.code = selectedCategory.code.toUpperCase()" required />
                <small v-if="!validation.code.isValid" class="text-danger">{{ validation.code.message }}</small>
              </div>
              <div class="form-group">
                <label for="categoryName">이름 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="categoryName" v-model="selectedCategory.name" required />
                <small v-if="!validation.name.isValid" class="text-danger">{{ validation.name.message }}</small>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">취소</button>
            <button type="button" class="btn btn-primary" @click="saveCategory">저장</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.card-header h4 {
  font-size: 1.25rem;
}

:deep(.datatable-wrapper) {
  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #333;
    text-align: center !important;
    vertical-align: middle;
  }
  td {
    vertical-align: middle !important;
    padding: 0.9rem 0.75rem;
  }
  tr:hover td {
    background-color: #f8f9fa;
  }
}
</style>
