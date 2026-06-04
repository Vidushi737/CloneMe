import { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  X,
  Calendar,
  Smile,
  Tag
} from 'lucide-react';
import api from '../services/api';

export default function Journals() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');

  // Drawer/Modal State for Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMood, setNewMood] = useState('');
  const [newTags, setNewTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modal State for View
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null);

  const fetchJournals = async () => {
    try {
      const response = await api.get('/journals/');
      setJournals(response.data);
    } catch (err) {
      console.error("Error fetching journals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) {
      setError('Title and Content are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/journals/', {
        title: newTitle,
        content: newContent,
        date: newDate,
        mood: newMood || null,
        tags: newTags || null
      });

      // Reset
      setNewTitle('');
      setNewContent('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setNewMood('');
      setNewTags('');
      setIsCreateOpen(false);

      // Refresh
      fetchJournals();
    } catch (err) {
      setError('Could not create journal entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    try {
      await api.delete(`/journals/${id}`);
      setSelectedJournal(null);
      fetchJournals();
    } catch (err) {
      alert("Failed to delete memory.");
    }
  };

  // Get distinct tags and moods for filters
  const allMoods = Array.from(new Set(journals.map(j => j.mood).filter(Boolean)));
  const allTags = Array.from(
    new Set(
      journals
        .flatMap(j => (j.tags || '').split(','))
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  // Filter & Search Logic
  const filteredJournals = journals.filter(j => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.content.toLowerCase().includes(search.toLowerCase());
    const matchesMood = !selectedMoodFilter || j.mood === selectedMoodFilter;

    const jTags = (j.tags || '').split(',').map((t: string) => t.trim().toLowerCase());
    const matchesTag = !selectedTagFilter || jTags.includes(selectedTagFilter.toLowerCase());

    return matchesSearch && matchesMood && matchesTag;
  });

  const moodEmojis: Record<string, string> = {
    Happy: '😊',
    Excited: '🚀',
    Motivated: '🔥',
    Neutral: '😐',
    Sad: '😢',
    Stressed: '😰'
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-indigo-400 w-8 h-8" />
            Memory Journals
          </h1>
          <p className="text-slate-400 mt-1">Keep a log of your thoughts, experiences, and breakthroughs.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl backdrop-blur-sm">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Mood filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Smile className="w-4 h-4" />
          </span>
          <select
            value={selectedMoodFilter}
            onChange={(e) => setSelectedMoodFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-medium cursor-pointer"
          >
            <option value="">All Moods</option>
            {allMoods.map((m: any) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 pointer-events-none">▼</span>
        </div>

        {/* Tag filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Tag className="w-4 h-4" />
          </span>
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-medium cursor-pointer"
          >
            <option value="">All Tags</option>
            {allTags.map((t: any) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 pointer-events-none">▼</span>
        </div>
      </div>

      {/* Grid of Journal entries */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Loading memories...</p>
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="glass-card py-20 text-center rounded-2xl border border-slate-850">
          <span className="text-5xl block mb-4">📭</span>
          <h3 className="text-xl font-bold text-white mb-2">No Memories Found</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria, or write a new entry to start cataloging your life!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJournals.map((j) => (
            <div
              key={j.id}
              onClick={() => setSelectedJournal(j)}
              className="glass-card hover:-translate-y-1 hover:border-indigo-500/30 active:scale-[0.99] cursor-pointer transition-all duration-300 flex flex-col justify-between p-5 rounded-2xl border border-slate-850"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 line-clamp-1 flex-1">{j.title}</h3>
                  <span className="text-lg shrink-0">{moodEmojis[j.mood] || '😐'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{j.date}</span>
                </div>

                <p className="text-slate-350 text-sm line-clamp-4 leading-relaxed font-sans">{j.content}</p>
              </div>

              {/* Badges footer */}
              {j.tags && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-850">
                  {j.tags.split(',').map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md uppercase tracking-wider"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW JOURNAL DETAIL MODAL */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#161e31] border border-slate-850 rounded-2xl shadow-2xl p-6 text-white max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedJournal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{moodEmojis[selectedJournal.mood] || '😐'}</span>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{selectedJournal.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedJournal.date}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-b border-slate-800 py-5">
                <p className="text-slate-350 text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedJournal.content}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {selectedJournal.tags && selectedJournal.tags.split(',').map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md uppercase tracking-wider"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleDelete(selectedJournal.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-350 border border-rose-500/25 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">Delete Memory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOURNAL DRAWER */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#161e31] border border-slate-850 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Write New Memory
            </h2>

            {error && (
              <p className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">{error}</p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mastered React state context design patterns"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                <textarea
                  placeholder="Tell your twin about your accomplishments, hurdles, or thoughts today..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mood (Optional)</label>
                  <select
                    value={newMood}
                    onChange={(e) => setNewMood(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="">Auto-Detect</option>
                    <option value="Happy">Happy 😊</option>
                    <option value="Excited">Excited 🚀</option>
                    <option value="Motivated">Motivated 🔥</option>
                    <option value="Neutral">Neutral 😐</option>
                    <option value="Sad">Sad 😢</option>
                    <option value="Stressed">Stressed 😰</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags (Optional)</label>
                  <span className="text-[10px] text-slate-500 font-semibold">Comma-separated</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. learning, career, victory (or leave blank for AI tags)"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 border border-slate-750 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Memory'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
