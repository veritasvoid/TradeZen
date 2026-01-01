import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';
import { TagForm } from '@/components/tag/TagForm';

const TagsView = () => {
  const { data: tags = [], isLoading } = useTags();
  const [showForm, setShowForm] = useState(false);

  console.log('🏷️ Tags in TagsView:', tags);

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto pt-24">
      {/* Page Title + New Tag Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Strategy Tags</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus size={20} />
          New Tag
        </button>
      </div>

      {/* Tags List */}
      {isLoading ? (
        <Loading type="skeleton-card" />
      ) : tags.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold mb-2">No Strategy Tags Yet</h3>
          <p className="text-slate-400 mb-6">
            Create tags to categorize your trades by strategy
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} />
            Create Your First Tag
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map(tag => (
            <div 
              key={tag.tagId} 
              className="card hover:bg-surface-hover transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Emoji */}
                <span className="text-4xl">{tag.emoji}</span>
                
                {/* Tag Info */}
                <div className="flex-1">
                  <div className="text-xl font-bold" style={{ color: tag.color }}>
                    {tag.name}
                  </div>
                </div>

                {/* Color Badge */}
                <div 
                  className="w-8 h-8 rounded-full shadow-lg" 
                  style={{ backgroundColor: tag.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tag Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-md w-full">
            <TagForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsView;
