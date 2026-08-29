import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { PriceHistoryPoint } from '../types';

interface HistoricalChartProps {
  currentPetrol: number;
  currentDiesel: number;
  currentCng: number;
  currentEv: number;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  currentPetrol,
  currentDiesel,
  currentCng,
  currentEv,
}) => {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [activeFuel, setActiveFuel] = useState<'petrol' | 'diesel' | 'cng' | 'all'>('all');

  useEffect(() => {
    fetch('/api/fuel-prices/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.points) {
          setHistory(data.points);
        }
      })
      .catch((err) => console.error('Failed to load history:', err));
  }, []);

  // Compute 30-day min and max for chart scaling
  const allPetrol = history.map((h) => h.petrol);
  const minPetrol = allPetrol.length ? Math.min(...allPetrol) : 102.12;
  const maxPetrol = allPetrol.length ? Math.max(...allPetrol) : 102.12;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              30-Day Delhi Fuel Price Trend & History
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking daily price stability and revision dynamics in the National Capital Territory.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          {(['all', 'petrol', 'diesel', 'cng'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveFuel(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeFuel === mode
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'all' ? 'All Fuels' : mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Rate Comparison Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
          <span className="text-[11px] font-semibold text-red-700">Petrol (Delhi)</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">₹{currentPetrol.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">30d Range: ₹{minPetrol} - ₹{maxPetrol}</span>
        </div>

        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
          <span className="text-[11px] font-semibold text-amber-700">Diesel (Delhi)</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">₹{currentDiesel.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">Base OMC Rate</span>
        </div>

        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-700">CNG (IGL)</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">₹{currentCng.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">Per kg / City Gate</span>
        </div>

        <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-xl">
          <span className="text-[11px] font-semibold text-cyan-700">EV Public</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">₹{currentEv.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">DERC Tariff / kWh</span>
        </div>
      </div>

      {/* Historical Data Table with Micro Bars */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Petrol (₹/L)</th>
              <th className="py-2.5 px-3">Diesel (₹/L)</th>
              <th className="py-2.5 px-3">CNG (₹/kg)</th>
              <th className="py-2.5 px-3">EV Tariff (₹/kWh)</th>
              <th className="py-2.5 px-3">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.slice(-8).reverse().map((h, i) => (
              <tr key={h.date} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{h.date}</span>
                </td>
                <td className="py-2.5 px-3 font-bold text-red-600">₹{h.petrol.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-amber-600">₹{h.diesel.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-emerald-600">₹{h.cng.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-cyan-600">₹{h.ev.toFixed(2)}</td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Minus className="w-3 h-3 text-slate-400" />
                    Stable
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
