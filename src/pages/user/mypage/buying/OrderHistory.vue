<script setup>
  /* 주문 내역 페이지 */
  
  import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/userStore';
  import { getOrders } from '@/api/order';
  import { currencyCol } from '@/composables/useDataTableColumns';
  import OrderDetailHistory from './OrderDetailHistory.vue';

  const router = useRouter();
  const keyword = ref('');
  const currentMemberId = ref('');
  const showForm = ref(false);

  //모달 상태
  const showDetail = ref(false);
  const selectedOrderId = ref(null);

  // memberId 가져오기
  const userStore = useUserStore();
  currentMemberId.value = userStore.currentUser.memberId;

  //테이블 컬럼 정의
  const columns = [
    {
      data: 'ordersId',
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
        const summary = data && data.length > 6 ? data.substring(0,6) + '...': data;
        return `<span class="detail-link" data-detail-id="${row.ordersId}" style="color: blue; cursor: pointer; text-decoration: underline;">${summary}</span>`;
      }
    },
    {
      ...currencyCol('price', '주문금액'),
      sortable: true
    },
    {
      data: 'orderedAt',
      title: '주문일',
      sortable: true,
      render: (data) => {
        return formatDate(data);
      }
    },
    {
      data: 'saleType',
      title: '판매유형',
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
      data: 'orderStatus',
      title: '주문상태',
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
      data: null,
      title: '관리',
      sortable: false,
      render: (data, type, row) => {
        return `<button class="btn btn-outline-danger btn-sm refund-link" data-order-id="${row.ordersId}">환불 신청</button>`;
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
    if (!status) return '기타';
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PENDING_PAYMENT': return '결제 대기중';
      case 'PAID': return '결제 완료';
      case 'PREPARING_SHIPMENT': return '배송 대기중';
      case 'SHIPPED': return '배송 중';
      case 'DELIVERED': return '배송 완료';
      case 'CONFIRMED': return '구매 확정';
      case 'CANCEL_REQUESTED': return '취소 요청';
      case 'CANCELLED': return '취소 완료';
      case 'REFUND_REQUESTED': return '환불 요청';
      case 'REFUNDED': return '환불 완료';
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
      'badge-pending': s === 'PENDING_PAYMENT',
      'badge-paid': s === 'PAID',
      'badge-preparing': s === 'PREPARING_SHIPMENT',
      'badge-shipped': s === 'SHIPPED',
      'badge-delivered': s === 'DELIVERED',
      'badge-confirmed': s === 'CONFIRMED',
      'badge-cancel-requested': s === 'CANCEL_REQUESTED',
      'badge-cancelled': s === 'CANCELLED',
      'badge-refund-requested': s === 'REFUND_REQUESTED',
      'badge-refunded': s === 'REFUNDED'
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
  async function fetchOrders({page, size, sort, keyword}) {
    const res = await getOrders({
      memberId: currentMemberId.value
    });
    let allOrders = res.data.content;

    //검색 필터링
    if(keyword) {
      allOrders = allOrders.filter(o => 
        o.itemName.includes(keyword)
      );
    }

    //정렬
    if(sort) {
      const [column, dir] = sort.split(',');
      allOrders.sort((a, b) => {
        const aValue = getNestedValue(a, column);
        const bValue = getNestedValue(b, column);
        const compare = aValue > bValue ? 1: -1;
        return dir === 'asc' ? compare : -compare;
      });
    }

    //페이징
    const start = (page - 1) * size;
    const rows = allOrders.slice(start, start + size);

    return {
      rows,
      total: allOrders.length
    };
  }

  // 중첩된 속성 접근 유틸
  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  } 

  // 상세내역 열기/ 닫기
  const openDetail = (id) => {
    selectedOrderId.value = id;
    showDetail.value = true;
  }
  const closeDetail = () => {
    selectedOrderId.value = null;
    showDetail.value = false;
  }


  // 상품명 클릭 및 환불 신청 버튼 이벤트 처리
  onMounted(() => {
    document.addEventListener('click', (event) => {
      //상품 상세 페이지로 이동
      const detailLink = event.target.closest('.detail-link');
      if (detailLink) {
        const orderId = detailLink.dataset.detailId;
        if (orderId) {
          //상세 페이지를 모달로 띄우기
          openDetail(orderId);
        }
        return;
      }

      //환불 신청
      const refundLink = event.target.closest('.refund-link');
      if (refundLink) {
        const orderId = refundLink.dataset.orderId;
        if (orderId) {
          router.push({ name: 'RefundRequest', params: { orderId } });
        }
      }
    });
  });

</script>
<template>
  <div class="content-page">
    <h1 class="page-title">
      <i class="fa-solid fa-wallet"></i> 주문 내역
    </h1>
    <p class="page-description">내가 구매한 상품의 내역을 확인할 수 있습니다.</p>

    <div>
      <ServerDataTable
        v-model:keyword="keyword"
        :columns="columns"
        :fetcher="fetchOrders"
        :page-size="10"
      >

      <!-- 데이터가 없을 때 -->
      <template #empty>주문 내역이 없습니다.</template>

      </ServerDataTable>
    </div>

    <!-- 상세 모달 -->
     <div v-if="showDetail" class="order-modal-backdrop" @click.self="closeDetail">
        <div class="order-modal">
          <OrderDetailHistory
            v-if="selectedOrderId !== null"
            :ordersId="selectedOrderId" 
            @close="closeDetail" />
        </div>
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
  :deep(.badge-pending) { background-color: #ffc107; }            /* 결제 대기중 - 노란색 */
  :deep(.badge-paid) { background-color: #17a2b8; }               /* 결제 완료 - 청록색 */
  :deep(.badge-preparing) { background-color: #007bff; }          /* 배송 대기중 - 파랑 */
  :deep(.badge-shipped) { background-color: #20c997; }            /* 배송 중 - 연녹색 */
  :deep(.badge-delivered) { background-color: #28a745; }          /* 배송 완료 - 녹색 */
  :deep(.badge-confirmed) { background-color: #6f42c1; }          /* 구매 확정 - 보라색 */
  :deep(.badge-cancel-requested) { background-color: #fd7e14; }   /* 취소 요청 - 주황 */
  :deep(.badge-cancelled) { background-color: #dc3545; }          /* 취소 완료 - 빨강 */
  :deep(.badge-refund-requested) { background-color: #e83e8c; }   /* 환불 요청 - 핑크 */
  :deep(.badge-refunded) { background-color: #343a40; }           /* 환불 완료 - 다크 그레이 */
  :deep(.badge-auction) { background-color: #007bff; }
  :deep(.badge-instant-buy) { background: #28a745; }

  /* 모달 스타일 */
  .order-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
  }
  .order-modal {
    width: 90%;
    max-width: 900px;
    max-height: 85vh;
    overflow: auto;
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  }
  .modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
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