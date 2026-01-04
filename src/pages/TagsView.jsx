import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useTags, useAddTag, useDeleteTag } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';
import { generateId } from '@/lib/utils';

const EMOJI_OPTIONS = ['🎯', '🚨', '📊', '💎', '🔥', '⚡', '🎪', '🎨', '🎭', '🎬', '🎪', '🎰', '🎲'];
const COLOR_OPTIONS = [
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#eab308' },
];

const TagsView = () => {
  const { data: tags = [], isLoading } = useTags();
  const addTag = useAddTag();
  const deleteTag = useDeleteTag();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🎯',
    color: '#06b6d4'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newTag = {
      tagId: generateId(),
      name: formData.name,
      emoji: formData.emoji,
      color: formData.color,
      order: tags.length
    };

    try {
      await addTag.mutateAsync(newTag);
      setFormData({ name: '', emoji: '🎯', color: '#06b6d4' });
      setShowForm(false);
    } catch (error) {
      alert('Failed to create tag: ' + error.message);
    }
  };

  const handleDelete = async (tagId, tagName) => {
    if (!confirm(`Delete "${tagName}" tag? This won't delete trades using this tag.`)) return;
    
    try {
      await deleteTag.mutateAsync(tagId);
    } catch (error) {
      alert('Failed to delete tag: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ paddingTop: '100px' }}>
      <div className="max-w-4xl mx-auto p-[1.5vw] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[1.9vw] font-black">Strategy Tags</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[0.5vw] hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} />
            New Tag
          </button>
        </div>

        {/* Tags List */}
        {isLoading ? (
          <Loading type="skeleton-card" />
        ) : tags.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-[1vw] border border-slate-700/50 p-12 text-center">
            <div className="text-6xl mb-[1vw]">🏷️</div>
            <h3 className="text-[1.25vw] font-bold mb-[0.5vw]">No Tags Yet</h3>
            <p className="text-slate-400 mb-[1.5vw]">
              Create strategy tags to categorize your trades
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-[0.5vw] px-[1.5vw] py-[0.75vw] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[0.5vw] hover:shadow-lg transition-all font-semibold"
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-[1vw] border border-slate-700/50 p-[1.5vw] hover:border-slate-600/50 transition-all group"
              >
                <div className="flex items-center gap-[1vw]">
                  <span className="text-5xl">{tag.emoji}</span>
                  
                  <div className="flex-1">
                    <div className="text-[1.5vw] font-bold mb-[0.25vw]" style={{ color: tag.color }}>
                      {tag.name}
                    </div>
                    <div className="text-[0.65vw] text-slate-500">
                      Tag ID: {tag.tagId}
                    </div>
                  </div>

                  <div 
                    className="w-12 h-12 rounded-full shadow-lg" 
                    style={{ backgroundColor: tag.color }}
                  />

                  <button
                    onClick={() => handleDelete(tag.tagId, tag.name)}
                    className="opacity-0 group-hover:opacity-100 p-[0.5vw] bg-red-600 hover:bg-red-700 text-white rounded-[0.5vw] transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Tag Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-[1vw]">
            <div className="bg-slate-900 rounded-[1vw] border border-slate-700 max-w-md w-full p-[1.5vw]">
              <div className="flex items-center justify-between mb-[1.5vw]">
                <h3 className="text-[1.5vw] font-black">New Strategy Tag</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-[0.5vw] hover:bg-slate-800 rounded-[0.5vw] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tag Name */}
                <div>
                  <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., EMA Retest, Break & Retest"
                    required
                  />
                </div>

                {/* Emoji Selector */}
                <div>
                  <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">
                    Emoji
                  </label>
                  <div className="grid grid-cols-6 gap-[0.5vw]">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji })}
                        className={`text-[1.9vw] p-[0.5vw] rounded-[0.5vw] border-2 transition-all ${
                          formData.emoji === emoji 
                            ? 'border-blue-500 bg-blue-900/30' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-[0.5vw]">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`p-[0.75vw] rounded-[0.5vw] border-2 transition-all ${
                          formData.color === color.value 
                            ? 'border-white' 
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        <span className="text-[0.65vw] font-bold text-white">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-[0.75vw] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-[1vw] py-[0.75vw] bg-slate-800 hover:bg-slate-700 rounded-[0.5vw] transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || addTag.isLoading}
                    className="flex-1 px-[1vw] py-[0.75vw] bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-[0.5vw] transition-all font-semibold disabled:opacity-50"
                  >
                    {addTag.isLoading ? 'Creating...' : 'Create Tag'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsView;
