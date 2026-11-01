import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout, { NAV } from './components/Layout'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import OrderPage from './pages/OrderPage'
import MyPage from './pages/MyPage'
import SpecialPage from './pages/SpecialPage'
import MenuPage from './pages/MenuPage'
import FoodsPage from './pages/FoodsPage'
import KitchenPage from './pages/KitchenPage'
import InventoryPage from './pages/InventoryPage'
import EmployeesPage from './pages/EmployeesPage'
import AccountingPage from './pages/AccountingPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

const pages: Record<string, JSX.Element> = {
  '/': <Dashboard />, '/order': <OrderPage />, '/my': <MyPage />, '/special': <SpecialPage />, '/menu': <MenuPage />,
  '/foods': <FoodsPage />, '/kitchen': <KitchenPage />, '/inventory': <InventoryPage />, '/employees': <EmployeesPage />,
  '/accounting': <AccountingPage />, '/reports': <ReportsPage />, '/settings': <SettingsPage />,
}

function Guard({ path }: { path: string }) {
  const role = useStore(s => s.role)
  const allowed = NAV.filter(n => n.roles.includes(role))
  if (!allowed.some(n => n.to === path)) return <Navigate to={allowed[0].to} replace />
  return pages[path]
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {Object.keys(pages).map(p => <Route key={p} path={p} element={<Guard path={p} />} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
