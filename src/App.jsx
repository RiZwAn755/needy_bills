import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';
import Dashboard from './pages/dashboard';
import ManageProducts from './pages/manageprods';
import GenerateBill from './pages/generatebill';
import PrintBill from './pages/printbill';
import Expenses from './pages/expenses';
import ProfitAnalytics from './pages/analytics';

import Settings from './pages/settings';
import AllBills from './pages/allbills';
import EditBill from './pages/editbill';
import Login from './pages/login';
import Signup from './pages/signup';
import Landing from './pages/landing';
import AdminDashboard from './pages/admin-dashboard';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes (Logged in Users) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/products" element={<ManageProducts />} />
                <Route path="/bill" element={<GenerateBill />} />
                <Route path="/bill/preview/:id" element={<PrintBill />} />
                <Route path="/bill/edit/:id" element={<EditBill />} />
                <Route path="/all-bills" element={<AllBills />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/analytics" element={<ProfitAnalytics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

