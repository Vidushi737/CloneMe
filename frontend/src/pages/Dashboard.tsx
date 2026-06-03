import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  CheckSquare, 
  Send, 
  Smile, 
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [journals, setJournals] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Journal State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [journalStatus, setJournalStatus] = useState('');
  const [submittingJournal, setSubmittingJournal] = useState(false);

  // Today's Mood State
  const [selectedMood, setSelectedMood] = useState('');
  const [moodStatus, setMoodStatus] = useState('');

  const fetchData = async () => {
    try {
      const [journalsRes, goalsRes, habitsRes] = await Promise.all([
        api.get('/journals'),
        api.get('/goals'),
        api.get('/habits'),
      ]);
      setJournals(journalsRes.data);
      setGoals(goalsRes.data);
      setHabits(habitsRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !quickContent) {
      setJournalStatus('Please fill in both fields.');
      return;
    }
    setSubmittingJournal(true);
    setJournalStatus('');
    try {
      await api.post('/journals/', {
        title: quickTitle,
        content: quickContent,
        date: new Date().toISOString().split('T')[0]
      });
      setQuickTitle('');
      setQuickContent('');
      setJournalStatus('Memory saved successfully!');
      fetchData();
      setTimeout(() => setJournalStatus(''), 3000);
    } catch (err) {
      setJournalStatus('Failed to save memory.');
    } finally {
      setSubmittingJournal(false);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setMoodStatus('Logging mood...');
    try {
      await api.post('/moods/', {
        mood,
        date: new Date().toISOString().split('T')[0],
        note: 'Logged via quick dashboard tracker'
      });
      setMoodStatus(`Logged as ${mood}!`);
      setTimeout(() => setMoodStatus(''), 3000);
    } catch (err) {
      setMoodStatus('Failed to log mood.');
    }
  };

  // Calculations
  const completedGoalsCount = goals.filter(g => g.is_completed).length;
  const goalSuccessRate = goals.length > 0 ? Math.round((completedGoalsCount / goals.length) * 100) : 0;
  
  // Weekly habit consistency calculation
  const totalHabitSlots = habits.length * 7;
  const completedHabitSlots = habits.reduce((acc, h) => {
    const last7Days = h.logs || [];
    return acc + last7Days.filter((l: any) => l.completed).length;
  }, 0);
  const habitConsistency = totalHabitSlots > 0 ? Math.round((completedHabitSlots / totalHabitSlots) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold uppercase tracking-wider">Syncing Digital Double...</p>
      </div>
    );
  }

  const moods = [
    { name: 'Happy', emoji: '😊', color: 'hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-400' },
    { name: 'Excited', emoji: '🚀', color: 'hover:bg-indigo-500/20 hover:border-indigo-500 text-indigo-400' },
    { name: 'Motivated', emoji: '🔥', color: 'hover:bg-amber-500/20 hover:border-amber-500 text-amber-400' },
    { name: 'Neutral', emoji: '😐', color: 'hover:bg-slate-500/20 hover:border-slate-500 text-slate-400' },
    { name: 'Sad', emoji: '😢', color: 'hover:bg-blue-500/20 hover:border-blue-500 text-blue-400' },
    { name: 'Stressed', emoji: '😰', color: 'hover:bg-rose-500/20 hover:border-rose-500 text-rose-400' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 backdrop-blur-md rounded-2xl border border-indigo-500/20">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Digital Double is Listening 🧠</h1>
          <p className="text-slate-300 mt-1 max-w-xl">
            CloneMe constructs your digital twin by analyzing your journal logs, habit consistency, and milestones. Update your double below.
          </p>
        </div>
        <Link 
          to="/chat" 
          className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          <span>Chat with Twin</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Journals Card */}
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider block">Memories Logged</span>
            <span className="text-4xl font-extrabold text-white block group-hover:scale-105 transition-transform origin-left">{journals.length}</span>
            <Link to="/journals" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1">
              View journals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Goals Progress Card */}
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider block">Goal Progress</span>
            <span className="text-4xl font-extrabold text-white block group-hover:scale-105 transition-transform origin-left">{goalSuccessRate}%</span>
            <Link to="/goals" className="text-purple-400 hover:text-purple-300 text-xs font-semibold flex items-center gap-1">
              {goals.length - completedGoalsCount} active goals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-inner">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Habits Consistency Card */}
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider block">Habit Consistency</span>
            <span className="text-4xl font-extrabold text-white block group-hover:scale-105 transition-transform origin-left">{habitConsistency}%</span>
            <Link to="/habits" className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1">
              {habits.length} habits tracked <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mood Logger & Quick Journal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Mood Tracker */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">How are you feeling today?</h2>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {moods.map((m) => (
                <button
                  key={m.name}
                  onClick={() => handleMoodSelect(m.name)}
                  className={`flex flex-col items-center justify-center p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 transition-all duration-200 ${m.color} ${selectedMood === m.name ? 'ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500/40' : ''}`}
                >
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-[11px] font-semibold tracking-wide uppercase">{m.name}</span>
                </button>
              ))}
            </div>

            {moodStatus && (
              <p className="text-center text-xs text-indigo-300 animate-pulse">{moodStatus}</p>
            )}
          </div>

          {/* Quick Journal Write */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Jot Down a Memory</h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">AI auto-detects mood & tags</span>
            </div>

            <form onSubmit={handleQuickJournalSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title (e.g. Completed a hard sprint session)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                required
              />
              
              <textarea
                placeholder="Write your thoughts. What went well? What was challenging? What did you achieve?"
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                required
              />

              <div className="flex justify-between items-center">
                {journalStatus && (
                  <p className="text-xs text-indigo-300">{journalStatus}</p>
                )}
                <div className="flex-1"></div>
                <button
                  type="submit"
                  disabled={submittingJournal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                >
                  {submittingJournal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Log Memory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right 1 Col: Quick list of habits/goals */}
        <div className="space-y-6">
          {/* Habits Widget */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Daily Habits</h2>
              </div>
              <Link to="/habits" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Manage
              </Link>
            </div>
            
            <div className="space-y-2.5">
              {habits.length === 0 ? (
                <p className="text-sm text-slate-500 py-3">No habits created yet. Track routine actions to build streaks!</p>
              ) : (
                habits.slice(0, 4).map((h) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const logs = h.logs || [];
                  const isCompletedToday = logs.some((l: any) => l.date === todayStr && l.completed);
                  return (
                    <div key={h.id} className="flex justify-between items-center p-3 bg-slate-900/30 border border-slate-800/80 rounded-xl">
                      <div>
                        <span className="text-sm font-semibold text-white block">{h.name}</span>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">{h.frequency}</span>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${isCompletedToday ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700/50'}`}>
                        {isCompletedToday ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Goals Widget */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Goals Tracker</h2>
              </div>
              <Link to="/goals" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-sm text-slate-500 py-3">No active goals yet. Map out your life aspirations!</p>
              ) : (
                goals.filter(g => !g.is_archived).slice(0, 3).map((g) => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white truncate max-w-[150px]">{g.title}</span>
                      <span className="text-slate-400 font-semibold">{g.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-1.5 border border-slate-850">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${g.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
