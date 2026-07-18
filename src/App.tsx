import { BrowserRouter, Routes, Route } from "react-router-dom";
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-slip" element={<AddSlip />} />
        <Route path="/history" element={<History />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/interest" element={<Interest />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/style-guide" element={<StyleGuide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
