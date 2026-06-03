import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  X, 
  Zap
} from 'lucide-react';
import api from '../services/api';

export default function Habits() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchHabits = async () => {
    try {
      const response = await api.get('/habits/');
      setHabits(response.data);
    } catch (err) {
      console.error("Error fetching habits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      setError('Habit name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/habits/', {
        name: newName,
        description: newDescription || null,
        frequency: newFrequency
      });

      setNewName('');
      setNewDescription('');
      setNewFrequency('daily');
      setIsCreateOpen(false);
      fetchHabits();
    } catch (err) {
      setError('Failed to create habit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this habit and all its logs permanently?")) return;
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch (err) {
      alert("Failed to delete habit.");
    }
  };

  const handleToggle = async (habitId: number, dateStr: string) => {
    try {
      const response = await api.post(`/habits/${habitId}/toggle`, { date: dateStr });
      // Update the habits state locally to trigger instant rendering
      setHabits(prevHabits => 
        prevHabits.map(h => 
          h.id === habitId ? { ...h, logs: response.data } : h
        )
      );
    } catch (err) {
      console.error("Error toggling habit:", err);
    }
  };

  // Generate last 7 days list chronologically
  const getLast7Days = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: weekdays[d.getDay()],
        isToday: i === 0
      });
    }
    return days;
  };

  const dateList = getLast7Days();

  // Streak Calculator
  const calculateStreak = (logs: any[]) => {
    if (!logs || logs.length === 0) return 0;
    
    // Convert log dates to string set of completed dates
    const completedDates = new Set(
      logs.filter(l => l.completed).map(l => l.date)
    );

    let streak = 0;
    const current = new Date();
    
    // Check backwards from today
    while (true) {
      const dateStr = current.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        // If today is not completed, let's check yesterday. If yesterday was completed, the streak is alive.
        if (streak === 0) {
          current.setDate(current.getDate() - 1);
          const yesterdayStr = current.toISOString().split('T')[0];
          if (completedDates.has(yesterdayStr)) {
            streak++;
            current.setDate(current.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return streak;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="text-emerald-400 w-8 h-8" />
            Routine Habits
          </h1>
          <p className="text-slate-400 mt-1">Consistency is key to digital double mapping. Toggle your habits for the week.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Main Habit Checklist */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Checking routine list...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="glass-card py-20 text-center rounded-2xl border border-slate-850">
          <span className="text-5xl block mb-4">🗓️</span>
          <h3 className="text-xl font-bold text-white mb-2">No Habits Set</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Logging daily habits trains your Future Self predictor on execution consistency. Set your first habit today!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Legend/Date Headers */}
          <div className="glass-card p-6 rounded-2xl border border-slate-850 overflow-x-auto">
            <div className="min-w-[650px] space-y-4">
              {/* Habits grid header */}
              <div className="grid grid-cols-12 items-center text-center pb-3 border-b border-slate-850 font-bold uppercase tracking-wider text-[11px] text-slate-400">
                <div className="col-span-4 text-left">Habit Details</div>
                <div className="col-span-1">Streak</div>
                <div className="col-span-7 grid grid-cols-7 gap-2">
                  {dateList.map((day) => (
                    <div key={day.dateStr} className={`flex flex-col items-center justify-center p-1 rounded ${day.isToday ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : ''}`}>
                      <span className="text-[10px]">{day.dayName}</span>
                      <span className="text-sm font-extrabold text-white mt-0.5">{day.dayNum}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Habit Rows */}
              <div className="space-y-3">
                {habits.map((h) => {
                  const logs = h.logs || [];
                  const streak = calculateStreak(logs);
                  return (
                    <div key={h.id} className="grid grid-cols-12 items-center text-center p-3 bg-slate-900/20 border border-slate-850/50 rounded-xl hover:border-slate-800 transition-all duration-200">
                      
                      {/* Name & description */}
                      <div className="col-span-4 text-left flex items-start gap-3">
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="mt-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="truncate pr-4">
                          <span className="font-bold text-white text-sm block leading-snug truncate">{h.name}</span>
                          {h.description && (
                            <span className="text-slate-400 text-[11px] block mt-0.5 leading-normal truncate">{h.description}</span>
                          )}
                        </div>
                      </div>

                      {/* Streak counter */}
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <Zap className={`w-4 h-4 ${streak > 0 ? 'text-amber-400 fill-amber-400/20' : 'text-slate-600'}`} />
                        <span className="text-sm font-extrabold text-white">{streak}</span>
                      </div>

                      {/* Checklist checkmarks */}
                      <div className="col-span-7 grid grid-cols-7 gap-2">
                        {dateList.map((day) => {
                          const isCompleted = logs.some((l: any) => l.date === day.dateStr && l.completed);
                          return (
                            <div key={day.dateStr} className="flex justify-center">
                              <button
                                onClick={() => handleToggle(h.id, day.dateStr)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10 active:scale-90' : 'bg-slate-900 border border-slate-800 text-transparent hover:border-slate-600 hover:text-slate-500 active:scale-90 font-bold'}`}
                              >
                                {isCompleted ? '✓' : '•'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE HABIT DRAWER */}
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
              <CheckSquare className="w-6 h-6 text-emerald-400" />
              Establish Routine Habit
            </h2>

            {error && (
              <p className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">{error}</p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Read technical journals for 30 min"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Describe your execution details or frequency checklist tips..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
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
                    'Add Habit'
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
