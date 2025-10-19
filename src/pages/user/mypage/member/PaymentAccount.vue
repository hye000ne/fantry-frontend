<script setup>
// =======================================================================
//  마이페이지 - 결제 계좌 관리
// =======================================================================
import { ref, onMounted } from 'vue';
import { getAccountsMember, addAccount, deleteAccount } from '@/api/account.js';
import { useUserStore } from '@/stores/userStore';
import { useAlertDialog } from '@/composables/useAlertDialog.js';
  
const { showAlert } = useAlertDialog();

// --- 상태 관리 ---
const currentMemberId = ref('');
const accounts = ref([]); // 등록된 계좌 리스트
const isLoading = ref(true);
const error = ref(null);

// 새 계좌 등록 폼 상태
const isAddingNewAccount = ref(false);
const newAccountPayload = ref({
    accountName: '',
    bankName: '',
    isActive: '0',
    isRefundable: '0',
    memberId: '',
});

// memberId 가져오기
const userStore = useUserStore();
currentMemberId.value = userStore.currentUser.memberId;

// --- 데이터 페칭 함수 (조회) ---
const fetchAccounts = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        // 실제 API 호출 로직
        const response = await getAccountsMember(currentMemberId.value);
        accounts.value = response.data.accountList;
    } catch (e) {
        error.value = '계좌 정보를 불러오는 데 실패했습니다.';
        console.error('Fetch Accounts Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 계좌 등록 함수 (추가) ---
const handleAddAccount = async () => {
    if (!newAccountPayload.value.bankName || !newAccountPayload.value.accountName ){
        showAlert('⚠️주의', '모든 필드를 입력해주세요.');
        return;
    }
    
    // 로딩 시작
    isLoading.value = true;
    try {
        // 계좌가 하나도 없으면 isActive:1, 아니면 0
        const isFirstAccount = accounts.value.length === 0;
        const payload = {
            accountName: newAccountPayload.value.accountName,
            bankName: newAccountPayload.value.bankName,
            isActive: isFirstAccount ? '1' : '0',
            isRefundable: '1',
            memberId: currentMemberId.value
        }

        //const payload = { ...newAccountPayload.value, memberId: currentMemberId.value };
        
        await addAccount(payload); 

        showAlert("✅안내", "계좌가 성공적으로 등록되었습니다.");
        isAddingNewAccount.value = false;
        newAccountPayload.value = { bankName: '', accountName: '', isActive: '0', isRefundable: '0' };
        await fetchAccounts();  //계좌 목록 새로고침
    } catch (e) {
        showAlert("🚫오류", "계좌 등록에 실패했습니다. 다시 시도해 주세요.");
        console.error('Add Account Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 계좌 삭제 함수 (삭제) ---
const handleDeleteAccount = async (accountId) => {
    if (!confirm('⚠️ 선택한 계좌를 정말로 삭제하시겠습니까?')) {
        return;
    }

    isLoading.value = true;
    try {
        await deleteAccount(accountId);
        showAlert("✅안내", "계좌가 성공적으로 삭제되었습니다.");
        await fetchAccounts();  //계좌 목록 새로고침
    } catch (e) {
        showAlert("🚫오류", "계좌 삭제에 실패했습니다. 다시 시도해 주세요.");
        console.error('Delete Account Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 유틸리티 함수 ---
const formatAccountNumber = (number) => {
    // 하이픈(-) 포함된 번호를 안전하게 보여주거나 마스킹 처리
    if (!number) return '정보 없음';
    return number;
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(fetchAccounts);
</script>

<template>
    <div class="content-page">
        <h1 class="page-title">
            <i class="fas fa-credit-card mr-2"></i> 결제 계좌 관리
        </h1>
        <p class="page-description">등록된 결제 수단(계좌/카드)을 확인하고 관리할 수 있습니다.</p>

        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            계좌 정보를 불러오는 중...
        </div>

        <div v-else-if="error" class="error-state">
            ⚠️ {{ error }}
        </div>

        <!-- 1. 계좌 목록 (카드 뷰) -->
        <div v-else class="account-card-grid">
            
            <!-- 등록된 계좌 카드 -->
            <div 
                v-for="account in accounts" 
                :key="account.id" 
                :class="['account-card', { 'primary-card': account.isActive == '1', 'unrefundable-card': account.isRefundable == '0' }]"
            >
                <div class="card-header">
                    <span class="bank-name">{{ account.bankName }}</span>
                    <span v-if="account.isActive=='1'" class="badge-primary">주 사용</span>
                </div>
                <div class="card-body">
                    <p class="account-number">
                        {{ formatAccountNumber(account.accountName) }}
                    </p>
                </div>
                <div class="card-actions">
                    <button @click="handleDeleteAccount(account.accountId)" class="btn-delete">
                        삭제
                    </button>
                    <!-- 주계좌 변경 버튼 등 추가 가능 -->
                </div>
            </div>

            <!-- 새 계좌 등록 시작 버튼 -->
            <div v-if="!isAddingNewAccount" class="add-new-card" @click="isAddingNewAccount = true">
                <i class="fas fa-plus-circle"></i>
                <p>새 계좌 등록하기</p>
            </div>
        </div>

        <!-- 2. 계좌 등록/변경 폼 -->
        <div v-if="isAddingNewAccount" class="register-form-container">
            <h3>{{ accounts.length > 0 ? '추가 계좌 등록' : '결제 계좌 등록' }}</h3>
            <form @submit.prevent="handleAddAccount" class="account-form">
                <div class="form-group">
                    <label for="bankName">은행명 / 카드사</label>
                    <input type="text" id="bankName" v-model="newAccountPayload.bankName" required placeholder="예: KB국민은행 / 신한카드">
                </div>
                
                <div class="form-group">
                    <label for="accountName">계좌번호 / 카드번호</label>
                    <input type="text" id="accountName" v-model="newAccountPayload.accountName" required placeholder="하이픈(-) 포함">
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-submit">등록하기</button>
                    <button type="button" @click="isAddingNewAccount = false" class="btn-cancel">취소</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* 아이콘 사용을 위한 Font Awesome 로딩을 가정합니다. */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.content-page {
    max-width: 900px;
    margin: 20px auto;
    padding: 30px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.page-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: #333;
    border-bottom: 3px solid #f0f0f0;
    padding-bottom: 10px;
    margin-bottom: 10px;
}

.page-description {
    color: #666;
    margin-bottom: 30px;
    font-size: 0.95rem;
}

/* --- 카드 그리드 레이아웃 --- */
.account-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

/* --- 계좌 카드 스타일 --- */
.account-card {
    background-color: #f7f9fc;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s, box-shadow 0.2s;
    min-height: 180px;
}

.account-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.primary-card {
    border: 2px solid #007bff;
    background-color: #e6f0ff;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.bank-name {
    font-size: 1.2rem;
    font-weight: 600;
    color: #333;
}

.badge-primary {
    background-color: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 0.75rem;
    font-weight: 500;
}

.badge-unrefundable {
    background-color: #dc3545;
    color: white;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-left: 8px;
}

.unrefundable-card {
    opacity: 0.7;
    border-style: dashed;
}

.account-number {
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 1px;
    color: #0056b3;
    margin-bottom: 10px;
}

.holder-name {
    font-size: 0.9rem;
    color: #555;
}

.card-actions {
    text-align: right;
    margin-top: 15px;
}

.btn-delete {
    background-color: #dc3545;
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background-color 0.2s;
}

.btn-delete:hover {
    background-color: #c82333;
}

/* --- 새 계좌 등록 카드 --- */
.add-new-card {
    border: 2px dashed #ccc;
    background-color: #fff;
    border-radius: 10px;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: #777;
    transition: background-color 0.2s, border-color 0.2s;
}

.add-new-card:hover {
    background-color: #f0f0f0;
    border-color: #aaa;
    color: #333;
}

.add-new-card i {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

/* --- 폼 스타일링 --- */
.register-form-container {
    padding: 25px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #f9f9f9;
    margin-top: 20px;
}

.register-form-container h3 {
    font-size: 1.4rem;
    color: #333;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 5px;
    color: #555;
    font-size: 0.9rem;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.form-group input:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 25px;
    justify-content: flex-end;
}

.btn-submit, .btn-cancel {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
}

.btn-submit {
    background-color: #007bff;
    color: white;
}

.btn-submit:hover {
    background-color: #0056b3;
}

.btn-cancel {
    background-color: #6c757d;
    color: white;
}

.btn-cancel:hover {
    background-color: #5a6268;
}

/* 로딩/에러 상태 */
.loading-state, .error-state {
    text-align: center;
    padding: 50px;
    font-size: 1.1rem;
    color: #666;
}

.spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top: 4px solid #007bff;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>