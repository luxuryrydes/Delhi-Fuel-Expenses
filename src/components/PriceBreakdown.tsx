import React, { useState } from 'react';
import { Calculator, Percent, Info, ShieldCheck } from 'lucide-react';
import { DelhiFuelData } from '../types';

interface PriceBreakdownProps {
  data: DelhiFuelData | null;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ data }) => {
  const [selectedFuel, setSelectedFuel] = useState<'petrol' | 'diesel'>('petrol');
  const breakdown = data?.priceBreakdown?.[selectedFuel];

  if (!breakdown) return null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Delhi Fuel Tax & Cost Breakdown (MoPNG / PPAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Understanding base refining cost, Central Excise, Dealer margin, and Delhi VAT.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setSelectedFuel('petrol')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedFuel === 'petrol'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Petrol Breakdown
          </button>
          <button
            onClick={() => setSelectedFuel('diesel')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedFuel === 'diesel'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diesel Breakdown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-center">
        {/* Breakdown Items List */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-medium text-slate-600">Base Price (ex-Refinery):</span>
            <span className="font-bold text-slate-900">₹{breakdown.basePrice.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-medium text-slate-600">Freight Charges:</span>
            <span className="font-bold text-slate-900">₹{breakdown.freight.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-red-50/60 border border-red-100/80">
            <span className="font-medium text-red-800">Central Excise Duty (Govt of India):</span>
            <span className="font-bold text-red-900">₹{breakdown.exciseDuty.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-medium text-slate-600">Dealer Commission:</span>
            <span className="font-bold text-slate-900">₹{breakdown.dealerCommission.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/80">
            <span className="font-medium text-amber-800">Delhi State VAT (19.40%):</span>
            <span className="font-bold text-amber-900">₹{breakdown.vat.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-slate-900 text-white font-bold">
            <span>Final Retail Selling Price (Delhi):</span>
            <span className="text-emerald-400 text-base">₹{breakdown.retailPrice.toFixed(2)} /L</span>
          </div>
        </div>

        {/* Visual Percent Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
          <div className="text-xs font-bold text-slate-700">Tax Share vs Base Cost in Delhi</div>

          {/* Progress bar */}
          <div className="h-4 w-full rounded-full bg-slate-200 flex overflow-hidden">
            <div
              style={{ width: `${(breakdown.basePrice / breakdown.retailPrice) * 100}%` }}
              className="bg-indigo-500 h-full"
              title="Base Price"
            ></div>
            <div
              style={{ width: `${(breakdown.exciseDuty / breakdown.retailPrice) * 100}%` }}
              className="bg-red-500 h-full"
              title="Excise Duty"
            ></div>
            <div
              style={{ width: `${(breakdown.vat / breakdown.retailPrice) * 100}%` }}
              className="bg-amber-500 h-full"
              title="Delhi VAT"
            ></div>
            <div
              style={{ width: `${(breakdown.dealerCommission / breakdown.retailPrice) * 100}%` }}
              className="bg-emerald-500 h-full"
              title="Dealer Margin"
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Base: {((breakdown.basePrice / breakdown.retailPrice) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Excise: {((breakdown.exciseDuty / breakdown.retailPrice) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Delhi VAT: {((breakdown.vat / breakdown.retailPrice) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Dealer: {((breakdown.dealerCommission / breakdown.retailPrice) * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-start gap-1 pt-1 border-t border-slate-200/60">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Rates reflect standard daily price revision structure declared by Indian Oil (IOCL) and Ministry of Petroleum & Natural Gas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
