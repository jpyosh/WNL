import emailjs from '@emailjs/browser';
import { Order } from '../types';

// TODO: Replace these with your actual EmailJS credentials
const SERVICE_ID = 'service_pjnnbrn';
const TEMPLATE_ID = 'template_qjbdcsa';
const PUBLIC_KEY = '4sM01miPjitGHP0Sr';

export const sendOrderConfirmation = async (order: Order): Promise<void> => {
  try {
    // Format the items list into an HTML string for the email template
    const itemsSummary = order.items
      .map(item => `${item.name} x ${item.quantity} - ₱${item.price.toLocaleString()}`)
      .join('<br/>');

    const templateParams = {
      order_id: order.id,
      to_name: order.customerDetails.fullName,
      to_email: order.customerDetails.email,
      message_html: itemsSummary,
      total_amount: `₱${order.total.toLocaleString()}`,
      shipping_address: order.customerDetails.address,
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Order confirmation email sent successfully.');
  } catch (error) {
    // We log the error but do not throw it, ensuring the UI flow continues
    // even if the email fails to send.
    console.error('Failed to send order confirmation email:', error);
  }
};