import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일을 명시적으로 불러옵니다.
  const env = loadEnv(mode, process.cwd(), '')

  // ===================================================================
  // ✨ [추가된 부분] 자기 검증 및 디버깅 로직
  // ===================================================================
  console.log('--- [Vite Config] Attempting to load .env variables ---')
  console.log('Loaded variables:', env)
  console.log('----------------------------------------------------')

  // 빌드를 시작하기 전에, 필수 환경변수가 실제로 로드되었는지 확인합니다.
  if (!env.VITE_BOOTPAY_APPLICATION_ID) {
    // 만약 ID가 없다면, 더 이상 진행하지 않고 여기서 즉시 에러를 발생시킵니다.
    throw new Error(
      '[FATAL VITE CONFIG ERROR] VITE_BOOTPAY_APPLICATION_ID was not found! Check if the .env.local file is being created correctly before the build starts.',
    )
  }
  // ===================================================================

  // Vite의 'define' 옵션을 사용하기 위해 환경변수 객체를 재가공합니다.
  const processEnv = {}
  for (const key in env) {
    if (key.startsWith('VITE_')) {
      processEnv[`import.meta.env.${key}`] = JSON.stringify(env[key])
    }
  }

  return {
    plugins: [
      vue(),
      // 운영(production) 빌드에서는 devtools를 제외하여 최적화합니다.
      mode !== 'production' && vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~bootstrap': fileURLToPath(new URL('./node_modules/bootstrap/scss', import.meta.url)),
        '~startbootstrap-sb-admin-2': fileURLToPath(
          new URL('./node_modules/startbootstrap-sb-admin-2/scss', import.meta.url),
        ),
      },
    },
    define: {
      // 위에서 가공한 환경변수 객체를 주입하여 빌드 시 강제로 값을 포함시킵니다.
      ...processEnv,
      global: 'window',
      // sockjs-client 발생 오류 해결
      //Vite에게 'global' 변수가 'window' 객체를 참조하도록 알려줌
    },
    css: {
      preprocessorOptions: {
        scss: {
          // node_modules에서 발생하는 Sass 경고를 무시하도록 설정
          quietDeps: true,
        },
      },
    },
    server: {
      proxy: {
        // '/api'로 시작하는 모든 요청을 프록시 처리합니다.
        '/api': {
          // .env.development 파일에 정의된 백엔드 서버 주소를 타겟으로 설정합니다.
          target: env.VITE_API_SERVER_URL,
          // Cross-Origin 요청을 위해 Origin 헤더를 변경합니다.
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 주요 라이브러리들을 'vendor' 청크로 분리합니다.
              const vendors = [
                'vue', 'vue-router', 'pinia', 'axios', 
                'chart.js', 'bootstrap', 'jquery', 
                'quill', '@vueup/vue-quill', 'datatables.net'
              ];
              const module = id.split('node_modules/')[1].split('/')[0];
              if (vendors.some(vendor => module.startsWith(vendor))) {
                return 'vendor';
              }
            }
          },
        },
      },
    },
  }
})

