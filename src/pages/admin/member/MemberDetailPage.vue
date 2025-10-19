<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">회원 상세 정보</h1>
      <button class="btn btn-secondary" @click="gotoList">
        목록으로
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="member" class="card">
      <div class="card-body">
        <table class="table table-bordered">
          <tbody>
            <tr>
              <th class="bg-light" style="width: 200px">회원번호</th>
              <td>{{ member.memberId }}</td>
            </tr>
            <tr>
              <th class="bg-light">아이디</th>
              <td>{{ member.id }}</td>
            </tr>
            <tr>
              <th class="bg-light">이름</th>
              <td>{{ member.name }}</td>
            </tr>
            <tr>
              <th class="bg-light">이메일</th>
              <td>{{ member.email }}</td>
            </tr>
            <tr>
              <th class="bg-light">전화번호</th>
              <td>{{ member.tel }}</td>
            </tr>
            <tr>
              <th class="bg-light">가입일</th>
              <td>{{ formatDate(member.createAt) }}</td>
            </tr>
            <tr>
              <th class="bg-light">탈퇴일</th>
              <td>{{ member.leavedAt ? formatDate(member.leavedAt) : '-' }}</td>
            </tr>
            <tr>
              <th class="bg-light">활성화 상태</th>
              <td>
                <span 
                  class="badge" 
                  :class="member.isActive === 0 ? 'badge-success' : 'badge-secondary'"
                >
                  {{ member.isActive === 0 ? '활성' : '비활성' }}
                </span>
              </td>
            </tr>
            <tr>
              <th class="bg-light">권한</th>
              <td>
                <span class="badge badge-info">{{ member.roleType }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <button class="bottom btn btn-success" @click="editMember">수정하기</button>
        <button class="bottom btn btn-danger" @click="deleteMember">삭제하기</button>
      </div>
    </div>

    <div v-else class="alert alert-warning">
      회원 정보를 찾을 수 없습니다.
    </div>
  </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { getMemberDetail, deactiveateMember } from '@/api/member';
    import { useAlertDialog } from '@/composables/useAlertDialog';

    const { showAlert: showDialog } = useAlertDialog();
    const route = useRoute();
    const router = useRouter();

    const member = ref(null);
    const loading = ref(true);

    onMounted(async () => {
        try {
            const memberId = route.params.memberId;
            const res = await getMemberDetail(memberId);
            member.value = res.data.member;
        } catch (error) {
            console.error('회원 정보 조회 실패:', error);
        } finally {
            loading.value = false;
        }
    });

    const gotoList = () => {
      router.push("/admin/member/list");
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    //회원 정보 수정 함수
    function editMember() {
        if (!member.value) return;
        router.push({ 
            name: 'AdminMemberEdit', 
            params: { memberId: member.value.id }
        });
    }

    // 회원 삭제 함수
    async function deleteMember() {
        if (!member.value) return;
        if (confirm('정말로 이 회원을 삭제하시겠습니까?')) {
            // 삭제 API 호출
            try{
              const res = await deactiveateMember(member.value.id);
              if (res.status === 200) {
                  showDialog("✅안내", "회원이 비활성화 되었습니다.");
                  router.push({ name: 'AdminMemberList' });
              } else {
                  showDialog("🚫오류", "회원 삭제에 실패했습니다.");
              }
            } catch(error) {
              console.error('삭제 중 오류 발생:', error.message);
              showDialog("🚫오류", "회원 삭제 중 오류가 발생했습니다.");
            }
        }
    }
</script>
<style scoped>
  .bottom {
    margin-top: 10px;
    margin-right: 10px;
  }
</style>