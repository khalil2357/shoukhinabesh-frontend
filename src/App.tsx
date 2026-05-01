import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { ProductDetail } from './pages/ProductDetail';
import { Login, Register } from './pages/auth/AuthPages';
import { CustomerDashboard } from './pages/account/CustomerDashboard';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { useAuthStore } from './store/useAuthStore';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, role }: { children: JSX.Element, role?: string }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Customer Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute role="CUSTOMER">
                <CustomerDashboard />
              </ProtectedRoute>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor" element={
              <ProtectedRoute role="VENDOR">
                <VendorDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        
        <footer className="bg-brand-onyx text-brand-cream section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20">
            <div className="lg:col-span-2 space-y-12">
              <h2 className="text-4xl font-serif font-bold tracking-tighter">SHOUKHINABESH</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 max-w-sm">
                Fine jewellery crafted for the extraordinary. Ethically sourced, hand-finished, and timelessly designed.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">The Collection</h4>
              <ul className="space-y-3 text-xs font-medium">
                <li><a href="/shop" className="hover:text-brand-gold transition-colors">Rings</a></li>
                <li><a href="/shop" className="hover:text-brand-gold transition-colors">Necklaces</a></li>
                <li><a href="/shop" className="hover:text-brand-gold transition-colors">Earrings</a></li>
                <li><a href="/shop" className="hover:text-brand-gold transition-colors">Bracelets</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Company</h4>
              <ul className="space-y-3 text-xs font-medium">
                <li><a href="#" className="hover:text-brand-gold transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Sustainability</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Journal</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-neutral-800 text-[9px] font-bold uppercase tracking-widest text-neutral-600 flex justify-between">
            <p>© 2026 SHOUKHINABESH JEWELLERY. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
               <a href="#">Privacy</a>
               <a href="#">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
