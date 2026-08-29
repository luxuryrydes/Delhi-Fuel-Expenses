import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Server,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { ApiKey, ApiKeyTier } from '../types';

interface ApiKeyManagerProps {
  onSelectKeyForSnippets?: (key: string) => void;
  selectedKeyForSnippets?: string;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  onSelectKeyForSnippets,
  selectedKeyForSnippets,
}) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // New key form state
  const [keyName, setKeyName] = useState('');
  const [keyTier, setKeyTier] = useState<ApiKeyTier>('Starter');
  const [keyDescription, setKeyDescription] = useState('');
  const [createdFor, setCreatedFor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);

  // Key tester state
  const [testKeyInput, setTestKeyInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/keys');
      const json = await res.json();
      if (json.success && Array.isArray(json.keys)) {
        setKeys(json.keys);
        if (!testKeyInput && json.keys.length > 0) {
          setTestKeyInput(json.keys[0].key);
        }
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
    if (onSelectKeyForSnippets) {
      onSelectKeyForSnippets(text);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName.trim(),
          tier: keyTier,
          description: keyDescription.trim(),
          createdFor: createdFor.trim() || 'Software Client',
        }),
      });
      const json = await res.json();
      if (json.success && json.key) {
        setNewlyCreatedKey(json.key);
        setTestKeyInput(json.key.key);
        if (onSelectKeyForSnippets) {
          onSelectKeyForSnippets(json.key.key);
        }
        await fetchKeys();
        setKeyName('');
        setKeyDescription('');
        setCreatedFor('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create key:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will immediately receive 401 Unauthorized errors.')) {
      return;
    }
    try {
      const res = await fetch('/api/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchKeys();
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Delete this API key permanently?')) return;
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await fetchKeys();
      }
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  const handleRunKeyTest = async () => {
    if (!testKeyInput.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    const start = performance.now();
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: testKeyInput.trim() }),
      });
      const latency = Math.round(performance.now() - start);
      const json = await res.json();
      setTestResult({
        status: res.status,
        statusText: res.statusText,
        latency,
        body: json,
      });
      // Refresh usage counts in table
      await fetchKeys();
    } catch (err: any) {
      setTestResult({
        status: 500,
        statusText: 'Network Error',
        latency: Math.round(performance.now() - start),
        body: { error: err.message },
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-red-500 text-white rounded-xl shadow-xs shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                  API Key Management & Developer Access
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Shield className="w-3 h-3 mr-1" />
                  REST Auth Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Generate production API keys so taxi fleets, fare dispatchers, accounting software, and mobile apps can query live Delhi fuel rates seamlessly via <code className="font-mono text-slate-700 font-semibold">x-api-key</code> headers.
              </p>
            </div>
          </div>

          <button
            id="btn-generate-api-key"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New API Key</span>
          </button>
        </div>

        {/* Modal: Create API Key */}
        {showCreateModal && (
          <div className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Create New Developer API Key</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Identifier / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi Taxi Dispatch Server"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Usage Tier & Rate Limit
                  </label>
                  <select
                    value={keyTier}
                    onChange={(e) => setKeyTier(e.target.value as ApiKeyTier)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  >
                    <option value="Starter">Starter (60 req/min · Free for Widgets)</option>
                    <option value="Pro">Pro (300 req/min · Commercial & ERP)</option>
                    <option value="Fleet Enterprise">Fleet Enterprise (1000 req/min · Real-time Dispatch)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application / Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LRTaxi Mobile Fleet App"
                    value={createdFor}
                    onChange={(e) => setCreatedFor(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Automatic ride fare estimation with live CNG/Petrol"
                    value={keyDescription}
                    onChange={(e) => setKeyDescription(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !keyName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Generating...' : 'Create API Key'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Newly created key banner alert */}
        {newlyCreatedKey && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-900">
                  New API Key Created: {newlyCreatedKey.name}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-mono break-all">
                  {newlyCreatedKey.key}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(newlyCreatedKey.key, `new-${newlyCreatedKey.id}`)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
              >
                {copiedKeyId === `new-${newlyCreatedKey.id}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Key</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="text-xs text-emerald-600 hover:text-emerald-800 px-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Active API Keys Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Your Active API Keys ({keys.length})</h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any key to copy and test
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Name & Purpose</th>
                <th className="py-2.5 px-3">API Key (Token)</th>
                <th className="py-2.5 px-3">Tier / Rate Limit</th>
                <th className="py-2.5 px-3">Usage</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {keys.map((k) => {
                const isVisible = !!visibleKeys[k.id];
                const displayKey = isVisible ? k.key : k.maskedKey;
                const isRevoked = k.status === 'revoked';

                return (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{k.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {k.description || k.createdFor}
                      </div>
                    </td>

                    {/* Key & Copy */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`px-2 py-1 rounded bg-slate-100 border border-slate-200 font-medium ${
                            isRevoked ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          {displayKey}
                        </span>

                        <button
                          title={isVisible ? 'Hide full key' : 'Show full key'}
                          onClick={() => toggleVisibility(k.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          title="Copy API Key"
                          onClick={() => handleCopy(k.key, k.id)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                        >
                          {copiedKeyId === k.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          k.tier === 'Fleet Enterprise'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : k.tier === 'Pro'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {k.tier}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {k.rateLimitPerMin} req / min
                      </div>
                    </td>

                    {/* Usage */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{k.requestCount} calls</div>
                      <div className="text-[11px] text-slate-400">
                        {k.lastUsedAt
                          ? `Used ${new Date(k.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Never used'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {k.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          Revoked
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Select to test"
                          onClick={() => {
                            setTestKeyInput(k.key);
                            if (onSelectKeyForSnippets) onSelectKeyForSnippets(k.key);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          Test
                        </button>

                        {k.status === 'active' ? (
                          <button
                            title="Revoke key"
                            onClick={() => handleRevokeKey(k.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            title="Delete key"
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-1 text-red-500 hover:text-red-700 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Interactive API Key Playground & Live Tester */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 md:p-6 shadow-xs space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Live API Key Request Tester</h3>
          </div>
          <span className="text-xs text-slate-400">
            Executes against <code className="text-emerald-400 font-mono">/api/fuel-prices/delhi</code>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">x-api-key:</span>
            <input
              type="text"
              value={testKeyInput}
              onChange={(e) => setTestKeyInput(e.target.value)}
              placeholder="Paste or select dlf_live_..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-22 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            id="btn-run-key-test"
            onClick={handleRunKeyTest}
            disabled={isTesting || !testKeyInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Authenticating...' : 'Send Authenticated Request'}</span>
          </button>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    testResult.status === 200
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  HTTP {testResult.status} {testResult.statusText}
                </span>
                <span className="text-slate-400">Latency: {testResult.latency}ms</span>
              </div>

              {testResult.body?.authenticated && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authenticated: {testResult.body.keyDetails?.name} ({testResult.body.keyDetails?.tier})
                </span>
              )}
            </div>

            <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-60 pt-2 leading-relaxed border-t border-slate-800/80">
              <code>{JSON.stringify(testResult.body, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Section 4: How Anyone Can Use The API Key in Their Software */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            3 Ways Anyone Can Pass The API Key in External Software
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Method 1 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">1</span>
              <span>HTTP Header (Recommended)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Pass <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">x-api-key</code> in server-side requests (Node, Python, Go, PHP).
            </p>
            <pre className="p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto">
              <code>x-api-key: {testKeyInput || 'dlf_live_...'}</code>
            </pre>
          </div>

          {/* Method 2 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">2</span>
              <span>Bearer Authorization</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Standard Bearer token header in HTTP request authorization.
            </p>
            <pre className="p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto">
              <code>Authorization: Bearer {testKeyInput || 'dlf_live_...'}</code>
            </pre>
          </div>

          {/* Method 3 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">3</span>
              <span>Query Parameter</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Append <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">?api_key=...</code> for browser widgets & webhooks.
            </p>
            <pre className="p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto">
              <code>/api/fuel-prices/delhi?api_key={testKeyInput ? testKeyInput.substring(0, 16) + '...' : 'dlf_live_...'}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
