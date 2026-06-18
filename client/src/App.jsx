import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Link, Wand2, RefreshCw, ChevronRight, Check, Trash2, QrCode, X, Search, MessageCircle, BarChart3, Layers, Plus, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [recentLinks, setRecentLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [shortenedLink, setShortenedLink] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [activeQrSlug, setActiveQrSlug] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ url: '', slug: '' }]);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history');

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/links`);
      setRecentLinks(response.data);
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchLinks();
    fetchAnalytics();
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShortenedLink(null);

    try {
      const payload = { url };
      if (customSlug.trim()) {
        payload.slug = customSlug.trim();
      }

      const response = await axios.post(`${API_BASE_URL}/shorten`, payload);
      setShortenedLink(response.data);
      setUrl('');
      setCustomSlug('');
      fetchLinks();
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    if (bulkRows.length >= 10) return;
    setBulkRows([...bulkRows, { url: '', slug: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (bulkRows.length === 1) return;
    setBulkRows(bulkRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...bulkRows];
    newRows[index][field] = value;
    setBulkRows(newRows);
  };

  const handleBulkShorten = async (e) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.url.trim());
    if (validRows.length === 0) {
      setError('Please enter at least one URL.');
      return;
    }
    if (validRows.length > 10) {
      setError('Maximum 10 URLs allowed in bulk mode.');
      return;
    }
    setBulkLoading(true);
    setError(null);
    setBulkResults([]);
    const results = [];
    for (const row of validRows) {
      const payload = { url: row.url.trim() };
      if (row.slug.trim()) payload.slug = row.slug.trim();
      
      try {
        const res = await axios.post(`${API_BASE_URL}/shorten`, payload);
        results.push({ ...res.data, success: true });
      } catch (err) {
        results.push({ url: payload.url, success: false, error: err.response?.data?.error || 'Failed' });
      }
    }
    setBulkResults(results);
    setBulkLoading(false);
    setBulkRows([{ url: '', slug: '' }]);
    fetchLinks();
    fetchAnalytics();
  };

  const copyToClipboard = (text, slug) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/links/${slug}`);
      fetchLinks();
      fetchAnalytics();
    } catch (err) {
      console.error('Error deleting link:', err);
    }
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  const handleGenerateQr = async (slug) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/qr/${slug}`);
      setQrDataUrl(response.data.qrCode);
      setActiveQrSlug(slug);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const filteredLinks = recentLinks.filter(link => 
    link.slug.toLowerCase().includes(searchQuery.toLowerCase()) || 
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative pb-20">

      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">

        {/* Header section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.3)] mb-4">
            <Link className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-300">
            Next-Gen URL Shortener
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Transform long, clunky URLs into sleek, manageable links. Experience lightning-fast redirection with real-time analytics.
          </p>
        </div>

        {/* Main Action Area */}
        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative bg-[#111827]/80 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            {/* Bulk Mode Toggle */}
            <div className="flex items-center justify-end mb-4">
              <button
                type="button"
                onClick={() => { setBulkMode(!bulkMode); setError(null); setShortenedLink(null); setBulkResults([]); }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  bulkMode
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{bulkMode ? 'Bulk Mode ON' : 'Bulk Shorten'}</span>
              </button>
            </div>

            {!bulkMode ? (
              /* Single URL Form */
              <form onSubmit={handleShorten} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Destination URL</label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Link className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/very/long/path/to/something/cool"
                      className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-inner"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Custom Alias <span className="text-slate-500 font-normal">(Optional)</span></label>
                  <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all duration-300 bg-black/40">
                    <span className="flex items-center px-4 bg-white/5 text-slate-400 text-sm border-r border-white/10 select-none">url.short/</span>
                    <input type="text" value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder="my-custom-link" className="block w-full px-4 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                </div>
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 flex items-center justify-center space-x-2 ${loading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transform hover:-translate-y-0.5'}`}>
                  {loading ? (<><RefreshCw className="w-5 h-5 animate-spin" /><span>Shortening...</span></>) : (<><Wand2 className="w-5 h-5" /><span>Shorten URL</span></>)}
                </button>
              </form>
            ) : (
              /* Bulk URL Form */
              <form onSubmit={handleBulkShorten} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">URLs to Shorten</label>
                    <span className="text-xs text-slate-500">{bulkRows.length}/10</span>
                  </div>
                  
                  <div className="space-y-3">
                    {bulkRows.map((row, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-xl shadow-inner group">
                        {/* URL Input */}
                        <div className="relative flex items-center flex-1 w-full">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Link className="h-4 w-4 text-slate-500" />
                          </div>
                          <input
                            type="url"
                            required
                            value={row.url}
                            onChange={(e) => handleRowChange(idx, 'url', e.target.value)}
                            placeholder="https://example.com/long-url"
                            className="block w-full pl-9 pr-3 py-2 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                          />
                        </div>
                        
                        {/* Alias Input */}
                        <div className="flex items-center flex-1 w-full border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 pl-0 sm:pl-3">
                          <input
                            type="text"
                            value={row.slug}
                            onChange={(e) => handleRowChange(idx, 'slug', e.target.value)}
                            placeholder="custom-alias (optional)"
                            className="block w-full px-2 py-2 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                          />
                        </div>

                        {/* Remove Button */}
                        {bulkRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-2 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors absolute sm:static right-2 top-2"
                            title="Remove row"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {bulkRows.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="mt-4 flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all border-dashed w-full justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add URL</span>
                    </button>
                  )}
                </div>
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={bulkLoading} className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 flex items-center justify-center space-x-2 ${bulkLoading ? 'bg-purple-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5'}`}>
                  {bulkLoading ? (<><RefreshCw className="w-5 h-5 animate-spin" /><span>Processing...</span></>) : (<><Layers className="w-5 h-5" /><span>Shorten All</span></>)}
                </button>
              </form>
            )}

            {/* Bulk Results */}
            {bulkResults.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in-up space-y-3">
                <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center"><Check className="w-4 h-4 mr-1" /> Bulk Results</h3>
                {bulkResults.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-sm gap-3 ${r.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="truncate">
                      {r.success ? (
                        <><span className="font-mono text-white">{r.shortUrl}</span><span className="text-slate-500 ml-2">← {r.url}</span></>
                      ) : (
                        <><span className="text-red-400">{r.error}</span><span className="text-slate-500 ml-2">← {r.url}</span></>
                      )}
                    </div>
                    {r.success && (
                      <button onClick={() => copyToClipboard(r.shortUrl, `bulk-${i}`)} className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                        {copiedSlug === `bulk-${i}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Success Result Container */}
            {shortenedLink && (
              <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in-up">
                <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center">
                  <Check className="w-4 h-4 mr-1" /> Successfully Generated!
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 gap-4">
                  <div className="truncate w-full">
                    <p className="text-white font-mono text-lg truncate">
                      <a href={shortenedLink.shortUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors">
                        {shortenedLink.shortUrl}
                      </a>
                    </p>
                    <p className="text-slate-400 text-xs mt-1 truncate">Redirects to: {shortenedLink.url}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(shortenedLink.shortUrl, 'new')}
                    className={`shrink-0 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${copiedSlug === 'new' ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}
                  >
                    {copiedSlug === 'new' ? (<><Check className="w-4 h-4" /><span>Copied!</span></>) : (<><Copy className="w-4 h-4" /><span>Copy</span></>)}
                  </button>
                </div>
                {/* Share Buttons */}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-slate-500 text-xs">Share via:</span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Check this link: ' + shortenedLink.shortUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" /><span>WhatsApp</span>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check this link: ' + shortenedLink.shortUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <span>Twitter / X</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-24 max-w-5xl mx-auto flex justify-center mb-8">
          <div className="inline-flex bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-white/5 p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {activeTab === 'analytics' && analytics && (
          <div className="max-w-5xl mx-auto animate-fade-in-up">
            <h2 className="text-2xl font-bold flex items-center mb-8">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
              Analytics Dashboard
            </h2>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#111827]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                <p className="text-slate-400 text-sm mb-1">Total Links</p>
                <p className="text-3xl font-bold text-white">{analytics.totalLinks}</p>
              </div>
              <div className="bg-[#111827]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                <p className="text-slate-400 text-sm mb-1">Total Clicks</p>
                <p className="text-3xl font-bold text-white">{analytics.totalClicks}</p>
              </div>
              <div className="bg-[#111827]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                <p className="text-slate-400 text-sm mb-1">Most Clicked</p>
                {analytics.topLinks.length > 0 ? (
                  <><p className="text-xl font-bold text-white font-mono">{analytics.topLinks[0].slug}</p><p className="text-blue-400 text-sm">{analytics.topLinks[0].clicks} clicks</p></>
                ) : (
                  <p className="text-slate-500 text-sm">No data yet</p>
                )}
              </div>
            </div>
            {/* Top 5 Bar Chart */}
            {analytics.topLinks.length > 0 && (
              <div className="bg-[#111827]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Top 5 Most Clicked</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.topLinks} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="slug" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                      {analytics.topLinks.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Recent Links Table */}
        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold flex items-center">
              Recent Links
              <span className="ml-3 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                {recentLinks.length} total
              </span>
            </h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search links..."
                  className="block w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all duration-300 text-sm"
                />
              </div>
              <button
                onClick={fetchLinks}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5 shrink-0"
                title="Refresh links"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-[#111827]/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-white/5">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">Short Link</th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">Original URL</th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">Clicks</th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentLinks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        No links generated yet. Create your first short link above!
                      </td>
                    </tr>
                  ) : filteredLinks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        No matches found for "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="font-mono text-blue-400">{link.slug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
                          <div className="truncate text-slate-300" title={link.url}>
                            {link.url}
                          </div>
                          <div className="text-slate-500 text-xs mt-1">
                            Created {new Date(link.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
                            <span className="text-white font-semibold">{link.clicks}</span>
                            <span className="text-slate-500 ml-1 text-xs">clicks</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => copyToClipboard(link.shortUrl, link.slug)}
                            className="inline-flex items-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Copy short link"
                          >
                            {copiedSlug === link.slug ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Visit link"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleGenerateQr(link.slug)}
                            className="inline-flex items-center p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 transition-colors ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Generate QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.slug)}
                            className="inline-flex items-center p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#111827] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                <QrCode className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">QR Code</h3>
              <p className="text-slate-400 text-sm mb-6 truncate">For url.short/{activeQrSlug}</p>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-6 mx-auto shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              
              <a 
                href={qrDataUrl} 
                download={`qr-${activeQrSlug}.png`}
                className="w-full block py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5"
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}

export default App;
