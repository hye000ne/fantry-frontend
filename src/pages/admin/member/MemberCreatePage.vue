<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">회원 추가</h1>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="createMember">
          <div class="row mb-3">
            <label for="id" class="col-sm-3 col-form-label">
              아이디 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <input 
                type="text" 
                id="id"
                v-model="form.id" 
                class="form-control"
                placeholder="영문, 숫자 조합 (4-20자)"
                required
                minlength="4"
                maxlength="20"
              />
              <small class="text-muted">영문, 숫자 조합으로 4-20자 사이로 입력하세요.</small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="password" class="col-sm-3 col-form-label">
              비밀번호 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <input 
                type="password" 
                id="password"
                v-model="form.password" 
                class="form-control"
                placeholder="8자 이상 입력"
                required
                minlength="8"
              />
              <small class="text-muted">8자 이상 입력하세요.</small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="passwordConfirm" class="col-sm-3 col-form-label">
              비밀번호 확인 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <input 
                type="password" 
                id="passwordConfirm"
                v-model="passwordConfirm" 
                class="form-control"
                placeholder="비밀번호 재입력"
                required
                minlength="8"
              />
              <small v-if="passwordConfirm && form.password !== passwordConfirm" class="text-danger">
                비밀번호가 일치하지 않습니다.
              </small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="name" class="col-sm-3 col-form-label">
              이름 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <input 
                type="text" 
                id="name"
                v-model="form.name" 
                class="form-control"
                placeholder="이름 입력"
                required
              />
            </div>
          </div>

          <div class="row mb-3">
            <label for="email" class="col-sm-3 col-form-label">
              이메일 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <input 
                type="email" 
                id="email"
                v-model="form.email" 
                class="form-control"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <div class="row mb-3">
            <label for="tel" class="col-sm-3 col-form-label">
              전화번호 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <input 
                type="tel" 
                id="tel"
                v-model="form.tel" 
                class="form-control"
                placeholder="010-1234-5678"
                required
              />
            </div>
          </div>

          <div class="row mb-3">
            <label for="roleId" class="col-sm-3 col-form-label">
              권한 <span class="text-danger">*</span>
            </label>
            <div class="col-sm-9">
              <select 
                id="roleId"
                v-model.number="form.roleId" 
                class="form-control"
                required>
                <option value="" disabled>권한을 선택하세요</option>
                <option :value="roleMap.USER">일반 회원 (USER)</option>
                <option :value="roleMap.RUSER">제한된 회원 (RUSER)</option>
              </select>
              <small class="text-muted">일반 회원과 제한된 회원만 등록할 수 있습니다.</small>
            </div>
          </div>

          <hr class="my-4">

          <div class="d-flex justify-content-end">
            <button type="button" class="bottom btn btn-secondary me-2" @click="router.back()">취소</button>
            <button type="submit" class="bottom btn btn-primary" :disabled="saving || !isPasswordValid">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? '등록 중...' : '회원 추가' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useRouter } from 'vue-router';
    import { registMember } from '@/api/member';
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const { showAlert: showDialog } = useAlertDialog();
    const router = useRouter();

    const form = ref({
        id: '',
        password: '',
        name: '',
        email: '',
        tel: '',
        sns: '',
        roleId: ''
    });

    const passwordConfirm = ref('');
    const saving = ref(false);

    // roleType과 roleId 매핑
    const roleMap = {
        USER: 3,
        RUSER: 4
    };

    // 비밀번호 유효성 검사
    const isPasswordValid = computed(() => {
    return form.value.password === passwordConfirm.value && 
            form.value.password.length >= 8;
    });

    async function createMember() {
        if (!form.value) return;
        
        // 비밀번호 확인
        if (form.value.password !== passwordConfirm.value) {
            showDialog("⚠️주의", "비밀번호가 일치하지 않습니다.");
            return;
        }

        // roleId 확인
        if (!form.value.roleId) {
            showDialog("⚠️주의", "권한을 선택해주세요.");
            return;
        }

        if (!confirm('회원을 추가하시겠습니까?')) {
            return;
        }

        try {
            saving.value = true;

            const res = await registMember({
                id: form.value.id,
                password: form.value.password,
                name: form.value.name,
                email: form.value.email,
                tel: form.value.tel,
                sns: form.value.sns || null,
                roleId: form.value.roleId
            });

            console.log('회원 추가 응답:', res);

            if (res.status === 200) {
                showDialog("✅안내", "회원이 추가되었습니다.");
                router.push({ name: 'AdminMemberList' });
            } else {
                showDialog("🚫오류", `${res.data || '알 수 없는 오류'} 로 인해 회원 추가에 실패했습니다.`);
            }
        } catch (error) {
            console.error('회원 추가 중 오류 발생:', error);
            showDialog("🚫오류", "회원 추가 중 오류가 발생했습니다.");
        } finally {
            saving.value = false;
        }
    }
</script>

<style scoped>
    .form-control:focus {
    border-color: #4e73df;
    box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }

    .text-danger {
    font-weight: bold;
    }

    label {
    font-weight: 500;
    }
    .bottom {
        margin-left: 10px;
    }
</style>