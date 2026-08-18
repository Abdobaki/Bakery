import React from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import InventoryPage from './pages/InventoryPage';

export default function App() {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">🥖</span>
          <span className="brand-title">مخبزة الأصالة</span>
        </div>

        <nav>
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink to="/" end>
                📊 لوحة التحكم والأرباح
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/inventory">
                🍕 مخزون المنتجات الخارجية
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/history">
                📁 الأرشيف والتقارير التاريخية
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header-bar">
          <h1 className="page-title">نظام إدارة المخبزة (Owner Management Portal)</h1>
          <div className="user-profile">
            <span>👤 مالِك المخبزة (Owner)</span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}
