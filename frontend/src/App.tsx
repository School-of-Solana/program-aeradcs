import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Marketplace, MyPlans, MySubscriptions, CreatePlan } from "./pages";

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/my-plans" element={<MyPlans />} />
        <Route path="/my-subscriptions" element={<MySubscriptions />} />
        <Route path="/create" element={<CreatePlan />} />
      </Routes>
    </div>
  );
}

export default App;
