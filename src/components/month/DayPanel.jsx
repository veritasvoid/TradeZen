import React from 'react';
import { X, Edit, Trash2, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { useDeleteTrade } from '@/hooks/useTrades';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { googleAPI } from '@/lib/googleAPI';

export const DayPanel = ({ date, trades, onClose, onAddTrade }) => {
  const { showToast } = useToast();
  const deleteTrade = useDeleteTrade();
  const currency = useSettingsStore(state => state.settings.currency);
  
  const dailyTotal = trades.reduce((sum, t) => sum + t.amount, 0);
  
  const handleDelete = async (tradeId) => {
    if (!confirm('Delete this trade?')) return;
    
    try {
      await deleteTrade.mutateAsync(tradeId);
      showToast('Trade deleted', 'success');
    } catch (error) {
      showToast('Failed to delete trade', 'error');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div>
          <div className="text-xl font-bold">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className={`text-2xl font-bold mt-1 ${dailyTotal >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCurrency(dailyTotal, currency)}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            {trades.length} trade{trades.length !== 1 ? 's' : ''}
          </div>
        </div>
      }
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4">No trades on this day</p>
            <Button onClick={onAddTrade}>Add Trade</Button>
          </div>
        ) : (
          <>
            {trades.map(trade => (
              <TradeCard
                key={trade.tradeId}
                trade={trade}
                currency={currency}
                onDelete={handleDelete}
              />
            ))}
            
            <Button
              onClick={onAddTrade}
              variant="secondary"
              className="w-full"
            >
              + Add Another Trade
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

const TradeCard = ({ trade, currency, onDelete }) => {
  const [showImage, setShowImage] = React.useState(false);
  
  return (
    <>
      <div className="card border-l-4" style={{ borderLeftColor: trade.tagColor }}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className={`text-2xl font-bold mb-1 ${trade.amount >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(trade.amount, currency)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{trade.tagEmoji}</span>
              <span className="text-sm font-medium" style={{ color: trade.tagColor }}>
                {trade.tagName}
              </span>
            </div>
          </div>
          <div className="text-sm text-text-tertiary">
            {trade.time}
          </div>
        </div>

        {trade.driveImageId && (
          <button
            onClick={() => setShowImage(true)}
            className="w-full h-32 rounded-lg overflow-hidden bg-surface-hover mb-2 relative group"
          >
            <img
              src={googleAPI.getImageUrl(trade.driveImageId)}
              alt="Trade screenshot"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn size={32} className="text-white" />
            </div>
          </button>
        )}

        {trade.notes && (
          <p className="text-sm text-text-secondary mb-3 p-2 bg-surface rounded">
            {trade.notes}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-text-secondary hover:text-accent"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(trade.tradeId)}
            className="flex-1 text-text-secondary hover:text-loss"
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Image Lightbox */}
      {showImage && (
        <Modal
          isOpen={true}
          onClose={() => setShowImage(false)}
          size="lg"
        >
          <img
            src={googleAPI.getImageUrl(trade.driveImageId)}
            alt="Trade screenshot"
            className="w-full h-auto rounded-lg"
          />
        </Modal>
      )}
    </>
  );
};
