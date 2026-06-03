import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Compass, 
  Calendar, 
  Award,
  Hourglass,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';

export default function Timeline() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [projections, setProjections] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'past' | 'future'>('past');
  const [loadingPast, setLoadingPast] = useState(true);
  const [loadingFuture, setLoadingFuture] = useState(true);

  const fetchTimeline = async () => {
    try {
      const response = await api.get('/ai/timeline');
      setChapters(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPast(false);
    }
  };

  const fetchProjections = async () => {
    try {
      const response = await api.get('/ai/predictor');
      setProjections(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFuture(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    fetchProjections();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="text-indigo-400 w-8 h-8 animate-spin duration-[10s]" />
            Timeline & Projections
          </h1>
          <p className="text-slate-400 mt-1">Reflect on your compiled past chapters or peer into your predicted future trajectories.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1.5 bg-slate-900/30 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'past' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>Past Chapters</span>
          </button>
          <button
            onClick={() => setActiveTab('future')}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'future' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Future Projections</span>
          </button>
        </div>
      </div>

      {/* PAST TIMELINE TAB */}
      {activeTab === 'past' && (
        <div className="space-y-8 relative">
          {loadingPast ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium">Compiling life chapters...</p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="glass-card py-20 text-center rounded-2xl border border-slate-850">
              <span className="text-5xl block mb-4">📖</span>
              <h3 className="text-xl font-bold text-white mb-2">No Chapters Compiled</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Log memory journals and complete goals to generate your chronological life chapters.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-4 md:ml-6 pl-6 md:pl-8 space-y-10 py-2">
              {chapters.map((chap, idx) => (
                <div key={chap.id || idx} className="relative group">
                  {/* Bullet Node */}
                  <div className="absolute -left-[35px] md:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-[#0b0f19] border-2 border-indigo-500 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-md shadow-indigo-500/20">
                    <span className="text-[10px] font-extrabold">{chap.id}</span>
                  </div>

                  {/* Content card */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-850 hover:border-indigo-500/20 transition-all duration-300 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h3 className="text-xl font-extrabold text-white group-hover:text-indigo-400 transition-colors leading-tight">{chap.title}</h3>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{chap.start_date} – {chap.end_date}</span>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed font-sans">{chap.summary}</p>

                    {/* Milestones list */}
                    {chap.milestones && chap.milestones.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-slate-850">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Key Accomplishments:</span>
                        <div className="flex flex-wrap gap-2">
                          {chap.milestones.map((mil: string, mIdx: number) => (
                            <span 
                              key={mIdx} 
                              className="px-2.5 py-1 bg-slate-900 border border-slate-850 rounded-lg text-slate-350 text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5 text-emerald-400" />
                              {mil}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FUTURE PROJECTIONS TAB */}
      {activeTab === 'future' && (
        <div className="space-y-6">
          {loadingFuture ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium">Calculating future trajectories...</p>
            </div>
          ) : !projections ? (
            <div className="glass-card py-20 text-center rounded-2xl border border-slate-850">
              <span className="text-5xl block mb-4">🔮</span>
              <h3 className="text-xl font-bold text-white mb-2">No Projections Available</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Once habits and goals are locked into consistency, the twin generates predictive projections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1 Month */}
              <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-4 hover:border-indigo-500/20 transition-all duration-300">
                <div className="flex items-center gap-2 text-indigo-400">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">1 Month</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">{projections.one_month}</p>
              </div>

              {/* 6 Months */}
              <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-4 hover:border-purple-500/20 transition-all duration-300">
                <div className="flex items-center gap-2 text-purple-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">6 Months</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">{projections.six_months}</p>
              </div>

              {/* 1 Year */}
              <div className="glass-card p-6 rounded-2xl border border-slate-850 space-y-4 hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Compass className="w-5 h-5 animate-pulse" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">1 Year</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">{projections.one_year}</p>
              </div>
            </div>
          )}

          {/* Guide Card */}
          <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-center">
            <span className="text-xl">🔮</span>
            <p className="text-xs text-indigo-300 font-semibold mt-2">
              Projections are computed by matching the thematic focus of your journals with the compliance consistency of your active habits. Keep checkmarks logged!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
