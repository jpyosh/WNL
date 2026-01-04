import { supabase } from '../lib/supabaseClient';
import { Product, Order, OrderForm, CartItem, OrderStatus } from '../types';

class WatchAndLearnService {
  // --- Product Management Methods ---

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data as Product[];
  }

  async uploadProductImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `prod_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return data as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(`Failed to update product: ${error.message}`);
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete product: ${error.message}`);
  }

  // --- Order Management Methods ---

  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_purchase,
          products (
            id,
            name,
            image_url,
            price
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: String(row.id),
      items: row.order_items.map((item: any) => ({
        id: item.products?.id,
        name: item.products?.name || 'Unknown Product',
        price: item.price_at_purchase,
        quantity: item.quantity,
        image_url: item.products?.image_url,
        description: '',
        stock_quantity: 0
      })), 
      total: row.total_amount,
      customerDetails: {
        fullName: row.customer_name,
        address: row.customer_address,
        contactNumber: row.contact_number,
        email: row.email,
        paymentMethod: row.payment_method,
      },
      status: row.status as OrderStatus,
      receiptUrl: row.payment_receipt_url || row.receipt_url,
      createdAt: row.created_at
    }));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    // 1. Update status
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw new Error(`Failed to update status: ${error.message}`);

    // 2. Inventory Logic: strictly strictly apply deduction only on completion
    if (status === 'completed') {
      await this._deductInventory(orderId);
    }
  }

  private async _deductInventory(orderId: string): Promise<void> {
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      console.error("Error fetching items for stock deduction:", itemsError);
      return; 
    }

    for (const item of orderItems) {
      const { data: productData } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (productData) {
        const newStock = Math.max(0, productData.stock_quantity - item.quantity);
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);
      }
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    // 1. Delete associated order items first (Foreign Key Constraint)
    const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

    if (itemsError) throw new Error(`Failed to delete order items: ${itemsError.message}`);

    // 2. Delete the order
    const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

    if (orderError) throw new Error(`Failed to delete order: ${orderError.message}`);
  }

  async createOrder(form: OrderForm, items: CartItem[], total: number): Promise<Order> {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_name: form.fullName,
        customer_address: form.address,
        contact_number: form.contactNumber,
        email: form.email,
        payment_method: form.paymentMethod,
        total_amount: total,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price_at_purchase: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw new Error(`Failed to add items: ${itemsError.message}`);

    return {
      id: String(orderData.id),
      items: items,
      total: orderData.total_amount,
      customerDetails: form,
      status: orderData.status as OrderStatus,
      createdAt: orderData.created_at,
      receiptUrl: orderData.payment_receipt_url
    };
  }

  async uploadReceipt(orderId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_receipt_url: publicUrl,
        status: 'paid'
      })
      .eq('id', orderId);

    if (updateError) throw new Error(`Failed to link receipt: ${updateError.message}`);

    return publicUrl;
  }
}

export const api = new WatchAndLearnService();