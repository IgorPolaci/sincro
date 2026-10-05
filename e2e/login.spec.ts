import {test,expect} from '@playwright/test';
test('login possui campos essenciais',async({page})=>{await page.goto('/login');await expect(page.getByRole('heading',{name:'Acesse sua conta'})).toBeVisible();await expect(page.getByLabel('E-mail')).toBeVisible();await expect(page.getByLabel('Senha')).toBeVisible()});
