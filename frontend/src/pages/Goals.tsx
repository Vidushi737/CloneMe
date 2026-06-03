import { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle, 
  Calendar
} from 'lucide-react';
import api from '../services/api';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Learning');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit/Detail Modal State
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editCompleted, setEditCompleted] = useState(false);

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals/');
      setGoals(response.data);
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/goals/', {
        title: newTitle,
        description: newDescription || null,
        category: newCategory,
        target_date: newTargetDate || null,
        progress: newProgress
      });

      // Reset
      setNewTitle('');
      setNewDescription('');
      setNewCategory('Learning');
      setNewTargetDate('');
      setNewProgress(0);
      setIsCreateOpen(false);

      fetchGoals();
    } catch (err) {
      setError('Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      await api.put(`/goals/${selectedGoal.id}`, {
        progress: editProgress,
        is_completed: editCompleted
      });
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      alert("Failed to update goal.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this goal permanently?")) return;
    try {
      await api.delete(`/goals/${id}`);
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      alert("Failed to delete goal.");
    }
  };

  const categories = ['Learning', 'Career', 'Health', 'Finance', 'Personal'];

  const filteredGoals = goals.filter(g => {
    return !categoryFilter || g.category === categoryFilter;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Learning': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Career': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Health': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Finance': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Target className="text-purple-400 w-8 h-8 animate-bounce" />
            Core Life Goals
          </h1>
          <p className="text-slate-400 mt-1">Set, track, and complete milestones to outline your personality development.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Categories filter tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/30 border border-slate-800 rounded-xl max-w-max">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${!categoryFilter ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${categoryFilter === c ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Goals list grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Synching goals...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="glass-card py-20 text-center rounded-2xl border border-slate-850">
          <span className="text-5xl block mb-4">🎯</span>
          <h3 className="text-xl font-bold text-white mb-2">No Goals Found</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            You don't have any goals in this category. Let's create one now to guide your twin's analysis!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((g) => (
            <div
              key={g.id}
              onClick={() => {
                setSelectedGoal(g);
                setEditProgress(g.progress);
                setEditCompleted(g.is_completed);
              }}
              className="glass-card hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300 p-5 rounded-2xl border border-slate-850 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md border uppercase tracking-wider ${getCategoryColor(g.category)}`}>
                    {g.category}
                  </span>
                  {g.is_completed && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-white leading-snug line-clamp-1">{g.title}</h3>
                  {g.description && (
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{g.description}</p>
                  )}
                </div>
              </div>

              {/* Progress and due date */}
              <div className="space-y-3.5 mt-6 pt-4 border-t border-slate-850">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-indigo-400">{g.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${g.is_completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                      style={{ width: `${g.progress}%` }}
                    ></div>
                  </div>
                </div>

                {g.target_date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {g.target_date}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE GOAL DRAWER */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#161e31] border border-slate-850 rounded-2xl shadow-2xl p-6 text-white">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-400" />
              Define New Goal
            </h2>

            {error && (
              <p className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">{error}</p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master system design and algorithms"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Elaborate on the milestones, resources, or reason for this goal..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Initial Progress</label>
                  <span className="text-xs font-bold text-indigo-400">{newProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
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
                    'Set Goal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#161e31] border border-slate-850 rounded-2xl shadow-2xl p-6 text-white">
            <button
              onClick={() => setSelectedGoal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold text-white mb-2 truncate pr-6">{selectedGoal.title}</h2>
            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-md border uppercase tracking-wider mb-4 ${getCategoryColor(selectedGoal.category)}`}>
              {selectedGoal.category}
            </span>

            {selectedGoal.description && (
              <p className="text-slate-450 text-sm mb-6 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-850">{selectedGoal.description}</p>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Update Progress</label>
                  <span className="text-xs font-bold text-indigo-400">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setEditProgress(val);
                    if (val >= 100) setEditCompleted(true);
                    else setEditCompleted(false);
                  }}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2.5 py-2">
                <input
                  type="checkbox"
                  id="completedCheckbox"
                  checked={editCompleted}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditCompleted(checked);
                    if (checked) setEditProgress(100);
                  }}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer bg-slate-950"
                />
                <label htmlFor="completedCheckbox" className="text-sm font-semibold text-slate-350 cursor-pointer">
                  Mark as fully completed
                </label>
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedGoal.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-rose-500/25 hover:bg-rose-500/10 text-rose-400 font-semibold rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGoal(null)}
                    className="px-4 py-2.5 border border-slate-750 hover:bg-slate-800 text-slate-350 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
