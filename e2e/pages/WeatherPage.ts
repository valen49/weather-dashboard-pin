import { Page, Locator } from '@playwright/test';
import { WeatherLocators } from '../locators/weather.locators';

export class WeatherPage {
  readonly page: Page;
  readonly title: Locator;
  readonly weatherCard: Locator;
  readonly temperature: Locator;
  readonly windSpeed: Locator;
  readonly errorMessage: Locator;
  readonly cityInput: Locator;
  readonly searchButton: Locator;
  readonly locationName: Locator;
  readonly notFoundMessage: Locator;
  readonly forecastContainer: Locator;
  readonly forecastCards: Locator;
  readonly forecastTempMax: Locator;
  readonly forecastTempMin: Locator;
  readonly toggleButton: Locator;
  readonly compareBtn: Locator;
  readonly compareInput: Locator;
  readonly compareSubmit: Locator;
  readonly compareWeatherCard: Locator;
  readonly compareTemperature: Locator;
  readonly compareLocationName: Locator;
  readonly comparisonGrid: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(WeatherLocators.appTitle);
    this.weatherCard = page.locator(WeatherLocators.weatherCard);
    this.temperature = page.locator(WeatherLocators.temperature);
    this.windSpeed = page.locator(WeatherLocators.windSpeed);
    this.errorMessage = page.locator(WeatherLocators.errorMessage);
    this.cityInput = page.locator(WeatherLocators.cityInput);
    this.searchButton = page.locator(WeatherLocators.searchButton);
    this.locationName = page.locator(WeatherLocators.locationName);
    this.notFoundMessage = page.locator(WeatherLocators.notFoundMessage);
    this.forecastContainer = page.locator(WeatherLocators.forecastContainer);
    this.forecastCards = page.locator(WeatherLocators.forecastCard);
    this.forecastTempMax = page.locator(WeatherLocators.forecastTempMax).first();
    this.forecastTempMin = page.locator(WeatherLocators.forecastTempMin).first();
    this.toggleButton = page.locator(WeatherLocators.toggleUnit);
    this.compareBtn = page.locator(WeatherLocators.compareBtn);
    this.compareInput = page.locator(WeatherLocators.compareInput);
    this.compareSubmit = page.locator(WeatherLocators.compareSubmit);
    this.compareWeatherCard = page.locator(WeatherLocators.compareWeatherCard);
    this.compareTemperature = page.locator(WeatherLocators.compareTemperature);
    this.compareLocationName = page.locator(WeatherLocators.compareLocationName);
    this.comparisonGrid = page.locator(WeatherLocators.comparisonGrid);
    this.themeToggle = page.locator(WeatherLocators.themeToggle);
  }

  async goto() {
    await this.page.goto('/');
  }

  async searchCity(city: string) {
    await this.cityInput.fill(city);
    await this.searchButton.click();
  }

  async compareWithCity(city: string) {
    await this.compareBtn.click();
    await this.compareInput.fill(city);
    await this.compareSubmit.click();
  }
}