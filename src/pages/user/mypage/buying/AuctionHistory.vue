<script setup>
  /* 경매 입찰 내역 페이지 */
  
  import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/userStore';
  import { getBidsByMemberId } from '@/api/bid';
  import { currencyCol } from '@/composables/useDataTableColumns';

  const router = useRouter();
  const keyword = ref('');
  const isLoading = ref(false);
  const currentMemberId = ref('');

  // memberId 가져오기
  const userStore = useUserStore();
  currentMemberId.value = userStore.currentUser.memberId;

  //테이블 컬럼 정의
  const columns = [
    {
      data: 'bidId',
      title: 'No.',
      sortable: false,
      render: (data, type, row, meta) => {
        return meta.row + 1 + (meta.settings._iDisplayStart || 0);
      }
    },
    {
      data: 'itemName',
      title: '상품명',
      sortable: false,
      render: (data, type, row) => {
        const summary = data.length > 6 ? data.substring(0,6) + '...': data;
        return `<span class="auction-link" data-auction-id="${row.itemId}" style="color: blue; cursor: pointer; text-decoration: underline;">${summary}</span>`;
      }
    },
    {
      ...currencyCol('bidAmount', '입찰가'),
      sortable: true,
    },
    {
      data: 'bidderName',
      title: '입찰인',
      sortable: true,
    },
    {
      data: 'bidAt',
      title: '입찰 시간',
      sortable: true,
      render: (data) => {
        return formatDate(data);
      }
    }
  ].map(col => ({...col,
    className: 'text-center',
  }));

  //날짜 포맷 문자열
  const formatDate = (dateArray) => {
      if(!dateArray || dateArray.length < 5) return 'N/A';
      const [year, month, day, hour, minute] = dateArray;
      const date = new Date(year, month-1, day, hour, minute);
      const pad = (num) => String(num).padStart(2, '0');
      return `${year}-${pad(month)}-${pad(day)}`;
  }

  //패치
  async function fetchBids({page, size, sort, keyword}) {
    const res = await getBidsByMemberId(currentMemberId.value);
    let allBids = res.data;

    //검색 필터링
    if(keyword) {
      allBids = allBids.filter(b => 
        b.auction.itemName.includes(keyword)
      );
    }

    //정렬
    if(sort) {
      const [column, dir] = sort.split(',');
      allBids.sort((a, b) => {
        const aValue = getNestedValue(a, column);
        const bValue = getNestedValue(b, column);
        const compare = aValue > bValue ? 1: -1;
        return dir === 'asc' ? compare : -compare;
      });
    }

    //페이징
    const start = (page - 1) * size;
    const rows = allBids.slice(start, start + size);

    return {
      rows,
      total: allBids.length
    };
  }

  // 중첩된 속성 접근 유틸
  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  } 

  // 상품명 클릭 시 해당 경매 상세 페이지로 이동
  onMounted(() => {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('.auction-link');
      if (target) {
        const auctionId = target.dataset.auctionId;
        if (auctionId) {
          router.push(`/product/${auctionId}`);
        }
      }
    });
  });

</script>
<template>
  <div class="content-page">
    <h1 class="page-title">
      <i class="fa-solid fa-gavel"></i> 경매 입찰 내역
    </h1>
    <p class="page-description">내가 입찰한 경매 내역을 여기서 확인할 수 있습니다.</p>

    <div>
      <ServerDataTable
        v-model:keyword="keyword"
        :columns="columns"
        :fetcher="fetchBids"
        :page-size="10"
      >

      <!-- 데이터가 없을 때 -->
      <template #empty>입찰한 경매가 없습니다.</template>

      </ServerDataTable>
    </div>

  </div>
</template>
<style scoped>
  .content-page {
  max-width: 900px;
  margin: 20px auto;
  padding: 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
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

/* 배지 기본 스타일 */
  :deep(.badge) {
    display: inline-block;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 12px;
    color: #fff;
    text-align: center;
  }

  /* 상태별 배지 색상 */
  :deep(.badge-pending) { 
    background-color: #6c757d; 
  }
  
  :deep(.badge-successful) { 
    background-color: #28a745; 
  }
  
  :deep(.badge-failed) { 
    background-color: #dc3545; 
  }

  /* 작은 화면에서 스크롤바 스타일링 */
  :deep(table) {
    white-space: nowrap !important;
    padding: 8px 12px;
  }

  .table-responsive-wrapper::-webkit-scrollbar {
    height: 8px;
  }

  .table-responsive-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .table-responsive-wrapper::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .table-responsive-wrapper::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

</style>
