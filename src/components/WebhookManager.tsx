import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { WebhookConfig } from '../types';

export const WebhookManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [testResult, setTestResult] = useState<{ url: string; msg: string; success: boolean } | null>(null);

  const fetchWebhooks = () => {
    fetch('/api/fuel-prices/webhooks')
      .then((res) => res.json())
      .then((data) => {
        if (data.webhooks) setWebhooks(data.webhooks);
      })
      .catch((err) => console.error('Failed to fetch webhooks:', err));
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/fuel-prices/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          secret: newSecret,
          events: ['price_change', 'scrape_complete'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUrl('');
        setNewSecret('');
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (url: string) => {
    try {
      await fetch('/api/fuel-prices/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestPing = async (url: string) => {
    setTestResult({ url, msg: 'Dispatching test ping...', success: true });
    try {
      const res = await fetch('/api/fuel-prices/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ url, msg: `Delivered! Server response: ${data.status} ${data.statusText || 'OK'}`, success: true });
      } else {
        setTestResult({ url, msg: `Delivery failed: ${data.error}`, success: false });
      }
    } catch (err: any) {
      setTestResult({ url, msg: `Failed to reach endpoint: ${err.message}`, success: false });
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Automated Price Change Webhooks & Push Dispatcher
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Notify your software instantly whenever Indian Oil or IGL revises Delhi fuel prices.
          </p>
        </div>
      </div>

      {/* Webhook Form */}
      <form onSubmit={handleAddWebhook} className="mt-4 flex flex-col md:flex-row gap-2">
        <input
          type="url"
          required
          placeholder="https://your-taxi-software.com/api/fuel-webhook"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
        />
        <input
          type="text"
          placeholder="Optional Signature Secret"
          value={newSecret}
          onChange={(e) => setNewSecret(e.target.value)}
          className="w-full md:w-56 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </form>

      {/* Registered Webhooks List */}
      <div className="mt-4 space-y-2">
        {webhooks.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center border border-dashed border-slate-200">
            No active webhooks registered. Add your software's endpoint URL above to receive instant price updates.
          </div>
        ) : (
          webhooks.map((hook) => (
            <div
              key={hook.url}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-slate-800 font-semibold truncate">{hook.url}</div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                  <span>Triggers: <strong className="text-slate-700">Price Change, Scrape Sync</strong></span>
                  {hook.lastTriggered && (
                    <span>Last fired: {new Date(hook.lastTriggered).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleTestPing(hook.url)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                >
                  <Send className="w-3 h-3 text-slate-500" />
                  Test Ping
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(hook.url)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {testResult && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{testResult.msg}</span>
        </div>
      )}
    </div>
  );
};
