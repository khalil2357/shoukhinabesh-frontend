import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: { name: string };
}

export const ProductCard = ({ product }: { product: Product }) => {
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const [adding, setAdding] = useState(false);

  const handleQuickAdd = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setAdding(true);
    try {
      await addItem(product.id, 1);
    } catch (error) {
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group space-y-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-stone/30">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0] || 'https://via.placeholder.com/600x800'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </Link>
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={adding}
          className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500 w-[calc(100%-2rem)] bg-brand-onyx text-brand-cream text-[10px] font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-3 h-3" /> {adding ? 'Adding...' : 'Quick Add'}
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">{product.category.name}</span>
            <Link to={`/product/${product.slug}`} className="block">
              <h3 className="text-xs font-bold uppercase tracking-widest hover:text-brand-gold transition-colors">{product.name}</h3>
            </Link>
          </div>
          <p className="text-sm font-medium text-neutral-500">${product.price.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
