import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { FAB } from '@/components/shared/FAB';
import { Loading } from '@/components/shared/Loading';
import { DayPanel } from '@/components/month/DayPanel';
import { TradeForm } from '@/components/trade/TradeForm';
import { useMonthTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const MonthView = () => {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: trades = [], isLoading: tradesLoading } = useMonthTrades(year, month);
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const groupedTrades = trades.reduce((acc, trade) => {
    if (!acc[trade.date]) acc[trade.date] = [];
    acc[trade.date].push(trade);
    return acc;
  }, {});

  const dailyPL = Object.entries(groupedTrades).reduce((acc, [date, dayTrades]) => {
    acc[date] = dayTrades.reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {});

  const monthStats = {
    totalPL: trades.reduce((sum, t) => sum + t.amount, 0),
    tradeCount: trades.length,
    winCount: trades.filter(t => t.amount > 0).length,
    lossCount: trades.filter(t => t.amount < 0).length,
    winRate: trades.length > 0 
      ? Math.round((trades.filter(t => t.amount > 0).length / trades.length) * 100)
      : 0
  };

  const isWeekendDay = (date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const isSameDayAs = (date1, date2) => {
    return isSameDay(date1, date2);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const handleDayClick = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
  };

  const handleAddTrade = () => {
    setShowTradeForm(true);
  };

  if (tradesLoading || tagsLoading) {
    return (
      <div className="p-4">
        <Loading type="skeleton-grid" />
      </div>
    );
  }

  return (
    <>
      {/* FIXED: Container now uses flex with full height */}
      <div className="flex flex-col h-[calc(100vh-80px)] p-6 pb-24 max-w-[1600px] mx-auto">
        {/* Month Navigation - Compact */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-3 hover:bg-surface-hover rounded-xl transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <h2 className="text-3xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="p-3 hover:bg-surface-hover rounded-xl transition-colors"
            >
              {viewMode === 'calendar' ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-3 hover:bg-surface-hover rounded-xl transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Month Stats - Compact */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="P&L"
            value={formatCompactCurrency(monthStats.totalPL, currency)}
            color={monthStats.totalPL >= 0 ? 'profit' : 'loss'}
          />
          <StatCard
            label="Trades"
            value={monthStats.tradeCount}
          />
          <StatCard
            label="Win Rate"
            value={`${monthStats.winRate}%`}
            color={monthStats.winRate >= 50 ? 'profit' : 'loss'}
          />
          <StatCard
            label="W/L"
            value={`${monthStats.winCount}/${monthStats.lossCount}`}
          />
        </div>

        {/* Calendar - NOW FILLS REMAINING SPACE */}
        {viewMode === 'calendar' ? (
          <div className="card flex-1 flex flex-col">
            {/* Day Headers - Compact */}
            <div className="grid grid-cols-7 gap-3 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-bold text-text-secondary py-2 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - FILLS REMAINING HEIGHT */}
            <div className="grid grid-cols-7 gap-3 flex-1">
              {/* Empty cells for offset */}
              {emptyDays.map((_, idx) => (
                <div key={`empty-${idx}`} />
              ))}
              
              {/* Day cells - NOW MUCH LARGER */}
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayPL = dailyPL[dateStr] || 0;
                const dayTrades = groupedTrades[dateStr] || [];
                const isWeekend = isWeekendDay(day);
                const isToday = isSameDayAs(day, new Date());
                
                return (
                  <DayCell
                    key={dateStr}
                    date={day}
                    pl={dayPL}
                    tradeCount={dayTrades.length}
                    isWeekend={isWeekend}
                    isToday={isToday}
                    currency={currency}
                    onClick={() => handleDayClick(day)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <ListView 
            trades={trades} 
            groupedTrades={groupedTrades}
            currency={currency}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {/* FAB */}
      <FAB onClick={handleAddTrade} />

      {/* Day Panel */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          trades={groupedTrades[selectedDate] || []}
          tags={tags}
          onClose={() => setSelectedDate(null)}
          onAddTrade={handleAddTrade}
        />
      )}

      {/* Trade Form */}
      {showTradeForm && (
        <TradeForm
          defaultDate={selectedDate}
          tags={tags}
          onClose={() => setShowTradeForm(false)}
        />
      )}
    </>
  );
};

const StatCard = ({ label, value, color = 'default' }) => {
  const colorClasses = {
    profit: 'text-profit',
    loss: 'text-loss',
    default: 'text-text-primary'
  };

  return (
    <div className="card text-center">
      <div className="text-text-tertiary text-xs mb-1 uppercase tracking-wide font-semibold">{label}</div>
      <div className={`text-2xl font-black ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
};

const DayCell = ({ date, pl, tradeCount, isWeekend, isToday, currency, onClick }) => {
  const dayNum = format(date, 'd');
  
  if (isWeekend) {
    return (
      <div className="h-full bg-surface/30 rounded-xl p-3 flex flex-col items-center justify-center opacity-40 border border-border/30">
        <div className="text-lg text-text-tertiary font-semibold">{dayNum}</div>
        <div className="text-2xl mt-2">🔒</div>
      </div>
    );
  }

  const bgClass = pl > 0 ? 'bg-profit/5 border-profit/30' : pl < 0 ? 'bg-loss/5 border-loss/30' : 'bg-surface border-border';
  const borderClass = isToday ? 'ring-4 ring-accent shadow-lg shadow-accent/20' : '';
  
  return (
    <button
      onClick={onClick}
      className={`
        h-full ${bgClass} ${borderClass} rounded-xl p-4 border-2
        hover:bg-surface-hover hover:scale-105 transition-all duration-200
        flex flex-col items-center justify-center
        relative group
      `}
    >
      {/* Date - Smaller, top left */}
      <div className="absolute top-2 left-3 text-sm text-text-secondary font-bold">{dayNum}</div>
      
      {/* P&L - HUGE in center */}
      {tradeCount > 0 && (
        <div className={`text-3xl font-black ${pl >= 0 ? 'text-profit' : 'text-loss'} mt-2`}>
          {formatCompactCurrency(pl, currency)}
        </div>
      )}
      
      {/* Trade count badge - bottom right */}
      {tradeCount > 0 && (
        <div className="absolute bottom-2 right-2 min-w-[28px] h-7 px-2 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">
          {tradeCount}
        </div>
      )}
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

const ListView = ({ trades, groupedTrades, currency, onDayClick }) => {
  const sortedDates = Object.keys(groupedTrades).sort().reverse();

  if (sortedDates.length === 0) {
    return (
      <div className="card text-center py-12 flex-1 flex items-center justify-center">
        <p className="text-text-secondary text-xl">No trades this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 flex-1 overflow-y-auto">
      {sortedDates.map(dateStr => {
        const dayTrades = groupedTrades[dateStr];
        const dayPL = dayTrades.reduce((sum, t) => sum + t.amount, 0);
        const date = new Date(dateStr + 'T12:00:00');

        return (
          <button
            key={dateStr}
            onClick={() => onDayClick(date)}
            className="card w-full text-left hover:bg-surface-hover transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg">
                {format(date, 'EEEE, MMMM d')}
              </div>
              <div className={`text-2xl font-black ${dayPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCompactCurrency(dayPL, currency)}
              </div>
            </div>
            <div className="text-sm text-text-secondary font-semibold">
              {dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MonthView;
