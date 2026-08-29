export interface FuelItem {
  id: 'petrol' | 'diesel' | 'cng' | 'ev' | 'lpg_commercial' | 'lpg_domestic' | 'png_domestic';
  name: string;
  category: 'Liquid' | 'Gas' | 'Electric';
  price: number;
  unit: string;
  unitShort: string;
  currency: string;
  change: number;
  changePercent: number;
  status: 'Live' | 'Verified' | 'Fallback';
  primarySource: string;
  sourceUrl: string;
  lastUpdated: string;
  color: string;
  iconType: 'drop' | 'flame' | 'cng' | 'zap';
}

export interface DelhiFuelData {
  city: string;
  state: string;
  country: string;
  timestamp: string;
  formattedTime: string;
  sourceSummary: string;
  sources: {
    name: string;
    type: 'Govt PSU' | 'Regulatory Board' | 'City Gas Operator' | 'Search Grounding';
    url: string;
    status: 'online' | 'cached' | 'error';
    lastChecked: string;
    latencyMs: number;
  }[];
  fuels: {
    petrol: FuelItem;
    diesel: FuelItem;
    cng: FuelItem;
    ev: FuelItem;
    png_domestic?: FuelItem;
    lpg_commercial?: FuelItem;
    lpg_domestic?: FuelItem;
  };
  priceBreakdown?: {
    petrol: {
      basePrice: number;
      freight: number;
      exciseDuty: number;
      dealerCommission: number;
      vat: number;
      retailPrice: number;
    };
    diesel: {
      basePrice: number;
      freight: number;
      exciseDuty: number;
      dealerCommission: number;
      vat: number;
      retailPrice: number;
    };
  };
  autoUpdateIntervalSec: number;
  nextScheduledUpdate: string;
  isScrapingActive: boolean;
}

export interface ScrapeLog {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

export interface PriceHistoryPoint {
  date: string;
  petrol: number;
  diesel: number;
  cng: number;
  ev: number;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  enabled: boolean;
  events: ('price_change' | 'scrape_complete')[];
  lastTriggered?: string;
  lastStatus?: number;
}

export type ApiKeyTier = 'Starter' | 'Pro' | 'Fleet Enterprise' | 'Public Demo';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  tier: ApiKeyTier;
  rateLimitPerMin: number;
  requestCount: number;
  createdAt: string;
  lastUsedAt?: string | null;
  status: 'active' | 'revoked';
  description?: string;
  createdFor?: string;
}

export interface ApiKeyCreatePayload {
  name: string;
  tier?: ApiKeyTier;
  rateLimitPerMin?: number;
  description?: string;
  createdFor?: string;
}

