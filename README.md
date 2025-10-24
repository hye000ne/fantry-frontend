<div align="center">

# 🎨 Fantry Frontend

**한정판 중고 굿즈 실시간 경매 플랫폼 - 프론트엔드**

![Vue.js](https://img.shields.io/badge/Vue.js-3.5.18-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.0.6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.19.0+-339933?style=flat-square&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)

</div>

---

## 📖 프로젝트 소개

**Fantry**는 한정판 굿즈의 진품 여부를 검증하고, 실시간 경매를 통해 안전하게 거래할 수 있는 플랫폼입니다.

본 프로젝트는 **Vue 3 Composition API**와 **Vite**를 기반으로 구축된 **프론트엔드 애플리케이션**으로, 사용자 경험 최적화와 실시간 상호작용에 중점을 두고 개발되었습니다.

### 주요 문제 해결
- ❌ **중고 굿즈 거래의 신뢰성 문제** → 전문 검수 프로세스로 진품 보장
- ❌ **불투명한 가격 책정** → 실시간 경매 시스템으로 공정한 시장 가격 형성
- ❌ **복잡한 거래 절차** → 직관적인 UI/UX로 간편한 거래 프로세스 제공

---

## ✨ 주요 기능

### 🔐 사용자 인증 & 관리
- **소셜 로그인 통합** - OAuth 2.0 기반 카카오 로그인 지원
- **JWT 토큰 자동 갱신** - Axios 인터셉터를 활용한 무중단 세션 관리
- **마이페이지** - 구매/판매 내역, 입찰 현황, 정산 관리

### 🛒 상품 & 경매
- **실시간 경매 시스템** - WebSocket(STOMP) 기반 실시간 입찰 처리
- **상품 상세 페이지** - 이미지 갤러리, 경매 정보, 실시간 입찰 현황
- **검수 신청 플로우** - 3단계 검수 신청 프로세스 (상품 정보 → 이미지 업로드 → 완료)
- **카테고리 필터링** - 앨범, 아티스트별 상품 검색 및 필터링

### 💳 결제 & 정산
- **통합 결제 시스템** - Bootpay API 연동 (카드, 간편결제 등)
- **3단계 결제 플로우** - 주문자 정보 → 결제 확인 → 완료
- **환불 요청** - 주문 상세에서 직접 환불 신청 가능
- **정산 관리** - 판매자 계좌 등록 및 정산 내역 조회

### 🔔 알림 & 실시간 통신
- **실시간 알림** - SSE(Server-Sent Events) 기반 알림 시스템
- **WebSocket 통신** - STOMP 프로토콜을 활용한 경매 실시간 업데이트
- **Toast 알림** - vue-toastification을 활용한 사용자 피드백

### 🛠️ 관리자 페이지
- **대시보드** - Chart.js 기반 매출, 경매, 회원 통계 시각화
- **회원 관리** - 회원 목록, 신고 내역, 제재 관리
- **상품 관리** - 검수 승인/반려, 경매 관리, 재고 관리
- **CS 관리** - FAQ, 공지사항, 1:1 문의 관리
- **정산 관리** - 판매자 정산 처리 및 내역 관리

---

## 🛠️ 기술 스택

### Frontend Framework
- **Vue 3.5.18** - Composition API 기반 프론트엔드 프레임워크
- **Vue Router 4.5.1** - SPA 라우팅 관리
- **Pinia 3.0.3** - 상태 관리 라이브러리

### Build Tools
- **Vite 7.0.6** - 빠른 개발 서버 및 빌드 도구
- **@vitejs/plugin-vue 6.0.1** - Vue SFC 지원 플러그인

### UI & Styling
- **Bootstrap 4.6.2** - UI 프레임워크
- **startbootstrap-sb-admin-2** - 관리자 대시보드 템플릿
- **SCSS** - CSS 전처리기
- **Font Awesome 7.0.1** - 아이콘 라이브러리

### State & Data Management
- **Axios 1.12.2** - HTTP 클라이언트 (인터셉터, 토큰 갱신)
- **Pinia** - 중앙 상태 관리 (user, payment, notification, inspection 등)

### Real-time Communication
- **@stomp/stompjs 7.2.0** - WebSocket STOMP 클라이언트
- **SockJS Client 1.6.1** - WebSocket 폴백 지원
- **EventSource Polyfill 1.0.31** - SSE 크로스 브라우저 지원

### Payment & External APIs
- **@bootpay/client-js 5.1.5** - Bootpay 결제 모듈
- **Kakao Address API** - 카카오 주소 검색 연동

### Data Visualization & Editor
- **Chart.js 4.5.0** - 데이터 시각화 차트 라이브러리
- **chartjs-plugin-datalabels 2.2.0** - 차트 데이터 레이블 플러그인
- **Quill 2.0.3 / @vueup/vue-quill 1.2.0** - WYSIWYG 에디터
- **DataTables.net-vue3 3.0.4** - 고급 테이블 컴포넌트

### Development Tools
- **Prettier 3.6.2** - 코드 포맷터
- **vite-plugin-vue-devtools 8.0.0** - Vue DevTools 플러그인
- **Sass Embedded 1.92.1** - SCSS 컴파일러

---

## 🚀 시작하기

### 사전 준비

프로젝트를 실행하기 위해서는 자바스크립트 런타임이 필요합니다:

- **[Node.js](https://nodejs.org/ko/)** (권장 버전: ^20.19.0 또는 >=22.12.0)
- **[Bun](https://bun.com/)** (선택사항)

### 모듈 설치

**Node.js 사용 시:**
```bash
npm install
```

**Bun 사용 시:**
```bash
bun install
```

### 환경 변수 설정

프로젝트 루트에 `.env.development` 및 `.env.production` 파일이 필요합니다.

#### 필수 환경 변수

**개발 환경 (`.env.development`)**
```env
VITE_API_SERVER_URL=http://localhost:8080
VITE_FILE_BASE_URL=http://localhost:8080/files
VITE_BOOTPAY_APPLICATION_ID=your_bootpay_application_id_here
```

**프로덕션 환경 (`.env.production`)**
```env
VITE_API_SERVER_URL=https://api.fantry.com
VITE_FILE_BASE_URL=https://api.fantry.com/files
VITE_BOOTPAY_APPLICATION_ID=your_bootpay_application_id_here
```

#### 결제 API 키 설정

**방법 1: 환경변수로 실행**
```bash
VITE_BOOTPAY_APPLICATION_ID=<ApplicationKey> npm run dev
VITE_BOOTPAY_APPLICATION_ID=<ApplicationKey> npm run build
```

**방법 2: .env 파일 수정**
1. `.env.development` 또는 `.env.production` 파일을 엽니다
2. `VITE_BOOTPAY_APPLICATION_ID` 값을 수정합니다
3. 개발 서버를 재시작합니다

### 개발 서버 실행

**Node.js 사용 시:**
```bash
npm run dev
```

**Bun 사용 시:**
```bash
bun dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

**Node.js 사용 시:**
```bash
npm run build
```

**Bun 사용 시:**
```bash
bun run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프로덕션 프리뷰

```bash
npm run preview
```

---

## 📁 프로젝트 구조

```
fantry-frontend/
├─ public/               # 정적 파일 (이미지, 파비콘 등)
├─ src/
│  ├─ api/              # 📡 API 통신 모듈
│  │  ├─ index.js       # Axios 인스턴스 & 인터셉터
│  │  ├─ auction.js     # 경매 API
│  │  ├─ payment.js     # 결제 API
│  │  └─ ...
│  ├─ components/       # 🧩 재사용 컴포넌트
│  │  ├─ common/
│  │  │  ├─ atoms/      # 원자 컴포넌트 (버튼, 입력필드 등)
│  │  │  ├─ molecules/  # 분자 컴포넌트 (네비게이션, 검색바 등)
│  │  │  └─ organisms/  # 유기체 컴포넌트 (헤더, 푸터 등)
│  │  ├─ admin/         # 관리자 전용 컴포넌트
│  │  └─ product/       # 상품 관련 컴포넌트
│  ├─ composables/      # 🔧 Vue Composables (재사용 로직)
│  │  ├─ useAlertDialog.js
│  │  ├─ useModal.js
│  │  └─ ...
│  ├─ layouts/          # 🖼️ 레이아웃 컴포넌트
│  │  ├─ UserLayout.vue
│  │  ├─ AdminLayout.vue
│  │  └─ CSPageLayout.vue
│  ├─ pages/            # 📄 페이지 컴포넌트
│  │  ├─ admin/         # 관리자 페이지
│  │  │  ├─ dashboard/
│  │  │  ├─ member/
│  │  │  ├─ auction/
│  │  │  ├─ order/
│  │  │  ├─ cs/
│  │  │  └─ settlement/
│  │  ├─ user/          # 사용자 페이지
│  │  │  ├─ access/     # 로그인/회원가입
│  │  │  ├─ inspection/ # 검수 신청
│  │  │  ├─ mypage/     # 마이페이지
│  │  │  └─ cs/         # 고객센터
│  │  ├─ payment/       # 결제 페이지
│  │  │  ├─ UserInfoPage.vue
│  │  │  ├─ CheckoutPage.vue
│  │  │  └─ PaymentCompletePage.vue
│  │  ├─ product/       # 상품 페이지
│  │  │  ├─ ProductListPage.vue
│  │  │  └─ ProductDetailPage.vue
│  │  └─ HomePage.vue
│  ├─ router/           # 🛣️ 라우팅 설정
│  │  ├─ index.js
│  │  ├─ userRoutes.js
│  │  └─ adminRoutes.js
│  ├─ stores/           # 🗄️ Pinia 스토어
│  │  ├─ userStore.js
│  │  ├─ paymentStore.js
│  │  ├─ notificationStore.js
│  │  ├─ inspectionStore.js
│  │  └─ uiStore.js
│  ├─ services/         # 🔌 서비스 레이어
│  │  └─ websocketService.js
│  ├─ module/           # 📦 독립 모듈
│  │  ├─ paymentModule.js
│  │  ├─ kakaoAddressSearch.js
│  │  └─ dialog.js
│  ├─ utils/            # 🛠️ 유틸리티 함수
│  │  ├─ tableFormatters.js
│  │  ├─ timerComposable.js
│  │  └─ permission.js
│  ├─ styles/           # 🎨 전역 스타일
│  │  ├─ css/
│  │  └─ scss/
│  ├─ App.vue           # 루트 컴포넌트
│  └─ main.js           # 엔트리 포인트
├─ .env.development     # 개발 환경 변수
├─ .env.production      # 프로덕션 환경 변수
├─ vite.config.js       # Vite 설정
├─ package.json         # 의존성 관리
└─ README.md
```

---

## 🔌 API 통신 구조

### Axios 인터셉터 기반 인증 처리

프론트엔드는 **JWT 액세스 토큰**과 **리프레시 토큰** 기반 인증 시스템을 사용합니다.

#### 주요 특징
1. **자동 토큰 갱신** - 401/403 에러 발생 시 `/api/reissue` 엔드포인트로 자동 재발급
2. **요청 대기열 관리** - 토큰 갱신 중 발생한 요청을 큐에 저장 후 순차 처리
3. **공통 에러 처리** - 인터셉터 레벨에서 에러 핸들링 및 자동 로그아웃

#### 코드 예시 (src/api/index.js)
```javascript
// 응답 인터셉터
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401/403 에러 시 토큰 재발급
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const res = await axios.post('/api/reissue', null, { withCredentials: true });
        const newAccessToken = res.headers.accesstoken;

        localStorage.setItem('accessToken', newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        return apiClient(originalRequest);
      }

      // 토큰 갱신 중에는 요청을 큐에 추가
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }

    return Promise.reject(error);
  }
);
```

---

## 🔔 실시간 통신 아키텍처

### WebSocket (STOMP) - 경매 실시간 업데이트

**연결 흐름:**
1. 사용자가 경매 상세 페이지 진입
2. WebSocket 연결 수립 (`/ws-stomp` 엔드포인트)
3. 특정 경매 토픽 구독 (`/topic/auctions/{auctionId}`)
4. 서버에서 입찰 발생 시 실시간 메시지 수신
5. Vue 컴포넌트 상태 자동 업데이트

**구현 예시 (services/websocketService.js):**
```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('/ws-stomp'),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

client.onConnect = () => {
  client.subscribe(`/topic/auctions/${auctionId}`, message => {
    const data = JSON.parse(message.body);
    // Vue 컴포넌트 상태 업데이트
  });
};
```

### SSE (Server-Sent Events) - 알림 시스템

**연결 흐름:**
1. 로그인 성공 시 SSE 연결 수립
2. `/api/notifications/subscribe` 엔드포인트 구독
3. 서버에서 알림 이벤트 발생 시 실시간 수신
4. Pinia `notificationStore`에 저장 및 Toast 알림 표시

---

## 🎨 디자인 시스템

### 스타일 가이드
- **전역 스타일** - `src/styles/scss/` 디렉토리에서 관리
- **컴포넌트 스타일** - Scoped CSS 사용으로 캡슐화
- **색상 팔레트** - Bootstrap 4 테마 변수 활용

---

## 📋 Git 및 PR 규칙

### 브랜치 전략

- `develop` - 메인 개발 브랜치
- `feat/*` - 새로운 기능 개발
- `fix/*` - 버그 수정
- `hotfix/*` - 긴급 수정

### 브랜치 명명 규칙

```
feat/기능명
fix/이슈번호-간단한설명
hotfix/긴급수정내용
```

### 커밋 메시지 규칙

```
타입: 간단한 설명

자세한 설명 (선택사항)

- feat: 새로운 기능
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅, 세미콜론 누락 등
- refactor: 코드 리팩토링
- test: 테스트 코드
- chore: 빌드 업무, 패키지 매니저 설정 등
```

### Pull Request 규칙

1. **브랜치 최신화** - `develop` 브랜치 최신 변경사항 merge 후 PR 생성
2. **충돌 해결** - PR 생성 전 로컬에서 충돌 해결 완료
3. **리뷰 요청** - 최소 1명 이상의 리뷰어 지정
4. **테스트 확인** - 로컬 환경에서 빌드 및 기능 테스트 완료

---

## 🧪 테스트 & 품질 관리

### 코드 포맷팅

```bash
npm run format
```

Prettier 설정에 따라 `src/` 디렉토리 내 모든 파일을 자동 포맷팅합니다.

### 빌드 최적화

#### 코드 스플리팅
- **Lazy Loading** - 모든 페이지 컴포넌트는 동적 import 사용
- **Manual Chunks** - Vite 설정에서 주요 라이브러리를 `vendor` 청크로 분리
  ```javascript
  manualChunks(id) {
    if (id.includes('node_modules')) {
      const vendors = ['vue', 'vue-router', 'pinia', 'axios', 'chart.js', 'bootstrap'];
      const module = id.split('node_modules/')[1].split('/')[0];
      if (vendors.some(vendor => module.startsWith(vendor))) {
        return 'vendor';
      }
    }
  }
  ```

#### 성능 최적화
- **Tree Shaking** - 사용하지 않는 코드 자동 제거
- **Minification** - 프로덕션 빌드 시 코드 압축
- **Asset Optimization** - 이미지 및 정적 파일 최적화

---

## 🔧 주요 설정 파일

### vite.config.js

```javascript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_SERVER_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: { /* 위 참조 */ }
        }
      }
    }
  };
});
```

### package.json - 주요 스크립트

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "prettier --write src/"
  }
}
```

---

## 🤝 기여자

이 프로젝트는 신세계 INC 아카데미 8차수 4팀이 개발했습니다.

---

## 📜 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📚 참고 자료

- **Backend Repository**: [fantry-backend](https://github.com/SinsegeaBackend-8th-Team4/fantry-backend)
- **Vue.js 공식 문서**: https://vuejs.org/
- **Vite 공식 문서**: https://vitejs.dev/
- **Pinia 공식 문서**: https://pinia.vuejs.org/
- **Bootstrap 4 문서**: https://getbootstrap.com/docs/4.6/

---

<div align="center">

**Made with ❤️ by Fantry Team**

</div>
