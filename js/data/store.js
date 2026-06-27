/**
 * @file Capa de datos Ghost — localStorage + Firebase (cuando esté configurado)
 * @module data/store
 */

const STORAGE_KEY = 'ghost_admin_v1';

/** @typedef {{ id: string; name: string; slug: string; address: string; city: string; phone: string; instagram?: string; active: boolean; createdAt: string }} CoffeeShop */
/** @typedef {{ id: string; shopId: string; name: string; variety: string; region: string; price: number; weight: string; roast: string; notes: string[]; imageUrl: string; featured: boolean; active: boolean; createdAt: string }} RetailProduct */

/** @returns {string} */
function uid() {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** @returns {{ shops: CoffeeShop[]; products: RetailProduct[] }} */
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return seedData();
}

/** @param {{ shops: CoffeeShop[]; products: RetailProduct[] }} data */
function writeLocal(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @returns {{ shops: CoffeeShop[]; products: RetailProduct[] }} */
function seedData() {
  const shopId = 'ghost-jardin-plaza';
  const data = {
    shops: [
      {
        id: shopId,
        name: 'Ghost Specialty Coffee',
        slug: 'ghost-jardin-plaza',
        address: 'Centro Comercial Jardín Plaza, Cali',
        city: 'Cali',
        phone: '+57 302 515 9900',
        instagram: 'ghost_specialty_coffee',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ],
    products: [
      {
        id: 'prod-papayo',
        shopId,
        name: 'Ghost · Papayo',
        variety: 'Papayo',
        region: 'Huila',
        price: 45000,
        weight: '250 g',
        roast: 'Semi-lavado · 1.800 msnm',
        notes: ['Mango', 'Nuez', 'Dulce'],
        imageUrl: 'assets/images/products/bolsa-papayo.png',
        featured: true,
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-gesha',
        shopId,
        name: 'Ghost · Gesha',
        variety: 'Gesha',
        region: 'Nariño',
        price: 72000,
        weight: '250 g',
        roast: 'Tostión clara',
        notes: ['Floral', 'Bergamota'],
        imageUrl: 'assets/images/products/bolsa-papayo.png',
        featured: false,
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-bourbon',
        shopId,
        name: 'Ghost · Bourbon',
        variety: 'Bourbon',
        region: 'Cauca',
        price: 48000,
        weight: '250 g',
        roast: 'Tostión media-clara',
        notes: ['Caramelo', 'Cítrico'],
        imageUrl: 'assets/images/products/vaso-hot.png',
        featured: true,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  writeLocal(data);
  return data;
}

/** Firebase config desde window.VP_FIREBASE_CONFIG */
function firebaseConfig() {
  return globalThis.VP_FIREBASE_CONFIG ?? { enabled: false };
}

/**
 * @returns {Promise<boolean>}
 */
export async function isFirebaseReady() {
  const cfg = firebaseConfig();
  return Boolean(cfg.enabled && cfg.apiKey && cfg.projectId);
}

/**
 * @returns {Promise<CoffeeShop[]>}
 */
export async function listShops() {
  if (await isFirebaseReady()) {
    return listShopsFirebase();
  }
  return readLocal().shops.filter((s) => s.active);
}

/**
 * @returns {Promise<CoffeeShop[]>}
 */
export async function listAllShops() {
  if (await isFirebaseReady()) {
    return listAllShopsFirebase();
  }
  return readLocal().shops;
}

/**
 * @param {Omit<CoffeeShop, 'id' | 'createdAt'> & { id?: string }} shop
 */
export async function saveShop(shop) {
  if (await isFirebaseReady()) {
    return saveShopFirebase(shop);
  }
  const data = readLocal();
  const entry = {
    ...shop,
    id: shop.id ?? uid(),
    createdAt: shop.id ? (data.shops.find((s) => s.id === shop.id)?.createdAt ?? new Date().toISOString()) : new Date().toISOString(),
  };
  const idx = data.shops.findIndex((s) => s.id === entry.id);
  if (idx >= 0) data.shops[idx] = entry;
  else data.shops.push(entry);
  writeLocal(data);
  return entry;
}

/**
 * @param {string} id
 */
export async function deleteShop(id) {
  if (await isFirebaseReady()) {
    return deleteShopFirebase(id);
  }
  const data = readLocal();
  data.shops = data.shops.filter((s) => s.id !== id);
  data.products = data.products.filter((p) => p.shopId !== id);
  writeLocal(data);
}

/**
 * @param {string} [shopId]
 * @returns {Promise<RetailProduct[]>}
 */
export async function listProducts(shopId) {
  if (await isFirebaseReady()) {
    return listProductsFirebase(shopId);
  }
  const products = readLocal().products.filter((p) => p.active);
  return shopId ? products.filter((p) => p.shopId === shopId) : products;
}

/**
 * @returns {Promise<RetailProduct[]>}
 */
export async function listAllProducts() {
  if (await isFirebaseReady()) {
    return listAllProductsFirebase();
  }
  return readLocal().products;
}

/**
 * @param {Omit<RetailProduct, 'id' | 'createdAt'> & { id?: string }} product
 */
export async function saveProduct(product) {
  if (await isFirebaseReady()) {
    return saveProductFirebase(product);
  }
  const data = readLocal();
  const entry = {
    ...product,
    id: product.id ?? uid(),
    createdAt: product.id
      ? (data.products.find((p) => p.id === product.id)?.createdAt ?? new Date().toISOString())
      : new Date().toISOString(),
  };
  const idx = data.products.findIndex((p) => p.id === entry.id);
  if (idx >= 0) data.products[idx] = entry;
  else data.products.push(entry);
  writeLocal(data);
  return entry;
}

/**
 * @param {string} id
 */
export async function deleteProduct(id) {
  if (await isFirebaseReady()) {
    return deleteProductFirebase(id);
  }
  const data = readLocal();
  data.products = data.products.filter((p) => p.id !== id);
  writeLocal(data);
}

/** @returns {Promise<void>} */
export function resetToSeed() {
  writeLocal(seedData());
  return Promise.resolve();
}

/* —— Firebase stubs (activos cuando VP_FIREBASE_CONFIG.enabled) —— */

let _fb = null;

async function getFirestore() {
  if (_fb) return _fb;
  const cfg = firebaseConfig();
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
  const app = initializeApp({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId,
  });
  _fb = { db: getFirestore(app), collection, getDocs, doc, setDoc, deleteDoc, query, where };
  return _fb;
}

async function listShopsFirebase() {
  const { db, collection, getDocs, query, where } = await getFirestore();
  const snap = await getDocs(query(collection(db, 'coffeeShops'), where('active', '==', true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function listAllShopsFirebase() {
  const { db, collection, getDocs } = await getFirestore();
  const snap = await getDocs(collection(db, 'coffeeShops'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function saveShopFirebase(shop) {
  const { db, doc, setDoc } = await getFirestore();
  const id = shop.id ?? uid();
  await setDoc(doc(db, 'coffeeShops', id), { ...shop, id }, { merge: true });
  return { ...shop, id };
}

async function deleteShopFirebase(id) {
  const { db, doc, deleteDoc } = await getFirestore();
  await deleteDoc(doc(db, 'coffeeShops', id));
}

async function listProductsFirebase(shopId) {
  const { db, collection, getDocs, query, where } = await getFirestore();
  const constraints = [where('active', '==', true)];
  if (shopId) constraints.push(where('shopId', '==', shopId));
  const snap = await getDocs(query(collection(db, 'retailProducts'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function listAllProductsFirebase() {
  const { db, collection, getDocs } = await getFirestore();
  const snap = await getDocs(collection(db, 'retailProducts'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function saveProductFirebase(product) {
  const { db, doc, setDoc } = await getFirestore();
  const id = product.id ?? uid();
  await setDoc(doc(db, 'retailProducts', id), { ...product, id }, { merge: true });
  return { ...product, id };
}

async function deleteProductFirebase(id) {
  const { db, doc, deleteDoc } = await getFirestore();
  await deleteDoc(doc(db, 'retailProducts', id));
}
