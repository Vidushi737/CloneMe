import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  CheckSquare,
  MessageSquare,
  Activity,
  Milestone,
  LineChart,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

/* ---------------- Dashboard ---------------- */

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-indigo-200 rounded">Journals</div>
        <div className="p-4 bg-green-200 rounded">Goals</div>
        <div className="p-4 bg-yellow-200 rounded">Habits</div>
        <div className="p-4 bg-pink-200 rounded">AI Chat</div>
      </div>
    </div>
  );
};

/* ---------------- Login ---------------- */

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setMsg(data.message || data.error);
    } catch {
      setMsg("Server error");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-96 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Welcome Back 👋
        </h1>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg"
        >
          Login
        </button>

        {msg && (
          <p className="text-center text-sm text-white mt-4">{msg}</p>
        )}
      </div>
    </div>
  );
};

/* ---------------- Signup ---------------- */

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setMsg(data.message || data.error);
    } catch {
      setMsg("Server error");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>

      <input
        placeholder="Email"
        className="border p-2 mb-2 w-full text-black"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 mb-2 w-full text-black"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleSignup}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Signup
      </button>

      <p className="mt-3">{msg}</p>
    </div>
  );
};

/* ---------------- Journals ---------------- */

const Journals = () => {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<string[]>([]);

  const addEntry = () => {
    if (!text.trim()) return;
    setEntries([...entries, text]);
    setText("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Journal</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="border p-2 w-full text-black"
        placeholder="Write something..."
      />

      <button
        onClick={addEntry}
        className="bg-indigo-500 text-white px-4 py-2 mt-2"
      >
        Add Entry
      </button>

      <ul className="mt-4">
        {entries.map((entry, i) => (
          <li key={i} className="border p-2 mt-1">
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------- Goals ---------------- */

const Goals = () => {
  const [goal, setGoal] = useState("");
  const [list, setList] = useState<string[]>([]);

  const addGoal = () => {
    if (!goal.trim()) return;
    setList([...list, goal]);
    setGoal("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Goals</h1>

      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="border p-2 mt-3 w-full text-black"
        placeholder="Enter goal"
      />

      <button
        onClick={addGoal}
        className="bg-indigo-500 text-white px-4 py-2 mt-2"
      >
        Add Goal
      </button>

      <ul className="mt-4">
        {list.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------- Habits ---------------- */

const Habits = () => {
  const [habit, setHabit] = useState("");
  const [habits, setHabits] = useState<string[]>([]);

  const addHabit = () => {
    if (!habit.trim()) return;
    setHabits([...habits, habit]);
    setHabit("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Habits</h1>

      <input
        value={habit}
        onChange={(e) => setHabit(e.target.value)}
        className="border p-2 mt-2 w-full text-black"
        placeholder="New habit"
      />

      <button
        onClick={addHabit}
        className="bg-indigo-500 text-white px-4 py-2 mt-2"
      >
        Add Habit
      </button>

      <ul className="mt-4">
        {habits.map((h, i) => (
          <li key={i}>✔ {h}</li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------- Other Pages ---------------- */

const Chat = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">AI Twin Chat</h1>
    <p>Speak to your digital double.</p>
  </div>
);

const Evolution = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Personality Evolution</h1>
    <p>Discover your growth patterns.</p>
  </div>
);

const Timeline = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Life Timeline</h1>
    <p>Walk through your milestones.</p>
  </div>
);

const Analytics = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Analytics Center</h1>
    <p>View visual reports of your life metrics.</p>
  </div>
);

/* ---------------- App ---------------- */

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/journals", label: "Journals", icon: BookOpen },
    { to: "/goals", label: "Goals", icon: Target },
    { to: "/habits", label: "Habits", icon: CheckSquare },
    { to: "/chat", label: "AI Twin Chat", icon: MessageSquare },
    { to: "/evolution", label: "Evolution", icon: Activity },
    { to: "/timeline", label: "Timeline", icon: Milestone },
    { to: "/analytics", label: "Analytics", icon: LineChart },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
        <aside className="w-64 bg-white dark:bg-[#161e31] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 px-2 py-4 mb-6">
              <span className="text-2xl">👥</span>
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                CloneMe
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <Icon className="w-5 h-5 text-indigo-500" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-500" />
              )}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between px-2">
              <div>
                <div className="text-xs font-semibold">Demo User</div>
                <div className="text-[10px] text-slate-500">
                  demo@cloneme.com
                </div>
              </div>

              <Link to="/login">
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/journals" element={<Journals />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/evolution" element={<Evolution />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}