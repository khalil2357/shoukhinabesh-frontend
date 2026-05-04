import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, ChevronDown, LogOut, LayoutDashboard, Package, Store, Heart } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, fetchCart, reset } = useCartStore();
  const { items: wishlistItems, fetchWishlist } = useWishlistStore();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initial entrance
    const tl = gsap.timeline();
    tl.fromTo(logoRef.current, 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.nav-link', 
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, 
      '-=0.4'
    )
    .fromTo('.nav-icon', 
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }, 
      '-=0.3'
    );
  }, { scope: navRef });

  useGSAP(() => {
    if (searchOpen) {
      const tl = gsap.timeline();
      tl.to(searchOverlayRef.current, { display: 'flex', opacity: 1, duration: 0.5, ease: 'power3.out' })
        .fromTo('.search-content > *', 
          { y: 30, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
        );
      
      setTimeout(() => searchInputRef.current?.focus(), 500);
    } else {
      gsap.to(searchOverlayRef.current, { opacity: 0, duration: 0.4, ease: 'power3.in', onComplete: () => {
        if (searchOverlayRef.current) searchOverlayRef.current.style.display = 'none';
      }});
    }
  }, [searchOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart().catch(() => {});
      fetchWishlist().catch(() => {});
    } else {
      reset();
    }
  }, [isAuthenticated, fetchCart, fetchWishlist, reset]);

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
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'bg-brand-cream/90 backdrop-blur-xl border-b border-brand-gold/20 py-3'
            : 'bg-transparent py-6'
        } flex items-center`}
      >
        <div className="w-full px-6 md:px-12 flex justify-between items-center gap-6">
          {/* Left nav */}
          <div ref={linksRef} className="flex-1 hidden md:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="nav-link hover:text-brand-onyx transition-colors relative group whitespace-nowrap"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-gold transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Logo (center) */}
          <div ref={logoRef} className="flex-none">
            <Link
              to="/"
              className={`text-2xl md:text-3xl font-serif font-bold tracking-tighter transition-all duration-500 ${scrolled ? 'scale-90' : 'scale-100'}`}
            >
              SHOUKHINABESH
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex-1 flex justify-end items-center gap-1 md:gap-4">
            {/* Search */}
            <button
              id="navbar-search-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="nav-icon p-2 text-brand-onyx hover:text-brand-gold transition-all hover:bg-brand-onyx/5 rounded-full"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              id="navbar-wishlist-btn"
              aria-label="Wishlist"
              className="nav-icon p-2 text-brand-onyx hover:text-brand-gold transition-all relative hover:bg-brand-onyx/5 rounded-full"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-brand-gold text-brand-onyx text-[8px] font-black rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              id="navbar-cart-btn"
              aria-label="Shopping cart"
              className="nav-icon p-2 text-brand-onyx hover:text-brand-gold transition-all relative hover:bg-brand-onyx/5 rounded-full"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-brand-gold text-brand-onyx text-[8px] font-black rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99' : itemCount}
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
                  className="nav-icon flex items-center gap-2 p-1 pr-3 text-brand-onyx hover:text-brand-gold transition-all rounded-full border border-transparent hover:border-neutral-200"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name ?? 'User'} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-[10px] font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-4 w-60 bg-white/95 backdrop-blur-xl border border-neutral-100 shadow-2xl py-2 z-50 animate-fadeInUp">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-onyx truncate">{user?.name}</p>
                      <p className="text-[9px] text-neutral-400 truncate mt-1">{user?.email}</p>
                    </div>
                    {[
                      { to: getDashboardLink(), icon: LayoutDashboard, label: 'Dashboard' },
                      ...(user?.role === 'CUSTOMER' ? [{ to: '/dashboard/orders', icon: Package, label: 'My Orders' }] : []),
                      ...(user?.role === 'VENDOR' ? [{ to: '/vendor', icon: Store, label: 'My Store' }] : []),
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 hover:bg-neutral-50 hover:text-brand-onyx transition-colors"
                      >
                        <item.icon className="w-3.5 h-3.5" /> {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 transition-colors border-t border-neutral-100 mt-1"
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
                className="nav-icon p-2 text-brand-onyx hover:text-brand-gold transition-all hover:bg-brand-onyx/5 rounded-full"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              id="navbar-mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-brand-onyx hover:text-brand-gold transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* GSAP Search Overlay */}
      <div 
        ref={searchOverlayRef}
        className="fixed inset-0 z-[100] bg-brand-cream/98 backdrop-blur-2xl hidden flex-col items-center justify-center px-6"
        style={{ opacity: 0 }}
      >
        <button
          onClick={() => setSearchOpen(false)}
          className="absolute top-10 right-12 p-3 text-neutral-400 hover:text-brand-onyx transition-all hover:rotate-90"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="w-full max-w-2xl search-content text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold mb-12 block">
            Seek the Extraordinary
          </span>
          <form onSubmit={handleSearch} className="relative group">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full bg-transparent text-4xl md:text-6xl font-serif text-brand-onyx text-center border-b border-neutral-200 py-6 focus:outline-none placeholder:text-neutral-200 transition-all focus:border-brand-onyx"
              id="search-input"
            />
            <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-brand-onyx/40 group-hover:text-brand-onyx transition-colors">
              <Search className="w-8 h-8" />
            </button>
          </form>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {['Solitaires', 'Recycled Gold', 'New Arrivals', 'Best Sellers'].map((tag) => (
              <button 
                key={tag}
                onClick={() => { setSearchQuery(tag); }}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors"
              >
                # {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer (Keeping simpler for now but added GSAP classes) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <div
            className="absolute inset-0 bg-brand-onyx/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-80 bg-brand-cream flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-slideInRight">
            <div className="flex items-center justify-between px-8 h-20 border-b border-neutral-100">
              <span className="text-lg font-serif font-bold tracking-tighter">SHOUKHINABESH</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-neutral-400 hover:text-brand-onyx transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-8 py-12 space-y-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block text-2xl font-serif font-bold hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-10 border-t border-neutral-100 space-y-6">
                {isAuthenticated ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-onyx">{user?.name}</p>
                      <p className="text-[9px] text-neutral-400">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
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
