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
  const avgPLPerTrade = totalTrades > 0 ? totalPL / totalTrades : 0;
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.amount)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.amount)) : 0;
  const accountBalance = startingBalance + totalPL;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const chartData = yearlyStats.map(m => ({
    month: monthNames[m.month],
    pl: m.totalPL,
    monthIndex: m.month
  }));

  const tagPerformance = calculateTagPerformance(trades, tags);

  console.log('📊 Tags loaded:', tags);
  console.log('📈 Tag performance:', tagPerformance);

  if (isLoading || tagsLoading) {
    return (
      <div className="p-6">
        <Loading type="skeleton-grid" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto">
      <div className="grid grid-cols-12 h-full">
        
        {/* LEFT SIDEBAR - Compact Performance */}
        <div className="col-span-2 bg-slate-900/50 border-r border-slate-700/50 p-4 space-y-3 overflow-y-auto">
          {/* Win Rate + Total Trades Combined */}
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-center mb-2">
              <WinRateDonut winRate={overallWinRate} size="small" />
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-[10px] mb-1">Total Trades</div>
              <div className="text-xl font-bold text-white">{totalTrades}</div>
            </div>
          </div>

          <MetricBoxSmall label="Avg P&L" value={formatCompactCurrency(avgPLPerTrade, currency)} valueColor={avgPLPerTrade >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <MetricBoxSmall label="Avg Winner" value={formatCompactCurrency(avgWinner, currency)} valueColor="text-emerald-400" />
          <MetricBoxSmall label="Avg Loser" value={formatCompactCurrency(avgLoser, currency)} valueColor="text-red-400" />
          <MetricBoxSmall label="Best" value={formatCompactCurrency(bestTrade, currency)} valueColor="text-emerald-400" highlight="emerald" />
          <MetricBoxSmall label="Worst" value={formatCompactCurrency(worstTrade, currency)} valueColor="text-red-400" highlight="red" />
        </div>

        {/* CENTER - Chart */}
        <div className="col-span-8 flex flex-col">
          <div className="border-b border-slate-700/50 px-8 py-4">
            <h2 className="text-xl font-bold text-center">Monthly P&L</h2>
          </div>

          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 40, right: 30, left: 30, bottom: 30 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${currency}${value}`}
                />
                <Bar dataKey="pl" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={index}
                      fill={entry.pl >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                  <LabelList 
                    dataKey="pl" 
                    position="top" 
                    formatter={(value) => value !== 0 ? `${currency}${value}` : ''}
                    style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-700/50 p-6">
            <div className="grid grid-cols-6 gap-3">
              {yearlyStats.map((monthData) => (
                <MonthCard
                  key={monthData.month}
                  month={monthNames[monthData.month]}
                  stats={monthData}
                  isCurrentMonth={monthData.month === currentMonth}
                  onClick={() => navigate(`/month/${currentYear}/${monthData.month}`)}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Summary + Tags */}
        <div className="col-span-2 bg-slate-900/50 border-l border-slate-700/50 p-4 space-y-3 overflow-y-auto">
          <div className="text-slate-400 text-sm mb-2">{currentYear}</div>

          <SummaryBoxSmall
            label="Account Balance"
            value={formatCompactCurrency(accountBalance, currency)}
            valueColor={accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}
            large
          />

          <SummaryBoxSmall
            label="Yearly P&L"
            value={formatCompactCurrency(totalPL, currency)}
            valueColor={totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />

          {/* Tag Performance - No Header */}
          {tagPerformance.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-700/50">
              {tagPerformance.map(tag => (
                <TagCardCompact key={tag.tagId} tag={tag} currency={currency} />
              ))}
            </div>
          )}
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
        tagId,
        tagName: trade.tagName,
        tagColor: trade.tagColor,
        tagEmoji: trade.tagEmoji,
        totalPL: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
    }
    
    tagStats[tagId].totalPL += trade.amount;
    tagStats[tagId].trades += 1;
    if (trade.amount > 0) tagStats[tagId].wins += 1;
    if (trade.amount < 0) tagStats[tagId].losses += 1;
  });
  
  return Object.values(tagStats)
    .map(tag => ({
      ...tag,
      winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0
    }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

const MetricBoxSmall = ({ label, value, valueColor = 'text-white', highlight }) => {
  const bgClass = highlight === 'emerald' 
    ? 'bg-emerald-900/20' 
    : highlight === 'red' 
    ? 'bg-red-900/20' 
    : 'bg-slate-800/30';

  return (
    <div className={`${bgClass} rounded-lg p-2.5`}>
      <div className="text-slate-400 text-[10px] mb-1">{label}</div>
      <div className={`text-lg font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

const TagCardCompact = ({ tag, currency }) => {
  const isPositive = tag.totalPL >= 0;
  
  return (
    <div className="bg-slate-800/30 rounded-lg p-2.5 hover:bg-slate-800/50 transition-all">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xl">{tag.tagEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate" style={{ color: tag.tagColor }}>
            {tag.tagName}
          </div>
        </div>
        {isPositive ? <TrendingUp size={14} className="text-emerald-400 flex-shrink-0" /> : <TrendingDown size={14} className="text-red-400 flex-shrink-0" />}
      </div>
      
      <div className={`text-lg font-bold mb-1.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatCompactCurrency(tag.totalPL, currency)}
      </div>
      
      <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400">
        <div>
          <span>Trades:</span>
          <span className="font-bold text-white ml-1">{tag.trades}</span>
        </div>
        <div>
          <span>WR:</span>
          <span className={`font-bold ml-1 ${tag.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{tag.winRate}%</span>
        </div>
      </div>
    </div>
  );
};

const SummaryBoxSmall = ({ label, value, valueColor = 'text-white', large = false }) => (
  <div className="bg-slate-800/50 rounded-lg p-3">
    <div className="text-slate-400 text-[10px] mb-1">{label}</div>
    <div className={`${large ? 'text-xl' : 'text-lg'} font-bold ${valueColor}`}>{value}</div>
  </div>
);

const WinRateDonut = ({ winRate, size = 'normal' }) => {
  const dimensions = size === 'small' ? { w: 20, h: 20, r: 35, stroke: 10, fontSize: 'text-lg' } : { w: 24, h: 24, r: 40, stroke: 12, fontSize: 'text-2xl' };
  const radius = dimensions.r;
  const circumference = 2 * Math.PI * radius;
  const winPercent = winRate / 100;
  const lossPercent = 1 - winPercent;

  return (
    <div className={`relative w-${dimensions.w} h-${dimensions.h}`}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth={dimensions.stroke} />
        {winRate > 0 && (
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth={dimensions.stroke}
            strokeDasharray={`${winPercent * circumference} ${circumference}`} />
        )}
        {winRate < 100 && (
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4444" strokeWidth={dimensions.stroke}
            strokeDasharray={`${lossPercent * circumference} ${circumference}`}
            strokeDashoffset={`${-winPercent * circumference}`} />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${dimensions.fontSize} font-bold`}>{winRate}%</span>
      </div>
    </div>
  );
};

const MonthCard = ({ month, stats, isCurrentMonth, onClick, currency }) => {
  const winRate = stats.tradeCount > 0 ? Math.round((stats.winCount / stats.tradeCount) * 100) : 100;

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800/30 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-800/50
        ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="text-slate-400 text-xs font-semibold mb-3 text-center">{month}</div>
      
      <div className="flex items-center justify-center mb-3">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
            {winRate > 0 && (
              <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${(winRate/100) * 100.5} 100.5`} />
            )}
            {winRate < 100 && (
              <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="3"
                strokeDasharray={`${((100-winRate)/100) * 100.5} 100.5`}
                strokeDashoffset={`${-(winRate/100) * 100.5}`} />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{winRate}%</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-500">{stats.tradeCount} Trades</div>
    </div>
  );
};

export default Dashboard;
