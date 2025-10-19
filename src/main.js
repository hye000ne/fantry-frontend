import { createApp } from 'vue';
import { createPinia } from 'pinia';
// useUiStore는 이제 router/index.js에서 사용하므로 제거합니다.
// import { useUiStore } from './stores/uiStore'; 

// router/index.js에서 setupRouter 함수를 import 합니다.
import { setupRouter } from './router'; 

import App from './App.vue'
import Toast from 'vue-toastification'


// Global vendor CSS (순수 전역만)
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

// JS vendors (Bootstrap JS 는 전역 1회만)
import jQuery from 'jquery'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import 'vue-toastification/dist/index.css'

// jQuery 의존 플러그인 호환성을 위해 전역에 설정
window.$ = window.jQuery = jQuery 

const app = createApp(App);
const pinia = createPinia(); // Pinia 인스턴스 생성

// 1. Pinia를 앱에 등록합니다. (라우터 가드에서 Store 접근을 위해 선행)
app.use(pinia); 

// 2. Pinia 등록 후, setupRouter 함수를 호출하여 라우터 인스턴스를 생성하고 네비게이션 가드를 설정합니다.
const router = setupRouter();

// 3. Vue Router를 앱에 등록합니다.
app.use(router); 

// 4. Toast 옵션 설정
const toastOption = {
  position: 'top-right',
  timeout: 20000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
}

// 5. vue-toastification 등록 및 앱 마운트
app.use(Toast, toastOption)
app.mount('#app')
