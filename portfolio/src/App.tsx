import { Routes, Route } from 'react-router-dom';
import { Sidenav } from './components/Sidenav';
import { HomePage } from './pages/HomePage';
import { ComponentPage } from './pages/ComponentPage';

export function App() {
  return (
    <div className="app-layout">
      <Sidenav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/components/:componentName" element={<ComponentPage />} />
        </Routes>
      </main>
    </div>
  );
}
