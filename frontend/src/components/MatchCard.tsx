import React, { useEffect, useState } from 'react';
import { Clock, Activity, ChevronLeft } from 'lucide-react';
import { MatchItem } from '../types';

interface Props {
  match: MatchItem;
  onSelect: (match: MatchItem) => void;
}

export const MatchCard: React.FC<Props> = ({ match, onSelect }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (match.status !== 'pre') return;
    const update = () => {
      const diff = new Date(match.date).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('قريب يبدا');
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (hrs > 24) {
        setCountdown(`باقي ${Math.floor(hrs / 24)} أيام`);
      } else {
        setCountdown(`${hrs}س ${mins}د`);
      }
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [match.date, match.status]);

  const timeFormatted = new Date(match.date).toLocaleTimeString('ar-MA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      onClick={() => onSelect(match)}
      className="group w-full text-right rounded-2xl border border-slate-800/90 bg-slate-900/85 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-900 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="rounded-lg bg-slate-800 px-2.5 py-1 font-semibold text-slate-300">
          {match.league_name}
        </span>

        {match.status === 'in' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-bold text-emerald-400 animate-pulse">
            <Activity className="h-3.5 w-3.5" /> مباشر ({match.status_detail})
          </span>
        ) : match.status === 'post' ? (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-400">سالا الماتش</span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Clock className="h-3.5 w-3.5" /> {countdown}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 items-center gap-2 py-2">
        <div className="flex flex-col items-center text-center gap-2">
          {match.home.logo && (
            <img src={match.home.logo} alt={match.home.name} className="h-11 w-11 object-contain" />
          )}
          <span className="text-sm font-bold text-white line-clamp-1">{match.home.name}</span>
          {match.home.form && (
            <span dir="ltr" className="text-[10px] tracking-widest text-slate-400">
              {match.home.form}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center justify-center">
          {match.status === 'pre' ? (
            <div className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-center">
              <span className="block text-sm font-extrabold text-emerald-400">{timeFormatted}</span>
              <span className="text-[10px] text-slate-400">
                {new Date(match.date).toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ) : (
            <div dir="ltr" className="text-2xl font-black text-white tracking-wider">
              {match.home.score} - {match.away.score}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          {match.away.logo && (
            <img src={match.away.logo} alt={match.away.name} className="h-11 w-11 object-contain" />
          )}
          <span className="text-sm font-bold text-white line-clamp-1">{match.away.name}</span>
          {match.away.form && (
            <span dir="ltr" className="text-[10px] tracking-widest text-slate-400">
              {match.away.form}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-emerald-400 font-semibold">
        <span>تحليل AI وتوقعات Monte Carlo</span>
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </button>
  );
};
