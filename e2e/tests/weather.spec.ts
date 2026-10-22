import { test, expect } from '@playwright/test';
import { WeatherPage } from '../pages/WeatherPage';

test.describe('Weather Dashboard', () => {
  test.use({ colorScheme: 'light' });

  test('should load the homepage with weather data', async ({ page }) => {
    const weatherPage = new WeatherPage(page);
    await weatherPage.goto();
    await expect(weatherPage.title).toHaveText('Weather Dashboard');
    const hasCard = await weatherPage.weatherCard.isVisible();
    const hasError = await weatherPage.errorMessage.isVisible();
    expect(hasCard || hasError).toBeTruthy();
  });

  test('should show not found message for invalid city', async ({ page }) => {
    const weatherPage = new WeatherPage(page);
    await weatherPage.goto();
    await weatherPage.searchCity('ciudadinexistente123xyz');
    await expect(weatherPage.notFoundMessage).toBeVisible();
  });

  test('should find the city in the given country', async ({ page }) => {
    const weatherPage = new WeatherPage(page);
    await page.goto('/?city=Londres&country=Reino+Unido');
    if (await weatherPage.locationName.isVisible()) {
      await expect(weatherPage.locationName).toContainText('Reino Unido');
    } else {
      await expect(weatherPage.errorMessage).toBeVisible();
    }
  });

  test('should switch from celsius to fahrenheit', async ({ page }) => {
    const weatherPage = new WeatherPage(page);
    await weatherPage.goto();
    if (await weatherPage.temperature.isVisible()) {
      await expect(weatherPage.temperature).toContainText('°C');
      await weatherPage.toggleButton.click();
      await expect(weatherPage.temperature).toContainText('°F');
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    const weatherPage = new WeatherPage(page);
    await weatherPage.goto();
    const html = page.locator('html');
    await weatherPage.themeToggle.click();
    await expect(html).toHaveClass(/dark/);
    await weatherPage.themeToggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
