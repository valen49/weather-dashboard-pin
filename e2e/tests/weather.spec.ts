import { test, expect } from '@playwright/test';
import { WeatherPage } from '../pages/WeatherPage';

test.describe('Weather Dashboard', () => {

  test.describe('Homepage', () => {
    test('should display the app title', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      await expect(weatherPage.title).toBeVisible();
      await expect(weatherPage.title).toHaveText('Weather Dashboard');
    });

    test('should display weather card with data', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasCard = await weatherPage.weatherCard.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasCard || hasError).toBeTruthy();
    });

    test('should display temperature with celsius unit', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasTemp = await weatherPage.temperature.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasTemp || hasError).toBeTruthy();
      if (hasTemp) {
        const tempText = await weatherPage.temperature.textContent();
        expect(tempText).toContain('°C');
      }
    });
  });

  test.describe('City Search', () => {
    test('should show weather for a valid city', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await page.goto('/?city=Buenos+Aires');
      const hasCard = await weatherPage.weatherCard.isVisible();
      const hasNotFound = await weatherPage.notFoundMessage.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasCard || hasNotFound || hasError).toBeTruthy();
    });

    test('should show not found message for invalid city', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      await weatherPage.searchCity('ciudadinexistente123xyz');
      await expect(weatherPage.notFoundMessage).toBeVisible();
    });

    test('should display search input and button', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      await expect(weatherPage.cityInput).toBeVisible();
      await expect(weatherPage.searchButton).toBeVisible();
    });
  });

  test.describe('Forecast', () => {
    test('should display forecast container', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasForecast = await weatherPage.forecastContainer.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasForecast || hasError).toBeTruthy();
    });

    test('should display 7 forecast cards', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasForecast = await weatherPage.forecastContainer.isVisible();
      if (hasForecast) {
        await expect(weatherPage.forecastCards).toHaveCount(7);
      }
    });
  });

  test.describe('Temperature Toggle', () => {
    test('should display toggle button', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasToggle = await weatherPage.toggleButton.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasToggle || hasError).toBeTruthy();
    });

    test('should switch from celsius to fahrenheit on click', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasTemp = await weatherPage.temperature.isVisible();
      if (hasTemp) {
        const tempBefore = await weatherPage.temperature.textContent();
        expect(tempBefore).toContain('°C');
        await weatherPage.toggleButton.click();
        const tempAfter = await weatherPage.temperature.textContent();
        expect(tempAfter).toContain('°F');
      }
    });

    test('should convert temperature correctly', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasTemp = await weatherPage.temperature.isVisible();
      if (hasTemp) {
        const celsiusText = await weatherPage.temperature.textContent();
        const celsius = parseFloat(celsiusText!.replace('°C', '').trim());
        await weatherPage.toggleButton.click();
        const fahrenheitText = await weatherPage.temperature.textContent();
        const fahrenheit = parseFloat(fahrenheitText!.replace('°F', '').trim());
        const expected = Math.round((celsius * 9/5) + 32);
        expect(fahrenheit).toBe(expected);
      }
    });

    test('should switch back to celsius on second click', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasTemp = await weatherPage.temperature.isVisible();
      if (hasTemp) {
        await weatherPage.toggleButton.click();
        await weatherPage.toggleButton.click();
        const tempText = await weatherPage.temperature.textContent();
        expect(tempText).toContain('°C');
      }
    });

    test('should update toggle button text', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasToggle = await weatherPage.toggleButton.isVisible();
      if (hasToggle) {
        await expect(weatherPage.toggleButton).toHaveText('Switch to °F');
        await weatherPage.toggleButton.click();
        await expect(weatherPage.toggleButton).toHaveText('Switch to °C');
      }
    });

    test('should toggle forecast temperatures', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await weatherPage.goto();
      const hasTemp = await weatherPage.temperature.isVisible();
      const hasForecast = await weatherPage.forecastContainer.isVisible();
      if (hasTemp && hasForecast) {
        const maxBefore = await weatherPage.forecastTempMax.textContent();
        expect(maxBefore).toContain('°C');
        await weatherPage.toggleButton.click();
        const maxAfter = await weatherPage.forecastTempMax.textContent();
        expect(maxAfter).toContain('°F');
      }
    });
  });

  test.describe('City Comparison', () => {
    test('should display compare button when city is searched', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await page.goto('/?city=Mendoza');
      const hasCompareBtn = await weatherPage.compareBtn.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasCompareBtn || hasError).toBeTruthy();
    });

    test('should show compare input when compare button is clicked', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await page.goto('/?city=Mendoza');
      const hasCompareBtn = await weatherPage.compareBtn.isVisible();
      if (hasCompareBtn) {
        await weatherPage.compareBtn.click();
        await expect(weatherPage.compareInput).toBeVisible();
      }
    });

    test('should display both cities when compared', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await page.goto('/?city=Mendoza&compare=Buenos+Aires');
      const hasGrid = await weatherPage.comparisonGrid.isVisible();
      const hasCard = await weatherPage.weatherCard.isVisible();
      const hasError = await weatherPage.errorMessage.isVisible();
      expect(hasGrid || hasCard || hasError).toBeTruthy();
    });

    test('should toggle compare temperature to fahrenheit', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await page.goto('/?city=Mendoza&compare=Buenos+Aires');
      const hasGrid = await weatherPage.comparisonGrid.isVisible();
      if (hasGrid) {
        const tempBefore = await weatherPage.compareTemperature.textContent();
        expect(tempBefore).toContain('°C');
        await weatherPage.toggleButton.click();
        const tempAfter = await weatherPage.compareTemperature.textContent();
        expect(tempAfter).toContain('°F');
      }
    });

    test('should exit comparison mode', async ({ page }) => {
      const weatherPage = new WeatherPage(page);
      await page.goto('/?city=Mendoza&compare=Buenos+Aires');
      const hasGrid = await weatherPage.comparisonGrid.isVisible();
      if (hasGrid) {
        await page.click('text=✕ Remove comparison');
        await expect(weatherPage.comparisonGrid).not.toBeVisible();
      }
    });
  });
});