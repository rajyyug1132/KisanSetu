import { BrowserRouter, Routes, Route } from "react-router-dom";
import KisanSetu from "@/pages/KisanSetu";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KisanSetu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
