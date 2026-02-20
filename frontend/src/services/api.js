/**
 * API 服务
 */
import { API_BASE_URL } from '../config';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // 新闻相关
  async getBreakingNews(region = null, limit = 10) {
    const params = new URLSearchParams({ limit });
    if (region) params.append('region', region);
    return this.fetch(`/news/breaking?${params}`);
  }

  async getLatestNews(region = null, eventType = null, limit = 20) {
    const params = new URLSearchParams({ limit });
    if (region) params.append('region', region);
    if (eventType) params.append('event_type', eventType);
    return this.fetch(`/news/latest?${params}`);
  }

  async getHeadlines(region = null, limit = 10) {
    const params = new URLSearchParams({ limit });
    if (region) params.append('region', region);
    return this.fetch(`/news/headlines?${params}`);
  }

  async getDailyBriefing(region = 'russia-ukraine', date = null) {
    const params = new URLSearchParams({ region });
    if (date) params.append('date', date);
    return this.fetch(`/news/briefing?${params}`);
  }

  async getNewsVolume(region = null, days = 30) {
    const params = new URLSearchParams({ days });
    if (region) params.append('region', region);
    return this.fetch(`/news/volume?${params}`);
  }

  // 社交媒体相关
  async getSocialFeed(platform = null, region = null, limit = 50) {
    const params = new URLSearchParams({ limit });
    if (platform) params.append('platform', platform);
    if (region) params.append('region', region);
    return this.fetch(`/social/feed?${params}`);
  }

  async getTrackedAccounts(platform = null, category = null) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (category) params.append('category', category);
    return this.fetch(`/social/accounts?${params}`);
  }

  async getSocialVolume(keyword, hours = 24) {
    const params = new URLSearchParams({ keyword, hours });
    return this.fetch(`/social/volume?${params}`);
  }

  // 市场相关
  async getPredictionMarkets(region = null, limit = 10) {
    const params = new URLSearchParams({ limit });
    if (region) params.append('region', region);
    return this.fetch(`/markets/predictions?${params}`);
  }

  async getDefenseStocks() {
    return this.fetch('/markets/stocks/defense');
  }

  async getEnergyStocks() {
    return this.fetch('/markets/stocks/energy');
  }

  async getCommodities() {
    return this.fetch('/markets/commodities');
  }

  async getMarketAlerts(region = null) {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    return this.fetch(`/markets/alerts?${params}`);
  }

  async getMarketOverview() {
    return this.fetch('/markets/overview');
  }

  // 地区相关
  async getRegions() {
    return this.fetch('/regions/');
  }

  async getCurrentHotspot() {
    return this.fetch('/regions/hotspot');
  }

  async getAllRegionsAnalysis() {
    return this.fetch('/regions/analysis');
  }

  async getRegionDetail(regionId) {
    return this.fetch(`/regions/${regionId}`);
  }

  // Translation
  async translate(text, source = 'auto', target = 'zh-CN') {
    return this.fetch('/translate/translate', {
      method: 'POST',
      body: JSON.stringify({ text, source, target })
    });
  }

  async translateBatch(texts, source = 'auto', target = 'zh-CN') {
    return this.fetch('/translate/translate/batch', {
      method: 'POST',
      body: JSON.stringify({ texts, source, target })
    });
  }

  async getLanguages() {
    return this.fetch('/translate/translate/languages');
  }
}

export const api = new ApiService();
export default api;
