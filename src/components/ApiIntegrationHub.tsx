import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Terminal,
  Layers,
  Clock,
  Download,
  Send,
  ExternalLink,
  Play,
  Settings,
  Key,
  Shield,
} from 'lucide-react';
import { DelhiFuelData, ApiKey } from '../types';

interface ApiIntegrationHubProps {
  data: DelhiFuelData | null;
  onUpdateInterval: (minutes: number) => void;
  intervalMinutes: number;
  onNavigateToKeys?: () => void;
  activeApiKey?: string;
}

export const ApiIntegrationHub: React.FC<ApiIntegrationHubProps> = ({
  data,
  onUpdateInterval,
  intervalMinutes,
  onNavigateToKeys,
  activeApiKey: initialApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'rest' | 'widget' | 'test'>('rest');
  const [codeLang, setCodeLang] = useState<'curl' | 'javascript' | 'python' | 'php' | 'nodejs'>('javascript');
  const [copied, setCopied] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>(initialApiKey || 'dlf_live_demo_delhi_fuel_2026');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const apiUrl = `${origin}/api/fuel-prices/delhi`;
  const widgetUrl = `${origin}?mode=widget`;

  useEffect(() => {
    fetch('/api/keys')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.keys) && json.keys.length > 0) {
          setKeys(json.keys);
          if (!initialApiKey) {
            setSelectedKey(json.keys[0].key);
          }
        }
      })
      .catch((err) => console.error('Failed to load keys in hub:', err));
  }, [initialApiKey]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestApi = async () => {
    setIsTesting(true);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (selectedKey) {
        headers['x-api-key'] = selectedKey;
      }
      const res = await fetch('/api/fuel-prices/delhi', { headers });
      const json = await res.json();
      setTestResponse(json);
    } catch (err: any) {
      setTestResponse({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const codeSnippets: Record<string, string> = {
    curl: `# 1. Recommended: Header Authentication
curl -X GET "${apiUrl}" \\
  -H "x-api-key: ${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}" \\
  -H "Accept: application/json"

# 2. Alternative: Query Parameter
curl -X GET "${apiUrl}?api_key=${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}"`,

    javascript: `// In your Frontend Web App, Taxi Dispatcher, or React / Node
async function getDelhiLiveFuelPrices() {
  try {
    const response = await fetch("${apiUrl}", {
      method: "GET",
      headers: {
        "x-api-key": "${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}",
        "Accept": "application/json"
      }
    });

    const result = await response.json();
    if (result.success) {
      const { fuels, auth } = result;
      console.log("Auth Status:", auth);
      console.log("Petrol Rate: ₹" + fuels.petrol.price + " /L"); // ₹102.12
      console.log("Diesel Rate: ₹" + fuels.diesel.price + " /L"); // ₹95.20
      console.log("CNG Rate:    ₹" + fuels.cng.price + " /kg");   // ₹86.98
      return fuels;
    }
  } catch (error) {
    console.error("Failed to fetch Delhi fuel rates:", error);
  }
}`,

    python: `# In your Python / Django / FastAPI / Flask software
import requests

def fetch_delhi_fuel_prices():
    url = "${apiUrl}"
    headers = {
        "x-api-key": "${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}",
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        fuels = data.get("data", {}).get("fuels", {})
        petrol = fuels["petrol"]["price"]
        diesel = fuels["diesel"]["price"]
        cng = fuels["cng"]["price"]
        
        print(f"Delhi Live: Petrol=₹{petrol}/L, Diesel=₹{diesel}/L, CNG=₹{cng}/kg")
        return fuels
    except requests.exceptions.RequestException as e:
        print(f"Error fetching live rates: {e}")
        return None`,

    nodejs: `// In your Node.js / Express / Fleet Server Backend
const axios = require('axios'); // or native fetch

async function syncDelhiFuelRates() {
  try {
    const response = await axios.get('${apiUrl}', {
      headers: {
        'x-api-key': '${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}',
      }
    });
    
    const { petrol, diesel, cng, ev, png_domestic } = response.data.data.fuels;
    
    // Compute taxi fare adjustments or dispatch quotes
    return {
      petrolRate: petrol.price,   // ₹102.12
      dieselRate: diesel.price,   // ₹95.20
      cngRate: cng.price,         // ₹86.98
      evTariff: ev.price,         // ₹8.50
      timestamp: response.data.data.timestamp
    };
  } catch (err) {
    console.error('API Sync Error:', err.response?.data || err.message);
  }
}`,

    php: `<?php
// In your PHP Software / Taxi ERP Backend
$apiUrl = "${apiUrl}";
$apiKey = "${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}";

$options = [
    "http" => [
        "method" => "GET",
        "header" => "x-api-key: " . $apiKey . "\\r\\n" .
                    "Accept: application/json\\r\\n"
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($apiUrl, false, $context);
$result = json_decode($response, true);

if ($result && isset($result['data']['fuels'])) {
    $fuels = $result['data']['fuels'];
    echo "Petrol: ₹" . $fuels['petrol']['price'] . " /L | Diesel: ₹" . $fuels['diesel']['price'];
}
?>`,
  };

  const iframeSnippet = `<iframe
  src="${widgetUrl}"
  width="100%"
  height="160"
  frameborder="0"
  style="border: none; border-radius: 12px; overflow: hidden; max-width: 1100px;"
  title="Delhi Live Fuel Rates Widget"
></iframe>`;

  const reactSnippet = `import { useEffect, useState } from 'react';

export function DelhiFuelRateWidget() {
  const [rates, setRates] = useState(null);

  useEffect(() => {
    fetch("${apiUrl}", {
      headers: { "x-api-key": "${selectedKey || 'dlf_live_demo_delhi_fuel_2026'}" }
    })
      .then(res => res.json())
      .then(json => setRates(json.data.fuels));
  }, []);

  if (!rates) return <div>Loading Delhi fuel rates...</div>;

  return (
    <div className="flex gap-4 p-3 bg-white border rounded-xl shadow-xs">
      <div>Petrol: <strong>₹{rates.petrol.price}/L</strong></div>
      <div>Diesel: <strong>₹{rates.diesel.price}/L</strong></div>
      <div>CNG: <strong>₹{rates.cng.price}/kg</strong></div>
    </div>
  );
}`;


  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Code2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              For Your Software · Integration & Live API
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connect your taxi service, fleet software, dispatch system, or accounting engine to continuous real-time Delhi fuel prices.
          </p>
        </div>

        {/* Polling daemon settings */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
          <Clock className="w-4 h-4 text-slate-500 ml-1.5" />
          <span className="text-xs text-slate-600 font-medium">Scrape Poll:</span>
          <select
            id="interval-select"
            value={intervalMinutes}
            onChange={(e) => onUpdateInterval(Number(e.target.value))}
            aria-label="Scrape update interval"
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value={1}>Every 1 Min (Ultra-Fast)</option>
            <option value={5}>Every 5 Mins (Fast)</option>
            <option value={15}>Every 15 Mins (Standard)</option>
            <option value={30}>Every 30 Mins</option>
            <option value={60}>Every 1 Hour</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mt-4 gap-1">
        <button
          id="tab-rest-api"
          onClick={() => setActiveTab('rest')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'rest'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          REST API & Code Snippets
        </button>
        <button
          id="tab-widget"
          onClick={() => setActiveTab('widget')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'widget'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Embeddable Widget
        </button>
        <button
          id="tab-tester"
          onClick={() => {
            setActiveTab('test');
            if (!testResponse) handleTestApi();
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'test'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Play className="w-4 h-4" />
          Live Response Inspector
        </button>
      </div>

      {/* Tab 1: REST API */}
      {activeTab === 'rest' && (
        <div className="pt-4 space-y-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                GET
              </span>
              <span className="text-slate-300">{apiUrl}</span>
            </div>
            <button
              id="copy-api-url"
              onClick={() => copyToClipboard(apiUrl, 'api-url')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 transition-colors shrink-0"
            >
              {copied === 'api-url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>

          {/* API Key Selector Banner */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Authenticate With API Key:</span>
                <span className="text-slate-500 ml-1.5 hidden md:inline">Injected into headers below</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold"
              >
                {keys.map((k) => (
                  <option key={k.id} value={k.key}>
                    {k.name} ({k.tier} · {k.rateLimitPerMin} req/min)
                  </option>
                ))}
              </select>

              {onNavigateToKeys && (
                <button
                  onClick={onNavigateToKeys}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded-lg shrink-0 transition-colors"
                >
                  Manage Keys
                </button>
              )}
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
              {(['javascript', 'python', 'nodejs', 'curl', 'php'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    codeLang === lang
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'javascript'
                    ? 'JavaScript'
                    : lang === 'python'
                    ? 'Python'
                    : lang === 'nodejs'
                    ? 'Node.js'
                    : lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(codeSnippets[codeLang], `code-${codeLang}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              {copied === `code-${codeLang}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code display */}
          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
            <code>{codeSnippets[codeLang]}</code>
          </pre>

          {/* Quick downloads */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs font-semibold text-slate-500">Instant Export:</span>
            <a
              href="/api/fuel-prices/export?format=json"
              download="delhi_fuel_prices.json"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download JSON Feed
            </a>
            <a
              href="/api/fuel-prices/export?format=csv"
              download="delhi_fuel_prices.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download 30-Day CSV
            </a>
          </div>
        </div>
      )}

      {/* Tab 2: Embed Widget */}
      {activeTab === 'widget' && (
        <div className="pt-4 space-y-4">
          <p className="text-xs text-slate-600">
            Paste this snippet into your website, CRM, or taxi management portal to render the live Delhi fuel bar directly inside your application:
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">1. Standard HTML / iFrame Embed</span>
              <button
                onClick={() => copyToClipboard(iframeSnippet, 'iframe-code')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
              >
                {copied === 'iframe-code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy iFrame</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
              <code>{iframeSnippet}</code>
            </pre>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">2. React / Next.js Component</span>
              <button
                onClick={() => copyToClipboard(reactSnippet, 'react-code')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
              >
                {copied === 'react-code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy React Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
              <code>{reactSnippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Live Response Inspector */}
      {activeTab === 'test' && (
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Live Server JSON Payload
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Status: 200 OK
              </span>
            </div>
            <button
              onClick={handleTestApi}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Fetching...' : 'Re-run Request'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-[380px] border border-slate-800">
            <code>
              {testResponse
                ? JSON.stringify(testResponse, null, 2)
                : JSON.stringify({ data: data || 'Loading...' }, null, 2)}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
};
