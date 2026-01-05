import React from 'react';
import { X } from 'lucide-react';

/**
 * ImageGalleryModal - Full-screen image viewer with zoom
 * Responsive: Full screen on all devices, touch-friendly
 */
export const ImageGalleryModal = ({ 
  imageUrl, 
  trade, 
  currency,
  privacyMode,
  onClose 
}) => {
  const formatAmount = (amount) => {
    if (privacyMode) return '****';
    return `${currency}${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 sm:p-3 bg-black/70 hover:bg-black/90 rounded-full transition-all"
        >
          <X size={20} className="sm:w-6 sm:h-6 text-white" />
        </button>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg sm:rounded-xl">
          <img 
            src={imageUrl} 
            alt="Trade Screenshot"
            className="max-w-full max-h-full object-contain cursor-zoom-in"
            style={{ touchAction: 'pinch-zoom' }}
          />
        </div>

        {/* Trade Info Overlay - Bottom */}
        <div className="mt-3 sm:mt-4 bg-slate-900/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            {/* Tag & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {trade.tagEmoji && trade.tagName && (
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">{trade.tagEmoji}</span>
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: trade.tagColor }}>
                    {trade.tagName}
                  </span>
                </div>
              )}
              <span className="text-xs sm:text-sm text-slate-400">
                {new Date(trade.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                {trade.time && ` • ${trade.time}`}
              </span>
            </div>

            {/* Amount */}
            <div className={`text-xl sm:text-2xl font-black ${trade.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trade.amount >= 0 ? '+' : '-'}{formatAmount(trade.amount)}
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {trade.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
