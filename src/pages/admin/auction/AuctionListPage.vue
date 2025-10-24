<template>
  <div ref="tableContainer">
    <h1 class="h3 mb-2 text-gray-800">판매 상품 목록</h1>
    <p class="mb-4">전체 판매 상품 내역을 테이블 형태로 조회하고 관리하는 페이지입니다.</p>

    <div class="row mb-3">
      <div class="col-md-3">
        <select v-model="saleType" class="form-control">
          <option value="">전체 판매 유형</option>
          <option v-for="option in saleTypeOptions" :key="option.value" :value="option.value">
            {{ option.text }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <select v-model="saleStatus" class="form-control">
          <option value="">전체 판매 상태</option>
          <option v-for="option in saleStatusOptions" :key="option.value" :value="option.value">
            {{ option.text }}
          </option>
        </select>
      </div>
    </div>

        <ServerDataTable
          :key="tableKey"
          ref="serverDataTable"
          :columns="columns"
          :fetcher="fetchAuctions"
        >
          <template #empty>판매 상품 내역이 없습니다.</template>
        </ServerDataTable>
      </div>
    </template>
    
    <script setup>
    import { ref, onMounted, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import ServerDataTable from '@/components/common/datatable/ServerDataTable.vue';
    import { getAuctionList, getAuctionDetails } from '@/api/auction';
    import { productNameFormatter } from '@/utils/tableFormatters';
    
    import { debounce } from 'lodash-es';
    
    import { useAlertDialog } from '@/composables/useAlertDialog';
    
    const router = useRouter();
    const tableContainer = ref(null);
    const serverDataTable = ref(null);
    const tableKey = ref(0);
    const { showAlert: showAlertDialog } = useAlertDialog();
    
    const saleType = ref('');
    const saleStatus = ref('');
    
    const saleTypeOptions = [
      { value: 'AUCTION', text: '경매' },
      { value: 'INSTANT_BUY', text: '즉시 구매' },
    ];
    
    const saleStatusOptions = [
      { value: 'PREPARING', text: '판매 준비중' },
      { value: 'REPREPARING', text: '재판매 준비중' },
      { value: 'ACTIVE', text: '판매 중' },
      { value: 'REACTIVE', text: '재판매중' },
      { value: 'SOLD', text: '판매 완료' },
      { value: 'NOT_SOLD', text: '유찰' },
      { value: 'CANCELLED', text: '판매 취소' },
    ];
    
    const columns = [
      { data: 'auctionId', title: 'ID', sortable: true, width: '50px' },
      { data: 'itemName', title: '상품명', sortable: false, className: 'item-name-cell', render: productNameFormatter },
      { data: 'categoryName', title: '카테고리', sortable: false },
      { 
        data: 'startPrice', 
        title: '경매 시작가', 
        sortable: true,
        render: data => `${(data || 0).toLocaleString()}원`
      },
      { 
        data: 'currentPrice', 
        title: '현재 가격', 
        sortable: true,
        render: (data, type, row) => {
          if (row.saleType === 'INSTANT_BUY') return '-'; // 즉시구매는 현재가 개념이 없음
          return row.highestBidderId ? `${(data || 0).toLocaleString()}원` : '입찰자 없음';
        }
      },
      { 
        data: 'currentPrice', 
        title: '최종 가격', 
        sortable: false,
        render: (data, type, row) => row.saleStatus === 'SOLD' ? `${(data || 0).toLocaleString()}원` : '-'
      },
      { 
        data: 'startTime', 
        title: '판매 시간', 
        sortable: true,
        render: (data, type, row) => {
          if (!data || !row.endTime) return '-';
          const start = parseUtcDateArray(data);
          const end = parseUtcDateArray(row.endTime);
          if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return '유효하지 않은 날짜';
    
          const format = (date) => {
            const pad = (num) => num.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
          }
    
          return `${format(start)}<br>~ ${format(end)}`;
        }
      },
      { data: 'saleType', title: '판매 유형', sortable: true, render: data => translateSaleType(data) },
      { data: 'saleStatus', title: '판매 상태', sortable: true, render: data => `<span class="${getStatusBadge(data)}">${translateSaleStatus(data)}</span>` },
      {
        data: 'productInspectionId',
        title: '재고 상세',
        sortable: false,
        className: 'inventory-detail-button-cell',
        render: (data, type, row) => {
          if (!data) return '-';
          return `<button class="btn btn-outline-secondary btn-sm inventory-detail-btn" data-id="${data}" data-status="${row.inventoryStatus}">보기</button>`
        }
      }
    ].map(col => ({ ...col, className: `text-center ${col.className || ''}` }));
    
    async function fetchAuctions({ page, size, sort }) {
      try {
        const listParams = {
          page: page - 1,
          size,
          sort: sort,
          saleType: saleType.value || null,
          saleStatus: saleStatus.value || null,
        };
        const listResponse = await getAuctionList(listParams);
        const auctionItems = listResponse.data.content;
        const totalElements = listResponse.data.totalElements;

        if (!auctionItems || auctionItems.length === 0) {
          return { rows: [], total: 0 };
        }

        // 각 경매의 상세 정보를 병렬로 조회
        const detailPromises = auctionItems.map(item => getAuctionDetails(item.auctionId).catch(() => null));
        const detailResults = await Promise.all(detailPromises);

        // 상세 정보 조회 결과를 기반으로 최종 데이터 조합
        // 일부 경매 상세 정보만 실패했을 경우를 대비하여, 원본 auctionItems 정보를 기반으로 데이터를 조합합니다.
        const combinedRows = auctionItems.map(item => {
            const detailData = detailResults.find(res => res && res.data && res.data.auctionId === item.auctionId);
            return {
                ...item, // 기본 목록 정보
                ...(detailData ? detailData.data : {}), // 상세 정보 (있을 경우 덮어쓰기)
            };
        });

        return {
          rows: combinedRows,
          total: totalElements,
        };
      } catch (error) {
        console.error('판매 상품 목록 조회 실패:', error);
        showAlertDialog('오류', '데이터를 불러오는 데 실패했습니다.');
        return { rows: [], total: 0 };
      }
    }
    
    onMounted(() => {
      if (tableContainer.value) {
        tableContainer.value.addEventListener('click', (e) => {
          const detailButton = e.target.closest('.inventory-detail-btn');
          if (detailButton) {
            const id = detailButton.dataset.id;
            const status = detailButton.dataset.status;
            if (!id || !status) {
              console.error('ID 또는 상태가 없어 재고 상세로 이동할 수 없습니다.', {id, status});
              showAlertDialog('오류', '재고 정보를 여는 데 실패했습니다.');
              return;
            }
            router.push(`/admin/inventory/detail/${id}?status=${status}`);
          }
        });
      }
    });
    
    watch([saleType, saleStatus], debounce(() => {
      tableKey.value++;
    }, 300));

const parseUtcDateArray = (dt) => {
    if (!Array.isArray(dt) || dt.length < 5) {
        return null;
    }
    const [year, month, day, hour, minute, second = 0] = dt;
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
};


const saleTypeMap = {
  'AUCTION': '경매',
  'INSTANT_BUY': '즉시구매'
};

const saleStatusMap = {
  'PREPARING': '판매 준비중',
  'ACTIVE': '판매 중',
  'REACTIVE': '재판매중',
  'SOLD': '판매 완료',
  'NOT_SOLD': '유찰',
  'CANCELLED': '판매 취소'
};

function translateSaleType(status) {
    return saleTypeMap[status] || status;
}

function translateSaleStatus(status) {
    return saleStatusMap[status] || status;
}

function getStatusBadge(status) {
  const baseClass = 'badge';
  switch (status) {
    case 'ACTIVE': return `${baseClass} badge-success`;
    case 'REACTIVE': return `${baseClass} badge-primary`;
    case 'SOLD': return `${baseClass} badge-dark`;
    case 'PREPARING': return `${baseClass} badge-info`;
    case 'NOT_SOLD': return `${baseClass} badge-warning`;
    case 'CANCELLED': return `${baseClass} badge-danger`;
    default: return `${baseClass} badge-secondary`;
  }
}
</script>

<style scoped>
  :deep(table th),
  :deep(table td) {
    text-align: center;
    vertical-align: middle;
  }
  .row.mb-3 > div {
    padding-left: 5px;
    padding-right: 5px;
  }

  :deep(.item-name-cell) {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* 툴팁(title 속성)이 동작하려면 마우스 이벤트가 필요합니다. */
    pointer-events: auto;
  }

  :deep(.detail-button-cell) {
    white-space: nowrap;
    /* 상세 버튼 셀은 클릭 이벤트를 허용해야 하므로 pointer-events를 auto로 설정합니다. */
    pointer-events: auto;
  }

  /* 기본적으로 모든 셀의 클릭 이벤트를 비활성화합니다. */
  :deep(table td) {
    pointer-events: none;
  }

  /* 상세 버튼 자체는 다시 클릭 가능하도록 설정합니다. */
  :deep(table td .btn) {
      pointer-events: auto;
  }

  /* 행 전체에 대한 hover 효과를 제거합니다. */
  :deep(table tbody tr:hover) {
      background-color: transparent !important; /* 배경색 변경 방지 */
      cursor: default; /* 기본 커서 유지 */
  }
</style>
