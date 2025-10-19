<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspectionStore'
import { useModal } from '@/composables/useModal'
import { storeToRefs } from 'pinia'
import { getMemberByToken } from '@/api/member'
import openAddressSearch from '@/module/kakaoAddressSearch'
import { useAlertDialog } from '@/composables/useAlertDialog.js';

const router = useRouter()
const inspectionStore = useInspectionStore()
const {showAlert} = useAlertDialog();

// Store 값
const { uploadedFiles, shippingAddress, shippingAddressDetail, bankName, bankAccount, completedStep } = storeToRefs(inspectionStore)

// 이미지 모달
const selectedImage = ref(null) // 모달에서 크게 볼 이미지 URL
const { initModal, show: showImageModal } = useModal('#imageModal')

// 로그인 회원 정보
const memberInfo = ref(null)
// 로그인 회원 정보 불러오기
const fetchUserData = async () => {
  if (memberInfo.value) return memberInfo.value

  try {
    const res = await getMemberByToken()
    memberInfo.value = res.data.member
    return memberInfo.value
  } catch (error) {
    console.error('회원 정보 불러오기 실패:', error)
    showAlert('오류', '저장된 회원 정보를 불러오는 데 실패했습니다.')
    return null
  }
}

const onFileChange = (event) => {
  const newFiles = Array.from(event.target.files) // FileList -> Array
  if (newFiles.length === 0) return

  for (const f of newFiles) {
    // 유효성 검사
    if (uploadedFiles.value.length >= 10) {
      showAlert('알림', '이미지는 최대 10개까지 등록할 수 있습니다.')
      break
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']

    if (!allowedTypes.includes(f.type)) {
      showAlert('알림', `'${f.name}' 파일은 지원하지 않는 형식입니다. (JPG, PNG만 가능)`)
      continue
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (f.size > maxSize) {
      showAlert('알림', `'${f.name}' 파일의 크기가 10MB를 초과합니다.`)
      continue
    }

    // uploadedFiles에 추가
    uploadedFiles.value.push({
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
    })
  }

  event.target.value = ''
}

// 썸네일 이미지 클릭 시 큰 이미지 모달
const openModal = (url) => {
  selectedImage.value = url
  showImageModal()
}

const removeFile = (index) => {
  if (index < 0 || index >= uploadedFiles.value.length) return
  URL.revokeObjectURL(uploadedFiles.value[index].previewUrl)
  uploadedFiles.value.splice(index, 1)
}

// 회원 배송지 정보 조회
const loadMyAddress = async () => {
  const member = await fetchUserData()
  if (member) {
    shippingAddress.value = member.roadAddress || ''
    shippingAddressDetail.value = member.detailAddress || ''
  }
}

// 회원 계좌 정보 조회
const loadMyAccount = async () => {
  const member = await fetchUserData()
  if (member) {
    bankName.value = member.bankName || ''
    bankAccount.value = member.accountNumber || ''
  }
}

// 주소 검색
const onClickAddressSearch = () => {
  openAddressSearch((data) => {
    shippingAddress.value = data.address
    shippingAddressDetail.value = ''
  })
}

const validateAll = () => {
  // 이미지 검증
  if (uploadedFiles.value.length < 2) {
    showAlert('알림', '이미지를 최소 2장(앞/뒤) 이상 등록해주세요.')
    return false
  }

  // 주소 검증
  if (!shippingAddress.value || !shippingAddress.value.trim()) {
    showAlert('알림', '주소를 입력해주세요.')
    return false
  }
  if (!shippingAddressDetail.value || !shippingAddressDetail.value.trim()) {
    showAlert('알림', '상세주소를 입력해주세요.')
    return false
  }

  // 계좌 검증
  if (!bankName.value || !bankName.value.trim()) {
    showAlert('알림', '은행명을 입력해주세요.')
    return false
  }
  if (!bankAccount.value || !bankAccount.value.trim()) {
    showAlert('알림', '계좌번호를 입력해주세요.')
    return false
  }
  return true
}

// 다음 단계 클릭 시
const goNext = () => {
  if (!validateAll()) return
  completedStep.value = 2
  router.push('/inspection/step3')
}

// 이전 단계 클릭 시
const goPrev = () => router.push('/inspection/step1')

onMounted(async () => {
  initModal()
  if (completedStep.value < 1) {
    showAlert('경고', '잘못된 접근입니다. 이전 단계를 먼저 완료해주세요.')
    router.replace('/inspection/step1')
  } else {
    const member = await fetchUserData()
    if (member) {
      shippingAddress.value = member.roadAddress || ''
      shippingAddressDetail.value = member.detailAddress || ''
      bankName.value = member.bankName || ''
      bankAccount.value = member.accountNumber || ''
    }
  }
})
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
        <p class="text-primary font-weight-bold mb-1">[2 / 3] 이미지 및 배송계좌 입력</p>
        <div class="progress" style="height: 6px">
          <div class="progress-bar bg-primary" style="width: 66%"></div>
        </div>
      </div>

      <div class="row align-items-stretch">
        <!-- 이미지 등록 -->
        <div class="col-lg-7 d-flex">
          <div class="card shadow-sm flex-fill">
            <div class="card-body">
              <h5 class="font-weight-bold mb-3">이미지 등록 <span class="text-danger">*</span></h5>
              <div class="border border-dashed p-5 text-center mb-4" style="border: 2px dashed #ddd; border-radius: 8px">
                <i class="fa fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-1">드래그 앤 드롭 또는</p>
                <label for="file-upload" class="text-primary font-weight-bold cursor-pointer">파일 선택</label>
                <input id="file-upload" type="file" multiple hidden accept="image/jpeg,image/png" @change="onFileChange" />
              </div>

              <p class="text-muted small mb-2">상품의 상태가 잘 보이도록 촬영된 사진을 등록해주세요.</p>
              <ul class="text-muted small mb-4">
                <li><strong>최소 2장 이상 (앞면/뒷면 필수)</strong>, 최대 10장까지 등록할 수 있습니다.</li>
                <li><strong>JPG, PNG 형식</strong>의 이미지만 업로드 가능합니다.</li>
                <li>이미지 한 장당 용량은 <strong>10MB</strong>를 초과할 수 없습니다.</li>
                <li><strong>가로/세로 1000픽셀 이상의 고화질 이미지</strong>를 권장합니다.</li>
                <li>상품의 하자(오염, 손상 등)가 있다면 해당 부분을 자세히 촬영해주세요.</li>
              </ul>

              <!-- 썸네일 -->
              <div class="d-flex gap-3 flex-wrap">
                <div v-for="(f, idx) in uploadedFiles" :key="f.previewUrl" class="thumbnail-wrapper">
                  <img :src="f.previewUrl" class="img-thumbnail rounded" :alt="f.name" @click="openModal(f.previewUrl)" aria-label="이미지 크게 보기" />
                  <button type="button" class="delete-btn" @click="removeFile(idx)" aria-label="썸네일 삭제">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5 d-flex flex-column">
          <div class="card shadow-sm mb-4 flex-fill">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="font-weight-bold mb-0">배송지 정보 <span class="text-danger">*</span></h5>
                <a href="#" class="small" @click.prevent="loadMyAddress">내 정보 불러오기</a>
              </div>
              <small class="form-text text-muted mb-3"> 검수 불합격 시 상품을 반송받으실 주소를 입력해주세요. </small>
              <div class="form-group">
                <label>주소</label>
                <div class="input-group">
                  <input type="text" class="form-control" v-model.trim="shippingAddress" placeholder="도로명 주소" readonly />
                  <div class="input-group-append">
                    <button class="btn btn-outline-secondary" type="button" @click="onClickAddressSearch">주소 검색</button>
                  </div>
                </div>
              </div>
              <div class="form-group mb-0">
                <label>상세주소</label>
                <input type="text" class="form-control" v-model.trim="shippingAddressDetail" placeholder="상세 주소" />
              </div>
            </div>
          </div>

          <div class="card shadow-sm flex-fill">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="font-weight-bold mb-0">계좌 정보 <span class="text-danger">*</span></h5>
                <a href="#" class="small" @click.prevent="loadMyAccount">내 정보 불러오기</a>
              </div>
              <small class="form-text text-muted mb-3"> 판매 대금을 정산받으실 계좌 정보를 입력해주세요. </small>
              <div class="form-group">
                <label>은행명</label>
                <input type="text" class="form-control" v-model.trim="bankName" placeholder="은행 선택" />
              </div>
              <div class="form-group mb-0">
                <label>계좌번호</label>
                <input type="text" class="form-control" v-model.trim="bankAccount" placeholder="'-' 없이 숫자만 입력" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary px-5" @click="goPrev">이전 단계</button>
        <button class="btn btn-primary px-5" @click="goNext">다음 단계</button>
      </div>
    </div>
  </main>

  <!-- 이미지 모달 -->
  <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body text-center">
          <img :src="selectedImage" class="img-fluid rounded" alt="preview" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.thumbnail-wrapper {
  position: relative;
  display: inline-block;

  img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 6px;
    cursor: pointer;
  }

  .delete-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 14px;
    line-height: 18px;
    cursor: pointer;
  }
}
</style>
