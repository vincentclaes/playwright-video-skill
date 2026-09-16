import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './skills/playwright-video/assets',
  testMatch: 'demo.spec.ts',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    launchOptions: { slowMo: 300 },
  },
});
