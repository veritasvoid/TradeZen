import React, { useState } from 'react';
import { X, Edit, Trash2, Camera } from 'lucide-react';
import { formatPrivateAmountWithSign } from '@/lib/utils';

/**
 * TagTradesModal - Shows all trades for a specific tag
 * Used from both Dashboard (year scope) and Month View (month scope)
 */
export const TagTradesModal = ({
  tag,
  trades,
  scope, // e.g., "2026" or "January 2026"
  currency,
  privacyMode,
  onClose,
  onEditTrade,
  onDeleteTrade,
  onViewImage
}) => {
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'highest', 'lowest'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'winners', 'losers'

  // Calculate stats
  const totalPL = trades.reduce((sum, t) => sum + t.amount, 0);
  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const winRate = trades.length > 0 ? Math.round((winners.length / trades.length) * 100) : 0;
  const avgWinner = winners.length > 0 ? winners.reduce((sum, t) => sum + t.amount, 0) / winners.length : 0;
  const avgLoser = losers.length > 0 ? losers.reduce((sum, t) => sum + t.amount, 0) / losers.length : 0;

  // Filter trades
  let filteredTrades = [...trades];
  if (filterBy === 'winners') filteredTrades = filteredTrades.filter(t => t.amount > 0);
  if (filterBy === 'losers') filteredTrades = filteredTrades.filter(t => t.amount < 0);

  // Sort trades
  filteredTrades.sort((a, b) => {
    switch (sortBy) {
      case 'latest': return new Date(b.date) - new Date(a.date);
      case 'oldest': return new Date(a.date) - new Date(b.date);
      case 'highest': return b.amount - a.amount;
      case 'lowest': return a.amount - b.amount;
      default: return 0;
    }
  });

  const formatAmount = (amount) => {
    if (privacyMode) return '****';
    return `${currency}${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700 w-full max-w-xs sm:max-w-md lg:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-700/50">
          <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-2xl sm:text-3xl">{tag.tagEmoji}</span>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black truncate" style={{ color: tag.tagColor }}>
                  {tag.tagName}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                {scope} • {trades.length} trade{trades.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-all flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-slate-400 uppercase mb-1">Total P&L</div>
              <div className={`text-sm sm:text-base lg:text-lg font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPrivateAmountWithSign(totalPL, currency, privacyMode)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-slate-400 uppercase mb-1">Win Rate</div>
              <div className="text-sm sm:text-base lg:text-lg font-black text-slate-200">{winRate}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-slate-400 uppercase mb-1">Avg Win</div>
              <div className="text-sm sm:text-base lg:text-lg font-black text-emerald-400">
                {formatAmount(avgWinner)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-slate-400 uppercase mb-1">Avg Loss</div>
              <div className="text-sm sm:text-base lg:text-lg font-black text-red-400">
                {formatAmount(Math.abs(avgLoser))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Trades</option>
              <option value="winners">Winners Only</option>
              <option value="losers">Losers Only</option>
            </select>
          </div>
        </div>

        {/* Trade List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm">
              No trades match the current filter
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredTrades.map(trade => (
                <div 
                  key={trade.tradeId}
                  className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Date & Time */}
                    <div className="flex-shrink-0 text-[10px] sm:text-xs text-slate-400">
                      {new Date(trade.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: scope.length === 4 ? undefined : 'numeric' // Hide year if viewing single year
                      })}
                      {trade.time && (
                        <span className="hidden sm:inline"> • {trade.time}</span>
                      )}
                    </div>

                    {/* Notes */}
                    {trade.notes && (
                      <div className="flex-1 min-w-0 text-xs sm:text-sm text-slate-300 truncate">
                        "{trade.notes}"
                      </div>
                    )}

                    {/* Amount */}
                    <div className={`flex-shrink-0 text-base sm:text-lg lg:text-xl font-black ${trade.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatPrivateAmountWithSign(trade.amount, currency, privacyMode)}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => onEditTrade(trade)}
                        className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                        title="Edit trade"
                      >
                        <Edit size={16} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTrade(trade.tradeId)}
                        className="p-2 sm:p-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                        title="Delete trade"
                      >
                        <Trash2 size={16} className="sm:w-4 sm:h-4" />
                      </button>
                      {trade.driveImageId && (
                        <button
                          onClick={() => onViewImage(trade)}
                          className="p-2 sm:p-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                          title="View screenshot"
                        >
                          <Camera size={16} className="sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
