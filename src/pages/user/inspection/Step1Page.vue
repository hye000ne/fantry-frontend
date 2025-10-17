<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getGoodsCategories, getArtists, getAlbumsByArtist } from '@/api/catalog.js'
import { getChecklistsByCategory, getPriceBaselineByCategory, estimatePrice, getMarketAvgPrice } from '@/api/checklist.js'
import SelectedArtistModal from '@/pages/user/inspection/SelectedArtistModal.vue'
import SelectedAlbumModal from '@/pages/user/inspection/SelectedAlbumModal.vue'
import { useInspectionStore } from '@/stores/inspectionStore'
import { storeToRefs } from 'pinia'
import { useAlertDialog } from '@/composables/useAlertDialog.js';

const router = useRouter()
const inspectionStore = useInspectionStore()
const {showAlert} = useAlertDialog();

// Store 값
const {
  selectedCategory,
  selectedCategoryValue,
  selectedArtist,
  selectedAlbum,
  itemName,
  itemDescription,
  hashtags,
  checklists,
  answers,
  expectedPrice,
  marketAvgPrice,
  sellerHopePrice,
  completedStep,
} = storeToRefs(inspectionStore)

// 로컬 상태 변수
const categories = ref([]) // 카테고리 목록
const artists = ref([]) // 아티스트 목록
const albums = ref([]) // 앨범 목록
const tagInput = ref('') // 해시태그 입력
const marketAvgCount = ref(0)

// 모달 상태
const showArtistModal = ref(false)
const showAlbumModal = ref(false)

// 로딩/에러 상태
const loadingInitial = ref(false) // 최초 로딩(카테고리/아티스트)
const loadingAlbums = ref(false) // 앨범 로딩
const loadingChecklists = ref(false) // 체크리스트 로딩
const loadingBaseline = ref(false) // 기준가 로딩
const loadingEstimate = ref(false) // 예상가 로딩
const loadingMarketAvg = ref(false) // 마켓 평균가 로딩
const error = ref(null) // 에러 메시지
const isPriceCalculated = ref(false) // 예상가 계산 완료 여부
const isMarketAvgCalculated = ref(false) // 평균 시세 조회 완료 여부

// UI 상태 Computed
const isCategoryDisabled = computed(() => loadingInitial.value)
const isArtistDisabled = computed(() => loadingInitial.value)
const isAlbumDisabled = computed(() => !selectedArtist.value || loadingAlbums.value)

// 상품명 미리보기 텍스트
const previewText = computed(() => {
  const ak = selectedArtist.value?.nameKo || '[아티스트]'
  const nm = itemName.value || '[상품명]'
  return `${ak} ${nm}`
})

// 체크리스트 필드 파싱
const fields = computed(() => {
  return checklists.value.map((c) => ({
    checklistItemId: c.checklistItemId,
    itemKey: c.itemKey,
    label: c.label,
    type: c.type,
    options: parseOptions(c.options), // 옵션을 파싱하여 사용
    required: !!c.required, // boolean 형태로 변환
    orderIndex: c.orderIndex,
  }))
})

// 초기 데이터 : 카테고리/아티스트 리스트 조회
const fetchInitData = async () => {
  loadingInitial.value = true
  error.value = null

  try {
    const [cats, arts] = await Promise.all([getGoodsCategories(), getArtists()])
    categories.value = cats ?? []
    artists.value = arts ?? []
  } catch (err) {
    error.value = err.message || '초기 데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loadingInitial.value = false
  }
}
// 카테고리가 포토카드(1), 앨범(2)일 때 true 반환
const showAlbumSelection = computed(() => {
  return [1, 2].includes(selectedCategory.value)
})

// 앨범 리스트 조회
const fetchAlbums = async (artistId) => {
  loadingAlbums.value = true
  error.value = null
  try {
    albums.value = (await getAlbumsByArtist(artistId)) ?? []
  } catch (err) {
    error.value = err.message || '앨범 목록을 불러오는 중 오류가 발생했습니다.'
  } finally {
    loadingAlbums.value = false
  }
}

// 카테고리 이벤트 핸들러
const onSelectCategory = async () => {
  // 카테고리 객체
  selectedCategoryValue.value = categories.value.find((c) => c.GoodsCategoryId === selectedCategory.value) || null

  // 상태 초기화
  loadingChecklists.value = true
  checklists.value = []
  answers.value = {}
  isPriceCalculated.value = false
  isMarketAvgCalculated.value = false
  marketAvgPrice.value = null
  marketAvgCount.value = 0
  error.value = null

  if (!showAlbumSelection.value) {
    selectedAlbum.value = null
  }

  try {
    const [checklistRes, baselineRes] = await Promise.all([getChecklistsByCategory(selectedCategory.value), getPriceBaselineByCategory(selectedCategory.value)])
    checklists.value = checklistRes.items ?? []
    inspectionStore.templateId = checklistRes.templateId
    inspectionStore.templateVersion = checklistRes.templateVersion
    expectedPrice.value = baselineRes ?? null

    // answers 초기화
    checklists.value.forEach((c) => {
      answers.value[c.itemKey] = c.type === 'BOOL' ? null : ''
    })
  } catch (err) {
    error.value = err.message || '체크리스트와 가격 정보를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loadingChecklists.value = false
  }
}

const onSelectArtist = (artist) => {
  selectedArtist.value = artist
  selectedAlbum.value = null
  isMarketAvgCalculated.value = false
  marketAvgPrice.value = null
  marketAvgCount.value = 0
  showArtistModal.value = false
  fetchAlbums(artist.artistId)
}

const onSelectAlbum = (album) => {
  selectedAlbum.value = album
  showAlbumModal.value = false
  isMarketAvgCalculated.value = false
  marketAvgPrice.value = null
  marketAvgCount.value = 0
}

// 해시태그 추가
const addTag = () => {
  const newTag = tagInput.value.trim().replace(/#/g, '') // 공백, '#' 제거
  if (newTag && !hashtags.value.includes(newTag)) {
    if (hashtags.value.length < 5) {
      hashtags.value.push(newTag)
      tagInput.value = ''
    } else {
      showAlert('알림', '해시태그는 최대 5개까지 추가할 수 있습니다.')
    }
  }
}

// 해시태그 삭제
const removeTag = (index) => {
  hashtags.value.splice(index, 1)
}

// 마지막 해시태그 삭제 (Backspace 키)
const removeLastTag = () => {
  if (tagInput.value === '' && hashtags.value.length > 0) {
    hashtags.value.pop()
  }
}

// 예상가 계산
const onEstimate = async () => {
  if (!validateChecklist()) return
  loadingEstimate.value = true
  error.value = null

  try {
    const selections = buildSelections() // 서버 전송용 포맷으로 변환
    expectedPrice.value = (await estimatePrice(selectedCategory.value, selections)) ?? null
    isPriceCalculated.value = true
  } catch (err) {
    error.value = err.message || '예상가를 계산하는 중 오류가 발생했습니다.'
  } finally {
    loadingEstimate.value = false
  }
}

// 평균 시세 조회
const onFetchMarketAvg = async () => {
  if (!selectedCategory.value || !selectedArtist.value) {
    alert('카테고리와 아티스트를 먼저 선택해주세요.')
    return
  }

  loadingMarketAvg.value = true
  error.value = null

  try {
    const res = await getMarketAvgPrice(selectedCategory.value, selectedArtist.value.artistId, selectedAlbum.value?.albumId)

    marketAvgPrice.value = res.marketAvgPrice
    marketAvgCount.value = res.count
    isMarketAvgCalculated.value = true
  } catch (err) {
    alert('평균 시세를 조회하는 중 오류가 발생했습니다.')
    marketAvgPrice.value = null
    marketAvgCount.value = 0
  } finally {
    loadingMarketAvg.value = false
  }
}

// 체크리스트 필수 항목 유효성 검증
const validateChecklist = () => {
  for (const f of fields.value) {
    if (f.required && (answers.value[f.itemKey] === null || answers.value[f.itemKey] === '')) {
      alert(`'${f.label}' 항목을 선택해주세요.`)
      return false
    }
  }
  return true
}

const validateAll = () => {
  // 상품 정보 검증
  if (!selectedCategory.value) {
    alert('카테고리를 선택해주세요.')
    return false
  }
  if (!selectedArtist.value) {
    alert('아티스트를 선택해주세요.')
    return false
  }
  if (!itemName.value || !itemName.value.trim()) {
    alert('상품명을 입력해주세요.')
    return false
  }
  if (!itemDescription.value || !itemDescription.value.trim()) {
    alert('상품 설명을 입력해주세요.')
    return false
  }

  // 체크리스트 검증
  if (!validateChecklist()) return false

  // 3. 가격 정보 검증
  if (!isPriceCalculated.value) {
    alert('시스템 예상가를 다시 계산해주세요.')
    return false
  }
  if (!isMarketAvgCalculated.value) {
    alert('평균 시세를 조회해주세요.')
    return false
  }
  if (sellerHopePrice.value === null || sellerHopePrice.value <= 0) {
    alert('판매 희망가를 0보다 큰 값으로 입력해주세요.')
    return false
  }

  return true
}

// answers -> 서버 전송용 selections
const buildSelections = () => {
  const selections = {}
  for (const [k, v] of Object.entries(answers.value)) {
    if (v === null || v === '' || v === undefined) continue
    if (v === true) selections[k] = 'Y'
    else if (v === false) selections[k] = 'N'
    else selections[k] = v
  }

  return selections
}

// 체크리스트 옵션 파싱
const parseOptions = (raw) => {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.log('JSON 파싱 실패: ', raw, e)
    return []
  }
}

// 다음 단계 이동
const goNext = () => {
  if (!validateAll()) return
  completedStep.value = 1
  router.push('/inspection/step2')
}

onMounted(fetchInitData)
watch(
  answers,
  () => {
    isPriceCalculated.value = false
  },
  { deep: true },
)
</script>

<template>
  <main class="bg-light py-5 inspection">
    <div class="container">
      <!-- 제목 -->
      <div class="mb-4 text-center">
        <h2 class="font-weight-bold">온라인 1차 검수 신청</h2>
      </div>

      <!-- 진행 바 -->
      <div class="mb-5">
        <p class="text-primary font-weight-bold mb-1">[1 / 3] 상품 정보 입력</p>
        <div class="progress" style="height: 6px">
          <div class="progress-bar bg-primary" style="width: 33%"></div>
        </div>
      </div>

      <div class="row">
        <!-- 좌측: 상품 정보 -->
        <div class="col-lg-7 d-flex">
          <div class="card shadow-sm flex-fill">
            <div class="card-body">
              <h5 class="font-weight-bold mb-2">상품 정보</h5>
              <p class="text-muted small mb-4">정확한 상품 정보를 입력해주세요.</p>

              <!-- 카테고리 -->
              <div class="form-group">
                <label class="font-weight-medium"> 카테고리 <span class="text-danger">*</span> </label>
                <select class="form-control" v-model="selectedCategory" :disabled="isCategoryDisabled" @change="onSelectCategory">
                  <option value="" disabled>선택하세요</option>
                  <option v-for="c in categories" :key="c.GoodsCategoryId" :value="c.GoodsCategoryId">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <!-- 아티스트 -->
              <div class="form-group">
                <label class="font-weight-medium"> 아티스트 <span class="text-danger">*</span> </label>
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    :value="selectedArtist ? `${selectedArtist.nameKo} (${selectedArtist.nameEn})` : ''"
                    readonly
                    placeholder="아티스트 선택"
                    :disabled="isArtistDisabled"
                    @click="!isArtistDisabled && (showArtistModal = true)"
                  />
                  <div class="input-group-append">
                    <button class="btn btn-outline-secondary" type="button" :disabled="isArtistDisabled" @click="!isArtistDisabled && (showArtistModal = true)">
                      <i class="fa fa-search"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 앨범 -->
              <div class="form-group" v-if="showAlbumSelection">
                <label class="font-weight-medium">앨범</label>
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    :value="selectedAlbum ? selectedAlbum.title : ''"
                    readonly
                    :placeholder="selectedArtist ? '앨범 선택' : '먼저 아티스트를 선택하세요'"
                    :disabled="isAlbumDisabled"
                    @click="!isAlbumDisabled && (showAlbumModal = true)"
                  />
                  <div class="input-group-append">
                    <button class="btn btn-outline-secondary" type="button" :disabled="isAlbumDisabled" @click="!isAlbumDisabled && (showAlbumModal = true)">
                      <i class="fa fa-search"></i>
                    </button>
                  </div>
                </div>
                <small v-if="loadingAlbums" class="text-muted">앨범 목록을 불러오는 중입니다…</small>
              </div>

              <!-- 상품명 -->
              <div class="form-group">
                <label class="font-weight-medium"> 상품명 <span class="text-danger">*</span> </label>
                <input type="text" class="form-control" placeholder="예: 한정판 포토카드" v-model="itemName" />
              </div>

              <!-- 미리보기 -->
              <div class="form-group">
                <small class="text-muted">미리보기: {{ previewText }}</small>
              </div>

              <!-- 설명 -->
              <div class="form-group">
                <label class="font-weight-medium"> 상품 설명 <span class="text-danger">*</span> </label>
                <textarea rows="3" class="form-control" placeholder="상품에 대한 설명을 입력해주세요." v-model="itemDescription" />
              </div>

              <!-- 해시태그 -->
              <div class="form-group">
                <label class="font-weight-medium">해시태그</label>
                <div class="tag-input-wrapper">
                  <span v-for="(tag, index) in hashtags" :key="index" class="tag-item">
                    #{{ tag }}
                    <button @click="removeTag(index)" class="remove-tag-btn">&times;</button>
                  </span>
                  <input type="text" class="tag-input" placeholder="태그 입력 후 Enter" v-model="tagInput" @keydown.enter.prevent="addTag" @keydown.backspace="removeLastTag" />
                </div>
                <small class="form-text text-muted">예: #아이브 #포토카드 (입력 후 엔터)</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 우측: 상태/가격 -->
        <div class="col-lg-5 d-flex flex-column">
          <!-- 체크리스트 -->
          <div class="card shadow-sm mb-4 flex-fill">
            <div class="card-body d-flex flex-column">
              <h5 class="font-weight-bold mb-2">상품 상태</h5>
              <p class="text-muted small mb-3">상품의 상태를 꼼꼼히 확인하고 체크해주세요.</p>
              <div
                v-if="checklists.length === 0 && !loadingChecklists"
                class="d-flex flex-column justify-content-center align-items-center py-4"
                style="border: 2px dashed #ddd; border-radius: 8px; background: #fafafa"
              >
                <i class="fa fa-clipboard-list text-secondary mb-2" style="font-size: 1.5rem"></i>
                <p class="mb-0 text-muted">체크리스트가 여기 표시됩니다.<br />카테고리를 먼저 선택하세요.</p>
              </div>

              <div class="flex-fill" style="max-height: 320px; overflow-y: auto">
                <div class="form-group" v-for="f in fields" :key="f.checklistItemId">
                  <label class="font-weight-medium">
                    {{ f.label }}
                    <span v-if="f.required" class="text-danger">*</span>
                  </label>

                  <!-- BOOL -->
                  <template v-if="f.type === 'BOOL'">
                    <div>
                      <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" :name="f.itemKey" v-model="answers[f.itemKey]" :value="true" />
                        <label class="form-check-label">예</label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" :name="f.itemKey" v-model="answers[f.itemKey]" :value="false" />
                        <label class="form-check-label">아니오</label>
                      </div>
                    </div>
                  </template>

                  <!-- SELECT -->
                  <template v-else-if="f.type === 'SELECT'">
                    <select class="form-control" v-model="answers[f.itemKey]">
                      <option value="" disabled selected>선택하세요</option>
                      <option v-for="opt in f.options" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                  </template>

                  <!-- TEXT -->
                  <template v-else-if="f.type === 'TEXT'">
                    <textarea class="form-control" rows="2" v-model="answers[f.itemKey]" />
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- 가격 -->
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="font-weight-bold mb-4">가격</h5>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <!-- 시스템 예상가 -->
                <span class="text-muted">시스템 예상가</span>
                <div class="d-flex align-items-center">
                  <strong class="text-primary mr-2">
                    {{ expectedPrice ? expectedPrice.toLocaleString() + '원' : '데이터 없음' }}
                  </strong>
                  <button class="btn btn-outline-primary btn-sm" type="button" :disabled="!selectedCategory || loadingEstimate" @click="onEstimate">
                    <span v-if="loadingEstimate">계산 중…</span>
                    <span v-else>예상가 계산</span>
                  </button>
                </div>
              </div>

              <!-- 평균 시세 -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted">평균 시세</span>
                <div class="d-flex align-items-center">
                  <span class="mr-2">
                    {{ marketAvgPrice ? `${marketAvgPrice.toLocaleString()}원 (${marketAvgCount}건)` : '데이터 없음' }}
                  </span>
                  <button class="btn btn-outline-secondary btn-sm" type="button" :disabled="!selectedCategory || loadingMarketAvg" @click="onFetchMarketAvg">
                    <span v-if="loadingMarketAvg">계산 중…</span>
                    <span v-else>시세 조회</span>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="font-weight-medium"> 판매 희망가 <span class="text-danger">*</span> </label>
                <input type="number" class="form-control" v-model="sellerHopePrice" />
                <small class="form-text text-muted"> 희망가와 예상가가 다를 수 있으며, 최종 가격은 검수 후 확정됩니다. </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 다음 단계 -->
      <div class="text-right mt-4">
        <button class="btn btn-primary px-5" type="button" @click="goNext">다음 단계</button>
      </div>
    </div>
  </main>

  <!-- 아티스트 모달 -->
  <SelectedArtistModal v-model:show="showArtistModal" :artists="artists" @select="onSelectArtist" />
  <!-- 앨범 모달 -->
  <SelectedAlbumModal v-model:show="showAlbumModal" :albums="albums" @select="onSelectAlbum" />
</template>

<style lang="scss" scoped>
$primary-color: #0066ff;
$primary-hover: #0052cc;

// 제목/라벨 스타일
h2,
h5,
label.font-weight-medium {
  color: #222 !important;
  font-weight: 600;
}

// 파란 강조 색상
.text-primary {
  color: $primary-color !important;
}

.progress-bar {
  background-color: $primary-color !important;
}

// 기본 버튼 (중첩 문법 사용)
.btn-primary {
  background-color: $primary-color !important;
  border-color: $primary-color !important;
  color: #fff !important;

  &:hover,
  &:focus {
    background-color: $primary-hover !important;
    border-color: $primary-hover !important;
    color: #fff !important;
  }
}

// 아웃라인 버튼
.btn-outline-primary {
  color: $primary-color !important;
  border-color: $primary-color !important;

  &:hover {
    background-color: $primary-color !important;
    color: #fff !important;
  }
}

// 돋보기 버튼
.input-group-append {
  .btn {
    background-color: #f8f9fa !important;
    border: 1px solid #ddd !important;

    i.fa-search {
      color: $primary-color !important;
    }

    &:hover {
      background-color: $primary-color !important;

      i.fa-search {
        color: #fff !important;
      }
    }
  }
}

.form-check-label {
  font-weight: normal;
}

// checklist 스크롤 영역
.checklist-container {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 6px;
}

.custom-select {
  height: auto;
  line-height: 1.5;
}

.tag-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  gap: 8px;
  cursor: text;

  &:focus-within {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.remove-tag-btn {
  background: none;
  border: none;
  color: #6c757d;
  margin-left: 6px;
  cursor: pointer;
  padding: 0;
  font-size: 1.1em;
  line-height: 1;

  &:hover {
    color: #343a40;
  }
}

.tag-input {
  border: none;
  outline: none;
  flex-grow: 1;
  padding: 4px 0;
  background: transparent;
}
</style>
