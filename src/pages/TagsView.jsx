import React, { useEffect } from 'react';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';

const TagsView = () => {
  const { data: tags = [], isLoading, error } = useTags();

  useEffect(() => {
    console.log('=== TAGS VIEW DEBUG ===');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('tags:', tags);
    console.log('tags.length:', tags?.length);
    console.log('tags array:', JSON.stringify(tags, null, 2));
  }, [tags, isLoading, error]);

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto pt-24">
      <h1 className="text-3xl font-black mb-6">Strategy Tags</h1>

      {isLoading ? (
        <div>
          <Loading type="skeleton-card" />
          <p className="text-center text-slate-400 mt-4">Loading tags...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12 bg-red-900/20">
          <p className="text-red-400">Error loading tags: {error?.message || 'Unknown error'}</p>
        </div>
      ) : !tags || tags.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold mb-2">No Tags Found</h3>
          <p className="text-slate-400 mb-4">
            Debug: tags = {JSON.stringify(tags)}
          </p>
          <p className="text-slate-500 text-sm">
            Check console for more details
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm mb-4">Found {tags.length} tag(s)</p>
          {tags.map(tag => (
            <div 
              key={tag.tagId} 
              className="card hover:bg-surface-hover transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{tag.emoji}</span>
                <div className="flex-1">
                  <div className="text-xl font-bold" style={{ color: tag.color }}>
                    {tag.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    ID: {tag.tagId}
                  </div>
                </div>
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
