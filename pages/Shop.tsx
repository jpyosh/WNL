import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { Product, CartItem, OrderForm } from '../types';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

interface ShopProps {
  onAdminClick: () => void;
}

const Shop: React.FC<ShopProps> = ({ onAdminClick }) => {
  // Application State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

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
      const order = await api.createOrder(formData, cart, cartTotal);
      setCurrentOrderId(order.id);
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
    await api.uploadReceipt(currentOrderId, file);
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
        
        <section id="inventory" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold tracking-tight">LIVE INVENTORY</h2>
            <div className="h-px bg-white/20 flex-grow ml-8"></div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart}
                  onClick={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-white/10 py-12 text-center text-gray-600 text-sm">
          <p>&copy; 2025 Watch and Learn. All rights reserved.</p>
          <p>09173005367 / 09613958412</p>
          <p>watchandlearn2025@gmail.com</p>

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
        orderId={currentOrderId}
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