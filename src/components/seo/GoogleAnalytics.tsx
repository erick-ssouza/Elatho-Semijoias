import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 Configuration
// Set the GA_MEASUREMENT_ID in .env as VITE_GA_MEASUREMENT_ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Initialize GA4
export function initGA() {
  if (!GA_MEASUREMENT_ID) {
    console.log('[GA4] No measurement ID configured. Set VITE_GA_MEASUREMENT_ID in .env');
    return;
  }

  // Check if script already exists
  if (document.getElementById('ga-script')) return;

  // Add gtag.js script
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send page views manually for SPA
  });
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

// Track custom events
export function trackEvent(
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;
  
  window.gtag('event', eventName, params);
}

// E-commerce: Track product view
export function trackProductView(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  trackEvent('view_item', {
    currency: 'BRL',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
    }],
  });
}

// E-commerce: Track add to cart
export function trackAddToCart(product: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}) {
  trackEvent('add_to_cart', {
    currency: 'BRL',
    value: product.price * product.quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category || '',
      price: product.price,
      quantity: product.quantity,
    }],
  });
}

// E-commerce: Track begin checkout
export function trackBeginCheckout(items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
}>, total: number) {
  trackEvent('begin_checkout', {
    currency: 'BRL',
    value: total,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

// E-commerce: Track purchase
export function trackPurchase(
  transactionId: string,
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>,
  total: number,
  shipping?: number
) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency: 'BRL',
    value: total,
    shipping: shipping || 0,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

// Hook for automatic page view tracking
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
}

// Provider component to initialize GA4 and track page views
export function GoogleAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Initialize GA4 on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    // Small delay to ensure page title is updated
    const timeout = setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 100);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.search]);

  return <>{children}</>;
}
