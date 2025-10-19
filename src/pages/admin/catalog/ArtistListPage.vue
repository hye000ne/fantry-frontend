<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import BaseDataTable from '@/components/common/datatable/BaseDataTable.vue'
import { getArtists, createArtist, updateArtist, deleteArtist } from '@/api/catalog'
import { useModal } from '@/composables/useModal'
import { useAlertDialog } from '@/composables/useAlertDialog.js'

const { showAlert } = useAlertDialog()

// --- 상태 관리 ---
const keyword = ref('')
const loading = ref(false)
const allArtists = ref([])
const pageRef = ref(null)

// --- 모달 관련 ---
const isEditMode = ref(false)
const selectedArtist = ref({
  artistId: null,
  nameKo: '',
  nameEn: '',
  groupType: '',
})
const { initModal, show, hide } = useModal('#artistModal')

// --- 유효성 검증 상태 ---
const validation = ref({
  nameKo: { isValid: true, message: '' },
  nameEn: { isValid: true, message: '' },
})

// --- 테이블 컬럼 및 옵션 ---
const groupTypes = [
  { value: 'MALE_GROUP', text: '남자 그룹' },
  { value: 'FEMALE_GROUP', text: '여자 그룹' },
  { value: 'MALE_SOLO', text: '남자 솔로' },
  { value: 'FEMALE_SOLO', text: '여자 솔로' },
  { value: 'MIXED', text: '혼성 그룹' },
  { value: 'OTHER', text: '기타' },
]

// --- 실시간 유효성 검사 ---
watch(
  selectedArtist,
  (newVal) => {
    // 한글명 유효성 검사 (한글과 공백만 허용)
    const koreanRegex = /^[가-힣\s]*$/
    if (newVal.nameKo && !koreanRegex.test(newVal.nameKo)) {
      validation.value.nameKo.isValid = false
      validation.value.nameKo.message = '한글명에는 한글과 공백만 입력할 수 있습니다.'
    } else {
      validation.value.nameKo.isValid = true
      validation.value.nameKo.message = ''
    }

    // 영문명 유효성 검사 (영문과 공백만 허용)
    const englishRegex = /^[a-zA-Z\s]*$/
    if (newVal.nameEn && !englishRegex.test(newVal.nameEn)) {
      validation.value.nameEn.isValid = false
      validation.value.nameEn.message = '영문명에는 영문과 공백만 입력할 수 있습니다.'
    } else {
      validation.value.nameEn.isValid = true
      validation.value.nameEn.message = ''
    }
  },
  { deep: true },
)

// --- 유틸리티 함수 ---
const formatDateTime = (dt) => {
  if (!dt || !Array.isArray(dt) || dt.length < 5) return '-'
  const [year, month, day, hour, minute] = dt
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const getGroupTypeText = (value) => {
  const type = groupTypes.find((t) => t.value === value)
  return type ? type.text : value
}

// --- 데이터 로딩 ---
const loadArtists = async () => {
  loading.value = true
  try {
    allArtists.value = await getArtists()
    console.log('Artists loaded:', allArtists.value)
  } catch (e) {
    showAlert(e.message || '아티스트 목록 조회에 실패했습니다.')
    allArtists.value = []
  } finally {
    loading.value = false
  }
}

// --- 모달 및 CRUD 핸들러 ---
const openAddModal = () => {
  isEditMode.value = false
  selectedArtist.value = { artistId: null, nameKo: '', nameEn: '', groupType: 'MALE_GROUP' }
  validation.value = { nameKo: { isValid: true, message: '' }, nameEn: { isValid: true, message: '' } }
  show()
}

const openEditModal = (artist) => {
  isEditMode.value = true
  selectedArtist.value = { ...artist }
  validation.value = { nameKo: { isValid: true, message: '' }, nameEn: { isValid: true, message: '' } }
  show()
}

const handleDelete = async (artist) => {
  if (!confirm(`'${artist.nameKo}' 아티스트를 정말 삭제하시겠습니까?`)) return
  try {
    await deleteArtist(artist.artistId)
    showAlert('알림', `'${artist.nameKo}' 아티스트가 삭제되었습니다.`)
    await loadArtists()
  } catch (e) {
    showAlert('오류', e.message || '삭제 처리 중 오류가 발생했습니다.')
  }
}

const saveArtist = async () => {
  // 저장 전 유효성 검사
  if (!validation.value.nameKo.isValid || !validation.value.nameEn.isValid) {
    showAlert('알림', '입력 값을 확인해주세요.')
    return
  }
  if (!selectedArtist.value.nameKo || !selectedArtist.value.nameEn || !selectedArtist.value.groupType) {
    showAlert('알림', '모든 필수 항목을 입력해주세요.')
    return
  }
  try {
    const payload = {
      nameKo: selectedArtist.value.nameKo,
      nameEn: selectedArtist.value.nameEn.toUpperCase(), // 대문자로 변환
      groupType: selectedArtist.value.groupType,
    }
    if (isEditMode.value) {
      await updateArtist(selectedArtist.value.artistId, payload)
      showAlert('알림', `'${payload.nameKo}' 아티스트가 수정되었습니다.`)
    } else {
      await createArtist(payload)
      showAlert('알림', `'${payload.nameKo}' 아티스트가 추가되었습니다.`)
    }
    hide()
    await loadArtists()
  } catch (e) {
    showAlert('오류', e.message || '저장 처리 중 오류가 발생했습니다.')
  }
}

// --- 검색 기능 ---
const filteredArtists = computed(() => {
  if (!keyword.value) {
    return allArtists.value
  }
  const lowerKeyword = keyword.value.toLowerCase()
  return allArtists.value.filter((art) => art.nameKo.toLowerCase().includes(lowerKeyword) || art.nameEn.toLowerCase().includes(lowerKeyword))
})

// --- 테이블 컬럼 정의 ---
const columns = [
  { data: 'artistId', title: 'ID', className: 'text-center' },
  { data: 'nameKo', title: '한글명' },
  { data: 'nameEn', title: '영문명' },
  {
    data: 'groupType',
    title: '그룹 구분',
    className: 'text-center',
    render: (data) => getGroupTypeText(data),
  },
  { data: 'createdAt', title: '등록일', className: 'text-center', render: (data) => formatDateTime(data) },
  { data: 'updatedAt', title: '수정일', className: 'text-center', render: (data) => formatDateTime(data) },
  {
    data: 'artistId',
    title: '관리',
    sortable: false,
    className: 'text-center',
    render: (id) => `
        <button class="btn btn-sm btn-outline-primary px-2 btn-edit" data-id="${id}">수정</button>
        <button class="btn btn-sm btn-outline-danger px-2 ml-2 btn-delete" data-id="${id}">삭제</button>
      `,
  },
]

const tableOptions = {
  pageLength: 10,
  lengthChange: false,
  order: [[0, 'desc']],
}

// --- 생명주기 및 이벤트 핸들링 ---
onMounted(() => {
  loadArtists()

  nextTick(() => {
    initModal()

    if (pageRef.value) {
      pageRef.value.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-id]')
        if (!button) return

        const id = parseInt(button.dataset.id, 10)
        const artist = allArtists.value.find((a) => a.artistId === id)
        if (!artist) return

        if (button.classList.contains('btn-edit')) {
          openEditModal(artist)
        } else if (button.classList.contains('btn-delete')) {
          handleDelete(artist)
        }
      })
    }
  })
})
</script>

<template>
  <main class="container-fluid p-4" ref="pageRef">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="fw-semibold text-dark mb-1">아티스트 관리</h4>
            <p class="text-muted small">상품 분류에 사용될 아티스트를 관리합니다.</p>
          </div>
          <button class="btn btn-primary" @click="openAddModal"><i class="fas fa-plus fa-sm"></i> 추가</button>
        </div>
      </div>

      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="small text-muted">총 {{ filteredArtists.length }}건</div>
          <input type="text" class="form-control form-control-sm" style="width: 250px" v-model="keyword" placeholder="한글명 또는 영문명으로 검색" />
        </div>

        <BaseDataTable :columns="columns" :data="filteredArtists" :loading="loading" :options="tableOptions">
          <template #empty> 등록된 아티스트가 없습니다. </template>
        </BaseDataTable>
      </div>
    </div>

    <div class="modal fade" id="artistModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? '아티스트 수정' : '아티스트 추가' }}</h5>
            <button type="button" class="close" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveArtist">
              <div class="form-group">
                <label for="artistNameKo">한글명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="artistNameKo" v-model="selectedArtist.nameKo" required />
                <small v-if="!validation.nameKo.isValid" class="text-danger">{{ validation.nameKo.message }}</small>
              </div>
              <div class="form-group mt-3">
                <label for="artistNameEn">영문명 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="artistNameEn" v-model="selectedArtist.nameEn" required />
                <small v-if="!validation.nameEn.isValid" class="text-danger">{{ validation.nameEn.message }}</small>
              </div>
              <div class="form-group mt-3">
                <label for="artistGroupType">그룹 구분 <span class="text-danger">*</span></label>
                <select class="form-control" id="artistGroupType" v-model="selectedArtist.groupType" required>
                  <option value="" disabled>선택하세요</option>
                  <option v-for="type in groupTypes" :key="type.value" :value="type.value">
                    {{ type.text }}
                  </option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">취소</button>
            <button type="button" class="btn btn-primary" @click="saveArtist">저장</button>
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
