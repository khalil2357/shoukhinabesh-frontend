import { ShoppingBag, User, Search, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-cream/80 backdrop-blur-md border-b border-brand-stone/50 h-16 flex items-center">
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <div className="flex-1 hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          <Link to="/shop" className="hover:text-brand-onyx transition-colors link-underline">The Shop</Link>
          <Link to="/about" className="hover:text-brand-onyx transition-colors link-underline">About</Link>
          <Link to="/editorial" className="hover:text-brand-onyx transition-colors link-underline">Editorial</Link>
        </div>

        <div className="flex-none">
          <Link to="/" className="text-2xl font-serif font-bold tracking-tighter hover:opacity-70 transition-opacity">
            SHOUKHINABESH
          </Link>
        </div>

        <div className="flex-1 flex justify-end items-center gap-6">
          <button className="p-2 text-neutral-600 hover:text-brand-onyx transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <Link to="/cart" className="p-2 text-neutral-600 hover:text-brand-onyx transition-colors relative">
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute top-0 right-0 text-[9px] font-bold">2</span>
          </Link>
          <Link to="/login" className="p-2 text-neutral-600 hover:text-brand-onyx transition-colors">
            <User className="w-4 h-4" />
          </Link>
          <button className="md:hidden p-2 text-neutral-600">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
