import React, { useState, useEffect } from 'react';
import { ShoppingBag, Tag, ArrowRight, Recycle, Package, Search, Filter, Star, Heart, Plus, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingState, ErrorState } from '../components/Feedback';

interface MarketItem {
  id: string;
  type: string;
  quantity: string;
  price: number;
  seller: string;
  category: string;
  image: string;
}

export default function Marketplace() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showSellModal, setShowSellModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    quantity: '',
    price: '',
    category: 'Recyclables'
  });

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/market/all');
      if (!response.ok) throw new Error("Failed to fetch marketplace items.");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch market items:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/market/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          seller: "Harshith G."
        })
      });
      if (response.ok) {
        setShowSellModal(false);
        setFormData({ type: '', quantity: '', price: '', category: 'Recyclables' });
        fetchItems();
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.seller.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingBag className="text-blue-600" />
            Circular Marketplace
          </h1>
          <p className="text-slate-500 mt-1">Buy and sell recyclable materials to power the circular economy.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSellModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Sell Materials
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Categories
            </h3>
            <div className="space-y-2">
              {['All', 'Recyclables', 'Materials'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    activeCategory === cat 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Recycle size={60} />
            </div>
            <h3 className="font-bold mb-2">Impact Points</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Earn points by selling recyclables and use them for discounts on premium materials.
            </p>
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Star size={16} fill="currentColor" />
              <span>850 Points Available</span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <Search size={20} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search materials (e.g. Plastic, Metal)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
            />
          </div>

          {loading ? (
            <LoadingState message="Loading marketplace..." className="py-20" />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchItems} className="py-20" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-all"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.type} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600">{item.seller}</span>
                        <span className="text-xs font-bold text-slate-400">{item.quantity}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-4 line-clamp-1">{item.type}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                          <span className="text-lg font-bold text-slate-900">₹{item.price.toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => alert(`Purchase request sent for ${item.type}!`)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                        >
                          Buy Now
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && !error && filteredItems.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Package className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="font-bold text-slate-900">No items found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or category filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sell Modal */}
      <AnimatePresence>
        {showSellModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSellModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">List Material for Sale</h2>
                <button onClick={() => setShowSellModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSell} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Material Type</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. High-Density Polyethylene"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. 50kg"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input 
                      required
                      type="number" 
                      placeholder="e.g. 1500"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="Recyclables">Recyclables (Raw Waste)</option>
                    <option value="Materials">Processed Materials</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4"
                >
                  List Item
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
