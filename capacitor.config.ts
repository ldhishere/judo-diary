
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.judodiary.app',
  appName: '유도 일기',
  webDir: 'dist', // 빌드된 파일이 위치할 폴더
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
