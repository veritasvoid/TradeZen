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
    <div className="h-screen overflow-hidden flex flex-col">
      {/* TOP SECTION - Compact, no wasted space */}
      <div className="pt-20 px-3 pb-2">
        <div className="grid grid-cols-12 gap-2">
          
          {/* Win Rate + Trades */}
          <div className="col-span-2 card p-3 flex items-center gap-3">
            <WinRateDonut winRate={overallWinRate} />
            <div>
              <div className="text-xs text-slate-400">Trades</div>
              <div className="text-2xl font-black">{totalTrades}</div>
            </div>
          </div>

          {/* Account Balance */}
          <div className="col-span-2 card p-3">
            <div className="text-xs text-slate-400 mb-1">ACCOUNT</div>
            <div className={`text-2xl font-black ${accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCompactCurrency(accountBalance, currency)}
            </div>
          </div>

          {/* Yearly P&L */}
          <div className="col-span-2 card p-3">
            <div className="text-xs text-slate-400 mb-1">YEARLY P&L</div>
            <div className={`text-2xl font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCompactCurrency(totalPL, currency)}
            </div>
          </div>

          {/* Strategy Performance */}
          <div className="col-span-6 card p-3">
            <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Strategy Performance</div>
            {tagPerformance.length > 0 ? (
              <div className="flex gap-4">
                {tagPerformance.map(tag => (
                  <div key={tag.tagId} className="flex items-center gap-2 flex-1">
                    <span className="text-2xl">{tag.tagEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: tag.tagColor }}>
                        {tag.tagName}
                      </div>
                      <div className={`text-xl font-black ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCompactCurrency(tag.totalPL, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tag.trades}T • {tag.winRate}% WR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No tagged trades</div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Chart + Tiles + Sidebar */}
      <div className="flex-1 px-3 pb-3 min-h-0">
        <div className="h-full grid grid-cols-12 gap-2">
          
          {/* LEFT SIDEBAR - Metrics */}
          <div className="col-span-2 card p-3 flex flex-col justify-around">
            <Metric label="AVG WINNER" value={formatCompactCurrency(avgWinner, currency)} color="profit" />
            <Metric label="AVG LOSER" value={formatCompactCurrency(avgLoser, currency)} color="loss" />
            <Metric label="BEST" value={formatCompactCurrency(bestTrade, currency)} color="profit" />
            <Metric label="WORST" value={formatCompactCurrency(worstTrade, currency)} color="loss" />
          </div>

          {/* CENTER - Chart + Monthly Tiles */}
          <div className="col-span-10 flex flex-col gap-2 min-h-0">
            
            {/* Chart */}
            <div className="flex-[3] card p-4 min-h-0">
              <div className="text-center text-xl font-black mb-2">{currentYear}</div>
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

            {/* Monthly Tiles */}
            <div className="flex-[2] card p-3 min-h-0">
              <div className="h-full grid grid-cols-6 gap-2">
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
    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-xl font-black ${color === 'profit' ? 'text-emerald-400' : 'text-red-400'}`}>{value}</div>
  </div>
);

const WinRateDonut = ({ winRate }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const win = winRate / 100;
  const loss = 1 - win;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        {winRate > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${win * circ} ${circ}`} />}
        {winRate < 100 && <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray={`${loss * circ} ${circ}`} strokeDashoffset={`${-win * circ}`} />}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black">{winRate}%</span>
      </div>
    </div>
  );
};

const MonthTile = ({ month, stats, isCurrentMonth, onClick }) => {
  const wr = stats.tradeCount > 0 ? Math.round((stats.winCount / stats.tradeCount) * 100) : 100;
  return (
    <div onClick={onClick} className={`bg-slate-800/30 rounded-lg p-2 cursor-pointer hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="text-xs text-slate-400 font-semibold mb-2">{month}</div>
      <div className="relative w-12 h-12">
        <svg viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          {wr > 0 && <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray={`${(wr/100) * 88} 88`} />}
          {wr < 100 && <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray={`${((100-wr)/100) * 88} 88`} strokeDashoffset={`${-(wr/100) * 88}`} />}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold">{wr}%</span>
        </div>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">{stats.tradeCount}T</div>
    </div>
  );
};

export default Dashboard;
