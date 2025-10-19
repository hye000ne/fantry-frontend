<script setup>
// =======================================================================
//  마이페이지 - 배송지 관리
// =======================================================================
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { getAllAddressMember, addAddress, editAddress, deleteAddress, setDefaultAddress } from '@/api/address';
import openAddressSearch from '@/module/kakaoAddressSearch.js';
import { useAlertDialog } from '@/composables/useAlertDialog';

const { showAlert: showDialog } = useAlertDialog();
const userStore = useUserStore();

// --- 상태 관리 ---
const currentMemberId = ref('');
const addresses = ref([]); // 등록된 배송지 리스트
const isLoading = ref(true);
const error = ref(null);

// 배송지 추가/수정 폼 상태
const isAddingOrEditing = ref(false);
const editingAddressId = ref(null); // 수정 중인 주소 ID (null이면 추가 모드)
const addressPayload = ref({
    roadAddress: '', // 기본 주소
    detailAddress: '', // 상세 주소
    alias: '', //별칭
    recipientName: '', // 받는 사람
    recipientTel: '', // 연락처
    isDefault: false, // 기본 배송지 여부
    memberId: '', // 회원
});

// --- 데이터 페칭 함수 (조회) ---
const fetchAddresses = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        currentMemberId.value = userStore.currentUser.memberId;
        const response = await getAllAddressMember(currentMemberId.value);
        addresses.value = response.data.addressList;

    } catch (e) {
        error.value = '배송지 정보를 불러오는 데 실패했습니다.';
        console.error('Fetch Addresses Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 배송지 추가/수정 시작 ---
const startAddAddress = () => {
    editingAddressId.value = null;
    addressPayload.value = {
        roadAddress: '',
        detailAddress: '',
        alias: '',
        recipientName: '',
        recipientTel: '',
        isDefault: addresses.value.length === 0? 1: 0,
        memberId: currentMemberId.value,
    };
    isAddingOrEditing.value = true;
};

const startEditAddress = (address) => {
    editingAddressId.value = address.addressId;
    addressPayload.value = {
        roadAddress: address.roadAddress || '',
        detailAddress: address.detailAddress || '',
        alias: address.alias || '',
        recipientName: address.recipientName || '',
        recipientTel: address.recipientTel || '',
        isDefault: '0',
        memberId: currentMemberId.value,
    };
    isAddingOrEditing.value = true;
};

// --- 배송지 등록/수정 처리 ---
const handleAddOrUpdateAddress = async () => {
    const payload = {  ...addressPayload.value, isDefault: addressPayload.value.isDefault};

    if (!payload.recipientName || !payload.roadAddress || !payload.recipientTel) {
        showDialog("⚠️주의", "필수 정보를 입력해주세요.");
        return;
    }

    isLoading.value = true;
    // payload.isDefault = payload.isDefault ? '1' : '0';
    try {
        const apiPayload = {
            ...payload,
            isDefault: payload.isDefault === 1 || payload.isDefault === '1' ? '1' : '0',
        }
        // 신규 추가 모드일 때만 기본 배송지 처리
        if(!editingAddressId.value && apiPayload.isDefault === '1') {
            //현재 등록된 기본 배송지를 찾음
            const existingDefault = addresses.value.find(addr => addr.isDefault == 1 || addr.isDefault === '1');

            if(existingDefault) {
                await editAddress(existingDefault.addressId, {
                    ...existingDefault,
                    isDefault: "0"
                });
            }
            
        }

        if (editingAddressId.value && apiPayload.isDefault === '1') {
            const existingDefault = addresses.value.find(addr => (addr.isDefault === 1 || addr.isDefault === '1') && addr.addressId !== editingAddressId.value);
            
            if (existingDefault) {
                await editAddress(existingDefault.addressId, {
                    ...existingDefault,
                    isDefault: "0"
                });
            }
        }

        if (editingAddressId.value) {
            await editAddress(editingAddressId.value, apiPayload);
            showDialog("✅안내", "배송지가 성공적으로 수정되었습니다.");
        } else {
            await addAddress(apiPayload);
            showDialog("✅안내", "배송지가 성공적으로 등록되었습니다.");
        }
        isAddingOrEditing.value = false;
        editingAddressId.value = null;
        addressPayload.value = {
            roadAddress: '',
            detailAddress: '',
            alias: '',
            recipientName: '',
            recipientTel: '',
            isDefault: '0',
            memberId: currentMemberId.value,
        };
        await fetchAddresses();
    } catch (e) {
        showDialog("🚫오류", "배송지 저장에 실패했습니다. 다시 시도해 주세요.")
        console.error('Save Address Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 배송지 삭제 처리 ---
const handleDeleteAddress = async (addressId) => {
    if (!confirm('⚠️ 선택한 배송지를 정말로 삭제하시겠습니까?')) {
        return;
    }
    isLoading.value = true;
    try {
        await deleteAddress(addressId);
        showDialog("✅안내", "배송지가 성공적으로 삭제되었습니다.");
        await fetchAddresses();
    } catch (e) {
        showDialog("🚫오류", "배송지 삭제에 실패했습니다. 다시 시도해 주세요.");
        console.error('Delete Address Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 기본 배송지 설정 처리 ---
const setPrimaryAddress = async (targetId) => {
    isLoading.value = true;
    try {
        // 기본 배송지로 설정
        await setDefaultAddress(currentMemberId.value, targetId);
        showDialog("✅안내", "기본 배송지가 변경되었습니다.");
        await fetchAddresses();
    } catch (e) {
        showDialog("🚫오류", "기본 배송지 변경에 실패했습니다. 다시 시도해 주세요.");
        console.error('Set Primary Address Error:', e);
    } finally {
        isLoading.value = false;
    }
};

// --- 카카오 주소 검색 연동 ---
const handleAddressSearch = () => {
    openAddressSearch((data) => {

    // 즉시 업데이트 (nextTick 제거)
    addressPayload.value.roadAddress = data.roadAddress || data.jibunAddress || '';
  });
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(fetchAddresses);
</script>

<template>
    <div class="content-page">
        <h1 class="page-title">
            <i class="fas fa-map-marked-alt mr-2"></i> 배송지 관리
        </h1>
        <p class="page-description">자주 사용하는 배송지를 등록하고 기본 주소를 설정할 수 있습니다.</p>

        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            배송지 정보를 불러오는 중...
        </div>

        <div v-else-if="error" class="error-state">
            ⚠️ {{ error }}
        </div>

        <!-- 1. 배송지 목록 (카드 뷰) -->
        <div v-else class="address-card-grid">
            
            <!-- 등록된 배송지 카드 -->
            <div 
                v-for="address in addresses" 
                :key="address.addressId" 
                :class="['address-card', { 'primary-card': address.isDefault == 1 }]"
            >
                <div class="card-header">
                    <span class="recipientName">{{ address.recipientName }}</span>
                    <span v-if="address.isDefault==1" class="badge-primary">기본 배송지</span>
                </div>
                <div class="card-body">
                    <p class="alias">
                        [ {{ address.alias }} ]
                    </p>
                    <p class="address-line-1">
                        {{ address.roadAddress }}
                    </p>
                    <p class="address-line-2">
                        {{ address.detailAddress }}
                    </p>
                    <p class="phone-number">
                        <i class="fas fa-phone-alt"></i> {{ address.recipientTel }}
                    </p>
                </div>
                <div class="card-actions">
                    <button @click="startEditAddress(address)" class="btn-edit">
                        수정
                    </button>
                    <button v-if="address.isDefault !='1'" @click="setPrimaryAddress(address.addressId)" class="btn-set-primary">
                        기본 설정
                    </button>
                    <button @click="handleDeleteAddress(address.addressId)" class="btn-delete">
                        삭제
                    </button>
                </div>
            </div>

            <!-- 새 배송지 등록 시작 버튼 -->
            <div v-if="!isAddingOrEditing" class="add-new-card" @click="startAddAddress">
                <i class="fas fa-plus-circle"></i>
                <p>새 배송지 추가하기</p>
            </div>
        </div>

        <!-- 2. 배송지 등록/수정 폼 -->
        <div v-if="isAddingOrEditing" class="register-form-container">
            <h3>{{ editingAddressId ? '배송지 수정' : '새 배송지 등록' }}</h3>
            <form @submit.prevent="handleAddOrUpdateAddress" class="address-form">
                
                <div class="form-row">
                    <div class="form-group flex-1">
                        <label for="recipientName">받는 사람 이름 *</label>
                        <input type="text" id="recipient" v-model="addressPayload.recipientName" required placeholder="예: 홍길동">
                    </div>
                    <div class="form-group flex-1">
                        <label for="recipientTel">연락처 *</label>
                        <input type="tel" id="phone" v-model="addressPayload.recipientTel" required placeholder="예: 010-1234-5678">
                    </div>
                </div>

                <div class="form-group">
                    <label for="alias">별칭</label>
                    <div class="flex-input-group">
                        <input type="text" id="alias" v-model="addressPayload.alias" placeholder="별칭">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="roadAddress">기본 주소 *</label>
                    <div class="flex-input-group">
                        <input type="text" id="roadAddress" v-model="addressPayload.roadAddress" required placeholder="도로명 또는 지번 주소" readonly>
                        <button type="button" class="btn-zipcode-search" @click="handleAddressSearch">주소 검색</button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="detailAddress">상세 주소</label>
                    <input type="text" id="detailAddress" v-model="addressPayload.detailAddress" placeholder="아파트/동/호수 등">
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-submit" :disabled="isLoading">
                        {{ editingAddressId ? '수정 완료' : '등록하기' }}
                    </button>
                    <button type="button" @click="isAddingOrEditing = false" class="btn-cancel">
                        취소
                    </button>
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
.address-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

/* --- 배송지 카드 스타일 --- */
.address-card {
    background-color: #f7f9fc;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s, box-shadow 0.2s;
    min-height: 250px;
}

.address-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.primary-card {
    border: 2px solid #ff7b00; /* 주황색 계열로 변경하여 차별화 */
    background-color: #fff8f0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 1px dashed #eee;
}

.recipientName {
    font-size: 1.2rem;
    font-weight: 700;
    color: #333;
}

.badge-primary {
    background-color: #ff7b00;
    color: white;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 0.75rem;
    font-weight: 500;
}

.card-body p {
    margin: 4px 0;
    font-size: 0.95rem;
    color: #555;
}

.alias {
    font-weight: 600;
    color: #007bff;
    margin-bottom: 10px !important;
}

.address-line-1 {
    font-weight: 500;
}
.address-line-2 {
    color: #777;
    margin-bottom: 15px !important;
}
.phone-number {
    font-style: italic;
    color: #666;
}

.card-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

/* 버튼 스타일 */
.btn-edit, .btn-delete, .btn-set-primary {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.2s;
    font-weight: 500;
}

.btn-edit {
    background-color: #007bff;
    color: white;
}
.btn-edit:hover { background-color: #0056b3; }

.btn-delete {
    background-color: #dc3545;
    color: white;
}
.btn-delete:hover { background-color: #c82333; }

.btn-set-primary {
    background-color: #ffc107;
    color: #333;
}
.btn-set-primary:hover { background-color: #e0a800; }


/* --- 새 배송지 등록 카드 --- */
.add-new-card {
    border: 2px dashed #ccc;
    background-color: #fff;
    border-radius: 10px;
    min-height: 250px;
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

.form-row {
    display: flex;
    gap: 15px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group.flex-1 {
    flex: 1;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 5px;
    color: #555;
    font-size: 0.9rem;
}

.form-group input[type="text"], 
.form-group input[type="tel"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 1rem;
}

.flex-input-group {
    display: flex;
    gap: 10px;
}

.flex-input-group input {
    flex: 1;
}

.btn-zipcode-search {
    padding: 10px 15px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    white-space: nowrap;
}
.btn-zipcode-search:hover { background-color: #5a6268; }

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
    background-color: #28a745;
    color: white;
}

.btn-submit:hover {
    background-color: #1e7e34;
}

.btn-cancel {
    background-color: #6c757d;
    color: white;
}

.btn-cancel:hover {
    background-color: #5a6268;
}

/* 로딩/에러 상태 (결제 계좌와 동일) */
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

/* 커스텀 체크박스 스타일 */
.checkbox-container {
  display: block;
  position: relative;
  padding-left: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
  font-weight: normal;
  color: #555;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: #eee;
  border-radius: 3px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #ccc;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #ff7b00;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

@media (max-width: 600px) {
    .form-row {
        flex-direction: column;
        gap: 0;
    }
    .flex-input-group {
        flex-direction: column;
    }
    .btn-zipcode-search {
        width: 100%; /* 모바일에서 주소 검색 버튼 너비 확보 */
    }
}
</style>
