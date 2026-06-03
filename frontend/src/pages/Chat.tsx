import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'twin',
      text: "Hello! I am your AI Digital Twin. I have synthesized your journal entries, active goals, and habits. Talk to me to reflect on your thoughts or review your current growth trajectory.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ journalsCount: 0, goalsCount: 0, habitsCount: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const [j, g, h] = await Promise.all([
        api.get('/journals'),
        api.get('/goals'),
        api.get('/habits')
      ]);
      setStats({
        journalsCount: j.data.length,
        goalsCount: g.data.filter((x: any) => !x.is_archived).length,
        habitsCount: h.data.length
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Package conversation history in correct schema
      const chat_history = messages.map(msg => ({
        sender: msg.sender === 'user' ? 'user' : 'twin',
        text: msg.text
      }));

      const response = await api.post('/ai/chat', {
        message: textToSend,
        chat_history: chat_history
      });

      // Twin Response
      const twinMsg = {
        id: Date.now() + 1,
        sender: 'twin',
        text: response.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, twinMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = {
        id: Date.now() + 2,
        sender: 'twin',
        text: "I had trouble retrieving your memory bank. Make sure the backend server and Gemini API keys are fully loaded.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    "What are my main focus areas recently?",
    "Review my goals progress and suggest improvements.",
    "Give me some advice based on my recent journals."
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900/30 border border-slate-850 rounded-2xl gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Digital Twin Double
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Synced with {stats.journalsCount} memories • {stats.goalsCount} goals • {stats.habitsCount} habits
            </p>
          </div>
        </div>

        <button 
          onClick={fetchStats}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          title="Sync memory store"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 bg-slate-900/20 border border-slate-850 rounded-2xl p-4 md:p-6 overflow-y-auto max-h-[60vh] space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-end gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-850 text-indigo-400 border border-slate-700/50'}`}>
              {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
            </div>

            {/* Bubble */}
            <div className="space-y-1">
              <div 
                className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm font-sans ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-500 text-white rounded-br-none' 
                    : 'bg-[#161e31] text-slate-200 border border-slate-800 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className={`text-[10px] text-slate-500 font-semibold block ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2.5 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="bg-[#161e31] border border-slate-800 p-4 rounded-2xl rounded-bl-none flex items-center gap-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter prompts */}
      {messages.length === 1 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Starter reflections:</span>
          <div className="flex flex-col sm:flex-row gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="flex-1 text-left p-3.5 bg-slate-900/40 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-350 text-xs rounded-xl font-medium transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <span>{prompt}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
        className="flex gap-2 p-2 bg-slate-900/30 border border-slate-850 rounded-2xl"
      >
        <input
          type="text"
          placeholder="Reflect with your digital twin double..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-500 focus:outline-none text-sm font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.97] text-white font-semibold rounded-xl transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
