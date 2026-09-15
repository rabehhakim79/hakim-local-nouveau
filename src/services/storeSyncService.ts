import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Product, OnlineOrder, StoreSettings, Customer, SaleInvoice } from '../types/store';

// Collection references
const COL_PRODUCTS = 'products';
const COL_ORDERS = 'online_orders';
const COL_SETTINGS = 'store_settings';
const COL_CUSTOMERS = 'customers';
const COL_INVOICES = 'invoices';
const DOC_SETTINGS_ID = 'main_config';

/**
 * 1. Online Orders: Real-time synchronization
 */
export function subscribeToOrders(onUpdate: (orders: OnlineOrder[]) => void) {
  if (!isFirebaseConfigured) return () => {};
  const ordersRef = collection(db, COL_ORDERS);
  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders: OnlineOrder[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<OnlineOrder, 'id'>) });
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.warn('Firestore orders sync error:', err);
    }
  );
}

export async function saveOrderToFirestore(order: OnlineOrder): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COL_ORDERS, order.id);
    await setDoc(docRef, order, { merge: true });
  } catch (err) {
    console.error('Failed to save order to Firestore:', err);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OnlineOrder['status']
): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COL_ORDERS, orderId);
    await setDoc(docRef, { status }, { merge: true });
  } catch (err) {
    console.error('Failed to update order status in Firestore:', err);
  }
}

/**
 * 2. Products: Real-time synchronization
 */
export function subscribeToProducts(onUpdate: (products: Product[]) => void) {
  if (!isFirebaseConfigured) return () => {};
  const productsRef = collection(db, COL_PRODUCTS);
  return onSnapshot(
    productsRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        prods.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      onUpdate(prods);
    },
    (err) => {
      console.warn('Firestore products sync error:', err);
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COL_PRODUCTS, product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    console.error('Failed to save product in Firestore:', err);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, COL_PRODUCTS, productId));
  } catch (err) {
    console.error('Failed to delete product in Firestore:', err);
  }
}

export async function seedInitialProductsIfEmpty(initialProducts: Product[]): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const snap = await getDocs(collection(db, COL_PRODUCTS));
    if (snap.empty && initialProducts.length > 0) {
      const batch = writeBatch(db);
      initialProducts.forEach((p) => {
        const ref = doc(db, COL_PRODUCTS, p.id);
        batch.set(ref, p);
      });
      await batch.commit();
      console.log('Seeded initial products to Firestore');
    }
  } catch (err) {
    console.warn('Seed products check error:', err);
  }
}

/**
 * 3. Settings: Real-time synchronization
 */
export function subscribeToSettings(onUpdate: (settings: StoreSettings) => void) {
  if (!isFirebaseConfigured) return () => {};
  const docRef = doc(db, COL_SETTINGS, DOC_SETTINGS_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as StoreSettings);
      }
    },
    (err) => {
      console.warn('Firestore settings sync error:', err);
    }
  );
}

export async function saveSettingsToFirestore(settings: StoreSettings): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COL_SETTINGS, DOC_SETTINGS_ID);
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.error('Failed to save settings in Firestore:', err);
  }
}

/**
 * 4. Customers: Real-time synchronization
 */
export function subscribeToCustomers(onUpdate: (customers: Customer[]) => void) {
  if (!isFirebaseConfigured) return () => {};
  const custRef = collection(db, COL_CUSTOMERS);
  return onSnapshot(
    custRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Customer, 'id'>) });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore customers sync error:', err);
    }
  );
}

export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COL_CUSTOMERS, customer.id);
    await setDoc(docRef, customer, { merge: true });
  } catch (err) {
    console.error('Failed to save customer in Firestore:', err);
  }
}

/**
 * 5. Invoices: Real-time synchronization
 */
export function subscribeToInvoices(onUpdate: (invoices: SaleInvoice[]) => void) {
  if (!isFirebaseConfigured) return () => {};
  const invRef = collection(db, COL_INVOICES);
  return onSnapshot(
    invRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const list: SaleInvoice[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<SaleInvoice, 'id'>) });
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore invoices sync error:', err);
    }
  );
}

export async function saveInvoiceToFirestore(invoice: SaleInvoice): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COL_INVOICES, invoice.id);
    await setDoc(docRef, invoice, { merge: true });
  } catch (err) {
    console.error('Failed to save invoice in Firestore:', err);
  }
}
