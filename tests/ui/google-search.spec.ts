import { test, expect, errors } from '@playwright/test';

test('searches for MoroSystems and filters career positions by city', async ({
  page,
}) => {
  // 1. Open Google.
  await page.goto('https://www.google.com/?hl=cs');

  await expect(page).toHaveTitle(/Google/);

  // Google may display the cookie consent dialog.
  const rejectCookiesButton = page.getByRole('button', {
    name: 'Odmítnout vše',
  });

  const googleCookieDialogAppeared = await rejectCookiesButton
    .waitFor({
      state: 'visible',
      timeout: 3000,
    })
    .then(() => true)
    .catch((error: unknown) => {
      if (error instanceof errors.TimeoutError) {
        return false;
      }
      throw error;
    });

  if (googleCookieDialogAppeared) {
    await rejectCookiesButton.click();
  }

  // 2. Search for MoroSystems.
  const searchBox = page.getByRole('combobox', {
    name: 'Najít',
  });

  await searchBox.fill('MoroSystems');
  await searchBox.press('Enter');

  // 3. Validate the Google search results page.
  await expect(page).toHaveTitle(/MoroSystems/);

  const moroSystemsWebsiteLink = page.getByRole('link', {
    name: /MoroSystems - smysluplná IT řešení a technologické inovace/i,
  });

  await expect(moroSystemsWebsiteLink).toBeVisible();

  // 4. Open the MoroSystems website.
  await moroSystemsWebsiteLink.click();

  // Validate the actual destination after Google's redirect.
  await expect(page).toHaveURL(
    url => ['morosystems.cz', 'www.morosystems.cz'].includes(url.hostname),
  );

  // MoroSystems cookie dialog is optional and may appear with a delay.
  const necessaryCookiesButton = page.getByRole('button', {
    name: 'Pouze nutné',
  });

  const cookieDialogAppeared = await necessaryCookiesButton
    .waitFor({
      state: 'visible',
      timeout: 3000,
    })
    .then(() => true)
    .catch((error: unknown) => {
      if (error instanceof errors.TimeoutError) {
        return false;
      }
      throw error;
    });

  if (cookieDialogAppeared) {
    await necessaryCookiesButton.click();
  }

  // 5. Navigate to the Career page.
  const careerLink = page.getByRole('link', {
    name: 'Kariéra',
  });

  await expect(careerLink).toBeVisible();
  await careerLink.click();

  await expect(page).toHaveURL(/\/kariera\/?/);

  // 6. Open the city filter.
  const cityFilter = page.getByRole('link', {
    name: 'Všechna města',
  });

  await expect(cityFilter).toBeVisible();
  await cityFilter.click();

  // 7. Select Brno.
  const brnoOption = page.locator('label').filter({
    hasText: 'Brno',
  });

  await expect(brnoOption).toBeVisible();
  await brnoOption.click();

  // Validate that Brno is selected in the city filter.
  const selectedCity = page.getByRole('link', {
    name: 'Brno',
    exact: true,
  });

  await expect(selectedCity).toBeVisible();

  // Validate that filtering returned at least one position.
  const positions = page.locator('.c-positions__item:visible');

  await expect(positions.first()).toBeVisible();

  // Every displayed position must be available in Brno.
  await expect(
    page.locator('.c-positions__item:visible:not([data-filter*="Brno"])'),
  ).toHaveCount(0);
});
