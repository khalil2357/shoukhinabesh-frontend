import { useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { ProductDetail } from './pages/ProductDetail';
import { Login, Register } from './pages/auth/AuthPages';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { Checkout } from './pages/Checkout';
import { CustomerDashboard } from './pages/account/CustomerDashboard';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';
import { Wishlist } from './pages/Wishlist';
import { useAuthStore } from './store/useAuthStore';
import { firebaseAuth } from './lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children: ReactNode; roles?: string[] }) => {
  const { hasHydrated, isAuthenticated, user } = useAuthStore();
  if (!hasHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Keep local state in sync without triggering another signOut call.
        useAuthStore.getState().clearAuth();
        return;
      }

      const tokenResult = await firebaseUser.getIdTokenResult();
      const role = (tokenResult.claims.role as 'CUSTOMER' | 'VENDOR' | 'ADMIN' | undefined) || 'CUSTOMER';
      const token = await firebaseUser.getIdToken();

      useAuthStore.getState().setAuth(
        {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'User',
          email: firebaseUser.email || '',
          role,
          avatar: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified,
        },
        token,
      );
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/wishlist" element={<Wishlist />} />

            {/* Checkout — requires auth */}
            <Route path="/checkout" element={
              <ProtectedRoute roles={['CUSTOMER']}>
                <Checkout />
              </ProtectedRoute>
            } />

            {/* Customer Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['CUSTOMER', 'VENDOR', 'ADMIN']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/orders" element={
              <ProtectedRoute roles={['CUSTOMER']}>
                <CustomerDashboard initialTab="orders" />
              </ProtectedRoute>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor" element={
              <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
                <VendorDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-brand-onyx text-brand-cream py-20 px-6 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-16">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-3xl font-serif font-bold tracking-tighter">SHOUKHINABESH</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 max-w-sm leading-loose">
                Fine jewellery crafted for the extraordinary. Ethically sourced, hand-finished, and timelessly designed.
              </p>
              <div className="flex gap-4 pt-2">
                {['Instagram', 'Pinterest', 'Facebook'].map((s) => (
                  <a key={s} href="#" className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-brand-gold transition-colors">
                    {s}
                  </a>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">The Collection</h4>
              <ul className="space-y-3 text-xs font-medium">
                {['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'New Arrivals'].map((c) => (
                  <li key={c}>
                    <a href="/shop" className="text-neutral-400 hover:text-brand-gold transition-colors">{c}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Company</h4>
              <ul className="space-y-3 text-xs font-medium">
                {['Our Story', 'Sustainability', 'Contact', 'Journal', 'Careers'].map((c) => (
                  <li key={c}>
                    <a href="#" className="text-neutral-400 hover:text-brand-gold transition-colors">{c}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-neutral-800 text-[9px] font-bold uppercase tracking-widest text-neutral-600 flex flex-col md:flex-row justify-between gap-4">
            <p>© 2026 Shoukhinabesh Jewellery. All Rights Reserved.</p>
            <div className="flex gap-8">
              <Link to="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-neutral-400 transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-neutral-400 transition-colors">Cookies</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
