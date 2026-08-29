import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Droplets,
  Server,
  Code2,
  Bell,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  Key,
} from 'lucide-react';
import { DelhiFuelData, ScrapeLog } from './types';
import { LiveFuelBanner } from './components/LiveFuelBanner';
import { ApiIntegrationHub } from './components/ApiIntegrationHub';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ScraperInspector } from './components/ScraperInspector';
import { PriceBreakdown } from './components/PriceBreakdown';
import { HistoricalChart } from './components/HistoricalChart';
import { WebhookManager } from './components/WebhookManager';

export default function App() {
  const [fuelData, setFuelData] = useState<DelhiFuelData | null>(null);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'api' | 'keys' | 'scraper' | 'history' | 'webhooks'>('overview');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('dlf_live_demo_delhi_fuel_2026');
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [lastScrapeTime, setLastScrapeTime] = useState<Date>(new Date());
  const [secondsUntilNext, setSecondsUntilNext] = useState(900);


  // Check if standalone widget mode is requested
  const isWidgetMode = typeof window !== 'undefined' && window.location.search.includes('mode=widget');

  const fetchCurrentPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/fuel-prices/delhi');
      const json = await res.json();
      if (json.success && json.data) {
        setFuelData(json.data);
        if (json.data.autoUpdateIntervalSec) {
          setIntervalMinutes(Math.round(json.data.autoUpdateIntervalSec / 60));
        }
      }
    } catch (err) {
      console.error('Failed to fetch fuel prices:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/fuel-prices/logs');
      const json = await res.json();
      if (json.success && json.logs) {
        setLogs(json.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/fuel-prices/refresh', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setFuelData(json.data);
        setLastScrapeTime(new Date());
        setSecondsUntilNext(intervalMinutes * 60);
      }
      await fetchLogs();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInterval = async (mins: number) => {
    try {
      const res = await fetch('/api/fuel-prices/interval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: mins }),
      });
      const json = await res.json();
      if (json.success) {
        setIntervalMinutes(mins);
        setSecondsUntilNext(mins * 60);
        await fetchLogs();
      }
    } catch (err) {
      console.error('Interval update failed:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCurrentPrices();
    fetchLogs();
  }, [fetchCurrentPrices, fetchLogs]);

  // Periodic polling & countdown timer in UI
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          fetchCurrentPrices();
          fetchLogs();
          return intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalMinutes, fetchCurrentPrices, fetchLogs]);

  // If in pure widget mode, render just the exact banner
  if (isWidgetMode) {
    return (
      <div className="p-3 bg-transparent">
        <LiveFuelBanner
          data={fuelData}
          isLoading={isLoading}
          onRefresh={handleManualRefresh}
          standalone={true}
        />
      </div>
    );
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 via-amber-500 to-emerald-500 flex items-center justify-center shadow-xs">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                  Delhi Live Fuel Price Engine
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Govt Scraper Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Continuous auto-updating rates from IOCL, IGL & PPAC for software integration
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-lg text-xs text-slate-600 border border-slate-200/60 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Next Scrape: <strong>{formatCountdown(secondsUntilNext)}</strong></span>
            </div>

            <a
              href="?mode=widget"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Widget Mode</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Section 1: The Pristine Live Fuel Banner (matching reference design) */}
        <section aria-label="Delhi Live Fuel Banner">
          <LiveFuelBanner
            data={fuelData}
            isLoading={isLoading}
            onRefresh={handleManualRefresh}
          />
        </section>

        {/* Section 2: Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Overview & Taxes
          </button>

          <button
            onClick={() => setActiveView('keys')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'keys'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Key className="w-4 h-4" />
            API Keys & Access
          </button>

          <button
            onClick={() => setActiveView('api')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'api'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Code2 className="w-4 h-4" />
            For My Software (API & Embeds)
          </button>

          <button
            onClick={() => setActiveView('scraper')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'scraper'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Server className="w-4 h-4" />
            Govt Scraper Inspector
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            30-Day Rate Trend
          </button>

          <button
            onClick={() => setActiveView('webhooks')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'webhooks'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Bell className="w-4 h-4" />
            Webhooks & Alerts
          </button>
        </div>

        {/* Section 3: Active Tab View */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <PriceBreakdown data={fuelData} />
            <ScraperInspector
              data={fuelData}
              logs={logs}
              onRefreshLogs={fetchLogs}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeView === 'keys' && (
          <div className="space-y-6">
            <ApiKeyManager
              onSelectKeyForSnippets={(k) => setSelectedApiKey(k)}
              selectedKeyForSnippets={selectedApiKey}
            />
          </div>
        )}

        {activeView === 'api' && (
          <div className="space-y-6">
            <ApiIntegrationHub
              data={fuelData}
              onUpdateInterval={handleUpdateInterval}
              intervalMinutes={intervalMinutes}
              onNavigateToKeys={() => setActiveView('keys')}
              activeApiKey={selectedApiKey}
            />
          </div>
        )}

        {activeView === 'scraper' && (
          <div className="space-y-6">
            <ScraperInspector
              data={fuelData}
              logs={logs}
              onRefreshLogs={fetchLogs}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-6">
            <HistoricalChart
              currentPetrol={fuelData?.fuels.petrol.price || 94.72}
              currentDiesel={fuelData?.fuels.diesel.price || 87.62}
              currentCng={fuelData?.fuels.cng.price || 75.09}
              currentEv={fuelData?.fuels.ev.price || 8.50}
            />
          </div>
        )}

        {activeView === 'webhooks' && (
          <div className="space-y-6">
            <WebhookManager />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-200/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time Delhi Fuel Scraping Service · Indian Oil (IOCL) + IGL Delhi + PPAC Grounding</span>
        </div>
        <div>
          <span>REST API Ready at <code className="font-mono text-slate-600">/api/fuel-prices/delhi</code></span>
        </div>
      </footer>
    </div>
  );
}
