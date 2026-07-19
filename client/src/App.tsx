import { Routes, Route, Link } from "react-router-dom";
import { Home } from "./pages/Home";
import { Detail } from "./pages/Detail";
import { Settings } from "./pages/Settings";

export function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/settings" className="header__settings" aria-label="CurseForge API key settings">
          ⚙
        </Link>
        <Link to="/" className="header__title">
          Bedrock Hub
        </Link>
        <p className="header__subtitle">Add-ons &amp; maps for Minecraft Bedrock</p>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/:section/:id" element={<Detail />} />
        </Routes>
      </main>
    </div>
  );
}
