import React, { useState, useEffect } from 'react';
import {
  Activity,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  ExternalLink,
  Flame,
  Radio,
} from 'lucide-react';
import { DelhiFuelData, ScrapeLog } from '../types';

interface ScraperInspectorProps {
  data: DelhiFuelData | null;
  logs: ScrapeLog[];
  onRefreshLogs: () => void;
  isLoading: boolean;
}

export const ScraperInspector: React.FC<ScraperInspectorProps> = ({
  data,
  logs,
  onRefreshLogs,
  isLoading,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Government Source Feeds & Scraper Daemon
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time health monitor of official PSU & regulatory data pipelines for Delhi NCT.
          </p>
        </div>

        <button
          onClick={onRefreshLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* 4 Official Sources Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {data?.sources.map((src) => (
          <div
            key={src.name}
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {src.type}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/70 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">
              {src.name}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
              <span>Ping: {src.latencyMs}ms</span>
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <span>Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Additional LPG & Gas Rates in Delhi */}
      {data?.fuels.lpg_commercial && data?.fuels.lpg_domestic && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Official LPG & Piped Natural Gas Rates in Delhi (IOCL Indane / IGL / MoPNG)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700">Commercial LPG (19 kg)</div>
                <div className="text-[11px] text-slate-400">Non-subsidized for Taxis / Fleet / Commercial</div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">
                  ₹{data.fuels.lpg_commercial.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 ml-1">/cyl</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700">Domestic LPG (14.2 kg)</div>
                <div className="text-[11px] text-slate-400">Regulated Household Cylinder</div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">
                  ₹{data.fuels.lpg_domestic.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 ml-1">/cyl</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700">Domestic PNG (IGL)</div>
                <div className="text-[11px] text-slate-400">Piped Gas / Delhi Households</div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-sky-700">
                  ₹{data.fuels.png_domestic?.price.toFixed(2) || '49.59'}
                </span>
                <span className="text-xs text-slate-500 ml-1">/SCM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Scrape Log Stream */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Live Scrape Execution Stream
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Auto-captured from backend scraping worker
          </span>
        </div>

        <div className="bg-slate-900 rounded-xl p-3 max-h-[220px] overflow-y-auto font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-4">Waiting for scrape logs...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
                <span className="text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase shrink-0 ${
                    log.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : log.status === 'warning'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {log.status}
                </span>
                <span className="text-indigo-400 font-semibold shrink-0">[{log.source}]</span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
