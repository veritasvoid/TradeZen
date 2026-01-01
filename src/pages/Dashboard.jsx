import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';
import { calculateYearlyStats, formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: trades = [], isLoading } = useTrades();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);
  const startingBalance = useSettingsStore(state => state.settings.startingBalance || 0);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const yearlyStats = calculateYearlyStats(trades, currentYear);

  const totalPL = yearlyStats.reduce((sum, m) => sum + m.totalPL, 0);
  const totalTrades = yearlyStats.reduce((sum, m) => sum + m.tradeCount, 0);
  const totalWins = yearlyStats.reduce((sum, m) => sum + m.winCount, 0);
  const totalLosses = yearlyStats.reduce((sum, m) => sum + m.lossCount, 0);
  const overallWinRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const avgWinner = winners.length > 0 ? winners.reduce((sum, t) => sum + t.amount, 0) / winners.length : 0;
  const avgLoser = losers.length > 0 ? losers.reduce((sum, t) => sum + t.amount, 0) / losers.length : 0;
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.amount)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.amount)) : 0;
  const accountBalance = startingBalance + totalPL;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const chartData = yearlyStats.map(m => ({
    month: monthNames[m.month],
    pl: m.totalPL
  }));

  const tagPerformance = calculateTagPerformance(trades, tags);

  if (isLoading || tagsLoading) {
    return <div className="p-6"><Loading type="skeleton-grid" /></div>;
  }

  return (
    <div className="h-screen pt-20 pb-2 px-2 overflow-hidden">
      {/* SINGLE GRID - NO SCROLLING */}
      <div className="h-full grid grid-cols-12 grid-rows-12 gap-2">
        
        {/* TOP LEFT - Win Rate (2x2) */}
        <div className="col-span-2 row-span-2 card flex flex-col items-center justify-center">
          <WinRateDonut winRate={overallWinRate} size="compact" />
          <div className="text-xs text-slate-400 mt-2">Trades: {totalTrades}</div>
        </div>

        {/* TOP MIDDLE - Account & P&L (4x2) */}
        <div className="col-span-4 row-span-2 card">
          <div className="h-full grid grid-cols-2 gap-2">
            <div className="flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Account</div>
              <div className={`text-xl font-black ${accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCompactCurrency(accountBalance, currency)}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Yearly P&L</div>
              <div className={`text-xl font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCompactCurrency(totalPL, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* TOP RIGHT - Tags (6x2) */}
        <div className="col-span-6 row-span-2 card">
          {tagPerformance.length > 0 ? (
            <div className="h-full flex gap-2">
              {tagPerformance.map(tag => (
                <div key={tag.tagId} className="flex-1 flex flex-col justify-center items-center">
                  <span className="text-2xl mb-1">{tag.tagEmoji}</span>
                  <div className="text-xs font-bold truncate max-w-full" style={{ color: tag.tagColor }}>{tag.tagName}</div>
                  <div className={`text-lg font-black ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCompactCurrency(tag.totalPL, currency)}
                  </div>
                  <div className="text-[10px] text-slate-400">{tag.trades}T • {tag.winRate}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">No tagged trades</div>
          )}
        </div>

        {/* LEFT SIDEBAR - Metrics (2x10) */}
        <div className="col-span-2 row-span-10 card">
          <div className="h-full flex flex-col justify-around py-2">
            <Metric label="Avg Winner" value={formatCompactCurrency(avgWinner, currency)} color="profit" />
            <Metric label="Avg Loser" value={formatCompactCurrency(avgLoser, currency)} color="loss" />
            <Metric label="Best" value={formatCompactCurrency(bestTrade, currency)} color="profit" />
            <Metric label="Worst" value={formatCompactCurrency(worstTrade, currency)} color="loss" />
          </div>
        </div>

        {/* CHART (10x6) */}
        <div className="col-span-10 row-span-6 card">
          <div className="text-center text-lg font-bold mb-2">{currentYear}</div>
          <div className="h-[calc(100%-2rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `${currency}${v}`} />
                <Bar dataKey="pl" radius={[4, 4, 0, 0]} barSize={30}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                  <LabelList dataKey="pl" position="top" formatter={(v) => v !== 0 ? `${currency}${v}` : ''} style={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MONTHLY TILES (10x4) */}
        <div className="col-span-10 row-span-4 card">
          <div className="h-full grid grid-cols-6 gap-2 p-2">
            {yearlyStats.map((m) => (
              <MonthTile
                key={m.month}
                month={monthNames[m.month]}
                stats={m}
                isCurrentMonth={m.month === currentMonth}
                onClick={() => navigate(`/month/${currentYear}/${m.month}`)}
                currency={currency}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateTagPerformance = (trades, tags) => {
  const tagStats = {};
  trades.forEach(trade => {
    const tagId = trade.tagId || 'none';
    if (tagId === 'none') return;
    if (!tagStats[tagId]) {
      tagStats[tagId] = {
        tagId, tagName: trade.tagName, tagColor: trade.tagColor, tagEmoji: trade.tagEmoji,
        totalPL: 0, trades: 0, wins: 0, losses: 0
      };
    }
    tagStats[tagId].totalPL += trade.amount;
    tagStats[tagId].trades += 1;
    if (trade.amount > 0) tagStats[tagId].wins += 1;
    if (trade.amount < 0) tagStats[tagId].losses += 1;
  });
  return Object.values(tagStats)
    .map(tag => ({ ...tag, winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0 }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

const Metric = ({ label, value, color }) => (
  <div className="text-center">
    <div className="text-[10px] text-slate-400 uppercase mb-1">{label}</div>
    <div className={`text-base font-bold ${color === 'profit' ? 'text-emerald-400' : 'text-red-400'}`}>{value}</div>
  </div>
);

const WinRateDonut = ({ winRate, size = 'normal' }) => {
  const dim = size === 'compact' ? 70 : 80;
  const r = size === 'compact' ? 30 : 35;
  const circ = 2 * Math.PI * r;
  const win = winRate / 100;
  const loss = 1 - win;

  return (
    <div style={{ width: dim, height: dim }} className="relative">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        {winRate > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${win * circ} ${circ}`} />}
        {winRate < 100 && <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray={`${loss * circ} ${circ}`} strokeDashoffset={`${-win * circ}`} />}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black">{winRate}%</span>
      </div>
    </div>
  );
};

const MonthTile = ({ month, stats, isCurrentMonth, onClick, currency }) => {
  const wr = stats.tradeCount > 0 ? Math.round((stats.winCount / stats.tradeCount) * 100) : 100;
  return (
    <div onClick={onClick} className={`bg-slate-800/30 rounded-lg p-2 cursor-pointer hover:bg-slate-800/50 transition-all flex flex-col items-center justify-between ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="text-[10px] text-slate-400 font-semibold mb-1">{month}</div>
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          {wr > 0 && <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray={`${(wr/100) * 88} 88`} />}
          {wr < 100 && <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray={`${((100-wr)/100) * 88} 88`} strokeDashoffset={`${-(wr/100) * 88}`} />}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold">{wr}%</span>
        </div>
      </div>
      <div className="text-[9px] text-slate-500">{stats.tradeCount}T</div>
    </div>
  );
};

export default Dashboard;
