import React from 'react';
import { X, ShieldAlert, TrendingUp, Users, Sparkles } from 'lucide-react';
import { MatchAnalysisResponse } from '../types';

interface Props {
  data: MatchAnalysisResponse | null;
  loading: boolean;
  onClose: () => void;
}

export const MatchAnalysisModal: React.FC<Props> = ({ data, loading, onClose }) => {
  if (!loading && !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#0b1120] p-5 sm:p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="sticky top-0 float-left rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        {loading || !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm font-semibold text-emerald-400">
              كنحسبو 10,000 محاكاة Monte Carlo وكنحللو المعطيات...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center border-b border-slate-800 pb-5">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                {data.match.league_name}
              </span>
              <div className="mt-4 flex items-center justify-around gap-4">
                <div className="flex flex-col items-center gap-2">
                  {data.match.home.logo && <img src={data.match.home.logo} className="h-14 w-14" alt="" />}
                  <h2 className="text-lg font-extrabold text-white">{data.match.home.name}</h2>
                  <span className="text-xs text-slate-400">Elo: {data.prediction.elo.home}</span>
                </div>

                <div className="text-center">
                  <span className="text-2xl font-black text-emerald-400">VS</span>
                  <span className="block mt-1 text-xs text-slate-400">
                    ثقة الموديل: {data.prediction.confidence.label} ({data.prediction.confidence.score}%)
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {data.match.away.logo && <img src={data.match.away.logo} className="h-14 w-14" alt="" />}
                  <h2 className="text-lg font-extrabold text-white">{data.match.away.name}</h2>
                  <span className="text-xs text-slate-400">Elo: {data.prediction.elo.away}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center">
                <span className="text-xs text-slate-400">فوز {data.match.home.name}</span>
                <span className="mt-1 block text-2xl font-black text-emerald-400">
                  {data.prediction.probabilities.home_win}%
                </span>
                <span className="text-xs text-slate-500">xG: {data.prediction.expected_goals.home}</span>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center">
                <span className="text-xs text-slate-400">تعادل (X)</span>
                <span className="mt-1 block text-2xl font-black text-amber-400">
                  {data.prediction.probabilities.draw}%
                </span>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center">
                <span className="text-xs text-slate-400">فوز {data.match.away.name}</span>
                <span className="mt-1 block text-2xl font-black text-sky-400">
                  {data.prediction.probabilities.away_win}%
                </span>
                <span className="text-xs text-slate-500">xG: {data.prediction.expected_goals.away}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'BTTS (بجوج يسجلو)', val: data.prediction.probabilities.btts_yes },
                { label: 'Over 1.5 أهداف', val: data.prediction.probabilities.over_1_5 },
                { label: 'Over 2.5 أهداف', val: data.prediction.probabilities.over_2_5 },
                { label: 'Over 3.5 أهداف', val: data.prediction.probabilities.over_3_5 },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                  <span className="text-xs text-slate-400">{m.label}</span>
                  <span className="mt-1 block text-lg font-extrabold text-white">{m.val}%</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> أقرب النتائج المتوقعة (Exact Score)
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {data.prediction.exact_scores.map((s) => (
                  <div
                    key={s.score}
                    className="flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 border border-slate-700"
                  >
                    <span dir="ltr" className="font-black text-emerald-400">
                      {s.score}
                    </span>
                    <span className="text-xs text-slate-300">{s.probability}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/25 p-5 space-y-3">
              <h3 className="text-base font-extrabold text-emerald-400 flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> تحليل Kora AI بالدارجة المغربية
              </h3>
              <p className="text-sm leading-relaxed text-slate-100">{data.prediction.darija_analysis.verdict}</p>
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs text-slate-300">
                  <strong className="block text-emerald-400 mb-1">القوة الهجومية:</strong>
                  {data.prediction.darija_analysis.attack}
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs text-slate-300">
                  <strong className="block text-emerald-400 mb-1">الصلابة الدفاعية:</strong>
                  {data.prediction.darija_analysis.defense}
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs text-amber-200 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{data.prediction.darija_analysis.injuries}</span>
              </div>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                {data.prediction.darija_analysis.scenarios.map((sc, idx) => (
                  <li key={idx}>{sc}</li>
                ))}
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" /> التشكيلة المتوقعة / الرسمية
                </h4>
                {data.lineups.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    {data.lineups.map((l) => (
                      <div key={l.team}>
                        <strong className="text-emerald-400">{l.team}:</strong>
                        <p className="text-slate-300 mt-1">
                          {l.players.map((p) => `${p.name} (${p.position})`).join(' • ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">التشكيلة الرسمية مازال ما تّعلناتش من المصدر.</p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <h4 className="text-sm font-bold text-white mb-2">المواجهات المباشرة (H2H)</h4>
                {data.h2h.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {data.h2h.map((g, i) => (
                      <li key={i} className="flex justify-between border-b border-slate-800 pb-1">
                        <span>{g.date}</span>
                        <span dir="ltr" className="font-bold text-emerald-400">{g.score}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">معطيات المواجهات السابقة غير متوفرة لهاد الماتش.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
