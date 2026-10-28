import { test, expect } from '@playwright/test';

test('saúde e headers de proteção estão disponíveis', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toEqual({ status: 'ok' });

  const login = await request.get('/login');
  expect(login.headers()['x-content-type-options']).toBe('nosniff');
  expect(login.headers()['x-frame-options']).toBe('DENY');
  expect(login.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(login.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});
