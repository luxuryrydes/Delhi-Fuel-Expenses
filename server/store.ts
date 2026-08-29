import { DelhiFuelData, ScrapeLog, PriceHistoryPoint, WebhookConfig, ApiKey, ApiKeyCreatePayload, ApiKeyTier } from '../src/types.js';
import { scrapeAllDelhiFuelPrices } from './scraper.js';
import crypto from 'crypto';

class FuelPriceStore {
  private currentData: DelhiFuelData | null = null;
  private logs: ScrapeLog[] = [];
  private history: PriceHistoryPoint[] = [];
  private webhooks: WebhookConfig[] = [];
  private apiKeys: ApiKey[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private intervalMinutes: number = 15;
  private isUpdating: boolean = false;

  constructor() {
    this.initHistory();
    this.initDefaultApiKeys();
  }

  private initDefaultApiKeys() {
    const now = new Date().toISOString();
    this.apiKeys = [
      {
        id: 'key_starter_demo',
        name: 'Public Starter & Taxi App Key',
        key: 'dlf_live_demo_delhi_fuel_2026',
        maskedKey: 'dlf_live_••••••••2026',
        tier: 'Starter',
        rateLimitPerMin: 60,
        requestCount: 42,
        createdAt: now,
        lastUsedAt: now,
        status: 'active',
        description: 'Instant ready-to-use API key for frontend widgets, mobile apps, and developer testing.',
        createdFor: 'General Developers / Taxi Services',
      },
      {
        id: 'key_fleet_dispatch',
        name: 'Taxi Fleet & Dispatch Production Key',
        key: 'dlf_live_taxi_fleet_delhi_9821',
        maskedKey: 'dlf_live_••••••••9821',
        tier: 'Fleet Enterprise',
        rateLimitPerMin: 1000,
        requestCount: 184,
        createdAt: now,
        lastUsedAt: now,
        status: 'active',
        description: 'High-throughput production key for automated fare calculations and dispatch servers.',
        createdFor: 'Fleet Operations (LRTaxi / Dispatch)',
      },
      {
        id: 'key_pro_accounting',
        name: 'Accounting & Fuel Reconciliation ERP',
        key: 'dlf_live_erp_accounting_7743',
        maskedKey: 'dlf_live_••••••••7743',
        tier: 'Pro',
        rateLimitPerMin: 300,
        requestCount: 12,
        createdAt: now,
        lastUsedAt: now,
        status: 'active',
        description: 'Synchronizes daily commercial fuel and CNG rates with accounting spreadsheets.',
        createdFor: 'Finance & Billing',
      },
    ];
  }

  private initHistory() {
    // Generate 30 days of realistic Delhi fuel price trends leading up to current date
    const now = new Date();
    const historyPoints: PriceHistoryPoint[] = [];
    const baseP = 102.12;
    const baseD = 95.20;
    const baseC = 86.98;
    const baseE = 8.50;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // CNG was 83.09 prior to recent IGL revision of +3.89 up to 86.98
      const cngVal = i <= 2 ? baseC : 83.09;

      historyPoints.push({
        date: dateStr,
        petrol: baseP,
        diesel: baseD,
        cng: cngVal,
        ev: baseE,
      });
    }
    this.history = historyPoints;
  }

  public async initialize() {
    this.addLog({
      id: `log-init-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'System Daemon',
      action: 'Initialization',
      status: 'success',
      message: 'Continuous Fuel Price Scraping Engine initialized for Delhi NCT.',
    });

    await this.refreshPrices(true);
    this.startBackgroundPoller();
  }

  public startBackgroundPoller() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    const ms = this.intervalMinutes * 60 * 1000;
    this.updateTimer = setInterval(() => {
      this.refreshPrices(false).catch((err) => {
        console.error('Background fuel price scrape error:', err);
      });
    }, ms);
  }

  public setIntervalMinutes(minutes: number) {
    this.intervalMinutes = Math.max(1, minutes);
    if (this.currentData) {
      this.currentData.autoUpdateIntervalSec = this.intervalMinutes * 60;
    }
    this.startBackgroundPoller();
    this.addLog({
      id: `log-interval-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Config',
      action: 'Set Interval',
      status: 'success',
      message: `Scrape poll interval updated to every ${this.intervalMinutes} minute(s).`,
    });
  }

  public getIntervalMinutes(): number {
    return this.intervalMinutes;
  }

  public async refreshPrices(isManual: boolean = false): Promise<DelhiFuelData> {
    if (this.isUpdating) {
      if (this.currentData) return this.currentData;
    }
    this.isUpdating = true;

    try {
      this.addLog({
        id: `log-req-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: isManual ? 'Manual User Trigger' : 'Cron Daemon',
        action: 'Scrape Dispatch',
        status: 'success',
        message: `Executing real-time scrape across IOCL, PPAC, IGL, and DERC endpoints.`,
      });

      const { data, logs } = await scrapeAllDelhiFuelPrices();

      // Check for price changes against previous data
      if (this.currentData) {
        const prevP = this.currentData.fuels.petrol.price;
        const prevD = this.currentData.fuels.diesel.price;
        const prevC = this.currentData.fuels.cng.price;

        const diffP = data.fuels.petrol.price - prevP;
        const diffD = data.fuels.diesel.price - prevD;
        const diffC = data.fuels.cng.price - prevC;

        data.fuels.petrol.change = Number(diffP.toFixed(2));
        data.fuels.petrol.changePercent = Number(((diffP / prevP) * 100).toFixed(2));
        data.fuels.diesel.change = Number(diffD.toFixed(2));
        data.fuels.diesel.changePercent = Number(((diffD / prevD) * 100).toFixed(2));
        data.fuels.cng.change = Number(diffC.toFixed(2));
        data.fuels.cng.changePercent = Number(((diffC / prevC) * 100).toFixed(2));

        if (diffP !== 0 || diffD !== 0 || diffC !== 0) {
          this.triggerWebhooks('price_change', data);
        }
      }

      data.autoUpdateIntervalSec = this.intervalMinutes * 60;
      this.currentData = data;

      // Add scrape logs
      logs.forEach((l) => this.addLog(l));

      this.triggerWebhooks('scrape_complete', data);
      return data;
    } catch (err: any) {
      this.addLog({
        id: `log-err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'Scraper Core',
        action: 'Scrape Failure',
        status: 'error',
        message: `Failed to scrape fuel prices: ${err.message}`,
      });
      if (this.currentData) return this.currentData;
      throw err;
    } finally {
      this.isUpdating = false;
    }
  }

  public getData(): DelhiFuelData | null {
    return this.currentData;
  }

  public getLogs(): ScrapeLog[] {
    return this.logs.slice(0, 100);
  }

  public addLog(log: ScrapeLog) {
    this.logs.unshift(log);
    if (this.logs.length > 200) {
      this.logs.pop();
    }
  }

  public getHistory(): PriceHistoryPoint[] {
    return this.history;
  }

  public getWebhooks(): WebhookConfig[] {
    return this.webhooks;
  }

  public addWebhook(webhook: WebhookConfig) {
    this.webhooks.push(webhook);
  }

  public removeWebhook(url: string) {
    this.webhooks = this.webhooks.filter((w) => w.url !== url);
  }

  public getApiKeys(): ApiKey[] {
    return this.apiKeys;
  }

  public createApiKey(payload: ApiKeyCreatePayload): ApiKey {
    const rawRandom = crypto.randomBytes(16).toString('hex');
    const fullKey = `dlf_live_${rawRandom}`;
    const maskedKey = `dlf_live_••••••••${rawRandom.slice(-4)}`;
    const now = new Date().toISOString();

    const tier: ApiKeyTier = payload.tier || 'Starter';
    let defaultRateLimit = 60;
    if (tier === 'Pro') defaultRateLimit = 300;
    if (tier === 'Fleet Enterprise') defaultRateLimit = 1000;

    const newKey: ApiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: payload.name.trim() || 'Custom API Key',
      key: fullKey,
      maskedKey,
      tier,
      rateLimitPerMin: payload.rateLimitPerMin || defaultRateLimit,
      requestCount: 0,
      createdAt: now,
      lastUsedAt: null,
      status: 'active',
      description: payload.description?.trim() || 'Custom developer API key for Delhi fuel price feeds.',
      createdFor: payload.createdFor?.trim() || 'Software Client',
    };

    this.apiKeys.unshift(newKey);
    this.addLog({
      id: `log-key-${Date.now()}`,
      timestamp: now,
      source: 'Auth & API Key Engine',
      action: 'Key Created',
      status: 'success',
      message: `Generated new API key "${newKey.name}" (${newKey.tier}, ${newKey.rateLimitPerMin} req/min).`,
    });

    return newKey;
  }

  public revokeApiKey(id: string): ApiKey | null {
    const found = this.apiKeys.find((k) => k.id === id);
    if (found) {
      found.status = 'revoked';
      this.addLog({
        id: `log-key-rev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'Auth & API Key Engine',
        action: 'Key Revoked',
        status: 'warning',
        message: `Revoked API key "${found.name}" (ID: ${found.id}).`,
      });
      return found;
    }
    return null;
  }

  public deleteApiKey(id: string): boolean {
    const initialLen = this.apiKeys.length;
    this.apiKeys = this.apiKeys.filter((k) => k.id !== id);
    return this.apiKeys.length < initialLen;
  }

  public validateAndRecordUsage(rawKey: string): { valid: boolean; key?: ApiKey; error?: string } {
    if (!rawKey) {
      return { valid: false, error: 'API key is missing' };
    }
    const cleanKey = rawKey.trim();
    const found = this.apiKeys.find((k) => k.key === cleanKey);

    if (!found) {
      return { valid: false, error: 'Invalid API Key. Please provide an active key generated from the portal.' };
    }

    if (found.status === 'revoked') {
      return { valid: false, error: 'API Key has been revoked. Please create or use an active key.' };
    }

    found.requestCount += 1;
    found.lastUsedAt = new Date().toISOString();
    return { valid: true, key: found };
  }

  public async triggerWebhooks(event: 'price_change' | 'scrape_complete', payload: any) {
    for (const hook of this.webhooks) {
      if (!hook.enabled || !hook.events.includes(event)) continue;
      try {
        const res = await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Fuel-Signature': hook.secret || '',
            'User-Agent': 'Delhi-Fuel-Price-Scraper/1.0',
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            city: 'Delhi',
            data: payload,
          }),
          signal: AbortSignal.timeout(4000),
        });
        hook.lastTriggered = new Date().toISOString();
        hook.lastStatus = res.status;
      } catch (err) {
        hook.lastTriggered = new Date().toISOString();
        hook.lastStatus = 500;
      }
    }
  }
}

export const fuelStore = new FuelPriceStore();
