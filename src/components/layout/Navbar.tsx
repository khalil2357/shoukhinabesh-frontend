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
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const cartOverlayRef = useRef<HTMLDivElement>(null);
  const wishlistOverlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wishBtnRef = useRef<HTMLButtonElement>(null);
  const cartCountRef = useRef<HTMLSpanElement>(null);
  const wishCountRef = useRef<HTMLSpanElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [navMessage, setNavMessage] = useState<string | null>(null);
  const navMessageTimeout = useRef<any>(null);

  const { cart, updateItem, removeItem: removeCartItem, addItem } = useCartStore();
  const { items: wishlistItems, toggleWishlist, fetchWishlist } = useWishlistStore();
  
  const items = cart?.items || [];
  const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  useGSAP(() => {
    if (cartOpen) {
      const tl = gsap.timeline();
      tl.to(cartOverlayRef.current, { display: 'flex', opacity: 1, duration: 0.1 })
        .fromTo('.cart-drawer', 
          { x: '100%' }, 
          { x: '0%', duration: 0.8, ease: 'expo.out' }
        )
        .fromTo('.cart-item', 
          { x: 30, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power3.out' },
          '-=0.4'
        );
    } else {
      gsap.to('.cart-drawer', { x: '100%', duration: 0.6, ease: 'expo.in', onComplete: () => {
        if (cartOverlayRef.current) cartOverlayRef.current.style.display = 'none';
      }});
    }
  }, [cartOpen]);

  useGSAP(() => {
    if (wishlistOpen) {
      const tl = gsap.timeline();
      tl.to(wishlistOverlayRef.current, { display: 'flex', opacity: 1, duration: 0.1 })
        .fromTo('.wishlist-drawer', 
          { x: '100%' }, 
          { x: '0%', duration: 0.8, ease: 'expo.out' }
        )
        .fromTo('.wishlist-item', 
          { x: 30, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power3.out' },
          '-=0.4'
        );
    } else {
      gsap.to('.wishlist-drawer', { x: '100%', duration: 0.6, ease: 'expo.in', onComplete: () => {
        if (wishlistOverlayRef.current) wishlistOverlayRef.current.style.display = 'none';
      }});
    }
  }, [wishlistOpen]);

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
      tl.to(searchOverlayRef.current, { display: 'flex', opacity: 1, y: 20, duration: 0.6, ease: 'expo.out' });
      
      setTimeout(() => searchInputRef.current?.focus(), 400);
    } else {
      gsap.to(searchOverlayRef.current, { opacity: 0, y: 0, duration: 0.4, ease: 'power3.in', onComplete: () => {
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

  // Show a brief message under the logo (originates from navbar)
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ message: string; type?: string }>;
      const msg = ev?.detail?.message || '';
      const type = ev?.detail?.type || '';
      if (!msg) return;

      // set message state
      setNavMessage(msg);

      // animate dynamic island
      if (messageRef.current) {
        gsap.killTweensOf(messageRef.current);
        gsap.fromTo(messageRef.current, 
          { y: -30, scale: 0.8, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.7)' }
        );
      }

      // clear any existing timers
      if (navMessageTimeout.current) clearTimeout(navMessageTimeout.current);
      navMessageTimeout.current = setTimeout(() => {
        // hide message
        if (messageRef.current) {
          gsap.to(messageRef.current, { 
            y: -30, scale: 0.8, opacity: 0, duration: 0.4, ease: 'power3.in',
            onComplete: () => setNavMessage(null)
          });
        } else {
          setNavMessage(null);
        }
      }, 3000);

      // Glow icon for a moment with modern western effects
      try {
        if (type === 'vault' && cartBtnRef.current) {
          const el = cartBtnRef.current;
          const ct = cartCountRef.current;
          const tl = gsap.timeline();
          tl.to(el, { scale: 1.15, filter: 'drop-shadow(0px 0px 8px rgba(197,163,93,0.8))', duration: 0.2, ease: 'back.out(2)' })
            .to(el, { scale: 1, filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))', duration: 0.4, ease: 'power2.out' });
          if (ct) gsap.fromTo(ct, { scale: 1 }, { scale: 1.3, backgroundColor: '#fff', color: '#000', boxShadow: '0 0 15px rgba(255,255,255,0.8)', duration: 0.2, yoyo: true, repeat: 1, ease: 'back.out(2)' });
        }

        if ((type === 'wishlist' || type === 'wishlist-remove') && wishBtnRef.current) {
          const el = wishBtnRef.current;
          const ct = wishCountRef.current;
          const tl = gsap.timeline();
          tl.to(el, { scale: 1.15, filter: 'drop-shadow(0px 0px 8px rgba(197,163,93,0.8))', duration: 0.2, ease: 'back.out(2)' })
            .to(el, { scale: 1, filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))', duration: 0.4, ease: 'power2.out' });
          if (ct) gsap.fromTo(ct, { scale: 1 }, { scale: 1.3, backgroundColor: '#fff', color: '#000', boxShadow: '0 0 15px rgba(255,255,255,0.8)', duration: 0.2, yoyo: true, repeat: 1, ease: 'back.out(2)' });
        }
      } catch (err) {
        // ignore animation errors
      }
    };

    window.addEventListener('show-nav-message', handler as EventListener);
    return () => {
      window.removeEventListener('show-nav-message', handler as EventListener);
      if (navMessageTimeout.current) clearTimeout(navMessageTimeout.current);
    };
  }, []);

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          scrolled
            ? 'py-3'
            : 'py-6'
        } flex items-center justify-center px-4 md:px-10`}
      >
        <div 
          ref={centerRef}
          className={`w-full max-w-[1440px] px-8 md:px-16 flex justify-between items-center transition-all duration-700 ${
            scrolled 
              ? 'bg-brand-onyx/95 backdrop-blur-3xl border border-white/5 rounded-full py-3 shadow-2xl scale-[0.98]' 
              : 'bg-transparent py-2'
          }`}
        >
          {/* Mobile Menu Icon (Left on mobile) */}
          <button
            ref={menuBtnRef}
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden p-2 ${iconColorClass} hover:scale-110 transition-transform`}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Left nav (Desktop only) - Architectural Ribbon Style */}
          <div ref={linksRef} className={`flex-1 hidden lg:flex items-center gap-12 text-[8px] font-black uppercase tracking-[0.6em] ${textColorClass}`}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="nav-link-refined group relative py-1 overflow-hidden"
              >
                <span className="block transition-transform duration-500 group-hover:-translate-y-full italic font-medium">
                  {link.label}
                </span>
                <span className="absolute top-full left-0 block transition-transform duration-500 group-hover:-translate-y-full text-brand-gold italic font-medium">
                  {link.label}
                </span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-brand-gold transition-all duration-700 ease-out group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Logo (Center) - Refined Ribbon Style */}
          <div ref={logoRef} className="flex-none lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <Link
              to="/"
              className={`text-sm md:text-base font-serif font-black tracking-[0.4em] uppercase transition-all duration-700 ${logoColorClass} ${scrolled ? 'scale-90' : 'scale-100'}`}
            >
              SHOUKHINABESH
            </Link>
          </div>

          {/* Right actions (Desktop only) */}
          <div className="flex-1 flex justify-end items-center gap-4 md:gap-10">
            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => setSearchOpen(true)}
                className={`nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all hover:bg-neutral-500/5 rounded-full`}
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                ref={wishBtnRef}
                onClick={() => setWishlistOpen(true)}
                className={`nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all relative hover:bg-neutral-500/5 rounded-full`}
              >
                <Heart className={`w-[18px] h-[18px] transition-all duration-300 ${wishlistItems.length > 0 ? 'fill-brand-gold text-brand-gold drop-shadow-[0_0_8px_rgba(197,163,93,0.6)]' : ''}`} />
                {wishlistItems.length > 0 && (
                  <span ref={wishCountRef} className="absolute -top-1 -right-1 w-[15px] h-[15px] bg-brand-gold text-brand-onyx text-[8px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(197,163,93,0.6)] border border-white/20">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              <button
                ref={cartBtnRef}
                onClick={() => setCartOpen(true)}
                className={`nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all relative hover:bg-neutral-500/5 rounded-full`}
              >
                <ShoppingBag className={`w-[18px] h-[18px] transition-all duration-300 ${itemCount > 0 ? 'text-brand-gold drop-shadow-[0_0_8px_rgba(197,163,93,0.6)]' : ''}`} />
                {itemCount > 0 && (
                  <span ref={cartCountRef} className="absolute -top-1 -right-1 w-[15px] h-[15px] bg-brand-gold text-brand-onyx text-[8px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(197,163,93,0.6)] border border-white/20">
                    {itemCount > 99 ? '99' : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile (Desktop only) */}
            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`nav-icon flex items-center gap-2 p-0.5 pr-2 ${iconColorClass} hover:text-brand-gold transition-all rounded-full border border-transparent hover:border-white/10`}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name ?? 'User'} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-7 h-7 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-[9px] font-black border border-white/10">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-500 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-4 w-60 bg-brand-onyx/98 backdrop-blur-3xl border border-white/5 shadow-2xl py-2 z-50 animate-fadeInUp rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{user?.name}</p>
                      <p className="text-[8px] text-neutral-400 truncate mt-1">{user?.email}</p>
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
                        className="flex items-center gap-4 px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <item.icon className="w-3.5 h-3.5" /> {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-rose-500 hover:bg-rose-500/5 transition-colors border-t border-white/5 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`hidden lg:flex nav-icon p-2 ${iconColorClass} hover:text-brand-gold transition-all hover:bg-white/5 rounded-full`}
              >
                <User className="w-4.5 h-4.5" />
              </Link>
            )}

            {/* Profile Placeholder for Mobile (To balance the Menu icon on left) */}
            <div className="lg:hidden w-10" />
          </div>
        </div>
      </nav>

      {/* Apple Dynamic Island Toast */}
      <div 
        className="fixed top-[100px] left-0 right-0 z-[150] flex justify-center pointer-events-none"
      >
        <div 
          ref={messageRef}
          style={{ opacity: 0, transform: 'translateY(-30px)' }}
        >
          {navMessage && (
            <div className="px-6 py-3 rounded-full bg-brand-onyx/95 backdrop-blur-2xl border border-white/10 text-white flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(197,163,93,0.15)] overflow-hidden">
              <div className="relative flex items-center justify-center w-5 h-5 bg-white/10 rounded-full">
                {navMessage.toLowerCase().includes('vault') || navMessage.toLowerCase().includes('cart') ? (
                  <ShoppingBag className="w-3 h-3 text-brand-gold" />
                ) : (
                  <Heart className="w-3 h-3 text-brand-gold" />
                )}
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest mt-0.5">{navMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* iOS-Style Floating Search Bar */}
      <div 
        ref={searchOverlayRef}
        className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[49] w-[90%] max-w-lg hidden flex-col items-center"
        style={{ opacity: 0, transform: 'translate(-50%, -20px)' }}
      >
        <div className={`w-full ${scrolled ? 'bg-brand-onyx/95 border-white/5' : 'bg-white/95 border-neutral-100'} backdrop-blur-3xl border shadow-2xl rounded-full p-2 flex items-center gap-3 animate-fadeInUp`}>
          <div className="pl-4">
            <Search className={`w-4 h-4 ${scrolled ? 'text-neutral-500' : 'text-neutral-400'}`} />
          </div>
          <form onSubmit={handleSearch} className="flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Shoukhinabesh..."
              className={`w-full bg-transparent text-[10px] font-black uppercase tracking-widest py-3 focus:outline-none ${scrolled ? 'text-white placeholder:text-neutral-600' : 'text-brand-onyx placeholder:text-neutral-300'}`}
              id="search-input"
            />
          </form>
          <button
            onClick={() => setSearchOpen(false)}
            className={`p-2 rounded-full hover:bg-neutral-500/10 transition-colors mr-1 ${scrolled ? 'text-white' : 'text-neutral-400'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Suggestions / Recent */}
        <div className={`mt-3 w-[90%] py-3 px-6 rounded-2xl backdrop-blur-3xl border shadow-xl flex flex-wrap justify-center gap-4 ${scrolled ? 'bg-brand-onyx/80 border-white/5' : 'bg-white/80 border-neutral-100'}`}>
          {['Solitaires', 'Recycled Gold', 'New Arrivals'].map((tag) => (
            <button 
              key={tag}
              onClick={() => { setSearchQuery(tag); }}
              className={`text-[8px] font-black uppercase tracking-widest transition-colors ${scrolled ? 'text-neutral-500 hover:text-brand-gold' : 'text-neutral-400 hover:text-brand-onyx'}`}
            >
              {tag}
            </button>
          ))}
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

                <button
                  onClick={() => { setMobileOpen(false); setWishlistOpen(true); }}
                  className="flex flex-col items-center gap-2 group relative"
                >
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-brand-onyx group-hover:text-white transition-all">
                    <Heart className={`w-5 h-5 ${wishlistItems.length > 0 ? 'fill-brand-gold text-brand-gold border-none' : ''}`} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Wishlist</span>
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-brand-gold text-brand-onyx text-[9px] font-black rounded-full flex items-center justify-center border-2 border-brand-cream">
                      {wishlistItems.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setMobileOpen(false); setCartOpen(true); }}
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
                </button>
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

      {/* GSAP Cart Drawer */}
      <div 
        ref={cartOverlayRef}
        className="fixed inset-0 z-[200] hidden"
      >
        <div 
          className="absolute inset-0 bg-brand-onyx/40 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        />
        <div className="cart-drawer absolute top-0 right-0 h-full w-full max-w-md bg-white flex flex-col shadow-2xl">
          <div className={`px-8 h-24 flex items-center justify-between border-b ${scrolled ? 'bg-brand-onyx text-white border-white/5' : 'bg-brand-cream text-brand-onyx border-neutral-100'}`}>
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-[0.3em]">Your Cart ({itemCount})</span>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-3 hover:rotate-90 transition-all duration-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="cart-item flex gap-5 group">
                  <div className="w-24 h-24 bg-neutral-50 rounded-xl overflow-hidden flex-none relative">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-onyx line-clamp-1">{item.product.name}</h4>
                      <p className="text-[11px] font-serif text-neutral-400 mt-1">৳ {item.product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-neutral-100 rounded-full px-2 py-1 gap-4">
                        <button 
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          className="text-neutral-400 hover:text-brand-onyx px-1"
                        >-</button>
                        <span className="text-[10px] font-black">{item.quantity}</span>
                        <button 
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="text-neutral-400 hover:text-brand-onyx px-1"
                        >+</button>
                      </div>
                      <button 
                        onClick={() => removeCartItem(item.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-neutral-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Your cart is empty</p>
                  <button 
                    onClick={() => { setCartOpen(false); navigate('/shop'); }}
                    className="mt-4 text-brand-gold font-serif italic text-lg hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-neutral-100 space-y-6 bg-neutral-50/50">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Subtotal</span>
              <span className="text-xl font-serif font-black text-brand-onyx">৳ {totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-[8px] text-neutral-400 text-center uppercase tracking-widest">
              Shipping & taxes calculated at checkout
            </p>
            <button
              disabled={items.length === 0}
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
              className="w-full bg-brand-onyx text-white py-6 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-onyx/90 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
            >
              Secure Checkout <Package className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* GSAP Wishlist Drawer */}
      <div 
        ref={wishlistOverlayRef}
        className="fixed inset-0 z-[200] hidden"
      >
        <div 
          className="absolute inset-0 bg-brand-onyx/40 backdrop-blur-sm"
          onClick={() => setWishlistOpen(false)}
        />
        <div className="wishlist-drawer absolute top-0 right-0 h-full w-full max-w-md bg-white flex flex-col shadow-2xl">
          <div className={`px-8 h-24 flex items-center justify-between border-b ${scrolled ? 'bg-brand-onyx text-white border-white/5' : 'bg-brand-cream text-brand-onyx border-neutral-100'}`}>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 fill-brand-gold text-brand-gold" />
              <span className="text-sm font-black uppercase tracking-[0.3em]">Wishlist ({wishlistItems.length})</span>
            </div>
            <button
              onClick={() => setWishlistOpen(false)}
              className="p-3 hover:rotate-90 transition-all duration-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8">
            {wishlistItems.length > 0 ? (
              wishlistItems.map((item: any) => (
                <div key={item.id} className="wishlist-item flex gap-5 group">
                  <div className="w-24 h-24 bg-neutral-50 rounded-xl overflow-hidden flex-none relative">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-onyx line-clamp-1">{item.product.name}</h4>
                      <p className="text-[11px] font-serif text-neutral-400 mt-1">৳ {item.product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <button 
                        onClick={async () => {
                          await addItem(item.product.id, 1);
                          await toggleWishlist(item.product.id);
                          setWishlistOpen(false);
                          setCartOpen(true);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest bg-brand-onyx text-white px-4 py-2 rounded-full hover:bg-brand-gold hover:text-brand-onyx transition-all flex items-center gap-2"
                      >
                        <ShoppingBag className="w-3 h-3" /> Move to Cart
                      </button>
                      <button 
                        onClick={() => toggleWishlist(item.product.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-neutral-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Your wishlist is empty</p>
                  <button 
                    onClick={() => { setWishlistOpen(false); navigate('/shop'); }}
                    className="mt-4 text-brand-gold font-serif italic text-lg hover:underline"
                  >
                    Discover Products
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-neutral-100 bg-neutral-50/50">
            <button
              onClick={() => { setWishlistOpen(false); navigate('/shop'); }}
              className="w-full border border-brand-onyx text-brand-onyx py-6 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-onyx hover:text-white transition-all group flex items-center justify-center gap-3"
            >
              Continue Shopping <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
