import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './modules/auth/pages/LoginPage';
import Dashboard from './pages/dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/sales';
import Orders from './modules/orders/pages/OrdersPage';
import CashClosing from './modules/cash-session/page/CashSessionPage';
import MainLayout from './layouts/MainLayout/MainLayout';
import ProtectedRouter from './core/guards/ProtectedRouter';
import { SaaSGrid } from './components/SaaSGrid';


function App() {
  return (
    <Router>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PROTEGIDAS (Requieren estar logueado) */}
        {/* Aquí permitimos que tanto 'admin' como 'vendedor' entren al layout base */}
        <Route element={<ProtectedRouter allowedRoles={['admin', 'vendedor']} />}>
          <Route path="/" element={<MainLayout />}>
            
            {/* Rutas accesibles para ambos roles */}
            <Route index element={<Dashboard />} />
            <Route path="ventas" element={<Sales />} />
            <Route path="detalle" element={<Orders />} />
            <Route path="cierre" element={<CashClosing />} />
            <Route path="features" element={<SaaSGrid />} /> 
            <Route path="inventario" element={<Inventory />} />


            

          </Route>
        </Route>

        {/* Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
    
  );
}

export default App;