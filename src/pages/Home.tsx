import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { categoriesService } from '../services/categories.service';
import { productsService } from '../services/products.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface Category { id: string; name: string; slug: string; imageUrl?: string | null; }
interface Product { id: string; name: string; slug: string; price: number; images: string[]; category?: { name: string } | null; }

const HERO_SLIDES = [
  {
    title: "Timeless Elegance",
    subtitle: "Liquid Gold Collection",
    desc: "Masterfully crafted pieces that celebrate the beauty of 24k recycled gold.",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop",
    link: "/shop?search=gold"
  },
  {
    title: "Brilliant Cuts",
    subtitle: "The Diamond Edit",
    desc: "Ethically sourced diamonds, cut to perfection by Milanese master artisans.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2000&auto=format&fit=crop",
    link: "/shop?categoryId=rings"
  },
  {
    title: "Modern Heritage",
    subtitle: "Bespoke Creations",
    desc: "Unique stories told through handcrafted jewelry, tailored exclusively for you.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000&auto=format&fit=crop",
    link: "/shop"
  }
];

const CATEGORY_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop',
  rings: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop',
  bracelets: 'https://images.unsplash.com/photo-1611591437281-460bfbe1520a?q=80&w=800&auto=format&fit=crop',
};

const FALLBACK_PRODUCTS: Product[] = [
  { id: '1', name: 'Diamond Drop Earrings', slug: 'diamond-drop-earrings', price: 2400, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800'], category: { name: 'Earrings' } },
  { id: '2', name: 'Gold Link Bracelet', slug: 'gold-link-bracelet', price: 1850, images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1520a?q=80&w=800'], category: { name: 'Bracelets' } },
  { id: '3', name: 'Sapphire Pendant', slug: 'sapphire-pendant', price: 3200, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800'], category: { name: 'Necklaces' } },
];

export const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loadingCats, setLoadingCats] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Reveal animations for sections
    const sections = gsap.utils.toArray('.reveal-section');
    sections.forEach((section: any) => {
      gsap.fromTo(section, 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Parallax background text
    gsap.to('.parallax-text', {
      scrollTrigger: {
        trigger: '.parallax-container',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      },
      x: -200,
      ease: 'none'
    });

    // Floating animation for craft image
    gsap.to('.floating-img', {
      y: 30,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, { scope: containerRef });

  useEffect(() => {
    categoriesService.getCategories()
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        setCategories(list.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));

    productsService.getProducts({ limit: 3, order: 'desc', sortBy: 'createdAt' })
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.data?.data ?? data?.data ?? data?.items ?? []);
        if (list.length > 0) setFeaturedProducts(list);
      })
      .catch(() => {});
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  useGSAP(() => {
    if (!sliderRef.current) return;
    
    const activeSlide = slidesRef.current[currentSlide];
    if (!activeSlide) return;

    // Slide transition
    gsap.fromTo(activeSlide.querySelector('.slide-bg'),
      { scale: 1.2 },
      { scale: 1, duration: 2, ease: 'power2.out' }
    );

    gsap.fromTo(activeSlide.querySelectorAll('.slide-content > *'),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
    );
  }, [currentSlide]);

  const getCatImage = (cat: Category) => {
    if (cat.imageUrl) return cat.imageUrl;
    const key = cat.name.toLowerCase();
    return CATEGORY_IMAGES[key] || CATEGORY_IMAGES.default;
  };

  return (
    <div ref={containerRef} className="overflow-x-hidden">
      {/* Hero Slider */}
      <section className="relative h-screen w-full overflow-hidden bg-brand-onyx" ref={sliderRef}>
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { slidesRef.current[i] = el; }}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div 
              className="slide-bg absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-brand-onyx/40" />
            </div>
            <div className="relative h-full container mx-auto px-6 md:px-12 flex flex-col justify-center slide-content">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.6em] text-brand-gold mb-4 block">
                {slide.subtitle}
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-serif font-bold text-brand-cream leading-[0.9] tracking-tighter mb-8 max-w-4xl">
                {slide.title.split(' ')[0]} <br />
                <span className="italic font-normal ml-[0.1em]">{slide.title.split(' ')[1]}</span>
              </h1>
              <p className="text-sm md:text-base text-neutral-300 max-w-md font-light leading-relaxed mb-10">
                {slide.desc}
              </p>
              <div className="flex items-center gap-8">
                <Link to={slide.link} className="premium-btn px-10 py-4 text-[11px] tracking-[0.3em] bg-brand-cream text-brand-onyx hover:bg-white transition-colors">
                  Explore Now
                </Link>
                <div className="hidden md:flex items-center gap-4 text-brand-cream text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-12 h-[1px] bg-brand-gold" />
                  Scroll to Discover
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <div className="absolute bottom-12 right-12 z-20 flex items-center gap-6">
          <button onClick={prevSlide} className="p-3 border border-brand-cream/20 text-brand-cream hover:bg-brand-cream hover:text-brand-onyx transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${currentSlide === i ? 'bg-brand-gold w-8' : 'bg-brand-cream/30'}`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className="p-3 border border-brand-cream/20 text-brand-cream hover:bg-brand-cream hover:text-brand-onyx transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="bg-brand-cream border-b border-neutral-200/40 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-8">
          {[
            { icon: Shield, title: 'Certified Gems', desc: 'GIA Authenticated stones' },
            { icon: Truck, title: 'Global Express', desc: 'Complimentary shipping' },
            { icon: RefreshCw, title: 'Care & Returns', desc: '30-day luxury guarantee' },
            { icon: Star, title: 'Milanese Craft', desc: 'Hand-finished perfection' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center group-hover:bg-brand-onyx group-hover:text-brand-cream transition-all duration-500">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">{title}</p>
                <p className="text-[9px] text-neutral-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parallax Section: The Essence */}
      <section className="parallax-container relative py-32 overflow-hidden bg-white">
        <div className="parallax-text absolute top-1/2 left-0 -translate-y-1/2 text-[25vw] font-serif font-black text-neutral-100/80 whitespace-nowrap pointer-events-none select-none uppercase">
          Shoukhinabesh Craft
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="reveal-section space-y-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold block">Master Artisans</span>
            <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter leading-[0.95]">
              Tradition Meets <br />
              <span className="italic font-normal">the Extraordinary.</span>
            </h2>
            <p className="text-sm md:text-base text-neutral-500 max-w-md font-light leading-relaxed">
              Every curve, every setting, and every reflection is born from decades of Milanese heritage. We don't just make jewelry; we craft legacies in 24k recycled gold.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] group">
              Discover Our Story <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          <div className="reveal-section relative">
            <div className="aspect-[4/5] overflow-hidden group rounded-sm shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1000&auto=format&fit=crop" 
                alt="Craftsmanship" 
                className="floating-img w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-brand-onyx p-8 text-brand-cream max-w-[200px] hidden md:block reveal-section">
              <p className="text-3xl font-serif font-bold mb-2">100%</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Ethically sourced conflict-free diamonds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories: The Grid */}
      <section className="py-32 bg-[#fafaf8] reveal-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="reveal-section">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-3 block">Curated Collections</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">Shop by Category</h2>
            </div>
            <Link to="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-neutral-300 hover:border-brand-onyx transition-all pb-1 whitespace-nowrap">Explore All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingCats ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)
            ) : categories.length > 0 ? (
              categories.map((cat, i) => (
                <Link 
                  key={cat.id} 
                  to={`/shop?categoryId=${cat.id}`} 
                  className={`reveal-section group relative aspect-[3/4] overflow-hidden bg-neutral-100 ${i % 2 !== 0 ? 'lg:translate-y-12' : ''}`}
                >
                  <img src={getCatImage(cat)} alt={cat.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-brand-onyx/20 group-hover:bg-brand-onyx/40 transition-colors duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <p className="text-brand-cream text-[10px] font-bold uppercase tracking-[0.4em] mb-2">{cat.name}</p>
                    <div className="h-[1px] w-0 group-hover:w-full bg-brand-gold transition-all duration-700" />
                  </div>
                </Link>
              ))
            ) : (
              (['Rings', 'Necklaces', 'Earrings', 'Bracelets'] as const).map((name, i) => (
                <Link 
                  key={name} 
                  to={`/shop?search=${name.toLowerCase()}`} 
                  className={`reveal-section group relative aspect-[3/4] overflow-hidden bg-neutral-100 ${i % 2 !== 0 ? 'lg:translate-y-12' : ''}`}
                >
                  <img src={CATEGORY_IMAGES[name.toLowerCase() as keyof typeof CATEGORY_IMAGES]} alt={name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-brand-onyx/20 group-hover:bg-brand-onyx/40 transition-colors duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <p className="text-brand-cream text-[10px] font-bold uppercase tracking-[0.4em] mb-2">{name}</p>
                    <div className="h-[1px] w-0 group-hover:w-full bg-brand-gold transition-all duration-700" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals: The Showcase */}
      <section className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-4 reveal-section">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-4 block">New Season</span>
              <h2 className="text-5xl font-serif font-bold tracking-tighter mb-8 leading-none">The Solitaire<br />Edit.</h2>
              <p className="text-sm text-neutral-500 font-light leading-relaxed mb-10">
                Introducing our most anticipated collection of the year. Minimalist settings designed to let the stones speak for themselves.
              </p>
              <Link to="/shop" className="premium-btn inline-block px-10 py-4 text-[10px]">View Full Collection</Link>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              {featuredProducts.slice(0, 2).map((product, i) => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.slug}`} 
                  className={`reveal-section group block ${i === 1 ? 'md:translate-y-24' : ''}`}
                >
                  <div className="aspect-[4/5] bg-neutral-50 overflow-hidden mb-6 relative">
                    <img 
                      src={product.images[0] || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'} 
                      alt={product.name} 
                      className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{product.category?.name}</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest group-hover:text-brand-gold transition-colors">{product.name}</h3>
                    <p className="text-base font-serif text-brand-gold">${Number(product.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA: Full Screen Immersive */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1588444837495-c6cfcb53ba8d?q=80&w=2000&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-brand-onyx/60 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 text-center space-y-10 px-6 reveal-section">
          <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold">Exclusively Yours</span>
          <h2 className="text-5xl md:text-8xl font-serif font-bold text-brand-cream tracking-tighter leading-none">
            A Journey of <br />
            <span className="italic font-normal">Pure Brilliance.</span>
          </h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link to="/register" className="premium-btn px-12 py-4 bg-brand-cream text-brand-onyx hover:bg-white transition-colors">
              Create an Account
            </Link>
            <Link to="/shop" className="text-brand-cream text-[10px] font-bold uppercase tracking-[0.4em] border-b border-brand-cream/30 hover:border-brand-gold pb-2 transition-all">
              Discover the Shop
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
