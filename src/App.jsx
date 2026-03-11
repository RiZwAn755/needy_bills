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

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ManageProducts />} />
            <Route path="/bill" element={<GenerateBill />} />
            <Route path="/bill/preview/:id" element={<PrintBill />} />
            <Route path="/bill/edit/:id" element={<EditBill />} />
            <Route path="/all-bills" element={<AllBills />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/analytics" element={<ProfitAnalytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

