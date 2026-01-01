import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMonthTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { TrendingUp, Plus } from 'lucide-react';
import { formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const MonthView = () => {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  const currentDate = new Date();
  const currentYear = parseInt(yearParam) || currentDate.getFullYear();
  const currentMonth = monthParam !== undefined ? parseInt(monthParam) : currentDate.getMonth();
  
  const { data: trades = [], isLoading } = useMonthTrades(currentYear, currentMonth);
  const { data: tags = [] } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Calculate month stats
  const totalPL = trades.reduce((sum, t) => sum + t.amount, 0);
  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const winRate = trades.length > 0 ? Math.round((winners.length / trades.length) * 100) : 0;

  // Tag performance for this month
  const tagPerformance = calculateMonthTagPerformance(trades);

  // Organize trades by day
  const tradesByDay = {};
  trades.forEach(trade => {
    const day = parseInt(trade.date.split('-')[2]);
    if (!tradesByDay[day]) tradesByDay[day] = [];
    tradesByDay[day].push(trade);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ paddingTop: '80px' }}>
      {/* HEADER WITH LOGO */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <TrendingUp size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              TradeZen
            </span>
          </button>

          <h1 className="text-2xl font-black">{monthNames[currentMonth]} {currentYear}</h1>

          <button className="w-10 h-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* CALENDAR - 9 cols */}
          <div className="col-span-9">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-slate-400 text-sm font-semibold py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayTrades = tradesByDay[day] || [];
                  const dayPL = dayTrades.reduce((sum, t) => sum + t.amount, 0);
                  const isToday = day === currentDate.getDate() && 
                                  currentMonth === currentDate.getMonth() && 
                                  currentYear === currentDate.getFullYear();

                  return (
                    <DayCell
                      key={day}
                      day={day}
                      trades={dayTrades}
                      dayPL={dayPL}
                      isToday={isToday}
                      currency={currency}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* STATS SIDEBAR - 3 cols */}
          <div className="col-span-3 space-y-4">
            {/* Month Stats */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4 font-semibold text-center">Month Stats</h3>
              
              <div className="space-y-4">
                <StatRow label="Total P&L" value={formatCompactCurrency(totalPL, currency)} color={totalPL >= 0 ? 'emerald' : 'red'} />
                <StatRow label="Trades" value={trades.length} />
                <StatRow label="Winners" value={winners.length} color="emerald" />
                <StatRow label="Losers" value={losers.length} color="red" />
                <StatRow label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? 'emerald' : 'red'} />
              </div>
            </div>

            {/* Strategy Performance for Month */}
            {tagPerformance.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4 font-semibold text-center">Strategies</h3>
                
                <div className="space-y-3">
                  {tagPerformance.map(tag => (
                    <div key={tag.tagId} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{tag.tagEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: tag.tagColor }}>
                            {tag.tagName}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-black ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCompactCurrency(tag.totalPL, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {tag.trades}T • {tag.winRate}% WR
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// FIX #3 & #4: Day cell with conditional trade count and tag display
const DayCell = ({ day, trades, dayPL, isToday, currency }) => {
  const hasData = trades.length > 0;
  const bgColor = hasData 
    ? (dayPL > 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30')
    : 'bg-slate-800/20 border-slate-700/30';

  return (
    <div className={`aspect-square rounded-lg border ${bgColor} ${isToday ? 'ring-2 ring-blue-500' : ''} p-2 relative hover:bg-slate-700/30 transition-all cursor-pointer`}>
      {/* Day number */}
      <div className="text-sm font-semibold text-slate-300">{day}</div>

      {/* P&L amount */}
      {hasData && (
        <div className={`text-xs font-bold mt-1 ${dayPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCompactCurrency(dayPL, currency)}
        </div>
      )}

      {/* Tags (bottom-left) - FIX #4 */}
      {hasData && (
        <div className="absolute bottom-1 left-1 flex flex-wrap gap-1">
          {[...new Set(trades.map(t => t.tagName).filter(Boolean))].map(tagName => (
            <span key={tagName} className="text-[8px] text-slate-400 bg-slate-900/50 px-1 rounded">
              {tagName}
            </span>
          ))}
        </div>
      )}

      {/* Trade count (bottom-right) - FIX #3: Only show if > 1 */}
      {trades.length > 1 && (
        <div className="absolute bottom-1 right-1 text-[9px] text-slate-500 font-semibold">
          {trades.length}
        </div>
      )}
    </div>
  );
};

const StatRow = ({ label, value, color }) => {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-black ${colorClass}`}>{value}</span>
    </div>
  );
};

const calculateMonthTagPerformance = (trades) => {
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
        wins: 0
      };
    }
    tagStats[tagId].totalPL += trade.amount;
    tagStats[tagId].trades += 1;
    if (trade.amount > 0) tagStats[tagId].wins += 1;
  });
  
  return Object.values(tagStats)
    .map(tag => ({ ...tag, winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0 }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

export default MonthView;
