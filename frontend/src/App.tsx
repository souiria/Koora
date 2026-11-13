import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trophy, Radio, Calendar, Sparkles } from 'lucide-react';
import { MatchItem, MatchAnalysisResponse } from './types';
import { MatchCard } from './components/MatchCard';
import { MatchAnalysisModal } from './components/MatchAnalysisModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function App() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [leagues, setLeagues] = useState<{ code: string; name: string }[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [tab, setTab] = useState<'all' | 'today' | 'live'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [analysisData, setAnalysisData] = useState<MatchAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/leagues`)
      .then((r) => r.json())
      .then(setLeagues)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const url =
      selectedLeague === 'ALL'
        ? `${API_BASE}/api/matches?days=7`
        : `${API_BASE}/api/matches?days=7&league=${selectedLeague}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('فشل الاتصال بالسيرفر');
        return r.json();
      })
      .then((d) => setMatches(d.matches || []))
      .catch((e) => setError(e.message || 'وقع مشكل فجلب الماتشات'))
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  const filteredMatches = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return matches.filter((m) => {
      if (tab === 'live' && m.status !== 'in') return false;
      if (tab === 'today' && !m.date.startsWith(todayStr)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.home.name.toLowerCase().includes(q) ||
          m.away.name.toLowerCase().includes(q) ||
          m.league_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [matches, tab, search]);

  const handleOpenMatch = async (match: MatchItem) => {
    setAnalysisLoading(true);
    setAnalysisData(null);
    try {
      const res = await fetch(`${API_BASE}/api/matches/${match.league_code}/${match.id}`);
      const json = await res.json();
      setAnalysisData(json);
    } catch {
      alert('تعذر تحميل تحليل الماتش دابا.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
              ⚽
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                KORA <span className="text-emerald-400">AI</span> 🇲🇦
              </h1>
              <p className="text-[11px] text-slate-400">تحليل ذكي وتوقعات إحصائية بالدارجة</p>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="قلّب على فرقة أو بطولة..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-9 pl-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tab === 'all' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> 7 أيام الجاية
            </button>
            <button
              onClick={() => setTab('today')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tab === 'today' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> ماتشات اليوم
            </button>
            <button
              onClick={() => setTab('live')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tab === 'live' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5" /> مباشر دابا
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Trophy className="h-4 w-4 text-emerald-400 shrink-0" />
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">جميع البطولات الكبرى</option>
              {leagues.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 animate-pulse rounded-2xl bg-slate-900/70 border border-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-sm text-red-300">
            {error} — تأكد أن السيرفر ديال FastAPI خدام على البورت 8000.
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
            ما كاين حتى ماتش مطابق لهاد الفلتر دابا. جرّب تبدل البطولة أو التاريخ.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((m) => (
              <MatchCard key={m.id} match={m} onSelect={handleOpenMatch} />
            ))}
          </div>
        )}
      </main>

      <MatchAnalysisModal
        data={analysisData}
        loading={analysisLoading}
        onClose={() => {
          setAnalysisData(null);
          setAnalysisLoading(false);
        }}
      />
    </div>
  );
}

export default App;
