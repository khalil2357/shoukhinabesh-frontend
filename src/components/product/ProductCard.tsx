import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: { name: string };
}

export const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="group space-y-4">
      <Link to={`/product/${product.slug}`} className="block aspect-[3/4] overflow-hidden bg-brand-stone/30 relative">
        <img 
          src={product.images[0] || 'https://via.placeholder.com/600x800'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
           <button className="w-full bg-brand-onyx text-brand-cream text-[10px] font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors">
             <ShoppingBag className="w-3 h-3" /> Quick Add
           </button>
        </div>
      </Link>
      
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
