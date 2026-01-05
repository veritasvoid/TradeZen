import React from 'react';
import { X, Edit, Trash2, ExternalLink } from 'lucide-react';

/**
 * BestWorstTradeModal - Shows detailed view of best or worst trade
 * Responsive: Full details with image on all devices
 */
export const BestWorstTradeModal = ({
  trade,
  type, // 'best' or 'worst'
  year,
  comparisonText, // e.g., "3.8x your average winner"
  currency,
  privacyMode,
  onClose,
  onEdit,
  onDelete,
  onViewInMonth
}) => {
  const formatAmount = (amount) => {
    if (privacyMode) return '****';
    return `${currency}${Math.abs(amount).toLocaleString()}`;
  };

  const isBest = type === 'best';
  const icon = isBest ? '🏆' : '💔';
  const title = isBest ? `Best Trade of ${year}` : `Worst Trade of ${year}`;
  const amountColor = isBest ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700 w-full max-w-xs sm:max-w-md lg:max-w-2xl max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-4 sm:p-6 z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black flex items-center gap-2 mb-1">
                <span className="text-2xl sm:text-3xl">{icon}</span>
                {title}
              </h2>
              {comparisonText && (
                <p className="text-xs sm:text-sm text-slate-400">
                  {comparisonText}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-all flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Image */}
          {trade.driveImageId && (
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50">
              <img 
                src={`https://drive.google.com/thumbnail?id=${trade.driveImageId}&sz=w1200`}
                alt="Trade Screenshot"
                className="w-full h-48 sm:h-64 lg:h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  // Could open ImageGalleryModal here
                }}
              />
            </div>
          )}

          {/* Trade Info Card */}
          <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-4">
            
            {/* Tag */}
            {trade.tagEmoji && trade.tagName && (
              <div className="flex items-center gap-2 sm:gap-3 pb-4 border-b border-slate-700/50">
                <span className="text-2xl sm:text-3xl">{trade.tagEmoji}</span>
                <span className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: trade.tagColor }}>
                  {trade.tagName}
                </span>
              </div>
            )}

            {/* Date & Time */}
            <div>
              <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wide mb-1">Date & Time</div>
              <div className="text-sm sm:text-base lg:text-lg font-semibold text-slate-200">
                {new Date(trade.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                {trade.time && (
                  <span className="text-slate-400 ml-2">• {trade.time}</span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wide mb-1">Amount</div>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-black ${amountColor}`}>
                {trade.amount >= 0 ? '+' : '-'}{formatAmount(trade.amount)}
              </div>
            </div>

            {/* Notes */}
            {trade.notes && (
              <div>
                <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wide mb-2">Notes</div>
                <div className="text-sm sm:text-base text-slate-300 leading-relaxed bg-slate-900/50 rounded-lg p-3 sm:p-4">
                  {trade.notes}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Edit size={18} />
              <span className="text-sm sm:text-base">Edit Trade</span>
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Trash2 size={18} />
              <span className="text-sm sm:text-base">Delete Trade</span>
            </button>
            {onViewInMonth && (
              <button
                onClick={onViewInMonth}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 min-h-[44px] sm:flex-none"
              >
                <ExternalLink size={18} />
                <span className="text-sm sm:text-base hidden sm:inline">View in Month</span>
                <span className="text-sm sm:text-base sm:hidden">Month View</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
