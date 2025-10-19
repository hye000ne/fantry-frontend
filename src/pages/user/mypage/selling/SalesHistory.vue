<script setup>
  /* 판매 내역 페이지 */
  
  import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/userStore';
  import { getAuctionsByMemberAndStatus } from '@/api/auction';
   import { currencyCol } from '@/composables/useDataTableColumns';

  const router = useRouter();
  const keyword = ref('');
  const dataTableRef = ref(null);

  // 테이블 컬럼 정의 (판매 내역에 맞게 수정)
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
        //긴 상품 이름은 10자 이내로 요약하여 보여지기
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


  // 날짜 포맷 함수
  const formatDate = (dateArray) => {
    if (!dateArray || dateArray.length < 5) return 'N/A';
    const [year, month, day, hour, minute] = dateArray;
    const date = new Date(year, month - 1, day, hour, minute);
    const pad = (num) => String(num).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  // 라벨 한글화 (판매 상태에 맞게 수정)
  const statusLabel = (status) => {
    if (!status) return '기타';
    const s = String(status).toUpperCase();
    switch (s) {
      case 'SOLD': return '판매 완료';
      case 'NOT_SOLD': return '유찰';
      case 'CANCELLED': return '판매 취소';
      default: return status;
    }
  };
  const typeLabel = (type) => {
    if(!type) return '기타';
    const s = String(type).toUpperCase();
    switch(s) {
      case 'AUCTION': return '경매';
      case 'INSTANT_BUY': return '바로구매';
      default: return type;
    }
  }

  // 라벨 클래스 지정
  const statusClass = (status) => {
    const s = (status || '').toString().toUpperCase();
    return {
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

  // 데이터 패치 함수
  async function fetchSalesHistory({ page, size, sort, keyword }) {
    const userStore = useUserStore();
    const memberId = userStore.currentUser?.memberId;

    if (!memberId) {
      console.error("Member ID not found. User might not be logged in.");
      return { rows: [], total: 0 }; // 데이터가 없음을 반환
    }

    try {
      // 판매 내역 리스트 요청 (SOLD 상태)
      const res = await getAuctionsByMemberAndStatus({ memberId: memberId, saleStatus: 'SOLD' });
      let allSales = res.data;

      // 검색 필터링 (필요 시)
      if (keyword) {
        allSales = allSales.filter(sale =>
          sale.itemName.includes(keyword)
        );
      }

      // 정렬
      if (sort) {
        const [column, dir] = sort.split(',');
        allSales.sort((a, b) => {
          const aValue = getNestedValue(a, column);
          const bValue = getNestedValue(b, column);
          const compare = aValue > bValue ? 1 : -1;
          return dir === 'asc' ? compare : -compare;
        });
      }

      // 페이징
      const start = (page - 1) * size;
      const rows = allSales.slice(start, start + size);

      return {
        rows,
        total: allSales.length
      };
    } catch (error) {
      console.error("Error fetching sales history:", error);
      return { rows: [], total: 0 }; // 에러 발생 시 빈 데이터 반환
    }
  }

  // 중첩된 속성 접근 유틸
  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  // onMounted에서 이벤트 위임을 사용하여 클릭 리스너 설정
  onMounted(() => {
    if (dataTableRef.value && dataTableRef.value.$el) {
      dataTableRef.value.$el.addEventListener('click', (e) => {
        const link = e.target.closest('.sale-link');
        if (link && link.dataset.auctionId) {
          const auctionId = link.dataset.auctionId;
          router.push({ name: 'ProductDetail', params: { id: auctionId } });
        }
      });
    }
  });
</script>

<template>
  <div class="content-page">
    <h1 class="page-title">
      <i class="fa-solid fa-money-check-dollar"></i> 판매 내역
    </h1>
    <p class="page-description">나의 판매 내역을 여기서 확인할 수 있습니다.</p>

    <div>
      <ServerDataTable
        ref="dataTableRef"
        v-model:keyword="keyword"
        :columns="columns"
        :fetcher="fetchSalesHistory"
        :page-size="10"
      >
        <!-- 데이터가 없을 때 -->
        <template #empty>판매 내역이 없습니다.</template>
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
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

  :deep(.badge) {
    display: inline-block;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 12px;
    color: #fff;
    text-align: center;
  }

  :deep(.badge-preparing) { background-color: #6c757d; }
  :deep(.badge-sold) { background-color: #28a745; }
  :deep(.badge-cancelled) { background-color: #dc3545; }
  :deep(.badge-secondary) { background-color: #a0a0a0; }
  :deep(.badge-auction) { background-color: #007bff; }
  :deep(.badge-instant-buy) { background: #28a745; }

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
