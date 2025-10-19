<script setup>
  /* 등록 상품 내역 페이지 */
  
  import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/userStore';
  import { getAuctionsByMember } from '@/api/auction';
  import { currencyCol } from '@/composables/useDataTableColumns';

  const router = useRouter();
  const keyword = ref('');
  const currentMemberId = ref('');

  // memberId 가져오기
  const userStore = useUserStore();
  currentMemberId.value = userStore.currentUser.memberId;

  //테이블 컬럼 정의 -- DTO에 맞게 수정 필요
  const columns = [
    {
      data: 'auctionId',
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
        //긴 상품 이름은 6자 이내로 요약하여 보여지기
        const summary = data.length > 6 ? data.substring(0,6) + '...': data;
        return `<span class="auction-link" data-auction-id="${row.auctionId}" style=""color: blue; cursor: pointer; text-decoration: underline;">${summary}</span>`;
      }
    },
    {
      ...currencyCol('startPrice', '시작가'),
      sortable: true,
    },
    {
      ...currencyCol('currentPrice', '현재가'),
      sortable: true,
    },
    {
      data: 'saleStatus',
      title: '상태',
      sortable: true,
      render: (data) => {
        const label = statusLabel(data);
        const classes = Object.entries(statusClass(data))
          .filter(([k, v]) => v)
          .map(([k, _]) => k)
          .join(' ');
        return `<span class="badge ${classes}">${label}</span>`;
      }  
    },
    {
      data: 'saleType',
      title: '유형',
      sortable: true,
      render: (data) => {
        const label = typeLabel(data);
        const classes = Object.entries(typeClass(data))
          .filter(([k, v]) => v)
          .map(([k, _]) => k)
          .join(' ');
        return `<span class="badge ${classes}">${label}</span>`;
      }
    },
    {
      data: 'startTime',
      title: '시작일',
      sortable: true,
      render: (data) => {
        return formatDate(data);
      }
    },
    {
      data: 'endTime',
      title: '종료일',
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

  //라벨 한글화
  const statusLabel = (status) => {
    if(!status) return '기타';
    const s = String(status).toUpperCase();
    switch(s) {
      case 'PREPARING': return '판매 준비중';
      case 'ACTIVE': return '판매 중';
      case 'SOLD': return '판매 완료';
      case 'NOT_SOLD': return '유찰 or 판매 안됨';
      case 'CANCELLED': return '판매 취소';
      default: return status;
    }
  }

  const typeLabel = (type) => {
    if(!type) return '기타';
    const s = String(type).toUpperCase();
    switch(s) {
      case 'AUCTION': return '경매';
      case 'INSTANT_BUY': return '바로구매';
      default: return type;
    }
  }

  //라벨 클래스 지정
  const statusClass = (status) => {
    const s = (status || '').toString().toUpperCase();
    return {
      'badge-preparing': s === 'PREPARING',
      'badge-active': s === 'ACTIVE',
      'badge-sold': s === 'SOLD',
      'badge-not-sold': s === 'NOT_SOLD',
      'badge-cancelled': s === 'CANCELLED'
    };
  }

  const typeClass = (type) => {
    const s = (type || '').toString().toUpperCase();
    return {
      'badge-auction': s === 'AUCTION',
      'badge-instant-buy': s === 'INSTANT_BUY'
    };
  }

  //패치
  async function fetchAuction({page, size, sort, keyword}) {
    //여기에 모든 경매 리스트 요청
    const res = await getAuctionsByMember(currentMemberId.value);
    let allAuctions = res.data;

    //검색 필터링
    if(keyword) {
      allAuctions = allAuctions.filter(m => 
      //컬럼에 맞게 수정 필요!!
        m.name.includes(keyword) ||
        m.auctionTitle.includes(keyword)
      );
    }

    //정렬
    if(sort) {
      const [column, dir] = sort.split(',');
      allAuctions.sort((a, b) => {
        const aValue = getNestedValue(a, column);
        const bValue = getNestedValue(b, column);
        const compare = aValue > bValue ? 1: -1;
        return dir === 'asc' ? compare : -compare;
      });
    }

    //페이징
    const start = (page - 1) * size;
    const rows = allAuctions.slice(start, start + size);

    return {
      rows,
      total: allAuctions.length
    };
  }

  // 중첩된 속성 접근 유틸
  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  } 


</script>
<template>
  <div class="content-page">
    <h1 class="page-title">
      <i class="fa-solid fa-store"></i> 등록 상품 내역
    </h1>
    <p class="page-description">내가 등록한 상품을 여기서 확인할 수 있습니다.</p>

    <div>
      <ServerDataTable
        v-model:keyword="keyword"
        :columns="columns"
        :fetcher="fetchAuction"
        :page-size="10"
        @loaded="attachClickHandlers"
      >

      <!-- 데이터가 없을 때 -->
      <template #empty>등록한 상품이 없습니다.</template>

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
  :deep(.badge-preparing) { 
    background-color: #6c757d; 
  }
  
  :deep(.badge-active) { 
    background-color: #007bff; 
  }
  
  :deep(.badge-not-sold) { 
    background-color: #ffc107; 
    color: #000; 
  }
  
  :deep(.badge-cancelled) { 
    background-color: #dc3545; 
  }
  
  :deep(.badge-sold) { 
    background-color: #28a745; 
  }

  :deep(.badge-auction) { 
    background-color: #007bff; 
  }
  
  :deep(.badge-instant-buy) { 
    background-color: #28a745; 
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