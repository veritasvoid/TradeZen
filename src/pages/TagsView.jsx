import React from 'react';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';

const TagsView = () => {
  const { data: tags = [], isLoading } = useTags();

  console.log('🏷️ Tags in TagsView:', tags);

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto pt-24">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-black">Strategy Tags</h1>
      </div>

      {/* Tags List */}
      {isLoading ? (
        <Loading type="skeleton-card" />
      ) : tags.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold mb-2">No Strategy Tags Yet</h3>
          <p className="text-slate-400">
            Tags will appear here once you create them
          </p>
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
    </div>
  );
};

export default TagsView;
