import { ProductCard } from '../components/product/ProductCard';

export const Shop = () => {
  const dummyProducts = [
    { id: '1', name: 'Velvet Lounge Chair', slug: 'velvet-lounge-chair', price: 1200, images: [], category: { name: 'Furniture' } },
    { id: '2', name: 'Ceramic Vase', slug: 'ceramic-vase', price: 150, images: [], category: { name: 'Decor' } },
    { id: '3', name: 'Linen Bedding Set', slug: 'linen-bedding-set', price: 450, images: [], category: { name: 'Living' } },
    { id: '4', name: 'Minimalist Clock', slug: 'minimalist-clock', price: 200, images: [], category: { name: 'Accessories' } },
  ];

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
      <header className="mb-24 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4 block">The Collection</span>
        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter">Curated Objects</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 mb-16">
        <div className="w-full lg:w-64 space-y-12">
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><button className="hover:text-brand-gold transition-colors">All Pieces</button></li>
              <li><button className="text-neutral-400 hover:text-brand-onyx transition-colors">Furniture</button></li>
              <li><button className="text-neutral-400 hover:text-brand-onyx transition-colors">Decor</button></li>
              <li><button className="text-neutral-400 hover:text-brand-onyx transition-colors">Lighting</button></li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">Sort By</h4>
            <ul className="space-y-3 text-sm">
              <li><button className="hover:text-brand-gold transition-colors">Latest</button></li>
              <li><button className="text-neutral-400 hover:text-brand-onyx transition-colors">Price: Low to High</button></li>
              <li><button className="text-neutral-400 hover:text-brand-onyx transition-colors">Price: High to Low</button></li>
            </ul>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {dummyProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
