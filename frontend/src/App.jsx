import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* เพิ่มหน้าใหม่ได้ที่นี่ */}
      </Routes>
    </Router>
  );
}

export default App;