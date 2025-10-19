<script setup>
// =======================================================================
//  마이페이지 - 회원 탈퇴
// =======================================================================
// 필요한 API 함수에 deleteMember 추가 (api/member.js에 정의 필요)
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { verifyMemberPassword, deactiveateMember } from '@/api/member'; // deleteMember API import
import { useAlertDialog } from '@/composables/useAlertDialog';

const { showAlert: showDialog } = useAlertDialog();
const userStore = useUserStore();

// 상태 관리
// 'init' | 'verify' | 'confirm'
const step = ref('init'); 
const userPassword = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

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
            step.value = 'confirm'; 
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

// 회원 탈퇴 처리
const withdrawMember = async () => {
    isLoading.value = true;
    errorMessage.value = '';

    try {
        const response = await deactiveateMember(currentUserId.value); 
        
        if (response.status === 204 || response.status === 200) {
            showDialog("✅안내", "회원 탈퇴 처리가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
            // 탈퇴 성공 시, 스토어의 로그아웃 액션을 호출하여 세션 정리 및 리디렉션
            userStore.logout(); 
        } else {
            errorMessage.value = '탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.';
        }
    } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        errorMessage.value = '탈퇴 처리 중 오류가 발생했습니다.';
    } finally {
        isLoading.value = false;
    }
}

// 모달 닫기
const closeModal = () => {
    step.value = 'init';
    userPassword.value = '';
    errorMessage.value = '';
}
</script>
<template>
    <div class="profile-section">
        <div class="info-card">
            <div class="card-header">
                <h3>회원 탈퇴</h3>
                <p class="card-description" style="color: #ef4444;">회원 탈퇴 시 모든 정보는 복구할 수 없습니다.</p>
            </div>
            
            <div class="info-item" style="background: rgba(239, 68, 68, 0.05);">
                <div class="info-icon" style="box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);">
                    🔥
                </div>
                <div class="info-content">
                    <div class="info-label">현재 회원</div>
                    <div class="info-value">{{ currentUserId }}</div>
                </div>
            </div>

            <button class="btn-primary" style="background: #ef4444;" @click="openVerifyModal">회원 탈퇴하기</button>
        </div>

        <Teleport to="body">
            <div v-if="step === 'verify'" class="modal-overlay" @click.self="closeModal">
                <div class="modal-container verify-modal">
                    <div class="modal-header">
                        <h2>회원 탈퇴 본인 인증</h2>
                        <button class="close-btn" @click="closeModal">✕</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="verify-icon">🔐</div>
                        <p class="verify-description">
                            **회원 탈퇴**를 진행하기 위해<br>
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

            <div v-if="step === 'confirm'" class="modal-overlay" @click.self="closeModal">
                <div class="modal-container verify-modal">
                    <div class="modal-header">
                        <h2>정말 탈퇴하시겠어요?</h2>
                        <button class="close-btn" @click="closeModal">✕</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="verify-icon">⚠️</div>
                        <p class="verify-description" style="color: #ef4444; font-weight: 600;">
                            회원 탈퇴 시 회원님의 모든 데이터(게시글, 댓글 등)는<br>
                            **영구적으로 삭제**되며 복구가 불가능합니다.
                        </p>
                        <p class="verify-description">
                            탈퇴를 원하시면 아래 '탈퇴하기' 버튼을 눌러주세요.
                        </p>
                        
                        <div v-if="errorMessage" class="error-message">
                            ⚠️ {{ errorMessage }}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-secondary" @click="closeModal" :disabled="isLoading">
                            취소
                        </button>
                        <button class="btn-primary" style="background: #ef4444;" @click="withdrawMember" :disabled="isLoading">
                            {{ isLoading ? '처리 중...' : '탈퇴하기' }}
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