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
  const menuBtnRef = useRef<HTMLButtonElement>(null);

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
    const handleScroll = () => setScrolled(window.scrollY > 50);
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

  // Reversed colors: light text when scrolled (on dark bg) and dark text when not (on light hero)
  const textColorClass = scrolled ? 'text-white' : 'text-brand-onyx';
  const iconColorClass = scrolled ? 'text-white' : 'text-brand-onyx';
  const logoColorClass = scrolled ? 'text-white' : 'text-brand-onyx';

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'bg-brand-onyx/90 backdrop-blur-2xl border-b border-white/10 py-3 shadow-lg'
            : 'bg-transparent py-8'
        } flex items-center`}
      >
        <div className="w-full px-6 md:px-16 flex justify-between items-center gap-6">
          {/* Mobile Menu Icon (Left on mobile) */}
          <button
            ref={menuBtnRef}
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden p-2 ${iconColorClass} hover:scale-110 transition-transform`}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Left nav (Desktop only) */}
          <div ref={linksRef} className={`flex-1 hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.4em] ${textColorClass}`}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="nav-link hover:text-brand-gold transition-colors relative group whitespace-nowrap"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-brand-gold transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Logo (Center) */}
          <div ref={logoRef} className="flex-none lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <Link
              to="/"
              className={`text-2xl md:text-3xl font-serif font-bold tracking-tighter transition-all duration-500 ${logoColorClass} ${scrolled ? 'scale-90' : 'scale-100'}`}
            >
              SHOUKHINABESH
            </Link>
          </div>

          {/* Right actions (Desktop only) */}
          <div className="flex-1 flex justify-end items-center gap-3 md:gap-6">
            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className={`nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all hover:bg-neutral-500/5 rounded-full`}
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                to="/wishlist"
                className={`nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all relative hover:bg-neutral-500/5 rounded-full`}
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-brand-gold text-brand-onyx text-[8px] font-black rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className={`nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all relative hover:bg-neutral-500/5 rounded-full`}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-brand-gold text-brand-onyx text-[8px] font-black rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99' : itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* User Profile (Desktop only) */}
            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`nav-icon flex items-center gap-2 p-1 pr-3 ${iconColorClass} hover:text-brand-gold transition-all rounded-full border border-transparent hover:border-neutral-200/50`}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name ?? 'User'} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-8 h-8 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-[10px] font-black border border-white/20">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-6 w-64 bg-white/95 backdrop-blur-2xl border border-neutral-100 shadow-2xl py-2 z-50 animate-fadeInUp">
                    <div className="px-6 py-5 border-b border-neutral-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-onyx truncate">{user?.name}</p>
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
                        className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 hover:bg-neutral-50 hover:text-brand-onyx transition-colors"
                      >
                        <item.icon className="w-4 h-4" /> {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 hover:bg-rose-50 transition-colors border-t border-neutral-100 mt-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`hidden lg:flex nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all hover:bg-neutral-500/5 rounded-full`}
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Profile Placeholder for Mobile (To balance the Menu icon on left) */}
            <div className="lg:hidden w-10" />
          </div>
        </div>
      </nav>

      {/* GSAP Search Overlay */}
      <div 
        ref={searchOverlayRef}
        className="fixed inset-0 z-[100] bg-brand-cream/98 backdrop-blur-3xl hidden flex-col items-center justify-center px-8"
        style={{ opacity: 0 }}
      >
        <button
          onClick={() => setSearchOpen(false)}
          className="absolute top-12 right-12 p-4 text-neutral-400 hover:text-brand-onyx transition-all hover:rotate-90"
        >
          <X className="w-8 h-8" />
        </button>
        
        <div className="w-full max-w-3xl search-content text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.8em] text-brand-gold mb-16 block">
            Seek the Extraordinary
          </span>
          <form onSubmit={handleSearch} className="relative group">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full bg-transparent text-5xl md:text-8xl font-serif text-brand-onyx text-center border-b-2 border-neutral-100 py-10 focus:outline-none placeholder:text-neutral-100 transition-all focus:border-brand-onyx"
              id="search-input"
            />
            <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-6 text-brand-onyx/20 group-hover:text-brand-onyx transition-colors">
              <Search className="w-10 h-10" />
            </button>
          </form>
        </div>
      </div>

      {/* GSAP Mobile Drawer */}
      <div 
        className={`fixed inset-0 z-[110] lg:hidden transition-all duration-500 ${mobileOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-brand-onyx/40 backdrop-blur-md transition-opacity duration-500 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        
        {/* Drawer Content */}
        <div 
          className={`absolute top-0 left-0 h-full w-full max-w-sm bg-brand-cream transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-8 h-24 border-b border-neutral-100">
              <span className="text-xl font-serif font-black tracking-tighter">SHOUKHINABESH</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-3 text-neutral-400 hover:text-brand-onyx transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-10 py-16 space-y-10">
              {/* Quick Actions (Moved from header to drawer on mobile) */}
              <div className="flex items-center gap-8 pb-12 border-b border-neutral-100">
                <button
                  onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-brand-onyx group-hover:text-white transition-all">
                    <Search className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Search</span>
                </button>

                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center gap-2 group relative"
                >
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-brand-onyx group-hover:text-white transition-all">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Wishlist</span>
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-brand-gold text-brand-onyx text-[9px] font-black rounded-full flex items-center justify-center border-2 border-brand-cream">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center gap-2 group relative"
                >
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-brand-onyx group-hover:text-white transition-all">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Cart</span>
                  {itemCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-brand-gold text-brand-onyx text-[9px] font-black rounded-full flex items-center justify-center border-2 border-brand-cream">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="space-y-6">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold mb-6 block">Collections</span>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="block text-3xl font-serif font-black hover:text-brand-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* User Account */}
              <div className="pt-12 border-t border-neutral-100 space-y-8">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-4">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-12 h-12 rounded-full border border-neutral-100" />
                      ) : (
                        <div className="w-12 h-12 bg-brand-onyx text-white rounded-full flex items-center justify-center font-black">
                          {user?.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-onyx">{user?.name}</p>
                        <p className="text-[9px] text-neutral-400">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-brand-onyx transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        <LogOut className="w-5 h-5" /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-4 bg-brand-onyx text-white text-[10px] font-black uppercase tracking-widest rounded-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-4 border border-brand-onyx text-brand-onyx text-[10px] font-black uppercase tracking-widest rounded-sm"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </nav>
            
            <div className="p-8 bg-neutral-50 text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.5em] text-neutral-300">© 2026 Shoukhinabesh Luxury</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
