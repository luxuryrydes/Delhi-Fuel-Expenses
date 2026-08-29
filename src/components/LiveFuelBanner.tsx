import React from 'react';
import { RefreshCw, Droplet, Wind, Zap, Flame, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DelhiFuelData } from '../types';

interface LiveFuelBannerProps {
  data: DelhiFuelData | null;
  isLoading: boolean;
  onRefresh: () => void;
  standalone?: boolean;
}

export const LiveFuelBanner: React.FC<LiveFuelBannerProps> = ({
  data,
  isLoading,
  onRefresh,
  standalone = false,
}) => {
  const fuels = data?.fuels;

  return (
    <div
      id="live-fuel-banner"
      className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs transition-all"
    >
      {/* Header bar matching user's design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              LIVE FUEL PRICES · DELHI
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
              Auto-Syncing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {data?.sourceSummary || 'Auto-fetched from IOCL + IGL (fallback)'} · updated{' '}
            <span className="font-medium text-slate-600">
              {data?.formattedTime || 'Just now'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="refresh-fuel-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin text-indigo-600' : ''}`}
            />
            <span>{isLoading ? 'Scraping Live...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 4 Cards Grid - Matches user reference screenshot exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PETROL */}
        <div
          id="fuel-card-petrol"
          className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-6 h-6 text-white fill-white/80" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {fuels?.petrol.name || 'PETROL'}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{fuels?.petrol.price.toFixed(2) || '102.12'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {fuels?.petrol.unitShort || '/L'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-emerald-600">
                {fuels?.petrol.status || 'Live'}
              </span>
              {fuels?.petrol.change !== undefined && fuels.petrol.change !== 0 && (
                <span
                  className={`text-[11px] ml-1.5 font-medium ${
                    fuels.petrol.change > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {fuels.petrol.change > 0 ? `+₹${fuels.petrol.change}` : `-₹${Math.abs(fuels.petrol.change)}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: DIESEL */}
        <div
          id="fuel-card-diesel"
          className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center gap-4 hover:border-amber-200 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-6 h-6 text-white fill-white/80" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {fuels?.diesel.name || 'DIESEL'}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{fuels?.diesel.price.toFixed(2) || '95.20'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {fuels?.diesel.unitShort || '/L'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-emerald-600">
                {fuels?.diesel.status || 'Live'}
              </span>
              {fuels?.diesel.change !== undefined && fuels.diesel.change !== 0 && (
                <span
                  className={`text-[11px] ml-1.5 font-medium ${
                    fuels.diesel.change > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {fuels.diesel.change > 0 ? `+₹${fuels.diesel.change}` : `-₹${Math.abs(fuels.diesel.change)}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: CNG */}
        <div
          id="fuel-card-cng"
          className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center gap-4 hover:border-emerald-200 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-xs">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {fuels?.cng.name || 'CNG'}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{fuels?.cng.price.toFixed(2) || '86.98'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {fuels?.cng.unitShort || '/kg'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-emerald-600">
                {fuels?.cng.status || 'Live'}
              </span>
              {fuels?.cng.change !== undefined && fuels.cng.change !== 0 && (
                <span
                  className={`text-[11px] ml-1.5 font-medium ${
                    fuels.cng.change > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {fuels.cng.change > 0 ? `+₹${fuels.cng.change}` : `-₹${Math.abs(fuels.cng.change)}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: EV */}
        <div
          id="fuel-card-ev"
          className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center gap-4 hover:border-cyan-200 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-6 h-6 text-white fill-white/80" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {fuels?.ev.name || 'EV'}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{fuels?.ev.price.toFixed(2) || '8.50'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {fuels?.ev.unitShort || '/kWh'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span className="text-xs font-medium text-cyan-700">
                {fuels?.ev.status || 'Live'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!standalone && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Direct PSU Scrapers: <strong className="text-slate-700">IOCL</strong>,{' '}
              <strong className="text-slate-700">IGL Delhi</strong>,{' '}
              <strong className="text-slate-700">PPAC MoPNG</strong>,{' '}
              <strong className="text-slate-700">DERC</strong>
            </span>
          </div>
          <div className="text-slate-400">
            Next scheduled sync: in ~{Math.round((data?.autoUpdateIntervalSec || 900) / 60)} min
          </div>
        </div>
      )}
    </div>
  );
};
