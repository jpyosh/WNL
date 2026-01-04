import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { Product, CartItem, OrderForm, Order } from '../types';
import { api } from '../services/api';
import { sendOrderConfirmation } from '../services/email';
import { Loader2, Watch } from 'lucide-react';

interface ShopProps {
  onAdminClick: () => void;
}

const CATEGORIES = [
  { label: 'All', value: 'All' },
  { label: 'Prospex', value: 'Prospex' },
  { label: 'Presage', value: 'Presage' },
  { label: 'GMT', value: 'GMT' },
  { label: 'Womens', value: 'Womens' },
  { label: 'Swiss & Luxury', value: 'Swiss & Luxury' },
  { label: 'Others', value: 'Others' }
];

const Shop: React.FC<ShopProps> = ({ onAdminClick }) => {
  // Application State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // Filter State
  const [selectedCategory, setSelectedCategory] = useState('All');

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Changed from storing just ID to storing full Order object to have details for email later
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Filter Logic
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const getCollectionTitle = () => {
    if (selectedCategory === 'All') return 'LIVE INVENTORY';
    return `${selectedCategory.toUpperCase()} COLLECTION`;
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Validation: Check if we have enough stock for a new item or increment
      const currentQtyInCart = existing ? existing.quantity : 0;
      if (currentQtyInCart + 1 > product.stock_quantity) {
        alert(`Sorry, you can't add more. Only ${product.stock_quantity} left in stock.`);
        return prev;
      }

      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        
        // Prevent going below 1
        if (newQty < 1) return item;

        // Prevent exceeding stock
        // Find the product source of truth to get max stock
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock_quantity) {
             alert(`Cannot exceed available stock of ${product.stock_quantity}`);
             return item;
        }

        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Checkout Logic
  const handleCheckoutSubmit = async (formData: OrderForm) => {
    setIsProcessingOrder(true);
    try {
      // 1. Create Order in Supabase
      const order = await api.createOrder(formData, cart, cartTotal);
      
      // MOVED: Email sending is now in handleReceiptUpload
      
      // 2. Update UI State
      setCurrentOrder(order);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      setCart([]); // Clear cart
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please check your network or try again.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    if (!currentOrder) return;
    
    // 1. Upload receipt to bucket
    await api.uploadReceipt(currentOrder.id, file);

    // 2. Send Confirmation Email (Now that we have order + receipt uploaded)
    // Note: The email service uses the order details we stored in state
    await sendOrderConfirmation(currentOrder);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Navbar 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        onAdminClick={onAdminClick}
      />

      <main>
        <Hero />
        
        {/* Sticky Category Bar */}
        <div className="sticky top-20 z-40 bg-black/95 backdrop-blur-md border-b border-white/10 py-4 overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center gap-2 md:justify-center min-w-max">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`
                            px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 border
                            ${selectedCategory === cat.value 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-gray-500 border-transparent hover:text-white hover:border-white/20'}
                        `}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
        
        <section id="inventory" className="py-16 px-6 md:px-12 max-w-7xl mx-auto min-h-[60vh]">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold tracking-tight">{getCollectionTitle()}</h2>
            <div className="h-px bg-white/20 flex-grow ml-8 hidden md:block"></div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
            </div>
          ) : (
            <>
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-fade-in-up" style={{animationFillMode: 'forwards'}}>
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Watch className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">NO WATCHES FOUND</h3>
                        <p className="text-gray-500 max-w-md">
                            There are currently no items available in the {selectedCategory === 'All' ? 'inventory' : `${selectedCategory} collection`}. 
                            Please check back later.
                        </p>
                        <button 
                            onClick={() => setSelectedCategory('All')}
                            className="mt-8 text-white border-b border-white pb-1 hover:opacity-70 transition-opacity text-sm uppercase tracking-widest"
                        >
                            View All Watches
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map(product => (
                        <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={addToCart}
                        onClick={(p) => setSelectedProduct(p)}
                        />
                    ))}
                    </div>
                )}
            </>
          )}
        </section>

        <footer className="border-t border-white/10 py-12 text-center text-gray-600 text-sm">
          <p>&copy; 2024 Watch and Learn. All rights reserved.</p>
        </footer>
      </main>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmit={handleCheckoutSubmit}
        isLoading={isProcessingOrder}
        total={cartTotal}
      />

      <ReceiptModal 
        isOpen={isReceiptOpen}
        orderId={currentOrder?.id || ''}
        onUpload={handleReceiptUpload}
        onClose={() => setIsReceiptOpen(false)}
      />

      <ProductDetailsModal 
        isOpen={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default Shop;