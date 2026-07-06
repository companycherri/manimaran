const API_BASE_URL = (import.meta.env.VITE_LARAVEL_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'laravel_api_token';

let cachedUser = null;

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(value) {
  if (value) {
    localStorage.setItem(TOKEN_KEY, value);
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const body = options.body;

  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  if (token()) {
    headers.set('Authorization', `Bearer ${token()}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload.message || Object.values(payload.errors || {})?.[0]?.[0] || 'Laravel API request failed';
    throw new Error(message);
  }

  return payload;
}

function withParams(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
          query.append(`${key}[${nestedKey}]`, nestedValue);
        }
      });
      return;
    }
    query.append(key, value);
  });

  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

function unwrap(payload) {
  return payload?.data ?? payload;
}

function collection(payload) {
  const data = unwrap(payload);
  return Array.isArray(data) ? data : data?.data || [];
}

function sortRecords(records, order) {
  if (!order) return records;

  const direction = order.startsWith('-') ? -1 : 1;
  const field = order.replace(/^-/, '');
  const normalizedField = field === 'created_date' ? 'created_at' : field === 'order' ? 'sort_order' : field;

  return [...records].sort((a, b) => {
    const aValue = a[field] ?? a[normalizedField] ?? '';
    const bValue = b[field] ?? b[normalizedField] ?? '';
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    return 0;
  });
}

function limitRecords(records, limit) {
  return limit ? records.slice(0, limit) : records;
}

function dateFields(record) {
  return {
    ...record,
    created_date: record.created_date || record.created_at,
    updated_date: record.updated_date || record.updated_at,
  };
}

function mapUser(user) {
  if (!user) return user;
  return {
    ...user,
    full_name: user.full_name || user.name,
  };
}

function normalizeVariantLabel(variant) {
  const label = String(variant.label || '').toLowerCase().replace(/\s+/g, '');
  const value = Number.parseFloat(variant.quantity_value);
  const unit = variant.quantity_unit || variant.unit || '';

  if (label) return label;
  if (!Number.isNaN(value) && unit) {
    if (unit === 'kg') return `${value}kg`;
    if (unit === 'l') return `${value}l`;
    return `${Number.isInteger(value) ? value : String(value).replace(/\.0+$/, '')}${unit}`;
  }
  return '';
}

function mapProduct(product) {
  const mapped = dateFields({
    ...product,
    category: product.category?.slug || product.category || product.category_name,
  });

  (product.variants || []).forEach((variant) => {
    const price = Number(variant.price);
    const label = normalizeVariantLabel(variant);
    if (label === '250g') mapped.price_250g = price;
    if (label === '500g') mapped.price_500g = price;
    if (label === '1kg' || label === '1000g') {
      mapped.price_1kg = price;
      mapped.price_per_kg = price;
    }
    if (label === '200ml') mapped.price_200ml = price;
    if (label === '500ml') mapped.price_500ml = price;
    if (label === '1000ml' || label === '1l') mapped.price_1000ml = price;
  });

  mapped.price = mapped.price || Number(product.variants?.[0]?.price || 0);

  return mapped;
}

function variant(label, unit, quantityValue, quantityUnit, price, sortOrder) {
  if (price === undefined || price === null || price === '') return null;
  return {
    label,
    unit,
    quantity_value: quantityValue,
    quantity_unit: quantityUnit,
    price: Number(price),
    stock_quantity: null,
    active: true,
    sort_order: sortOrder,
  };
}

function productPayload(data) {
  const configuredVariants = [
    variant('250g', 'g', 250, 'g', data.price_250g, 10),
    variant('500g', 'g', 500, 'g', data.price_500g, 20),
    variant('1kg', 'kg', 1, 'kg', data.price_per_kg ?? data.price_1kg, 30),
    variant('200ml', 'ml', 200, 'ml', data.price_200ml, 10),
    variant('500ml', 'ml', 500, 'ml', data.price_500ml, 20),
    variant('1000ml', 'ml', 1000, 'ml', data.price_1000ml, 30),
  ].filter(Boolean);

  const variants = configuredVariants.length > 0
    ? configuredVariants
    : [variant('Default', data.unit || 'piece', 1, data.unit || 'piece', data.price, 10)].filter(Boolean);

  return {
    category_id: data.category_id || null,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image_url: data.image_url || null,
    promo_video_url: data.promo_video_url || null,
    unit: data.unit || 'kg',
    status: data.status || 'active',
    in_stock: data.in_stock !== false,
    featured: Boolean(data.featured),
    featured_in_footer: Boolean(data.featured_in_footer),
    show_category_badge: data.show_category_badge !== false,
    display_order: Number(data.display_order || 0),
    signature_display_order: Number(data.signature_display_order || data.display_order || 0),
    ingredients: data.ingredients || null,
    keywords: data.keywords || null,
    variants,
  };
}

function mapCategory(category) {
  return dateFields({
    ...category,
    order: category.order ?? category.sort_order ?? 0,
  });
}

function categoryPayload(data) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image_url: data.image_url || null,
    sort_order: Number(data.order ?? data.sort_order ?? 0),
    active: data.active !== false,
  };
}

function mapCartItem(item) {
  return dateFields({
    ...item,
    product_name: item.product_name || item.product?.name,
    product_image: item.product_image || item.product?.image_url,
    unit_price: Number(item.unit_price || 0),
    unit: item.unit || item.variant?.unit,
    weight: item.weight || item.variant_label || item.variant?.label,
    variant_label: item.variant_label || item.variant?.label,
  });
}

async function resolveVariantId(data) {
  if (data.product_variant_id) return data.product_variant_id;
  if (!data.product_id) return undefined;

  const product = await products.get(data.product_id);
  const desired = String(data.weight || data.variant_label || '').toLowerCase().replace(/\s+/g, '');
  const byLabel = product.variants?.find((variant) => normalizeVariantLabel(variant) === desired);
  const byPrice = product.variants?.find((variant) => Number(variant.price) === Number(data.unit_price));
  return (byLabel || byPrice || product.variants?.[0])?.id;
}

function mapOrder(order) {
  return dateFields({
    ...order,
    total_amount: Number(order.total_amount || 0),
    subtotal: Number(order.subtotal || 0),
    items: (order.items || []).map((item) => ({
      ...item,
      unit_price: Number(item.unit_price || 0),
      line_total: Number(item.line_total || 0),
    })),
  });
}

function genericEntity(entityName) {
  return {
    async list(order, limit) {
      const records = collection(await request(`/entities/${entityName}`)).map(dateFields);
      return limitRecords(sortRecords(records, order), limit);
    },
    async filter(filters = {}, order, limit) {
      const records = collection(await request(withParams(`/entities/${entityName}`, { filter: filters }))).map(dateFields);
      return limitRecords(sortRecords(records, order), limit);
    },
    async get(id) {
      const records = await this.filter({ id });
      return records[0] || null;
    },
    async create(data) {
      return dateFields(unwrap(await request(`/entities/${entityName}`, {
        method: 'POST',
        body: JSON.stringify({ data }),
      })));
    },
    async update(id, data) {
      return dateFields(unwrap(await request(`/entities/${entityName}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      })));
    },
    async delete(id) {
      return request(`/entities/${entityName}/${id}`, { method: 'DELETE' });
    },
  };
}

const products = {
  async list(order, limit) {
    const records = collection(await request(cachedUser?.role === 'admin' ? '/admin/products?per_page=200' : '/products?per_page=200')).map(mapProduct);
    return limitRecords(sortRecords(records, order), limit);
  },
  async filter(filters = {}, order, limit) {
    if (filters.id) {
      return [await this.get(filters.id)];
    }

    const records = (await this.list(order)).filter((product) => {
      return Object.entries(filters).every(([key, value]) => product[key] == value);
    });

    return limitRecords(records, limit);
  },
  async get(id) {
    return mapProduct(unwrap(await request(cachedUser?.role === 'admin' ? `/admin/products/${id}` : `/products/id/${id}`)));
  },
  async create(data) {
    return mapProduct(unwrap(await request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productPayload(data)),
    })));
  },
  async update(id, data) {
    return mapProduct(unwrap(await request(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productPayload({ ...(await this.get(id)), ...data })),
    })));
  },
  async delete(id) {
    return request(`/admin/products/${id}`, { method: 'DELETE' });
  },
};

const categories = {
  async list(order, limit) {
    const records = collection(await request(cachedUser?.role === 'admin' ? '/admin/categories?per_page=200' : '/categories?per_page=200')).map(mapCategory);
    return limitRecords(sortRecords(records, order), limit);
  },
  async filter(filters = {}, order, limit) {
    const records = (await this.list(order)).filter((category) => {
      return Object.entries(filters).every(([key, value]) => category[key] == value);
    });
    return limitRecords(records, limit);
  },
  async create(data) {
    return mapCategory(unwrap(await request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryPayload(data)),
    })));
  },
  async update(id, data) {
    return mapCategory(unwrap(await request(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryPayload(data)),
    })));
  },
  async delete(id) {
    return request(`/admin/categories/${id}`, { method: 'DELETE' });
  },
};

const cartItems = {
  async list() {
    return collection(await request('/cart')).map(mapCartItem);
  },
  async filter() {
    return this.list();
  },
  async create(data) {
    const productVariantId = await resolveVariantId(data);
    const payload = unwrap(await request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        product_id: data.product_id,
        product_variant_id: productVariantId,
        quantity: data.quantity || 1,
      }),
    }));
    return mapCartItem(payload);
  },
  async update(id, data) {
    return mapCartItem(unwrap(await request(`/cart/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: data.quantity }),
    })));
  },
  async delete(id) {
    return request(`/cart/items/${id}`, { method: 'DELETE' });
  },
};

const orders = {
  async list(order, limit) {
    const isAdmin = cachedUser?.role === 'admin';
    const records = collection(await request(isAdmin ? '/admin/orders?per_page=200' : '/orders?per_page=200')).map(mapOrder);
    return limitRecords(sortRecords(records, order), limit);
  },
  async filter(filters = {}, order, limit) {
    if (filters.order_number) {
      const payload = await request(`/orders/track/${encodeURIComponent(filters.order_number)}`);
      return [mapOrder(unwrap(payload))];
    }

    const records = (await this.list(order)).filter((record) => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'created_by') return true;
        return record[key] == value;
      });
    });

    return limitRecords(records, limit);
  },
  async create(data) {
    const payload = await request('/orders/base44', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapOrder(unwrap(payload));
  },
  async update(id, data) {
    const payload = await request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: data.status }),
    });
    return mapOrder(unwrap(payload));
  },
};

const coupons = {
  async list(order, limit) {
    const records = collection(await request('/admin/coupons?per_page=200')).map(dateFields);
    return limitRecords(sortRecords(records, order), limit);
  },
  async create(data) {
    return dateFields(unwrap(await request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    })));
  },
  async update(id, data) {
    return dateFields(unwrap(await request(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })));
  },
  async delete(id) {
    return request(`/admin/coupons/${id}`, { method: 'DELETE' });
  },
};

const users = {
  async me() {
    return auth.me();
  },
  async list(order, limit) {
    const records = collection(await request('/admin/users?per_page=200')).map(mapUser);
    return limitRecords(sortRecords(records, order), limit);
  },
};

const entityOverrides = {
  Product: products,
  Category: categories,
  CartItem: cartItems,
  Order: orders,
  Coupon: coupons,
  User: users,
};

export function createEntity(name) {
  return entityOverrides[name] || genericEntity(name);
}

const auth = {
  async me() {
    const payload = await request('/auth/me');
    cachedUser = mapUser(payload.user);
    return cachedUser;
  },
  async isAuthenticated() {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },
  async updateMe(data) {
    const payload = await request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    cachedUser = mapUser(payload.user);
    return cachedUser;
  },
  async login(credentials, admin = false) {
    const payload = await request(admin ? '/auth/admin/login' : '/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    storeToken(payload.token);
    cachedUser = mapUser(payload.user);
    return cachedUser;
  },
  async logout(returnTo) {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout failures so local auth state is still cleared.
    }
    localStorage.removeItem(TOKEN_KEY);
    cachedUser = null;
    if (returnTo) window.location.href = returnTo;
  },
  redirectToLogin(returnTo) {
    const target = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : '';
    window.location.href = `/login${target}`;
  },
};

const functionRoutes = {
  createRazorpayOrder: '/razorpay/standalone-orders',
  verifyRazorpayPayment: '/razorpay/standalone-verify',
  sendOrderConfirmation: '/functions/send-order-confirmation',
  sendNewsletterSubscriptionEmail: '/functions/send-newsletter-subscription-email',
  sendContactEmail: '/functions/send-contact-email',
};

const functions = {
  async invoke(name, data = {}) {
    const route = functionRoutes[name];
    if (!route) throw new Error(`Unknown Laravel function: ${name}`);
    const payload = await request(route, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: payload.data ?? payload };
  },
};

async function uploadFile({ file }) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/uploads', {
    method: 'POST',
    body: formData,
  });
}

export const laravel = {
  request,
  auth,
  entities: new Proxy({}, {
    get: (_, name) => createEntity(name),
  }),
  functions,
  uploadFile,
};
