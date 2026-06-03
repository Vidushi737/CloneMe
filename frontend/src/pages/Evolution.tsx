import { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Award, 
  TrendingUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import api from '../services/api';

export default function Evolution() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get('/ai/evolution');
      setReport(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold uppercase tracking-wider">Mapping Personality Evolution...</p>
      </div>
    );
  }

  const getTraitColor = (name: string) => {
    switch (name) {
      case 'Openness': return 'bg-indigo-500';
      case 'Conscientiousness': return 'bg-amber-500';
      case 'Extraversion': return 'bg-pink-500';
      case 'Agreeableness': return 'bg-emerald-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="text-indigo-400 w-8 h-8" />
            Personality Evolution Engine
          </h1>
          <p className="text-slate-400 mt-1">Deep analysis of your behaviors, habit adherence, and journal logs.</p>
        </div>
        <button
          onClick={() => fetchReport(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-3 border border-slate-750 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all disabled:opacity-55 active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Recalculating...' : 'Refresh Engine'}</span>
        </button>
      </div>

      {!report ? (
        <div className="glass-card py-20 text-center rounded-2xl border border-slate-850">
          <span className="text-5xl block mb-4">📈</span>
          <h3 className="text-xl font-bold text-white mb-2">No Analysis Available</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Write more journal entries and set goals to compile your personality profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Summary Card and Index */}
          <div className="lg:col-span-1 space-y-6">
            {/* Evolution Index Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-850 text-center relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
              
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-4">Evolution Index</span>
              
              <div className="relative inline-flex items-center justify-center mb-4">
                {/* Visual circle representation */}
                <div className="w-36 h-36 rounded-full border-4 border-slate-800 flex items-center justify-center">
                  <span className="text-5xl font-extrabold text-white group-hover:scale-105 transition-transform duration-300">
                    {report.evolution_index || 0}
                  </span>
                </div>
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin duration-[4s]"></div>
              </div>

              <p className="text-slate-350 text-sm font-medium">Your global progress score based on goal completion consistency and habit streak logs.</p>
            </div>

            {/* Mindset Summary */}
            <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-400" />
                Current Mindset
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed font-sans font-medium">
                {report.summary}
              </p>
            </div>
          </div>

          {/* Right Columns: Trait Breakdowns & Strengths/Weaknesses */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Trait Progress Bars */}
            <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Big Five Personality Traits Mapping
              </h2>

              <div className="space-y-4">
                {report.traits && report.traits.map((t: any) => (
                  <div key={t.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white">{t.name}</span>
                      </div>
                      <span className="text-indigo-400">{t.score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-850">
                      <div 
                        className={`h-2 rounded-full ${getTraitColor(t.name)} transition-all duration-700`}
                        style={{ width: `${t.score}%` }}
                      ></div>
                    </div>
                    {t.description && (
                      <span className="text-[10px] text-slate-400 block font-medium mt-1 leading-normal">{t.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-3.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Your Key Strengths
                </h3>
                <ul className="space-y-2">
                  {report.strengths && report.strengths.map((str: string) => (
                    <li key={str} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed font-sans">
                      <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-3.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Potential Blockers
                </h3>
                <ul className="space-y-2">
                  {report.weaknesses && report.weaknesses.map((weak: string) => (
                    <li key={weak} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed font-sans">
                      <span className="text-amber-400 mt-0.5 font-bold">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Growth Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.recommendations && report.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-slate-300 text-xs leading-relaxed font-semibold font-sans">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
