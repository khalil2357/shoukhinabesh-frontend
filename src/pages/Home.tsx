import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const Home = () => {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-[#fafafa]">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
           <h1 className="text-[25vw] font-serif font-black select-none leading-none">GOLD</h1>
        </div>
        
        <div className="container mx-auto px-6 text-center z-10">
          <span className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400 mb-8 block animate-fade-in">
            Timeless Elegance • Since 2026
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold leading-[0.85] mb-12 tracking-tighter">
            Rare Finds. <br />
            <span className="italic font-normal text-brand-gold">Pure Gold.</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <Link to="/shop" className="premium-btn min-w-[200px]">
              Explore Jewellery
            </Link>
            <Link to="/editorial" className="text-[10px] font-bold uppercase tracking-[0.3em] border-b border-brand-onyx pb-2 hover:opacity-60 transition-opacity">
              The Artisan Story
            </Link>
          </div>
        </div>
      </section>

      {/* Curation Section */}
      <section className="section-padding grid grid-cols-1 lg:grid-cols-2 gap-32 items-center bg-white">
        <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center hover:scale-105 transition-transform duration-1000" />
        </div>
        <div className="space-y-12">
          <h2 className="text-5xl md:text-6xl font-serif font-bold leading-tight tracking-tighter">
            Crafted for the <br /> extraordinary.
          </h2>
          <p className="text-lg text-neutral-500 leading-relaxed max-w-md font-light">
            Every piece in our collection is a testament to the master jeweler's art. 
            From ethically sourced diamonds to 24k recycled gold, we prioritize 
            sustainability without compromising on luxury.
          </p>
          <div className="grid grid-cols-2 gap-12 pt-8">
             <div className="space-y-2">
                <p className="text-2xl font-serif">100%</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Ethically Sourced</p>
             </div>
             <div className="space-y-2">
                <p className="text-2xl font-serif">Hand</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Finished in Milan</p>
             </div>
          </div>
          <Link to="/about" className="flex items-center gap-4 font-bold uppercase text-[10px] tracking-[0.3em] group pt-12">
            Our Craftsmanship <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="section-padding bg-brand-cream">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div className="max-w-xl">
             <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-4 block">New Arrivals</span>
             <h2 className="text-5xl font-serif font-bold tracking-tighter">The Solitaire Collection</h2>
          </div>
          <Link to="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-neutral-300 hover:border-brand-onyx transition-all">
            View All Pieces
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { name: 'Diamond Drop Earrings', price: '$2,400', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=2070&auto=format&fit=crop' },
            { name: 'Gold Link Bracelet', price: '$1,850', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1520a?q=80&w=2070&auto=format&fit=crop' },
            { name: 'Sapphire Pendant', price: '$3,200', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2070&auto=format&fit=crop' }
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[3/4] bg-white mb-8 overflow-hidden flex items-center justify-center p-12 relative">
                <img 
                  src={item.img} 
                  alt={item.name}
                  className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest">{item.name}</h3>
                <p className="text-sm font-serif text-brand-gold">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full Width Editorial */}
      <section className="h-[70vh] relative overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-fixed bg-center" />
         <div className="absolute inset-0 bg-brand-onyx/40" />
         <div className="z-10 text-center text-brand-cream space-y-8 px-6">
            <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter">Bespoke Creations</h2>
            <p className="text-sm uppercase tracking-[0.5em] font-light">Custom designs tailored to your unique story</p>
            <Button className="bg-brand-cream text-brand-onyx hover:bg-white border-none">Consult an Expert</Button>
         </div>
      </section>
    </div>
  );
};
