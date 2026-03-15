import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import GlobalLoader from './components/GlobalLoader';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/dashboard'));
const ManageProducts = lazy(() => import('./pages/manageprods'));
const GenerateBill = lazy(() => import('./pages/generatebill'));
const PrintBill = lazy(() => import('./pages/printbill'));
const Expenses = lazy(() => import('./pages/expenses'));
const ProfitAnalytics = lazy(() => import('./pages/analytics'));
const Settings = lazy(() => import('./pages/settings'));
const Profile = lazy(() => import('./pages/profile'));
const AllBills = lazy(() => import('./pages/allbills'));
const EditBill = lazy(() => import('./pages/editbill'));
const Login = lazy(() => import('./pages/login'));
const Signup = lazy(() => import('./pages/signup'));
const Landing = lazy(() => import('./pages/landing'));
const AdminDashboard = lazy(() => import('./pages/admin-dashboard'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <GlobalLoader />
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

