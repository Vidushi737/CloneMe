import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { LineChart as ChartIcon, Sparkles, Calendar, Activity } from 'lucide-react';
import api from '../services/api';

export default function Analytics() {
  const [moodStats, setMoodStats] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const [moodsRes, goalsRes, habitsRes] = await Promise.all([
        api.get('/moods/stats'),
        api.get('/goals'),
        api.get('/habits')
      ]);
      setMoodStats(moodsRes.data);
      setGoals(goalsRes.data);
      setHabits(habitsRes.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold uppercase tracking-wider">Syncing Life Analytics...</p>
      </div>
    );
  }

  // 1. Mood Progression line chart data
  const moodValues: Record<string, number> = {
    Stressed: 1,
    Sad: 2,
    Neutral: 3,
    Motivated: 4,
    Happy: 5,
    Excited: 6
  };

  const lineData = (moodStats?.recent || []).map((m: any) => ({
    date: m.date.slice(5), // MM-DD format
    moodValue: moodValues[m.mood] || 3,
    moodName: m.mood
  }));

  // 2. Mood Counts Pie Data
  const moodColors: Record<string, string> = {
    Happy: '#10b981', // Emerald
    Excited: '#6366f1', // Indigo
    Motivated: '#f59e0b', // Amber
    Neutral: '#64748b', // Slate
    Sad: '#3b82f6', // Blue
    Stressed: '#ef4444' // Red
  };

  const pieData = Object.entries(moodStats?.counts || {}).map(([name, value]) => ({
    name,
    value: Number(value),
    color: moodColors[name] || '#6366f1'
  }));

  // 3. Habit Completion Rates Bar Data
  const habitBarData = habits.map(h => {
    const logs = h.logs || [];
    const completedCount = logs.filter((l: any) => l.completed).length;
    const rate = logs.length > 0 ? Math.round((completedCount / logs.length) * 100) : 0;
    return {
      name: h.name,
      completedRate: rate
    };
  });

  // 4. Goal Categories Pie Data
  const goalCategoryCounts = goals.reduce((acc: Record<string, number>, g: any) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  const goalCategoryColors = {
    Learning: '#6366f1',
    Career: '#f59e0b',
    Health: '#10b981',
    Finance: '#3b82f6',
    Personal: '#ec4899'
  };

  const goalPieData = Object.entries(goalCategoryCounts).map(([name, value]) => ({
    name,
    value: Number(value),
    color: (goalCategoryColors as any)[name] || '#6366f1'
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-[#161e31] border border-slate-800 rounded-xl shadow-lg">
          <p className="text-xs font-bold text-slate-400">{data.date}</p>
          <p className="text-sm font-extrabold text-white mt-1">Mood: {data.moodName}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ChartIcon className="text-indigo-400 w-8 h-8" />
            Analytics Center
          </h1>
          <p className="text-slate-400 mt-1">Detailed visual tracking of your emotional and execution patterns.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Mood Timeline */}
        <div className="glass-card p-5 rounded-2xl border border-slate-850 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Mood Progression (Recent Logs)
          </h2>
          <div className="h-72 w-full">
            {lineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold">No mood history log available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161e31" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontWeight={600} />
                  <YAxis
                    domain={[1, 6]}
                    ticks={[1, 2, 3, 4, 5, 6]}
                    tickFormatter={(val) => {
                      const labels = ['', 'Stressed', 'Sad', 'Neutral', 'Motivated', 'Happy', 'Excited'];
                      return labels[val] || '';
                    }}
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight={600}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="moodValue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Mood Frequency Distribution */}
        <div className="glass-card p-5 rounded-2xl border border-slate-850 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Mood Distribution
          </h2>
          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold">No data available.</div>
            ) : (
              <>
                <div className="h-full w-full sm:w-[60%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2 shrink-0 max-h-full overflow-y-auto">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-xs font-semibold text-slate-350">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 3: Habit Compliance Rate */}
        <div className="glass-card p-5 rounded-2xl border border-slate-850 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Habit Adherence Rate (%)
          </h2>
          <div className="h-72 w-full">
            {habitBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold">Add habits to chart compliance.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161e31" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={600} tickFormatter={(val) => val.slice(0, 10) + (val.length > 10 ? '..' : '')} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={600} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="completedRate" fill="#10b981" radius={[8, 8, 0, 0]}>
                    {habitBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.completedRate > 50 ? '#10b981' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Goal Breakdown */}
        <div className="glass-card p-5 rounded-2xl border border-slate-850 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Goals Categories Breakdown
          </h2>
          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {goalPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold">No goals set yet.</div>
            ) : (
              <>
                <div className="h-full w-full sm:w-[60%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {goalPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2 shrink-0">
                  {goalPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-xs font-semibold text-slate-350">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
