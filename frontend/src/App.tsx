import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, ReactNode } from "react";
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

/* ---- Import real page components ---- */
import DashboardPage from "./pages/Dashboard";
import JournalsPage from "./pages/Journals";
import GoalsPage from "./pages/Goals";
import HabitsPage from "./pages/Habits";
import ChatPage from "./pages/Chat";
import EvolutionPage from "./pages/Evolution";
import TimelinePage from "./pages/Timeline";
import AnalyticsPage from "./pages/Analytics";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";

/* ---- Auth helpers ---- */

interface UserInfo {
  id: number;
  username: string;
  email: string;
}

function getStoredAuth(): { token: string | null; user: UserInfo | null } {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  let user: UserInfo | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

/* ---- Protected Route Wrapper ---- */

function ProtectedRoute({ token, children }: { token: string | null; children: ReactNode }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/* ---- Sidebar Layout ---- */

function SidebarLayout({
  darkMode,
  setDarkMode,
  user,
  onLogout,
  children,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  user: UserInfo | null;
  onLogout: () => void;
  children: ReactNode;
}) {
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/journals", label: "Journals", icon: BookOpen },
    { to: "/goals", label: "Goals", icon: Target },
    { to: "/habits", label: "Habits", icon: CheckSquare },
    { to: "/chat", label: "AI Twin Chat", icon: MessageSquare },
    { to: "/evolution", label: "Evolution", icon: Activity },
    { to: "/timeline", label: "Timeline", icon: Milestone },
    { to: "/analytics", label: "Analytics", icon: LineChart },
  ];

  return (
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-200"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-200"
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
              <div className="text-xs font-semibold">
                {user?.username || "User"}
              </div>
              <div className="text-[10px] text-slate-500">
                {user?.email || ""}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

/* ---- LogoutNavigator (helper to navigate on logout inside Router) ---- */

function LogoutNavigator({ shouldLogout, onDone }: { shouldLogout: boolean; onDone: () => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (shouldLogout) {
      onDone();
      navigate("/login", { replace: true });
    }
  }, [shouldLogout, navigate, onDone]);
  return null;
}

/* ---- Main App ---- */

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pendingLogout, setPendingLogout] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = getStoredAuth();
    setToken(stored.token);
    setUser(stored.user);
  }, []);

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLoginSuccess = (newToken: string, userInfo: any) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setPendingLogout(true);
  };

  const isAuthenticated = !!token;

  return (
    <Router>
      <LogoutNavigator
        shouldLogout={pendingLogout}
        onDone={() => setPendingLogout(false)}
      />

      <Routes>
        {/* ---- Public Auth Routes (full-screen, no sidebar) ---- */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* ---- Protected Routes (sidebar layout) ---- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <DashboardPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/journals"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <JournalsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <GoalsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <HabitsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <ChatPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/evolution"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <EvolutionPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <TimelinePage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute token={token}>
              <SidebarLayout darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout}>
                <AnalyticsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        {/* ---- Catch-all: redirect to appropriate page ---- */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </Router>
  );
}