/**
 * Market at Home — API Client & Local State Engine
 * Handles asynchronous communication with backend endpoints with automated local persistence.
 */

const API = {
    baseUrl: 'api',
    _initialized: false,
    _isSyncing: false,
    _lastSyncTime: 0,
    _bc: null,

    CLOUD_CONFIG: {
        apiUrl: 'https://api.restful-api.dev/objects',
        productsDocId: 'ff808181a09d98f701a0ab636f501f98',
        usersDocId: 'ff808181a09d98f701a0ab6371151f99',
        requestsDocId: 'ff808181a09d98f701a0ab6372a41f9a',
        ordersDocId: 'ff808181a09d98f701a0ab63743b1f9b'
    },

    // ==========================================
    // INITIALIZATION & PERSISTENCE
    // ==========================================
    initLocalData() {
        if (!this._initialized) {
            try {
                const isMockUser = (user) => {
                    if (!user) return false;
                    const idStr = String(user.id || '');
                    if (['101', '102', '103', '104', '201', '202', '203', '204'].includes(idStr) || idStr.startsWith('mock-')) return true;
                    return false;
                };

                const s = localStorage.getItem('globalbiz_sellers_store') || localStorage.getItem('mah_sellers_db');
                if (s) {
                    try {
                        const parsedS = JSON.parse(s);
                        if (Array.isArray(parsedS)) this.fallbackSellers = parsedS.filter(x => !isMockUser(x));
                        else this.fallbackSellers = [];
                    } catch (e) { this.fallbackSellers = []; }
                } else {
                    this.fallbackSellers = [];
                }
                localStorage.setItem('globalbiz_sellers_store', JSON.stringify(this.fallbackSellers));
                localStorage.setItem('mah_sellers_db', JSON.stringify(this.fallbackSellers));

                const b = localStorage.getItem('globalbiz_buyers_store') || localStorage.getItem('mah_buyers_db');
                if (b) {
                    try {
                        const parsedB = JSON.parse(b);
                        if (Array.isArray(parsedB)) this.fallbackBuyers = parsedB.filter(x => !isMockUser(x));
                        else this.fallbackBuyers = [];
                    } catch (e) { this.fallbackBuyers = []; }
                } else {
                    this.fallbackBuyers = [];
                }
                localStorage.setItem('globalbiz_buyers_store', JSON.stringify(this.fallbackBuyers));
                localStorage.setItem('mah_buyers_db', JSON.stringify(this.fallbackBuyers));

                const isMockProduct = (prod) => {
                    if (!prod) return false;
                    const idStr = String(prod.id || '');
                    if (['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008'].includes(idStr) || idStr.startsWith('mock-')) return true;
                    return false;
                };

                const p = localStorage.getItem('globalbiz_products_store') || localStorage.getItem('mah_products_db');
                if (p) {
                    try {
                        const parsed = JSON.parse(p);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Normalize stored goods and remove any mock items
                            const cleanStored = parsed
                                .filter(item => !isMockProduct(item))
                                .map(prod => ({
                                    ...prod,
                                    id: prod.id || ('prod-' + Date.now()),
                                    title: prod.title || prod.name || 'Untitled Good',
                                    name: prod.name || prod.title || 'Untitled Good',
                                    price: parseFloat(prod.price) || 0,
                                    photo: prod.photo || prod.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600',
                                    photo_url: prod.photo_url || prod.photo || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600',
                                    phone: prod.phone || prod.seller_phone || '',
                                    seller_phone: prod.seller_phone || prod.phone || '',
                                    seller_name: prod.seller_name || 'Verified Seller',
                                    seller_id: prod.seller_id || ('seller-' + (prod.id || Date.now())),
                                    location: prod.location || (prod.city ? `${prod.city}, ${prod.country || 'Nigeria'}` : 'Abuja, Nigeria'),
                                    country: prod.country || 'Nigeria',
                                    state: prod.state || prod.city || 'Abuja (FCT)',
                                    city: prod.city || prod.location || 'Abuja',
                                    status: prod.status || 'approved',
                                    published_by_seller: true,
                                    business_verified: prod.business_verified !== undefined ? prod.business_verified : 1,
                                    available_qty: parseInt(prod.available_qty) || 50
                                }));

                            this.fallbackProducts = cleanStored;
                            localStorage.setItem('globalbiz_products_store', JSON.stringify(this.fallbackProducts));
                            localStorage.setItem('mah_products_db', JSON.stringify(this.fallbackProducts));
                        } else {
                            this.fallbackProducts = [];
                            localStorage.setItem('globalbiz_products_store', JSON.stringify([]));
                            localStorage.setItem('mah_products_db', JSON.stringify([]));
                        }
                    } catch(err) {
                        this.fallbackProducts = [];
                        localStorage.setItem('globalbiz_products_store', JSON.stringify([]));
                        localStorage.setItem('mah_products_db', JSON.stringify([]));
                    }
                } else {
                    this.fallbackProducts = [];
                    localStorage.setItem('globalbiz_products_store', JSON.stringify([]));
                    localStorage.setItem('mah_products_db', JSON.stringify([]));
                }

                const r = localStorage.getItem('globalbiz_requests_store');
                if (r) {
                    try { const parsedR = JSON.parse(r); if (Array.isArray(parsedR) && parsedR.length > 0) this.fallbackBuyingRequests = parsedR; } catch(e){}
                }
                localStorage.setItem('globalbiz_requests_store', JSON.stringify(this.fallbackBuyingRequests));

                const o = localStorage.getItem('globalbiz_orders_store');
                if (o) {
                    try { const parsedO = JSON.parse(o); if (Array.isArray(parsedO) && parsedO.length > 0) this.fallbackOrders = parsedO; } catch(e){}
                }
                localStorage.setItem('globalbiz_orders_store', JSON.stringify(this.fallbackOrders));

                const c = localStorage.getItem('globalbiz_complaints_store');
                if (c) {
                    try { const parsedC = JSON.parse(c); if (Array.isArray(parsedC) && parsedC.length > 0) this.fallbackComplaints = parsedC; } catch(e){}
                }
                localStorage.setItem('globalbiz_complaints_store', JSON.stringify(this.fallbackComplaints));

                const a = localStorage.getItem('globalbiz_announcements_store');
                if (a) {
                    try { const parsedA = JSON.parse(a); if (Array.isArray(parsedA) && parsedA.length > 0) this.fallbackAnnouncements = parsedA; } catch(e){}
                }
                localStorage.setItem('globalbiz_announcements_store', JSON.stringify(this.fallbackAnnouncements));

                const cat = localStorage.getItem('globalbiz_categories_store');
                if (cat) {
                    try { const parsedCat = JSON.parse(cat); if (Array.isArray(parsedCat) && parsedCat.length > 0) this.fallbackCategories = parsedCat; } catch(e){}
                }
                localStorage.setItem('globalbiz_categories_store', JSON.stringify(this.fallbackCategories));

                const set = localStorage.getItem('globalbiz_site_settings');
                if (set) {
                    try { const parsedSet = JSON.parse(set); if (parsedSet) this.siteSettings = parsedSet; } catch(e){}
                }
                localStorage.setItem('globalbiz_site_settings', JSON.stringify(this.siteSettings));

            } catch (e) {
                console.warn('Local storage sync notice', e);
            }
            this._initialized = true;
        }
    },

    // ==========================================
    // MULTI-TAB & REAL-TIME BROADCAST ENGINE
    // ==========================================
    broadcastChange(type, payload) {
        try {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('globalbiz:cloud-synced', {
                    detail: { type, payload, products: this.fallbackProducts, total: (this.fallbackProducts || []).length }
                }));
                if (window.BroadcastChannel) {
                    if (!this._bc) this._bc = new BroadcastChannel('globalbiz_marketplace_bus');
                    this._bc.postMessage({ type, payload, products: this.fallbackProducts, timestamp: Date.now() });
                }
            }
        } catch (e) {}
    },

    // ==========================================
    // CLOUD SYNCHRONIZATION ENGINE (GLOBAL MULTI-DEVICE)
    // ==========================================
    async pullFromCloud() {
        if (this._isSyncing) return this.fallbackProducts;
        this._isSyncing = true;
        this.initLocalData();
        let changed = false;

        const endpoints = [
            '/api/products',
            'https://globalbusiness-cyan.vercel.app/api/products'
        ];

        for (const ep of endpoints) {
            try {
                const res = await fetch(ep, { method: 'GET', cache: 'no-store' });
                if (res && res.ok) {
                    const json = await res.json().catch(() => null);
                    if (json && Array.isArray(json.data) && json.data.length > 0) {
                        this.fallbackProducts = json.data.map(p => ({
                            id: p.id,
                            title: p.title || p.name || 'Untitled Good',
                            name: p.name || p.title || 'Untitled Good',
                            price: parseFloat(p.price) || 0,
                            photo: p.photo_url || p.photo || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600',
                            photo_url: p.photo_url || p.photo || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600',
                            seller_name: p.seller_name || 'Verified Merchant',
                            seller_phone: p.seller_phone || p.phone || '',
                            phone: p.phone || p.seller_phone || '',
                            seller_id: p.seller_id,
                            country: p.country || 'Nigeria',
                            state: p.state || 'Abuja (FCT)',
                            city: p.city || 'Abuja',
                            location: p.location || `${p.city || 'Abuja'}, ${p.country || 'Nigeria'}`,
                            description: p.description || '',
                            status: p.status || 'approved',
                            business_verified: p.business_verified !== undefined ? p.business_verified : 1,
                            available_qty: parseInt(p.available_qty) || 50,
                            published_by_seller: true,
                            category: p.category_name || p.category || 'General',
                            category_name: p.category_name || p.category || 'General'
                        }));
                        this.saveLocalData('products', this.fallbackProducts);
                        changed = true;
                        break;
                    }
                }
            } catch (e) {}
        }

        // Secondary resilient fallback to Global Cloud Document Store
        if (!changed || !this.fallbackProducts || this.fallbackProducts.length === 0) {
            try {
                const restRes = await fetch(`${this.CLOUD_CONFIG.apiUrl}/${this.CLOUD_CONFIG.productsDocId}`, { cache: 'no-store' });
                if (restRes && restRes.ok) {
                    const doc = await restRes.json().catch(() => null);
                    if (doc && doc.data && Array.isArray(doc.data.products) && doc.data.products.length > 0) {
                        this.fallbackProducts = doc.data.products;
                        this.saveLocalData('products', this.fallbackProducts);
                        changed = true;
                    }
                }
            } catch (e) {}
        }

        // Pull users too
        const userEndpoints = [
            '/api/users',
            'https://globalbusiness-cyan.vercel.app/api/users'
        ];
        let usersFound = false;
        for (const ep of userEndpoints) {
            try {
                const res = await fetch(ep, { method: 'GET', cache: 'no-store' });
                if (res && res.ok) {
                    const json = await res.json().catch(() => null);
                    if (json && Array.isArray(json.data) && json.data.length > 0) {
                        const sellers = json.data.filter(u => u.role === 'seller');
                        const buyers = json.data.filter(u => u.role === 'buyer');
                        if (sellers.length > 0) {
                            this.fallbackSellers = sellers;
                            this.saveLocalData('sellers', this.fallbackSellers);
                        }
                        if (buyers.length > 0) {
                            this.fallbackBuyers = buyers;
                            this.saveLocalData('buyers', this.fallbackBuyers);
                        }
                        usersFound = true;
                        break;
                    }
                }
            } catch(e) {}
        }

        if (!usersFound) {
            try {
                const uRes = await fetch(`${this.CLOUD_CONFIG.apiUrl}/${this.CLOUD_CONFIG.usersDocId}`, { cache: 'no-store' });
                if (uRes && uRes.ok) {
                    const doc = await uRes.json().catch(() => null);
                    if (doc && doc.data) {
                        if (Array.isArray(doc.data.sellers) && doc.data.sellers.length > 0) {
                            this.fallbackSellers = doc.data.sellers;
                            this.saveLocalData('sellers', this.fallbackSellers);
                        }
                        if (Array.isArray(doc.data.buyers) && doc.data.buyers.length > 0) {
                            this.fallbackBuyers = doc.data.buyers;
                            this.saveLocalData('buyers', this.fallbackBuyers);
                        }
                    }
                }
            } catch (e) {}
        }

        this._isSyncing = false;
        this._lastSyncTime = Date.now();

        if (changed && typeof window !== 'undefined') {
            this.broadcastChange('pull_sync', this.fallbackProducts);
        }

        return this.fallbackProducts;
    },

    async pushProductsToCloud() {
        try {
            this.saveLocalData('products', this.fallbackProducts);
            this.broadcastChange('product_list_updated', this.fallbackProducts);

            fetch(`${this.CLOUD_CONFIG.apiUrl}/${this.CLOUD_CONFIG.productsDocId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'GlobalBusiness Products Store',
                    data: {
                        products: this.fallbackProducts,
                        updated_at: new Date().toISOString()
                    }
                })
            }).catch(() => {});
        } catch (e) {
            console.warn('Products push notice:', e);
        }
    },

    async pushUsersToCloud() {
        try {
            this.saveLocalData('sellers', this.fallbackSellers);
            this.saveLocalData('buyers', this.fallbackBuyers);
            this.broadcastChange('users_updated', { sellers: this.fallbackSellers, buyers: this.fallbackBuyers });

            fetch(`${this.CLOUD_CONFIG.apiUrl}/${this.CLOUD_CONFIG.usersDocId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'GlobalBusiness Users Store',
                    data: {
                        sellers: this.fallbackSellers,
                        buyers: this.fallbackBuyers,
                        updated_at: new Date().toISOString()
                    }
                })
            }).catch(() => {});
        } catch (e) {
            console.warn('Users push notice:', e);
        }
    },

    // ==========================================
    // UNIFIED USER AUTH & ROLE MANAGEMENT
    // ==========================================
    async getUsers(params = {}) {
        this.initLocalData();
        if (!this._lastSyncTime || (this.fallbackSellers.length === 0 && this.fallbackBuyers.length === 0) || Date.now() - this._lastSyncTime > 15000) {
            await this.pullFromCloud();
        }
        const sellers = (this.fallbackSellers || []).map(s => ({
            id: s.id,
            full_name: s.full_name,
            phone: s.phone,
            email: s.email,
            location: s.location || s.city || 'Nigeria',
            role: 'seller',
            store_name: s.store_name,
            verified: s.verified || 0,
            status: s.status || 'active',
            password: s.password || 'password123'
        }));
        const buyers = (this.fallbackBuyers || []).map(b => ({
            id: b.id,
            full_name: b.full_name,
            phone: b.phone,
            email: b.email,
            location: b.location || b.city || 'Nigeria',
            role: 'buyer',
            verified: b.verified || 1,
            status: b.status || 'active',
            password: b.password || 'password123'
        }));

        let users = [...sellers, ...buyers];
        if (params.role) {
            users = users.filter(u => u.role === params.role);
        }
        if (params.search) {
            const q = params.search.toLowerCase();
            users = users.filter(u => 
                (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                (u.phone && u.phone.includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.store_name && u.store_name.toLowerCase().includes(q))
            );
        }
        return users;
    },

    async registerUser(payload) {
        this.initLocalData();
        const isSeller = payload.role === 'seller';
        const userPass = payload.password || 'password123';
        if (isSeller) {
            const sellerRes = await this.registerSeller({
                full_name: payload.full_name,
                phone: payload.phone,
                email: payload.email,
                password: userPass,
                location: payload.location || payload.city || 'Abuja, Nigeria',
                store_name: payload.store_name || (payload.full_name + "'s Store"),
                verified: payload.verified || 0
            });
            const newUser = {
                ...sellerRes.data,
                role: 'seller',
                password: userPass
            };
            this.pushUsersToCloud();
            return newUser;
        } else {
            const buyerRes = await this.createBuyer({
                full_name: payload.full_name,
                phone: payload.phone,
                email: payload.email,
                password: userPass,
                location: payload.location || payload.city || 'Abuja, Nigeria'
            });
            const newUser = {
                ...buyerRes.data,
                role: 'buyer',
                password: userPass
            };
            this.pushUsersToCloud();
            return newUser;
        }
    },

    async toggleUserStatus(userId) {
        this.initLocalData();
        const s = this.fallbackSellers.find(x => x.id == userId);
        if (s) {
            s.status = s.status === 'suspended' ? 'active' : 'suspended';
            this.saveLocalData('sellers', this.fallbackSellers);
            return { status: 'success', user: s };
        }
        const b = this.fallbackBuyers.find(x => x.id == userId);
        if (b) {
            b.status = b.status === 'suspended' ? 'active' : 'suspended';
            this.saveLocalData('buyers', this.fallbackBuyers);
            return { status: 'success', user: b };
        }
        return { status: 'error', message: 'User not found' };
    },

    async deleteUser(userId) {
        this.initLocalData();
        this.fallbackSellers = this.fallbackSellers.filter(s => s.id != userId);
        this.fallbackBuyers = this.fallbackBuyers.filter(b => b.id != userId);
        this.saveLocalData('sellers', this.fallbackSellers);
        this.saveLocalData('buyers', this.fallbackBuyers);
        return { status: 'success', message: 'User removed successfully' };
    },

    saveLocalData(type, data) {
        try {
            if (type === 'sellers') localStorage.setItem('globalbiz_sellers_store', JSON.stringify(data));
            if (type === 'buyers') localStorage.setItem('globalbiz_buyers_store', JSON.stringify(data));
            if (type === 'products') localStorage.setItem('globalbiz_products_store', JSON.stringify(data));
            if (type === 'businesses') localStorage.setItem('globalbiz_biz_store', JSON.stringify(data));
            if (type === 'requests') localStorage.setItem('globalbiz_requests_store', JSON.stringify(data));
            if (type === 'orders') localStorage.setItem('globalbiz_orders_store', JSON.stringify(data));
            if (type === 'complaints') localStorage.setItem('globalbiz_complaints_store', JSON.stringify(data));
            if (type === 'announcements') localStorage.setItem('globalbiz_announcements_store', JSON.stringify(data));
            if (type === 'categories') localStorage.setItem('globalbiz_categories_store', JSON.stringify(data));
            if (type === 'settings') localStorage.setItem('globalbiz_site_settings', JSON.stringify(data));
        } catch (e) {}
    },

    // ==========================================
    // 1. CATEGORIES MANAGEMENT (CRUD)
    // ==========================================
    async getCategories() {
        this.initLocalData();
        return this.fallbackCategories;
    },

    async addCategory(payload) {
        this.initLocalData();
        const newCat = {
            id: Date.now(),
            name: payload.name,
            slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            icon: payload.icon || 'fa-tag',
            description: payload.description || ''
        };
        this.fallbackCategories.push(newCat);
        this.saveLocalData('categories', this.fallbackCategories);
        return { status: 'success', data: newCat, message: 'Category added successfully' };
    },

    async updateCategory(id, payload) {
        this.initLocalData();
        const idx = this.fallbackCategories.findIndex(c => c.id == id);
        if (idx !== -1) {
            this.fallbackCategories[idx] = { ...this.fallbackCategories[idx], ...payload };
            this.saveLocalData('categories', this.fallbackCategories);
            return { status: 'success', message: 'Category updated successfully' };
        }
        return { status: 'error', message: 'Category not found' };
    },

    async deleteCategory(id) {
        this.initLocalData();
        this.fallbackCategories = this.fallbackCategories.filter(c => c.id != id);
        this.saveLocalData('categories', this.fallbackCategories);
        return { status: 'success', message: 'Category removed successfully' };
    },

    // ==========================================
    // 2. PRODUCTS MANAGEMENT & MODERATION
    // ==========================================
    async getProducts(params = {}) {
        this.initLocalData();
        if (!this._lastSyncTime || !this.fallbackProducts || this.fallbackProducts.length === 0 || Date.now() - this._lastSyncTime > 4000) {
            await this.pullFromCloud();
        }
        return this.filterFallbackProducts(params);
    },

    async getProduct(id) {
        this.initLocalData();
        let prod = this.fallbackProducts.find(p => String(p.id) === String(id));
        if (!prod) {
            await this.pullFromCloud();
            prod = this.fallbackProducts.find(p => String(p.id) === String(id));
        }
        return prod;
    },

    async getProductById(id) {
        return this.getProduct(id);
    },

    async createProduct(payload) {
        this.initLocalData();
        const title = payload.title || payload.name || 'Untitled Good';
        const photo = payload.photo_url || payload.photo || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';
        const phone = payload.seller_phone || payload.phone || '';
        const city = payload.city || payload.location || 'Abuja';
        const country = payload.country || 'Nigeria';
        const location = payload.location || `${city}, ${country}`;
        const newProd = {
            id: payload.id || ('prod-' + Date.now()),
            title: title,
            name: title,
            price: parseFloat(payload.price) || 0,
            category_id: payload.category_id || 1,
            category_name: payload.category_name || payload.category || 'General',
            category: payload.category || payload.category_name || 'General',
            seller_name: payload.seller_name || 'Verified Seller',
            seller_phone: phone,
            phone: phone,
            whatsapp: phone.replace(/[^0-9+]/g, ''),
            seller_id: payload.seller_id || ('seller-' + Date.now()),
            published_by_seller: true,
            country: country,
            state: payload.state || payload.state_province || city || 'Abuja (FCT)',
            city: city,
            location: location,
            description: payload.description || '',
            photo_url: photo,
            photo: photo,
            delivery_info: payload.delivery_info || 'Local pickup & worldwide courier delivery available',
            views: 1,
            business_verified: payload.business_verified !== undefined ? payload.business_verified : 1,
            status: 'approved',
            available_qty: parseInt(payload.available_qty) || 50,
            created_at: new Date().toISOString().split('T')[0]
        };

        const existingIdx = this.fallbackProducts.findIndex(p => String(p.id) === String(newProd.id));
        if (existingIdx >= 0) {
            this.fallbackProducts[existingIdx] = newProd;
        } else {
            this.fallbackProducts.unshift(newProd);
        }
        this.saveLocalData('products', this.fallbackProducts);

        // Save directly to Neon PostgreSQL Cloud Database
        const postUrls = ['/api/products', 'https://globalbusiness-cyan.vercel.app/api/products'];
        for (const url of postUrls) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProd)
                });
                if (res && res.ok) break;
            } catch (err) {}
        }

        this.pushProductsToCloud();
        return { status: 'success', id: newProd.id, data: newProd, message: 'Good listed on marketplace successfully!' };
    },

    async updateProduct(id, payload) {
        this.initLocalData();
        const idx = this.fallbackProducts.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            const current = this.fallbackProducts[idx];
            const title = payload.title || payload.name || current.title || current.name;
            const photo = payload.photo || payload.photo_url || current.photo || current.photo_url;
            const phone = payload.phone || payload.seller_phone || current.phone || current.seller_phone;
            const city = payload.city || payload.location || current.city;
            const country = payload.country || current.country || 'Nigeria';
            const location = payload.location || (city ? `${city}, ${country}` : current.location);

            this.fallbackProducts[idx] = {
                ...current,
                ...payload,
                title: title,
                name: title,
                photo: photo,
                photo_url: photo,
                phone: phone,
                seller_phone: phone,
                city: city,
                country: country,
                location: location,
                updated_at: new Date().toISOString().split('T')[0]
            };
            this.saveLocalData('products', this.fallbackProducts);

            const postUrls = ['/api/products', 'https://globalbusiness-cyan.vercel.app/api/products'];
            for (const url of postUrls) {
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.fallbackProducts[idx])
                    });
                    if (res && res.ok) break;
                } catch (err) {}
            }

            this.pushProductsToCloud();
            return { status: 'success', data: this.fallbackProducts[idx], message: 'Product updated successfully!' };
        }
        return { status: 'error', message: 'Product not found' };
    },

    async deleteProduct(id) {
        this.initLocalData();
        this.fallbackProducts = this.fallbackProducts.filter(x => String(x.id) !== String(id));
        this.saveLocalData('products', this.fallbackProducts);

        const delUrls = [
            `/api/products?id=${encodeURIComponent(id)}`,
            `https://globalbusiness-cyan.vercel.app/api/products?id=${encodeURIComponent(id)}`
        ];
        for (const url of delUrls) {
            try {
                const res = await fetch(url, { method: 'DELETE' });
                if (res && res.ok) break;
            } catch (err) {}
        }

        this.pushProductsToCloud();
        return { status: 'success', message: 'Product removed successfully!' };
    },

    async setProductApprovalStatus(id, status) {
        this.initLocalData();
        const prod = this.fallbackProducts.find(p => String(p.id) === String(id));
        if (prod) {
            prod.status = status;
            this.saveLocalData('products', this.fallbackProducts);
            this.pushProductsToCloud();
            return { status: 'success', message: 'Product ' + (status === 'approved' ? 'approved' : 'rejected') };
        }
        return { status: 'error', message: 'Product not found' };
    },

    // ==========================================
    // 3. ORDERS MANAGEMENT (FULL 6-STAGE LIFECYCLE)
    // ==========================================
    async getOrders(params = {}) {
        this.initLocalData();
        let list = [...this.fallbackOrders];
        if (params.status && params.status !== 'all') {
            list = list.filter(o => o.status.toLowerCase() === params.status.toLowerCase());
        }
        if (params.q) {
            const q = params.q.toLowerCase();
            list = list.filter(o =>
                (o.order_number && o.order_number.toLowerCase().includes(q)) ||
                (o.buyer_name && o.buyer_name.toLowerCase().includes(q)) ||
                (o.buyer_phone && o.buyer_phone.includes(q)) ||
                (o.seller_name && o.seller_name.toLowerCase().includes(q)) ||
                (o.item_name && o.item_name.toLowerCase().includes(q))
            );
        }
        return list;
    },

    async getOrder(id) {
        this.initLocalData();
        return this.fallbackOrders.find(o => o.id == id || o.order_number === id);
    },

    async createOrder(payload) {
        this.initLocalData();
        const randCode = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        const newOrder = {
            id: Date.now(),
            order_number: randCode,
            buyer_id: payload.buyer_id || null,
            buyer_name: payload.buyer_name || 'Anonymous Customer',
            buyer_phone: payload.buyer_phone || '',
            buyer_email: payload.buyer_email || '',
            delivery_address: payload.delivery_address || 'Abuja, Nigeria',
            delivery_city: payload.delivery_city || payload.delivery_address || 'Abuja',
            delivery_country: payload.delivery_country || 'Nigeria',
            seller_id: payload.seller_id || null,
            seller_name: payload.seller_name || 'Marketplace Merchant',
            seller_phone: payload.seller_phone || '',
            items: payload.items || [],
            item_name: payload.items && payload.items.length ? payload.items.map(i => i.title).join(', ') : (payload.item_name || 'Marketplace Item'),
            quantity: payload.items ? payload.items.reduce((acc, i) => acc + (i.quantity || 1), 0) : (payload.quantity || 1),
            total_amount: parseFloat(payload.total_amount) || 0,
            currency: payload.currency || 'USD',
            status: 'Pending',
            payment_status: payload.payment_status || 'Paid (Escrow)',
            payment_method: payload.payment_method || 'Online Payment / Escrow Protection',
            notes: payload.notes || '',
            has_dispute: 0,
            dispute_reason: '',
            created_at: new Date().toISOString().split('T')[0],
            timeline: [
                { status: 'Pending', timestamp: new Date().toLocaleTimeString(), note: 'Order placed by buyer and awaiting merchant confirmation' }
            ]
        };

        this.fallbackOrders.unshift(newOrder);
        this.saveLocalData('orders', this.fallbackOrders);

        const buyer = this.fallbackBuyers.find(b => b.phone === payload.buyer_phone || b.full_name === payload.buyer_name);
        if (buyer) {
            buyer.orders_count = (buyer.orders_count || 0) + 1;
            this.saveLocalData('buyers', this.fallbackBuyers);
        }

        this.addNotification({
            user_phone: payload.buyer_phone,
            title: 'Order Confirmed: ' + newOrder.order_number,
            message: 'Your order for ' + newOrder.item_name + ' has been placed successfully. Track its live progress in My Orders.',
            type: 'order',
            target: 'buyer'
        });

        return { status: 'success', data: newOrder, order_number: newOrder.order_number, message: 'Order placed successfully!' };
    },

    async updateOrderStatus(orderId, newStatus, adminNote = '') {
        this.initLocalData();
        const order = this.fallbackOrders.find(o => o.id == orderId || o.order_number === orderId);
        if (order) {
            order.status = newStatus;
            if (!order.timeline) order.timeline = [];
            order.timeline.push({
                status: newStatus,
                timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
                note: adminNote || ('Status updated to ' + newStatus)
            });
            this.saveLocalData('orders', this.fallbackOrders);

            this.addNotification({
                user_phone: order.buyer_phone,
                title: 'Order Update (' + order.order_number + '): ' + newStatus,
                message: 'Your order is now "' + newStatus + '". ' + (adminNote ? 'Note: ' + adminNote : ''),
                type: 'order',
                target: 'buyer'
            });

            return { status: 'success', data: order, message: 'Order status updated to ' + newStatus };
        }
        return { status: 'error', message: 'Order not found' };
    },

    async cancelOrder(orderId, reason = 'Cancelled by customer') {
        return await this.updateOrderStatus(orderId, 'Cancelled', reason);
    },

    async getBuyerMarketplaceOrders(user) {
        this.initLocalData();
        if (!user) return [];
        const userPhone = (user.phone || '').replace(/[^0-9]/g, '');
        const userName = (user.full_name || '').toLowerCase().trim();

        return this.fallbackOrders.filter(o => {
            const oPhone = (o.buyer_phone || '').replace(/[^0-9]/g, '');
            const oName = (o.buyer_name || '').toLowerCase().trim();
            if (userPhone && oPhone && (userPhone === oPhone || oPhone.endsWith(userPhone) || userPhone.endsWith(oPhone))) return true;
            if (userName && oName && (userName === oName || oName.includes(userName) || userName.includes(oName))) return true;
            return false;
        });
    },

    // ==========================================
    // 4. SELLER MANAGEMENT & VERIFICATION PIPELINE
    // ==========================================
    async getSellers(params = {}) {
        this.initLocalData();
        let list = [...this.fallbackSellers];
        if (params.q) {
            const q = params.q.toLowerCase();
            list = list.filter(s =>
                (s.full_name && s.full_name.toLowerCase().includes(q)) ||
                (s.store_name && s.store_name.toLowerCase().includes(q)) ||
                (s.location && s.location.toLowerCase().includes(q)) ||
                (s.id_number && s.id_number.toLowerCase().includes(q)) ||
                (s.phone && s.phone.includes(q))
            );
        }
        if (params.verified !== undefined) {
            list = list.filter(s => s.verified == params.verified);
        }
        return list;
    },

    async registerSeller(payload) {
        this.initLocalData();
        const newSeller = {
            id: Date.now(),
            full_name: payload.full_name,
            email: payload.email || (payload.full_name.toLowerCase().replace(/\s+/g, '') + '@example.com'),
            id_number: payload.id_number || ('NIN-' + Math.floor(10000000000 + Math.random() * 90000000000)),
            phone: payload.phone,
            password: payload.password || 'password123',
            location: payload.location,
            city: payload.city || payload.location,
            country: payload.country || 'Nigeria',
            kin_name: payload.kin_name || 'Relative',
            kin_phone: payload.kin_phone || '+234 800 000 0000',
            store_name: payload.store_name || (payload.full_name + "'s Store"),
            category_name: payload.category_name || 'General Marketplace',
            verified: payload.verified !== undefined ? payload.verified : 0,
            status: 'active',
            verification_status: payload.verified ? 'Approved' : 'Pending Review',
            verification_notes: '',
            registered_at: new Date().toISOString().split('T')[0]
        };
        this.fallbackSellers.unshift(newSeller);
        this.saveLocalData('sellers', this.fallbackSellers);

        const postUrls = ['/api/users', 'https://globalbusiness-cyan.vercel.app/api/users'];
        for (const url of postUrls) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: 'seller-' + newSeller.id,
                        full_name: newSeller.full_name,
                        store_name: newSeller.store_name,
                        phone: newSeller.phone,
                        email: newSeller.email,
                        password: newSeller.password,
                        role: 'seller',
                        location: newSeller.location || newSeller.city,
                        country: newSeller.country,
                        verified: newSeller.verified
                    })
                });
                if (res && res.ok) break;
            } catch(e) {}
        }

        this.pushUsersToCloud();
        return { status: 'success', data: newSeller, message: 'Seller registered successfully!' };
    },

    async verifySeller(id, isVerified = 1, notes = '') {
        this.initLocalData();
        const seller = this.fallbackSellers.find(s => s.id == id);
        if (seller) {
            seller.verified = isVerified;
            seller.verification_status = isVerified === 1 ? 'Approved' : (isVerified === -1 ? 'Rejected' : 'Pending Review');
            seller.verification_notes = notes;
            this.saveLocalData('sellers', this.fallbackSellers);
            this.pushUsersToCloud();
            return { status: 'success', message: isVerified === 1 ? 'Seller verified with official badge!' : (isVerified === -1 ? 'Seller verification rejected' : 'Verification status updated') };
        }
        return { status: 'error', message: 'Seller not found' };
    },

    async updateSeller(id, payload) {
        this.initLocalData();
        const idx = this.fallbackSellers.findIndex(s => s.id == id);
        if (idx !== -1) {
            this.fallbackSellers[idx] = { ...this.fallbackSellers[idx], ...payload };
            this.saveLocalData('sellers', this.fallbackSellers);
            this.pushUsersToCloud();
            return { status: 'success', data: this.fallbackSellers[idx], message: 'Seller updated successfully' };
        }
        return { status: 'error', message: 'Seller not found' };
    },

    async deleteSeller(id) {
        this.initLocalData();
        this.fallbackSellers = this.fallbackSellers.filter(s => s.id != id);
        this.saveLocalData('sellers', this.fallbackSellers);
        this.pushUsersToCloud();
        return { status: 'success', message: 'Seller removed successfully' };
    },

    // ==========================================
    // 5. BUYER MANAGEMENT & PROFILES
    // ==========================================
    async getBuyers(params = {}) {
        this.initLocalData();
        let list = [...this.fallbackBuyers];
        if (params.q) {
            const q = params.q.toLowerCase();
            list = list.filter(b =>
                (b.full_name && b.full_name.toLowerCase().includes(q)) ||
                (b.location && b.location.toLowerCase().includes(q)) ||
                (b.email && b.email.toLowerCase().includes(q)) ||
                (b.phone && b.phone.includes(q))
            );
        }
        return list;
    },

    async createBuyer(payload) {
        this.initLocalData();
        const newBuyer = {
            id: Date.now(),
            full_name: payload.full_name,
            email: payload.email || (payload.full_name.toLowerCase().replace(/\s+/g, '') + '@buyer.com'),
            phone: payload.phone,
            password: payload.password || 'password123',
            location: payload.location || 'Abuja, Nigeria',
            city: payload.city || payload.location || 'Abuja',
            country: payload.country || 'Nigeria',
            delivery_address: payload.delivery_address || payload.location || 'Abuja, Nigeria',
            profile_pic: payload.profile_pic || '',
            orders_count: payload.orders_count || 0,
            status: 'active',
            verified: 1,
            registered_at: new Date().toISOString().split('T')[0]
        };
        this.fallbackBuyers.unshift(newBuyer);
        this.saveLocalData('buyers', this.fallbackBuyers);

        const postUrls = ['/api/users', 'https://globalbusiness-cyan.vercel.app/api/users'];
        for (const url of postUrls) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: 'buyer-' + newBuyer.id,
                        full_name: newBuyer.full_name,
                        phone: newBuyer.phone,
                        email: newBuyer.email,
                        password: newBuyer.password,
                        role: 'buyer',
                        location: newBuyer.location || newBuyer.city,
                        country: newBuyer.country,
                        verified: 1
                    })
                });
                if (res && res.ok) break;
            } catch(e) {}
        }

        this.pushUsersToCloud();
        return { status: 'success', data: newBuyer, message: 'Buyer registered successfully!' };
    },

    async updateBuyer(id, payload) {
        this.initLocalData();
        const idx = this.fallbackBuyers.findIndex(b => b.id == id);
        if (idx !== -1) {
            this.fallbackBuyers[idx] = { ...this.fallbackBuyers[idx], ...payload };
            this.saveLocalData('buyers', this.fallbackBuyers);
            this.pushUsersToCloud();
            return { status: 'success', data: this.fallbackBuyers[idx], message: 'Buyer updated successfully' };
        }
        return { status: 'error', message: 'Buyer not found' };
    },

    async deleteBuyer(id) {
        this.initLocalData();
        this.fallbackBuyers = this.fallbackBuyers.filter(b => b.id != id);
        this.saveLocalData('buyers', this.fallbackBuyers);
        this.pushUsersToCloud();
        return { status: 'success', message: 'Buyer removed successfully' };
    },

    async deleteUser(id) {
        this.initLocalData();
        this.fallbackUsers = (this.fallbackUsers || []).filter(u => u.id != id);
        this.fallbackBuyers = (this.fallbackBuyers || []).filter(b => b.id != id);
        this.fallbackSellers = (this.fallbackSellers || []).filter(s => s.id != id);
        this.saveLocalData('users', this.fallbackUsers);
        this.saveLocalData('buyers', this.fallbackBuyers);
        this.saveLocalData('sellers', this.fallbackSellers);
        return { status: 'success', message: 'Member deleted permanently' };
    },

    // ==========================================
    // 6. UNIFIED MEMBERS DIRECTORY & USER MANAGEMENT
    // ==========================================
    async getMembers(params = {}) {
        this.initLocalData();
        if (!this._lastSyncTime || (this.fallbackSellers.length === 0 && this.fallbackBuyers.length === 0) || Date.now() - this._lastSyncTime > 15000) {
            await this.pullFromCloud();
        }
        const sellersList = this.fallbackSellers.map(s => ({
            id: s.id,
            member_id: s.id_number || ('SELLER-' + s.id),
            full_name: s.full_name,
            email: s.email || 'seller@marketathome.com',
            phone: s.phone,
            role: 'Seller',
            store_name: s.store_name,
            location: s.location || s.city || 'Nigeria',
            city: s.city || s.location || 'Abuja',
            country: s.country || 'Nigeria',
            verified: s.verified !== undefined ? s.verified : 1,
            status: s.status || 'active',
            registered_at: s.registered_at || '2026-08-10',
            source_type: 'seller'
        }));

        const buyersList = this.fallbackBuyers.map(b => ({
            id: b.id,
            member_id: 'BUYER-' + b.id,
            full_name: b.full_name,
            email: b.email || 'buyer@marketathome.com',
            phone: b.phone,
            role: 'Buyer',
            store_name: 'Direct Customer',
            location: b.location || b.city || 'Nigeria',
            city: b.city || b.location || 'Abuja',
            country: b.country || 'Nigeria',
            verified: b.verified !== undefined ? b.verified : 1,
            status: b.status || 'active',
            registered_at: b.registered_at || '2026-08-12',
            source_type: 'buyer',
            orders_count: b.orders_count || 0
        }));

        let combined = [...sellersList, ...buyersList];

        if (params.role && params.role !== 'all') {
            combined = combined.filter(m => m.role.toLowerCase() === params.role.toLowerCase());
        }

        if (params.status && params.status !== 'all') {
            combined = combined.filter(m => (m.status || 'active').toLowerCase() === params.status.toLowerCase());
        }

        if (params.verified !== undefined) {
            combined = combined.filter(m => m.verified == params.verified);
        }

        if (params.q) {
            const q = params.q.toLowerCase().trim();
            combined = combined.filter(m =>
                (m.full_name && m.full_name.toLowerCase().includes(q)) ||
                (m.member_id && m.member_id.toLowerCase().includes(q)) ||
                (m.phone && m.phone.includes(q)) ||
                (m.email && m.email.toLowerCase().includes(q)) ||
                (m.location && m.location.toLowerCase().includes(q)) ||
                (m.store_name && m.store_name.toLowerCase().includes(q)) ||
                (m.role && m.role.toLowerCase().includes(q))
            );
        }

        return combined;
    },

    async updateMember(id, sourceType, payload) {
        if (sourceType === 'seller') {
            return await this.updateSeller(id, payload);
        } else {
            return await this.updateBuyer(id, payload);
        }
    },

    async toggleUserStatus(id, sourceType, newStatus) {
        return await this.updateMember(id, sourceType, { status: newStatus });
    },

    async deleteMember(id, sourceType) {
        if (sourceType === 'seller') {
            return await this.deleteSeller(id);
        } else {
            return await this.deleteBuyer(id);
        }
    },

    // ==========================================
    // 7. SOURCING MANAGEMENT (BUYING ASSISTANCE)
    // ==========================================
    async getBuyingRequests() {
        this.initLocalData();
        return this.fallbackBuyingRequests;
    },

    async submitBuyingAssistance(payload) {
        this.initLocalData();
        const newReq = {
            id: Date.now(),
            tracking_code: 'PBA-' + Math.floor(10000 + Math.random() * 90000),
            status: 'Sourcing Active',
            assigned_agent: 'Senior Sourcing Desk',
            requested_qty: payload.requested_qty || '1',
            supplier_info: payload.supplier_info || 'Searching verified suppliers...',
            created_at: new Date().toISOString().split('T')[0],
            ...payload
        };
        this.fallbackBuyingRequests.unshift(newReq);
        this.saveLocalData('requests', this.fallbackBuyingRequests);
        return {
            status: 'success',
            id: newReq.id,
            tracking_code: newReq.tracking_code,
            message: 'Buying assistance request submitted successfully!'
        };
    },

    async updateBuyingRequest(payload) {
        this.initLocalData();
        const req = this.fallbackBuyingRequests.find(x => x.id == payload.id);
        if (req) {
            if (payload.status) req.status = payload.status;
            if (payload.assigned_agent) req.assigned_agent = payload.assigned_agent;
            if (payload.supplier_info) req.supplier_info = payload.supplier_info;
            if (payload.notes) req.notes = payload.notes;
            this.saveLocalData('requests', this.fallbackBuyingRequests);
            return { status: 'success', data: req, message: 'Sourcing request updated successfully' };
        }
        return { status: 'error', message: 'Request not found' };
    },

    async getBuyerSourcingOrders(user) {
        const allRequests = await this.getBuyingRequests();
        if (!user) return [];
        const userPhoneClean = (user.phone || '').replace(/[^0-9]/g, '');
        const userNameClean = (user.full_name || '').toLowerCase().trim();

        return allRequests.filter(r => {
            const rPhoneClean = (r.customer_phone || '').replace(/[^0-9]/g, '');
            const rNameClean = (r.customer_name || '').toLowerCase().trim();
            if (userPhoneClean && rPhoneClean && (userPhoneClean === rPhoneClean || rPhoneClean.endsWith(userPhoneClean) || userPhoneClean.endsWith(rPhoneClean))) {
                return true;
            }
            if (userNameClean && rNameClean && (userNameClean === rNameClean || rNameClean.includes(userNameClean) || userNameClean.includes(rNameClean))) {
                return true;
            }
            return false;
        });
    },

    // ==========================================
    // 8. REPORTS & COMPLAINTS MANAGEMENT
    // ==========================================
    async getComplaints(params = {}) {
        this.initLocalData();
        let list = [...this.fallbackComplaints];
        if (params.type && params.type !== 'all') {
            list = list.filter(c => c.type === params.type);
        }
        if (params.status && params.status !== 'all') {
            list = list.filter(c => c.status === params.status);
        }
        if (params.q) {
            const q = params.q.toLowerCase();
            list = list.filter(c =>
                (c.subject && c.subject.toLowerCase().includes(q)) ||
                (c.reported_by && c.reported_by.toLowerCase().includes(q)) ||
                (c.target_entity && c.target_entity.toLowerCase().includes(q)) ||
                (c.details && c.details.toLowerCase().includes(q))
            );
        }
        return list;
    },

    async createComplaint(payload) {
        this.initLocalData();
        const newTicket = {
            id: Date.now(),
            ticket_number: 'TKT-' + Math.floor(1000 + Math.random() * 9000),
            type: payload.type || 'seller_issue',
            subject: payload.subject || 'Marketplace Issue Report',
            reported_by: payload.reported_by || 'Anonymous User',
            reporter_phone: payload.reporter_phone || '',
            reporter_role: payload.reporter_role || 'buyer',
            target_entity: payload.target_entity || 'General',
            target_id: payload.target_id || null,
            details: payload.details || '',
            status: 'Open',
            admin_notes: '',
            created_at: new Date().toISOString().split('T')[0]
        };
        this.fallbackComplaints.unshift(newTicket);
        this.saveLocalData('complaints', this.fallbackComplaints);
        return { status: 'success', data: newTicket, message: 'Report submitted. Our moderation desk will investigate.' };
    },

    async updateComplaintStatus(id, status, adminNotes = '') {
        this.initLocalData();
        const ticket = this.fallbackComplaints.find(c => c.id == id);
        if (ticket) {
            ticket.status = status;
            if (adminNotes) ticket.admin_notes = adminNotes;
            this.saveLocalData('complaints', this.fallbackComplaints);
            return { status: 'success', data: ticket, message: 'Report ticket status updated to ' + status };
        }
        return { status: 'error', message: 'Report not found' };
    },

    // ==========================================
    // 9. NOTIFICATIONS & BROADCAST ANNOUNCEMENTS
    // ==========================================
    async getAnnouncements() {
        this.initLocalData();
        return this.fallbackAnnouncements;
    },

    async createAnnouncement(payload) {
        this.initLocalData();
        const newAnn = {
            id: Date.now(),
            title: payload.title,
            message: payload.message,
            target: payload.target || 'all',
            target_user: payload.target_user || '',
            priority: payload.priority || 'normal',
            created_at: new Date().toISOString().split('T')[0],
            created_by: 'Administrator'
        };
        this.fallbackAnnouncements.unshift(newAnn);
        this.saveLocalData('announcements', this.fallbackAnnouncements);
        return { status: 'success', data: newAnn, message: 'Broadcast announcement sent live across marketplace!' };
    },

    async deleteAnnouncement(id) {
        this.initLocalData();
        this.fallbackAnnouncements = this.fallbackAnnouncements.filter(a => a.id != id);
        this.saveLocalData('announcements', this.fallbackAnnouncements);
        return { status: 'success', message: 'Announcement removed' };
    },

    addNotification(payload) {
        try {
            const raw = localStorage.getItem('globalbiz_user_notifications') || '[]';
            const list = JSON.parse(raw);
            const newNotif = {
                id: Date.now(),
                title: payload.title,
                message: payload.message,
                type: payload.type || 'info',
                target: payload.target || 'buyer',
                user_phone: payload.user_phone || '',
                read: false,
                created_at: new Date().toISOString()
            };
            list.unshift(newNotif);
            localStorage.setItem('globalbiz_user_notifications', JSON.stringify(list));
        } catch (e) {}
    },

    getUserNotifications(user) {
        try {
            const raw = localStorage.getItem('globalbiz_user_notifications') || '[]';
            let list = JSON.parse(raw);
            if (!user) return list.slice(0, 10);
            const phone = (user.phone || '').replace(/[^0-9]/g, '');
            return list.filter(n => !n.user_phone || !phone || n.user_phone.includes(phone) || phone.includes(n.user_phone) || n.target === 'all');
        } catch (e) {
            return [];
        }
    },

    // ==========================================
    // 10. SHOPPING CART & FAVORITES
    // ==========================================
    getCart() {
        try {
            const raw = localStorage.getItem('globalbiz_buyer_cart') || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    },

    saveCart(cart) {
        try {
            localStorage.setItem('globalbiz_buyer_cart', JSON.stringify(cart));
        } catch (e) {}
    },

    addToCart(product, qty = 1) {
        const cart = this.getCart();
        const existing = cart.find(item => item.id == product.id);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + qty;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: parseFloat(product.price) || 0,
                photo_url: product.photo_url,
                seller_name: product.seller_name,
                seller_phone: product.phone || product.seller_phone,
                location: product.city || product.location || 'Abuja',
                country: product.country || 'Nigeria',
                quantity: qty
            });
        }
        this.saveCart(cart);
        return cart;
    },

    updateCartQuantity(productId, newQty) {
        let cart = this.getCart();
        if (newQty <= 0) {
            cart = cart.filter(i => i.id != productId);
        } else {
            const item = cart.find(i => i.id == productId);
            if (item) item.quantity = newQty;
        }
        this.saveCart(cart);
        return cart;
    },

    removeFromCart(productId) {
        let cart = this.getCart();
        cart = cart.filter(i => i.id != productId);
        this.saveCart(cart);
        return cart;
    },

    clearCart() {
        this.saveCart([]);
    },

    getFavorites() {
        try {
            const raw = localStorage.getItem('globalbiz_buyer_favorites') || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    },

    toggleFavorite(productId) {
        let favs = this.getFavorites();
        const idx = favs.indexOf(productId);
        let added = false;
        if (idx > -1) {
            favs.splice(idx, 1);
        } else {
            favs.push(productId);
            added = true;
        }
        localStorage.setItem('globalbiz_buyer_favorites', JSON.stringify(favs));
        return { added, favorites: favs };
    },

    isFavorite(productId) {
        const favs = this.getFavorites();
        return favs.includes(productId);
    },

    // ==========================================
    // 11. REPORTS & ANALYTICS CALCULATION ENGINE
    // ==========================================
    async getAnalyticsSummary() {
        this.initLocalData();
        const totalRevenue = this.fallbackOrders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
        const sourcingRevenue = this.fallbackBuyingRequests.reduce((acc, r) => acc + (parseFloat(r.service_fee) || 60), 0);

        const ordersByStatus = {
            pending: this.fallbackOrders.filter(o => o.status === 'Pending').length,
            confirmed: this.fallbackOrders.filter(o => o.status === 'Confirmed').length,
            processing: this.fallbackOrders.filter(o => o.status === 'Processing').length,
            shipped: this.fallbackOrders.filter(o => o.status === 'Shipped').length,
            delivered: this.fallbackOrders.filter(o => o.status === 'Delivered').length,
            cancelled: this.fallbackOrders.filter(o => o.status === 'Cancelled').length
        };

        const pendingVerifications = this.fallbackSellers.filter(s => s.verified === 0 || s.verification_status === 'Pending Review').length;
        const openReports = this.fallbackComplaints.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length;

        return {
            total_users: this.fallbackSellers.length + this.fallbackBuyers.length,
            total_buyers: this.fallbackBuyers.length,
            total_sellers: this.fallbackSellers.length,
            total_products: this.fallbackProducts.length,
            total_orders: this.fallbackOrders.length,
            pending_orders: ordersByStatus.pending,
            completed_orders: ordersByStatus.delivered,
            cancelled_orders: ordersByStatus.cancelled,
            pending_verifications: pendingVerifications,
            sourcing_requests: this.fallbackBuyingRequests.length,
            open_reports: openReports,
            total_revenue: totalRevenue + sourcingRevenue,
            orders_by_status: ordersByStatus
        };
    },

    filterFallbackProducts(params = {}) {
        let results = [...this.fallbackProducts];
        const search = params.search || params.q || params.keyword || '';
        if (search) {
            const q = search.toLowerCase().trim();
            results = results.filter(p =>
                ((p.title || p.name) && (p.title || p.name).toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q)) ||
                (p.city && p.city.toLowerCase().includes(q)) ||
                (p.state && p.state.toLowerCase().includes(q)) ||
                (p.country && p.country.toLowerCase().includes(q)) ||
                (p.location && p.location.toLowerCase().includes(q)) ||
                (p.seller_name && p.seller_name.toLowerCase().includes(q)) ||
                (p.category_name && p.category_name.toLowerCase().includes(q))
            );
        }
        if (params.category_id) {
            results = results.filter(p => p.category_id == params.category_id);
        }
        if (params.category && params.category !== 'all') {
            const cat = params.category.toLowerCase().trim();
            results = results.filter(p => 
                (p.category_name && p.category_name.toLowerCase().includes(cat)) ||
                (p.category && p.category.toLowerCase().includes(cat)) ||
                (p.category_id && p.category_id == params.category)
            );
        }
        if (params.category_name && params.category_name !== 'all') {
            const cat = params.category_name.toLowerCase().trim();
            results = results.filter(p => 
                (p.category_name && p.category_name.toLowerCase().includes(cat)) ||
                (p.category && p.category.toLowerCase().includes(cat))
            );
        }
        if (params.country && params.country !== 'all' && params.country.trim() !== '') {
            const c = params.country.toLowerCase().trim();
            results = results.filter(p => p.country && (p.country.toLowerCase().includes(c) || c.includes(p.country.toLowerCase())));
        }
        if (params.state && params.state !== 'all' && params.state.trim() !== '') {
            const s = params.state.toLowerCase().trim();
            results = results.filter(p =>
                (p.state && (p.state.toLowerCase().includes(s) || s.includes(p.state.toLowerCase()))) ||
                (p.city && (p.city.toLowerCase().includes(s) || s.includes(p.city.toLowerCase()))) ||
                (p.location && (p.location.toLowerCase().includes(s) || s.includes(p.location.toLowerCase())))
            );
        }
        if (params.seller_id) {
            results = results.filter(p => p.seller_id == params.seller_id);
        }
        if (params.max_price) {
            results = results.filter(p => p.price <= parseFloat(params.max_price));
        }
        return results;
    },

    
    // ==========================================
    // 12. NATURAL LANGUAGE AI SEARCH PARSER
    // ==========================================
    parseNaturalLanguageQuery(query) {
        if (!query) return {};
        const q = query.toLowerCase().trim();
        const parsed = {
            raw: query,
            keyword: '',
            category_id: null,
            category_name: null,
            max_price: null,
            location: null,
            state: null,
            color: null,
            intent: null
        };

        // 1. Detect Maximum Budget / Price (e.g. "under 50000", "under ₦50,000", "below 30k", "under $50")
        const priceMatch = q.match(/(?:under|below|less than|max|budget(?: of)?|within)\s*(?:₦|\$|usd|ngn)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?k?)/i);
        if (priceMatch && priceMatch[1]) {
            let numStr = priceMatch[1].replace(/,/g, '');
            let val = 0;
            if (numStr.endsWith('k') || numStr.endsWith('K')) {
                val = parseFloat(numStr.slice(0, -1)) * 1000;
            } else {
                val = parseFloat(numStr);
            }
            
            // If the user typed in NGN (> 500), convert to approximate USD base ($1 = 1550 NGN)
            if (val > 500) {
                parsed.max_price = val / 1550.0;
            } else {
                parsed.max_price = val;
            }
        }

        // 2. Detect Locations
        const locations = ['abuja', 'kano', 'kaduna', 'lagos', 'port harcourt', 'dubai', 'london', 'guangzhou', 'texas', 'california', 'accra', 'nairobi', 'riyadh'];
        for (const loc of locations) {
            if (q.includes(loc)) {
                parsed.location = loc;
                parsed.state = loc;
                break;
            }
        }

        // 3. Detect Categories
        if (q.includes('shoe') || q.includes('bag') || q.includes('handbag') || q.includes('heel')) {
            parsed.category_id = 4;
            parsed.category_name = 'Shoes & Bags';
        } else if (q.includes('ankara') || q.includes('cloth') || q.includes('fabric') || q.includes('fashion') || q.includes('dress') || q.includes('kaftan') || q.includes('shirt')) {
            parsed.category_id = 2;
            parsed.category_name = 'Clothing & Fashion';
        } else if (q.includes('wig') || q.includes('hair') || q.includes('beauty') || q.includes('bone straight') || q.includes('lace') || q.includes('frontal')) {
            parsed.category_id = 3;
            parsed.category_name = 'Wigs & Beauty';
        } else if (q.includes('yam') || q.includes('food') || q.includes('grain') || q.includes('produce') || q.includes('agro') || q.includes('coffee')) {
            parsed.category_id = 10;
            parsed.category_name = 'Agriculture & Produce';
        } else if (q.includes('phone') || q.includes('iphone') || q.includes('samsung') || q.includes('mobile')) {
            parsed.category_id = 7;
            parsed.category_name = 'Mobile Phones';
        } else if (q.includes('watch') || q.includes('smartwatch') || q.includes('gadget') || q.includes('electronics') || q.includes('tv')) {
            parsed.category_id = 6;
            parsed.category_name = 'Electronics & Gadgets';
        } else if (q.includes('scooter') || q.includes('car') || q.includes('auto') || q.includes('vehicle')) {
            parsed.category_id = 9;
            parsed.category_name = 'Car Sales & Auto';
        }

        // 4. Detect Colors
        const colors = ['black', 'blue', 'white', 'red', 'gold', 'green', 'pink', 'silver', 'titanium'];
        for (const c of colors) {
            if (q.includes(c)) {
                parsed.color = c;
                break;
            }
        }

        // 5. Detect Intent
        if (q.includes('wedding')) parsed.intent = 'wedding';
        else if (q.includes('gift') || q.includes('sister') || q.includes('brother') || q.includes('mom')) parsed.intent = 'gift';
        else if (q.includes('wholesale') || q.includes('bulk')) parsed.intent = 'wholesale';
        else if (q.includes('export')) parsed.intent = 'export';

        return parsed;
    },

    // ==========================================
    // 13. AI ASSISTANT CONVERSATION ENGINE
    // ==========================================
    async aiAssistantChat(userMessage) {
        this.initLocalData();
        const parsed = this.parseNaturalLanguageQuery(userMessage);
        const rawMsg = (userMessage || '').trim();
        const msg = rawMsg.toLowerCase();
        let allProducts = await this.getProducts();
        let products = [...allProducts];

        let reply = "";
        let recommendedProducts = [];

        // 1. Keyword search across titles, descriptions, and categories
        const searchWords = msg.split(/\s+/).filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'from', 'want', 'need', 'give', 'show', 'tell', 'help', 'can', 'you', 'please'].includes(w));
        
        let keywordMatches = [];
        if (searchWords.length > 0) {
            keywordMatches = allProducts.filter(p => {
                const searchStr = `${p.name || ''} ${p.title || ''} ${p.description || ''} ${p.category_name || ''} ${p.city || ''} ${p.location || ''}`.toLowerCase();
                return searchWords.some(w => searchStr.includes(w));
            });
        }

        if (parsed.category_id) {
            products = products.filter(p => p.category_id == parsed.category_id);
        }
        if (parsed.location) {
            products = products.filter(p => (p.city && p.city.toLowerCase().includes(parsed.location)) || (p.location && p.location.toLowerCase().includes(parsed.location)));
        }
        if (parsed.max_price) {
            products = products.filter(p => p.price <= parsed.max_price);
        }

        // Merge keyword matches if category/location filtered to empty
        if (products.length === 0 && keywordMatches.length > 0) {
            products = keywordMatches;
        }

        // Conversational Intent Matching
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('sannu') || msg.includes('assalamu')) {
            reply = "Hello! 👋 I'm your Market at Home Shopping Assistant. I can help you find verified goods, connect with sellers, explain Escrow payments, or source products directly across Nigeria & worldwide.\n\nWhat are you looking to buy or inquire about today?";
            if (allProducts.length > 0) {
                recommendedProducts = allProducts.slice(0, 4);
            }
        } else if (msg.includes('how to sell') || msg.includes('add product') || msg.includes('post item') || msg.includes('seller portal')) {
            reply = "🏪 **Selling on Market at Home is fast & easy:**\n1. Register or sign in with your **Seller** account.\n2. In your **Seller Portal**, click **'➕ Add New Product'**.\n3. Enter your product title, price, photo, and details to publish it instantly to all buyers!";
        } else if (msg.includes('how to buy') || msg.includes('choose goods') || msg.includes('buyer portal') || msg.includes('catalog')) {
            reply = "🛍️ **Buying Goods on Market at Home:**\n1. Browse our verified marketplace catalog or use the search bar.\n2. Click any item to inspect photos, details, and seller rating.\n3. Click **'Add to Cart'** or **'Buy with Escrow'** for 100% buyer protection until doorstep delivery!";
            if (allProducts.length > 0) {
                recommendedProducts = allProducts.slice(0, 4);
            }
        } else if (msg.includes('escrow') || msg.includes('payment') || msg.includes('safe') || msg.includes('guarantee')) {
            reply = "🛡️ **100% Escrow Protection Guarantee:**\nWhen you purchase an item, your payment is securely held in our escrow vault. The seller only receives payment after you inspect and confirm receipt of your order in good condition.";
        } else if (msg.includes('delivery') || msg.includes('shipping') || msg.includes('waybill') || msg.includes('logistics')) {
            reply = "🚚 **Doorstep Delivery & Logistics:**\nWe partner with top logistics couriers across all 36 Nigerian states and global cargo partners in China, UAE, and Europe for fast, trackable waybills.";
        } else if (msg.includes('gift') || msg.includes('sister') || msg.includes('birthday') || msg.includes('wedding')) {
            reply = "🎁 **Curated Gift & Occasion Selections:**\nHere are top recommended verified goods for your special occasion:";
            recommendedProducts = (products.length > 0 ? products : allProducts).slice(0, 4);
        } else if (products.length > 0) {
            reply = `✨ I found ${products.length} matching verified listing${products.length > 1 ? 's' : ''}${parsed.category_name ? ' in ' + parsed.category_name : ''}${parsed.location ? ' from ' + parsed.location : ''}${parsed.max_price ? ' within your budget' : ''}:`;
            recommendedProducts = products.slice(0, 4);
        } else {
            reply = `🔍 I couldn't find an exact listing matching "${rawMsg}", but our **Sourcing Concierge Desk** can physically locate, inspect, and negotiate it for you in Kano, Abuja, Lagos, or Guangzhou!\n\nHere are some of our latest verified marketplace items:`;
            recommendedProducts = allProducts.slice(0, 3);
        }

        return {
            reply: reply,
            products: recommendedProducts,
            recommendedProducts: recommendedProducts,
            parsed: parsed
        };
    },

    // In-App Chat Messages
    getChatMessages(sellerPhone) {
        try {
            const raw = localStorage.getItem('globalbiz_chat_' + sellerPhone) || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    },

    sendChatMessage(sellerPhone, message, sender = 'buyer', productRef = null) {
        const list = this.getChatMessages(sellerPhone);
        const newMsg = {
            id: Date.now(),
            text: message,
            sender: sender,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            productRef: productRef
        };
        list.push(newMsg);
        localStorage.setItem('globalbiz_chat_' + sellerPhone, JSON.stringify(list));
        return newMsg;
    },

    siteSettings: {
        site_name: 'Market at Home — Buy & Sell Worldwide',
        support_phone: '09090809080',
        support_email: 'support@marketathome.com',
        commission_rate: 5.0,
        seller_kyc_required: true,
        maintenance_mode: false
    },

    fallbackCategories: [
        { id: 1, name: 'Food & Groceries', slug: 'food-groceries', icon: 'fa-utensils', description: 'Fresh produce, spices, packaged goods & staples' },
        { id: 2, name: 'Clothing & Fashion', slug: 'clothing-fashion', icon: 'fa-shirt', description: 'Authentic Ankara, laces, ready-to-wear & native attire' },
        { id: 3, name: 'Wigs & Beauty', slug: 'wigs-beauty', icon: 'fa-wand-magic-sparkles', description: 'Raw virgin hair, frontal wigs, cosmetics & skincare' },
        { id: 4, name: 'Shoes & Bags', slug: 'shoes-bags', icon: 'fa-bag-shopping', description: 'Luxury footwear, designer handbags, luggage & leather' },
        { id: 5, name: 'Furniture & Decor', slug: 'furniture-decor', icon: 'fa-couch', description: 'Handcrafted furniture, lighting, beddings & home accessories' },
        { id: 6, name: 'Electronics & Gadgets', slug: 'electronics', icon: 'fa-tv', description: 'Smartwatches, audio, appliances & electronics' },
        { id: 7, name: 'Mobile Phones', slug: 'mobile-phones', icon: 'fa-mobile-screen', description: 'iPhones, Samsung, Android devices & mobile accessories' },
        { id: 8, name: 'Computers & IT', slug: 'computers-it', icon: 'fa-laptop-code', description: 'Laptops, MacBooks, monitors, printers & computing gear' },
        { id: 9, name: 'Car Sales & Auto', slug: 'car-sales', icon: 'fa-car-side', description: 'Automobiles, spare parts, electric mobility & accessories' },
        { id: 10, name: 'Agriculture & Produce', slug: 'agriculture-produce', icon: 'fa-wheat-awn', description: 'Yams, grains, export cash crops, seeds & farm supplies' },
        { id: 11, name: 'Real Estate & Rent', slug: 'real-estate', icon: 'fa-building', description: 'Commercial properties, retail spaces, apartments & land' },
        { id: 12, name: 'Professional Services', slug: 'professional-services', icon: 'fa-briefcase', description: 'Logistics, clearing agents, legal & translation desks' }
    ],

    fallbackSellers: [],
    fallbackBuyers: [],
    fallbackOrders: [],
    fallbackComplaints: [],
    fallbackBuyingRequests: [],

    // Admin & Platform Helper APIs
    async toggleSellerVerification(sellerId) {
        this.initLocalData();
        const seller = this.fallbackSellers.find(s => String(s.id) === String(sellerId));
        if (seller) {
            seller.verified = seller.verified ? 0 : 1;
            seller.verification_status = seller.verified ? 'Approved' : 'Pending Review';
            this.saveLocalData('sellers', this.fallbackSellers);
            this.pushUsersToCloud();
            return { status: 'success', data: seller };
        }
        return { status: 'error', message: 'Seller not found' };
    },

    async getBroadcasts() {
        return this.getAnnouncements();
    },

    getLatestBroadcast() {
        this.initLocalData();
        return (this.fallbackAnnouncements && this.fallbackAnnouncements.length > 0) ? this.fallbackAnnouncements[0] : null;
    },

    async createBroadcast(payload) {
        return this.createAnnouncement(payload);
    },

    async createDispute(payload) {
        return this.createComplaint({
            type: payload.category || 'order_dispute',
            subject: payload.subject,
            details: payload.details
        });
    },

    async getAdminStats() {
        const summary = await this.getAnalyticsSummary();
        return {
            users: summary.total_users || (this.fallbackSellers.length + this.fallbackBuyers.length),
            buyers: summary.total_buyers || this.fallbackBuyers.length,
            sellers: summary.total_sellers || this.fallbackSellers.length,
            products: summary.total_products || this.fallbackProducts.length,
            orders: summary.total_orders || this.fallbackOrders.length,
            pendingOrders: summary.pending_orders || 0,
            completedOrders: summary.completed_orders || 0
        };
    },

    defaultProducts: [],
    fallbackProducts: []
};
