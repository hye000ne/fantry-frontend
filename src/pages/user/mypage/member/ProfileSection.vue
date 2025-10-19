<script setup>
// =======================================================================
//  마이페이지 - 개인 정보 관리
//  회원의 정보를 확인하고 수정할 수 있는 페이지
// =======================================================================

import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { verifyMemberPassword, getMemberDetail, updateOneMember } from '@/api/member';
import { useAlertDialog } from '@/composables/useAlertDialog.js';

const { showAlert } = useAlertDialog();

const userStore = useUserStore();

// 상태 관리
const step = ref('init'); // 'init' | 'verify' | 'edit'
const userPassword = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// 회원 정보
const memberData = ref({
    id: '',
    name: '',
    email: '',
    tel: '',
});

// 수정할 데이터 (원본과 분리)
const editData = ref({
    id: '',
    name: '',
    email: '',
    tel: '',
});

// 현재 사용자 ID (userStore에서 가져오기)
const currentUserId = computed(() => userStore.currentUser.id);

// 2차 인증 모달 열기
const openVerifyModal = () => {
    step.value = 'verify';
    userPassword.value = '';
    errorMessage.value = '';
}

// 비밀번호 인증(2차 인증)
const verifyPassword = async () => {
    if (!userPassword.value.trim()) {
        errorMessage.value = '비밀번호를 입력해주세요.';
        return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
        const response = await verifyMemberPassword(currentUserId.value, userPassword.value);
        
        if (response.data.success || response.data.result) {
            // 인증 성공 시 회원 정보 조회
            await loadMemberData();
            step.value = 'edit';
        } else {
            errorMessage.value = '비밀번호가 일치하지 않습니다.';
        }
    } catch (error) {
        console.error('비밀번호 인증 오류:', error)
        errorMessage.value = '비밀번호가 일치하지 않습니다.';
    } finally {
        isLoading.value = false;
    }
}

// 회원 정보 불러오기
const loadMemberData = async () => {
    isLoading.value = true;
    
    try {
        const response = await getMemberDetail(currentUserId.value);
        
        if (response.status == 200) {
            memberData.value = {
                id: response.data.member.id || '',
                name: response.data.member.name || '',
                email: response.data.member.email || '',
                tel: response.data.member.tel || '',
            }
            
            // 수정용 데이터에 복사
            editData.value = { ...memberData.value }
        }
    } catch (error) {
        console.error('회원 정보 조회 오류:', error);
        errorMessage.value = '회원 정보를 불러오는데 실패했습니다.';
    } finally {
        isLoading.value = false;
    }
}

// 정보 수정 저장
const saveProfile = async () => {
    // 유효성 검사
    if (!editData.value.name.trim()) {
        errorMessage.value = '이름을 입력해주세요.';
        return;
    }
    
    if (!editData.value.email.trim()) {
        errorMessage.value = '이메일을 입력해주세요.';
        return;
    }

     // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editData.value.email)) {
        errorMessage.value = '올바른 이메일 형식이 아닙니다.';
        return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
        const response = await updateOneMember(currentUserId.value, editData.value);
        
        if (response.data) {
        showAlert("✅안내", "회원 정보가 성공적으로 수정되었습니다.");
        memberData.value = { ...editData.value }
        closeModal();
        }
    } catch (error) {
        console.error('회원 정보 수정 오류:', error);
        errorMessage.value = '회원 정보 수정에 실패했습니다.';
    } finally {
        isLoading.value = false;
    }
}

// 모달 닫기
const closeModal = () => {
    step.value = 'init';
    userPassword.value = '';
    errorMessage.value = '';
    editData.value = { ...memberData.value }
}

// 수정 취소
const cancelEdit = () => {
    editData.value = { ...memberData.value }
    closeModal();
}
</script>

<template>
  <div class="profile-section">
    <!-- 초기 화면: 정보 수정 버튼 -->
    <div class="info-card">
      <div class="card-header">
        <h3>개인정보 관리</h3>
        <p class="card-description">회원님의 개인정보를 안전하게 관리합니다.</p>
      </div>
      
      <div class="info-item">
        <div class="info-icon">👤</div>
        <div class="info-content">
          <div class="info-label">회원 ID</div>
          <div class="info-value">{{ currentUserId }}</div>
        </div>
      </div>

      <button class="btn-primary" @click="openVerifyModal">내 정보 수정하기</button>
    </div>

    <!-- 2차 인증 모달 -->
    <Teleport to="body">
      <div v-if="step === 'verify'" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container verify-modal">
          <div class="modal-header">
            <h2>본인 인증</h2>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="verify-icon">🔐</div>
            <p class="verify-description">
              회원님의 소중한 정보 보호를 위해<br>
              비밀번호를 한 번 더 입력해주세요.
            </p>
            
            <div class="form-group">
              <label>비밀번호</label>
              <input
                v-model="userPassword"
                type="password"
                placeholder="비밀번호를 입력하세요"
                @keyup.enter="verifyPassword"
                :disabled="isLoading"
              />
            </div>

            <div v-if="errorMessage" class="error-message">
              ⚠️ {{ errorMessage }}
            </div>
          </div>

          <div class="modal-footer">
            <!-- <button class="btn-secondary" @click="closeModal" :disabled="isLoading">
              취소
            </button> -->
            <button class="btn-primary" @click="verifyPassword" :disabled="isLoading">
              {{ isLoading ? '인증 중...' : '확인' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 정보 수정 모달 -->
      <div v-if="step === 'edit'" class="modal-overlay" @click.self="cancelEdit">
        <div class="modal-container edit-modal">
          <div class="modal-header">
            <h2>개인정보 수정</h2>
            <button class="close-btn" @click="cancelEdit">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>아이디</label>
              <input
                v-model="editData.id"
                type="text"
                placeholder="아이디를 입력하세요"
                :disabled="isLoading"
              />
            </div>
            
            <div class="form-group">
              <label>이름 <span class="required">*</span></label>
              <input
                v-model="editData.name"
                type="text"
                placeholder="이름을 입력하세요"
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label>이메일 <span class="required">*</span></label>
              <input
                v-model="editData.email"
                type="email"
                placeholder="example@email.com"
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label>전화번호</label>
              <input
                v-model="editData.tel"
                type="tel"
                placeholder="010-0000-0000"
                :disabled="isLoading"
              />
            </div>

            <div v-if="errorMessage" class="error-message">
              ⚠️ {{ errorMessage }}
            </div>
          </div>

          <div class="modal-footer">
            <!-- <button class="btn-secondary" @click="cancelEdit" :disabled="isLoading">
              취소
            </button> -->
            <button class="btn-primary" @click="saveProfile" :disabled="isLoading">
              {{ isLoading ? '저장 중...' : '저장하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.profile-section {
  max-width: 600px;
}

/* 정보 카드 */
.info-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  margin-bottom: 32px;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.card-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(60, 77, 255, 0.03) 0%, rgba(191, 212, 255, 0.05) 100%);
  border-radius: 12px;
  margin-bottom: 24px;
}

.info-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(60, 77, 255, 0.1);
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #1a1a1a;
  font-weight: 600;
}

/* 버튼 스타일 */
.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #3C4DFF 0%, #5C7BFF 100%);
  color: white;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(60, 77, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 2px solid #e8ecf3;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #3C4DFF;
  color: #3C4DFF;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 2px solid #f5f7fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.close-btn:hover {
  background: #e8ecf3;
  color: #1a1a1a;
}

.modal-body {
  padding: 32px;
}

.modal-footer {
  padding: 24px 32px;
  border-top: 2px solid #f5f7fa;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 인증 모달 */
.verify-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 16px;
}

.verify-description {
  text-align: center;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* 폼 스타일 */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.required {
  color: #ef4444;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8ecf3;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #3C4DFF;
  box-shadow: 0 0 0 4px rgba(60, 77, 255, 0.1);
}

.form-group input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-top: 16px;
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }

  .info-card {
    padding: 24px 20px;
  }
}
</style>