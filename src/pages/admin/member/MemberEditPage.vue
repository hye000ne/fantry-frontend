<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">회원 정보 수정</h1>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="form" class="card">
      <div class="card-body">
        <form @submit.prevent="updateMember">
          <table class="table table-bordered">
            <tbody>
              <tr>
                <th class="bg-light" style="width: 200px">회원번호</th>
                <td>{{ originalMember.memberId }}</td>
              </tr>
              <tr>
                <th class="bg-light">
                  <label for="id" class="mb-0">아이디 <span class="text-danger">*</span></label>
                </th>
                <td>
                  <input 
                    type="text" 
                    id="id"
                    v-model="form.id" 
                    class="form-control"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th class="bg-light">
                  <label for="name" class="mb-0">이름 <span class="text-danger">*</span></label>
                </th>
                <td>
                  <input 
                    type="text" 
                    id="name"
                    v-model="form.name" 
                    class="form-control"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th class="bg-light">
                  <label for="email" class="mb-0">이메일 <span class="text-danger">*</span></label>
                </th>
                <td>
                  <input 
                    type="email" 
                    id="email"
                    v-model="form.email" 
                    class="form-control"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th class="bg-light">
                  <label for="tel" class="mb-0">전화번호 <span class="text-danger">*</span></label>
                </th>
                <td>
                  <input 
                    type="tel" 
                    id="tel"
                    v-model="form.tel" 
                    class="form-control"
                    placeholder="010-1234-5678"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th class="bg-light">가입일</th>
                <td class="text-muted">{{ formatDate(originalMember.createAt) }}</td>
              </tr>
              <tr>
                <th class="bg-light">탈퇴일</th>
                <td class="text-muted">{{ leavedAtDisplay }}</td>
              </tr>
              <tr>
                <th class="bg-light">
                  <label for="isActive" class="mb-0">활성화 상태 <span class="text-danger">*</span></label>
                </th>
                <td>
                  <select 
                    id="isActive"
                    v-model.number="form.isActive" 
                    class="form-control"
                    required
                  >
                    <option :value="0">활성</option>
                    <option :value="1">비활성</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th class="bg-light">권한</th>
                <td>
                  <span class="badge badge-info">{{ originalMember.roleType }}</span>
                  <small class="text-muted d-block mt-1">권한은 수정할 수 없습니다.</small>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="mt-3">
            <button type="submit" class="bottom btn btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              저장
            </button>
            <button type="button" class="bottom btn btn-secondary ms-2" @click="router.back()">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-else class="alert alert-warning">
      회원 정보를 찾을 수 없습니다.
    </div>
  </div>
</template>

<script setup>
    import { ref, computed, watch, onMounted } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { updateOneMember, getMemberDetail } from '@/api/member';
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const { showAlert: showDialog } = useAlertDialog();
    const route = useRoute();
    const router = useRouter();

    const originalMember = ref(null);
    const form = ref(null);
    const loading = ref(true);
    const saving = ref(false);
    const leavedAt = ref(null);

    onMounted(async () => {
    try {
        const memberId = route.params.memberId;
        const res = await getMemberDetail(memberId);
        originalMember.value = res.data.member;
        
        // 기존 탈퇴일 저장
        leavedAt.value = originalMember.value.leavedAt;
        
        // 수정 가능한 필드만 form에 복사
        form.value = {
        id: originalMember.value.id,
        name: originalMember.value.name,
        tel: originalMember.value.tel,
        email: originalMember.value.email,
        isActive: originalMember.value.isActive
        };
    } catch (error) {
        console.error('회원 정보 조회 실패:', error);
        showDialog("🚫오류", "회원 정보를 불러오는데 실패했습니다.");
    } finally {
        loading.value = false;
    }
    });

    // isActive 값이 변경될 때 탈퇴일 자동 설정
    watch(() => form.value?.isActive, (newValue) => {
    if (newValue === 1) {
        // 비활성(1)으로 변경 시 오늘 날짜로 설정
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const seconds = String(today.getSeconds()).padStart(2, '0');
        leavedAt.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else if (newValue === 0) {
        // 활성(0)으로 변경 시 탈퇴일 제거
        leavedAt.value = null;
    }
    });

    const leavedAtDisplay = computed(() => {
    return leavedAt.value ? formatDate(leavedAt.value) : '-';
    });

    async function updateMember() {
      if (!form.value) return;
      
      if (!confirm('회원 정보를 수정하시겠습니까?')) {
          return;
      }

      try {
          saving.value = true;
          

          const res = await updateOneMember(originalMember.value.id, {
              ...form.value
          });

          if (res.status === 200) {
          showDialog("✅안내", "회원 정보가 수정되었습니다.");
          router.push({ 
              name: 'AdminMemberDetail', 
              params: { memberId: originalMember.value.id } 
          });
          } else {
            showDialog("🚫오류", `${res.message || '알 수 없는 오류'} 로 인해 회원 정보 수정에 실패했습니다.`);
          }
      } catch (error) {
          console.error('수정 중 오류 발생:', error);
          showDialog("🚫오류", "회원 정보 수정 중 오류가 발생했습니다.");
      } finally {
          saving.value = false;
      }
    }

    function formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR');
    }
</script>

<style scoped>
    .form-control:focus {
    border-color: #4e73df;
    box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }

    th.bg-light {
    background-color: #f8f9fc !important;
    }

    .text-danger {
    font-weight: bold;
    }
    .bottom {
    margin-right: 10px;
    }
</style>