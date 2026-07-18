import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { AccountProvider } from "@/lib/useAccount";
import { ProfileProvider } from "@/lib/useProfile";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireAdmin } from "@/components/RequireAdmin";

// Each page is code-split into its own chunk, so opening the app only downloads
// the route being viewed instead of every screen (and every screen's heavy
// dependencies) up front.
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const AddSlip = lazy(() => import("@/pages/AddSlip").then((m) => ({ default: m.AddSlip })));
const History = lazy(() => import("@/pages/History").then((m) => ({ default: m.History })));
const Goals = lazy(() => import("@/pages/Goals").then((m) => ({ default: m.Goals })));
const Achievements = lazy(() =>
  import("@/pages/Achievements").then((m) => ({ default: m.Achievements })),
);
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));
const Interest = lazy(() => import("@/pages/Interest").then((m) => ({ default: m.Interest })));
const Reconciliation = lazy(() =>
  import("@/pages/Reconciliation").then((m) => ({ default: m.Reconciliation })),
);
const AuditLog = lazy(() => import("@/pages/AuditLog").then((m) => ({ default: m.AuditLog })));
const StyleGuide = lazy(() => import("@/pages/StyleGuide").then((m) => ({ default: m.StyleGuide })));
const Admin = lazy(() => import("@/pages/Admin").then((m) => ({ default: m.Admin })));
const InterestRates = lazy(() =>
  import("@/pages/InterestRates").then((m) => ({ default: m.InterestRates })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
      กำลังโหลด...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AccountProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/add-slip"
                  element={
                    <RequireAuth>
                      <AddSlip />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <RequireAuth>
                      <History />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/goals"
                  element={
                    <RequireAuth>
                      <Goals />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/achievements"
                  element={
                    <RequireAuth>
                      <Achievements />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/interest"
                  element={
                    <RequireAuth>
                      <Interest />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reconciliation"
                  element={
                    <RequireAuth>
                      <RequireAdmin>
                        <Reconciliation />
                      </RequireAdmin>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/audit-log"
                  element={
                    <RequireAuth>
                      <AuditLog />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <RequireAdmin>
                        <Admin />
                      </RequireAdmin>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/interest-rates"
                  element={
                    <RequireAuth>
                      <RequireAdmin>
                        <InterestRates />
                      </RequireAdmin>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/style-guide"
                  element={
                    <RequireAuth>
                      <StyleGuide />
                    </RequireAuth>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AccountProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
