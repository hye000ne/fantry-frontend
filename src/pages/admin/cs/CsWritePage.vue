<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createNotice } from '@/api/adminNotice.js';
import { createFaq } from '@/api/adminFaq.js';
import CommonEditor from '@/components/common/organisms/CommonEditor.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const route = useRoute();
const router = useRouter();
const { showAlert: showAlertDialog } = useAlertDialog();

const type = ref('');
const post = ref({
  title: '',
  content: '',
  status: 'ACTIVE', // 기본값
  csTypeId: 3, // 기본값 '기타문의'
});

const typeOptions = [
  { id: 1, name: '배송문의' },
  { id: 2, name: '결제문의' },
  { id: 3, name: '기타문의' },
  { id: 4, name: '상품문의' },
  { id: 5, name: '환불/반품 문의' },
  { id: 6, name: '판매 문의' },
];

const error = ref(null);

const pageTitle = computed(() => {
  switch (type.value) {
    case 'notice':
      return '새 공지사항 작성';
    case 'faq':
      return '새 FAQ 작성';
    case 'inquiry':
      return '새 문의 작성';
    default:
      return '새 글 작성';
  }
});

const listPageName = computed(() => {
  switch (type.value) {
    case 'notice':
      return 'AdminNoticeList';
    case 'faq':
      return 'AdminFaqList';
    case 'inquiry':
      return 'AdminInquiryList';
    default:
      return 'AdminDashboard';
  }
});

async function handleSubmit() {
  if (!post.value.title || !post.value.content) {
    showAlertDialog('알림', '제목과 내용을 모두 입력해주세요.');
    return;
  }

  try {
    let response;
    switch (type.value) {
      case 'notice':
        response = await createNotice(post.value);
        break;
      case 'faq':
        response = await createFaq(post.value);
        break;
      case 'inquiry':
        // TODO: Admin Inquiry Create API does not exist yet.
        showAlertDialog('오류', '문의 등록 API가 아직 구현되지 않았습니다.');
        return;
      default:
        showAlertDialog('오류', '잘못된 타입입니다.');
        return;
    }
    showAlertDialog('성공', '성공적으로 등록되었습니다.');
    router.push({ name: listPageName.value });
  } catch (e) {
    console.error('등록 실패:', e);
    error.value = '등록 중 오류가 발생했습니다.';
    showAlertDialog('오류', error.value);
  }
}

function goToList() {
  router.push({ name: listPageName.value });
}

onMounted(() => {
  type.value = route.query.type;
  if (!['notice', 'faq', 'inquiry'].includes(type.value)) {
    showAlertDialog('경고', '잘못된 접근입니다.');
    router.back();
  }
});
</script>

<template>
  <div class="container-fluid p-4">
    <div class="card shadow-sm">
      <div class="card-header">
        <h5 class="card-title mb-0">{{ pageTitle }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="post-title" class="form-label">제목</label>
            <input type="text" id="post-title" class="form-control" v-model="post.title" required>
          </div>

          <div class="mb-3">
            <label for="post-type" class="form-label">유형</label>
            <select id="post-type" class="form-select" v-model="post.csTypeId" required>
              <option v-for="type in typeOptions" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">내용</label>
            <CommonEditor v-model="post.content" />
          </div>

          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" @click="goToList">취소</button>
            <button type="submit" class="btn btn-primary">등록</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
