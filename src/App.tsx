import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { AddSlip } from "@/pages/AddSlip";
import { History } from "@/pages/History";
import { Goals } from "@/pages/Goals";
import { Achievements } from "@/pages/Achievements";
import { Settings } from "@/pages/Settings";
import { Interest } from "@/pages/Interest";
import { Reconciliation } from "@/pages/Reconciliation";
import { AuditLog } from "@/pages/AuditLog";
import { StyleGuide } from "@/pages/StyleGuide";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
                <Reconciliation />
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
            path="/style-guide"
            element={
              <RequireAuth>
                <StyleGuide />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
