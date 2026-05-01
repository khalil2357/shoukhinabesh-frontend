import { useState } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';

export const VendorDashboard = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    images: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });
      setMessage('Jewellery added successfully!');
      setFormData({ name: '', description: '', price: '', stock: '', categoryId: '', images: [] });
    } catch (err) {
      setMessage('Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 container mx-auto">
      <h1 className="text-4xl font-serif font-bold mb-12">Vendor Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 bg-white p-10 border border-neutral-100 space-y-8">
          <h2 className="text-xl font-bold uppercase tracking-widest">Add New Jewellery Piece</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 border-b border-neutral-200 pb-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Piece Name</label>
              <input 
                type="text" required
                className="w-full bg-transparent text-sm focus:outline-none"
                placeholder="E.G. DIAMOND SOLITAIRE RING"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2 border-b border-neutral-200 pb-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Description</label>
              <textarea 
                className="w-full bg-transparent text-sm focus:outline-none h-24"
                placeholder="DESCRIBE THE CRAFTSMANSHIP..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2 border-b border-neutral-200 pb-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Price (USD)</label>
                <input 
                  type="number" required
                  className="w-full bg-transparent text-sm focus:outline-none"
                  placeholder="2500"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2 border-b border-neutral-200 pb-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Stock</label>
                <input 
                  type="number" required
                  className="w-full bg-transparent text-sm focus:outline-none"
                  placeholder="5"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'List Jewellery Piece'}
            </Button>
            {message && <p className="text-center text-xs font-bold uppercase tracking-widest text-brand-gold">{message}</p>}
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-brand-onyx text-brand-cream p-10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Vendor Info</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your pieces will be reviewed by our curators before appearing in the main collection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
