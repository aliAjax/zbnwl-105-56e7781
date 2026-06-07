import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import TodayWorkbench from "@/pages/TodayWorkbench";
import CustomerProfile from "@/pages/CustomerProfile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/today" element={<TodayWorkbench />} />
        <Route path="/customer/:customerName" element={<CustomerProfile />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
