import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, ChevronDown, LogOut, LayoutDashboard, Package, Store } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, fetchCart, reset } = useCartStore();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart().catch(() => {});
    } else {
      reset();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    reset();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'VENDOR') return '/vendor';
    return '/dashboard';
  };

  const navLinks = [
    { to: '/shop', label: 'The Shop' },
    { to: '/shop?categoryId=rings', label: 'Rings' },
    { to: '/shop?categoryId=necklaces', label: 'Necklaces' },
    { to: '/shop?categoryId=earrings', label: 'Earrings' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-brand-cream/95 backdrop-blur-md shadow-sm border-b border-neutral-200/60'
            : 'bg-brand-cream/80 backdrop-blur-md border-b border-neutral-200/40'
        } h-16 flex items-center`}
      >
        <div className="w-full px-6 md:px-12 flex justify-between items-center gap-6">
          {/* Left nav */}
          <div className="flex-1 hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="hover:text-brand-onyx transition-colors link-underline whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logo (center) */}
          <div className="flex-none">
            <Link
              to="/"
              className="text-xl md:text-2xl font-serif font-bold tracking-tighter hover:opacity-70 transition-opacity"
            >
              SHOUKHINABESH
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex-1 flex justify-end items-center gap-1 md:gap-2">
            {/* Search */}
            <button
              id="navbar-search-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-neutral-600 hover:text-brand-onyx transition-colors rounded-sm hover:bg-neutral-100"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              id="navbar-cart-btn"
              aria-label="Shopping cart"
              className="p-2 text-neutral-600 hover:text-brand-onyx transition-colors relative rounded-sm hover:bg-neutral-100"
            >
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-onyx text-brand-cream text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  id="navbar-user-menu-btn"
                  aria-label="User menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-2 text-neutral-600 hover:text-brand-onyx transition-colors rounded-sm hover:bg-neutral-100"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name ?? 'User avatar'} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-[10px] font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-100 shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-xs font-bold text-brand-onyx truncate">{user?.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-brand-onyx/10 text-brand-onyx">
                        {user?.role}
                      </span>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-brand-onyx transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                    {user?.role === 'CUSTOMER' && (
                      <Link
                        to="/dashboard/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-brand-onyx transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" /> My Orders
                      </Link>
                    )}
                    {user?.role === 'VENDOR' && (
                      <Link
                        to="/vendor"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-brand-onyx transition-colors"
                      >
                        <Store className="w-3.5 h-3.5" /> My Store
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors border-t border-neutral-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                id="navbar-login-btn"
                aria-label="Sign in"
                className="hidden md:flex p-2 text-neutral-600 hover:text-brand-onyx transition-colors rounded-sm hover:bg-neutral-100"
              >
                <User className="w-4 h-4" />
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              id="navbar-mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-neutral-600 hover:text-brand-onyx transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-brand-cream/95 backdrop-blur-md flex flex-col items-center justify-center px-6 animate-fadeIn">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-5 right-6 p-2 text-neutral-400 hover:text-brand-onyx transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 mb-8">
            Search the Collection
          </p>
          <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="flex items-center border-b-2 border-brand-onyx pb-2">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jewellery..."
                className="flex-1 bg-transparent text-2xl font-serif focus:outline-none placeholder:text-neutral-300"
                id="search-input"
              />
              <button type="submit" className="p-2 text-neutral-600 hover:text-brand-onyx transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-brand-onyx/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-80 bg-brand-cream flex flex-col shadow-2xl animate-slideInRight">
            <div className="flex items-center justify-between px-6 h-16 border-b border-neutral-100">
              <span className="text-sm font-serif font-bold tracking-tighter">SHOUKHINABESH</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-neutral-400 hover:text-brand-onyx transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block text-lg font-serif font-bold hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-6 border-t border-neutral-100 space-y-4">
                {isAuthenticated ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-brand-onyx">{user?.name}</p>
                      <p className="text-[10px] text-neutral-400">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
