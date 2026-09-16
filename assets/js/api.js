/**
 * Market at Home — API Client & Local State Engine
 * Handles asynchronous communication with backend endpoints with automated local persistence.
 */

const API = {
    baseUrl: 'api',
    _initialized: false,

    // ==========================================
    // INITIALIZATION & PERSISTENCE
    // ==========================================
    initLocalData() {
        if (!this._initialized) {
            try {
                const s = localStorage.getItem('globalbiz_sellers_store');
                if (s) this.fallbackSellers = JSON.parse(s);
                else localStorage.setItem('globalbiz_sellers_store', JSON.stringify(this.fallbackSellers));

                const b = localStorage.getItem('globalbiz_buyers_store');
                if (b) this.fallbackBuyers = JSON.parse(b);
                else localStorage.setItem('globalbiz_buyers_store', JSON.stringify(this.fallbackBuyers));

                const p = localStorage.getItem('globalbiz_products_store');
                if (p) {
                    const parsed = JSON.parse(p);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const userProducts = parsed.filter(item => item.id > 10000 || item.user_id);
                        const existingIds = new Set(userProducts.map(x => x.id));
                        const uniqueSeeds = this.fallbackProducts.filter(x => !existingIds.has(x.id));
                        this.fallbackProducts = [...userProducts, ...uniqueSeeds];
                    }
                }
                localStorage.setItem('globalbiz_products_store', JSON.stringify(this.fallbackProducts));

                const r = localStorage.getItem('globalbiz_requests_store');
                if (r) this.fallbackBuyingRequests = JSON.parse(r);
                else localStorage.setItem('globalbiz_requests_store', JSON.stringify(this.fallbackBuyingRequests));

                const o = localStorage.getItem('globalbiz_orders_store');
                if (o) this.fallbackOrders = JSON.parse(o);
                else localStorage.setItem('globalbiz_orders_store', JSON.stringify(this.fallbackOrders));

                const c = localStorage.getItem('globalbiz_complaints_store');
                if (c) this.fallbackComplaints = JSON.parse(c);
                else localStorage.setItem('globalbiz_complaints_store', JSON.stringify(this.fallbackComplaints));

                const a = localStorage.getItem('globalbiz_announcements_store');
                if (a) this.fallbackAnnouncements = JSON.parse(a);
                else localStorage.setItem('globalbiz_announcements_store', JSON.stringify(this.fallbackAnnouncements));

                const cat = localStorage.getItem('globalbiz_categories_store');
                if (cat) this.fallbackCategories = JSON.parse(cat);
                else localStorage.setItem('globalbiz_categories_store', JSON.stringify(this.fallbackCategories));

                const set = localStorage.getItem('globalbiz_site_settings');
                if (set) this.siteSettings = JSON.parse(set);
                else localStorage.setItem('globalbiz_site_settings', JSON.stringify(this.siteSettings));

            } catch (e) {
                console.warn('Local storage sync notice', e);
            }
            this._initialized = true;
        }
    },

    
    // ==========================================
    // UNIFIED USER AUTH & ROLE MANAGEMENT
    // ==========================================
    async getUsers(params = {}) {
        this.initLocalData();
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
        if (isSeller) {
            const sellerRes = await this.registerSeller({
                full_name: payload.full_name,
                phone: payload.phone,
                email: payload.email,
                location: payload.location || payload.city || 'Abuja, Nigeria',
                store_name: payload.store_name || (payload.full_name + "'s Store"),
                verified: payload.verified || 0
            });
            const newUser = {
                ...sellerRes.data,
                role: 'seller',
                password: payload.password || 'password123'
            };
            return newUser;
        } else {
            const buyerRes = await this.createBuyer({
                full_name: payload.full_name,
                phone: payload.phone,
                email: payload.email,
                location: payload.location || payload.city || 'Abuja, Nigeria'
            });
            const newUser = {
                ...buyerRes.data,
                role: 'buyer',
                password: payload.password || 'password123'
            };
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
        return this.filterFallbackProducts(params);
    },

    async getProduct(id) {
        this.initLocalData();
        return this.fallbackProducts.find(p => p.id == id);
    },

    async createProduct(payload) {
        this.initLocalData();
        const newProd = {
            id: Date.now(),
            title: payload.title,
            price: parseFloat(payload.price) || 0,
            category_id: payload.category_id || 1,
            category_name: payload.category_name || 'General',
            seller_name: payload.seller_name || 'Verified Seller',
            seller_phone: payload.seller_phone || payload.phone || '',
            country: payload.country || 'Nigeria',
            state: payload.state || payload.state_province || 'Abuja (FCT)',
            city: payload.city || payload.location || 'Abuja',
            description: payload.description || '',
            photo_url: payload.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
            delivery_info: payload.delivery_info || 'Local pickup & worldwide courier delivery available',
            views: 1,
            business_verified: payload.business_verified !== undefined ? payload.business_verified : 1,
            status: payload.status || 'approved',
            available_qty: parseInt(payload.available_qty) || 50,
            created_at: new Date().toISOString().split('T')[0]
        };
        this.fallbackProducts.unshift(newProd);
        this.saveLocalData('products', this.fallbackProducts);
        return { status: 'success', id: newProd.id, data: newProd, message: 'Good listed on marketplace successfully!' };
    },

    async updateProduct(id, payload) {
        this.initLocalData();
        const idx = this.fallbackProducts.findIndex(p => p.id == id);
        if (idx !== -1) {
            this.fallbackProducts[idx] = { ...this.fallbackProducts[idx], ...payload };
            this.saveLocalData('products', this.fallbackProducts);
            return { status: 'success', message: 'Product updated successfully!' };
        }
        return { status: 'error', message: 'Product not found' };
    },

    async deleteProduct(id) {
        this.initLocalData();
        this.fallbackProducts = this.fallbackProducts.filter(x => x.id != id);
        this.saveLocalData('products', this.fallbackProducts);
        return { status: 'success', message: 'Product removed successfully!' };
    },

    async setProductApprovalStatus(id, status) {
        this.initLocalData();
        const prod = this.fallbackProducts.find(p => p.id == id);
        if (prod) {
            prod.status = status;
            this.saveLocalData('products', this.fallbackProducts);
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
            return { status: 'success', data: this.fallbackSellers[idx], message: 'Seller updated successfully' };
        }
        return { status: 'error', message: 'Seller not found' };
    },

    async deleteSeller(id) {
        this.initLocalData();
        this.fallbackSellers = this.fallbackSellers.filter(s => s.id != id);
        this.saveLocalData('sellers', this.fallbackSellers);
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
        return { status: 'success', data: newBuyer, message: 'Buyer registered successfully!' };
    },

    async updateBuyer(id, payload) {
        this.initLocalData();
        const idx = this.fallbackBuyers.findIndex(b => b.id == id);
        if (idx !== -1) {
            this.fallbackBuyers[idx] = { ...this.fallbackBuyers[idx], ...payload };
            this.saveLocalData('buyers', this.fallbackBuyers);
            return { status: 'success', data: this.fallbackBuyers[idx], message: 'Buyer updated successfully' };
        }
        return { status: 'error', message: 'Buyer not found' };
    },

    async deleteBuyer(id) {
        this.initLocalData();
        this.fallbackBuyers = this.fallbackBuyers.filter(b => b.id != id);
        this.saveLocalData('buyers', this.fallbackBuyers);
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

    filterFallbackProducts(params) {
        let results = [...this.fallbackProducts];
        if (params.q) {
            const q = params.q.toLowerCase().trim();
            results = results.filter(p =>
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q)) ||
                (p.city && p.city.toLowerCase().includes(q)) ||
                (p.state && p.state.toLowerCase().includes(q)) ||
                (p.country && p.country.toLowerCase().includes(q)) ||
                (p.seller_name && p.seller_name.toLowerCase().includes(q)) ||
                (p.category_name && p.category_name.toLowerCase().includes(q))
            );
        }
        if (params.category_id) {
            results = results.filter(p => p.category_id == params.category_id);
        }
        if (params.category_name) {
            results = results.filter(p => p.category_name && p.category_name.toLowerCase() === params.category_name.toLowerCase());
        }
        if (params.country && params.country !== 'all' && params.country.trim() !== '') {
            const c = params.country.toLowerCase().trim();
            results = results.filter(p => p.country && (p.country.toLowerCase().includes(c) || c.includes(p.country.toLowerCase())));
        }
        if (params.state && params.state !== 'all' && params.state.trim() !== '') {
            const s = params.state.toLowerCase().trim();
            results = results.filter(p =>
                (p.state && (p.state.toLowerCase().includes(s) || s.includes(p.state.toLowerCase()))) ||
                (p.city && (p.city.toLowerCase().includes(s) || s.includes(p.city.toLowerCase())))
            );
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
        const msg = userMessage.toLowerCase();
        let products = await this.getProducts();

        let reply = "";
        let recommendedProducts = [];

        if (parsed.category_id) {
            products = products.filter(p => p.category_id == parsed.category_id);
        }
        if (parsed.location) {
            products = products.filter(p => p.city && p.city.toLowerCase().includes(parsed.location));
        }
        if (parsed.max_price) {
            products = products.filter(p => p.price <= parsed.max_price);
        }

        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            reply = "Hello! 👋 I'm your Market Assistant. Tell me what you're looking for, your budget, or target location (e.g. 'I need premium Ankara under ₦20,000 in Abuja' or 'Wigs in Kano').";
        } else if (msg.includes('gift') || msg.includes('sister') || msg.includes('birthday')) {
            reply = "That's lovely! 🎁 Here are verified premium gift selections including Luxury Human Hair Wigs, AMOLED Smartwatches, and Authentic Ankara Fabrics:";
            recommendedProducts = products.slice(0, 3);
        } else if (products.length > 0) {
            reply = `Found ${products.length} matching goods on Market at Home${parsed.category_name ? ' in ' + parsed.category_name : ''}${parsed.location ? ' from ' + parsed.location : ''}${parsed.max_price ? ' within your budget' : ''}:`;
            recommendedProducts = products.slice(0, 3);
        } else {
            reply = "I couldn't find an exact listing matching all those criteria, but our **Sourcing Concierge** can physically find, inspect, and negotiate it for you in Kano, Abuja, or Guangzhou!";
            recommendedProducts = (await this.getProducts()).slice(0, 2);
        }

        return {
            reply: reply,
            products: recommendedProducts,
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

    fallbackSellers: [
        {
            id: 101,
            full_name: 'Amina Bello Lawal',
            email: 'amina@luxurankara.ng',
            id_number: 'NIN-78492019482',
            phone: '+234 803 456 7890',
            location: 'Abuja (Wuse 2)',
            city: 'Abuja',
            country: 'Nigeria',
            kin_name: 'Usman Bello Lawal (Brother)',
            kin_phone: '+234 802 111 2233',
            store_name: 'Amina Luxury Ankara & Fabrics',
            category_name: 'Clothing & Fashion',
            verified: 1,
            verification_status: 'Approved',
            status: 'active',
            registered_at: '2026-08-10'
        },
        {
            id: 102,
            full_name: 'Fatima Zahra Mohammed',
            email: 'orders@kanowigs.ng',
            id_number: 'NIN-92817401928',
            phone: '+234 814 999 4455',
            location: 'Kano (Kano Municipal)',
            city: 'Kano',
            country: 'Nigeria',
            kin_name: 'Aisha Mohammed (Sister)',
            kin_phone: '+234 816 777 8899',
            store_name: 'Hajiya Wigs & Beauty Palace',
            category_name: 'Wigs & Beauty',
            verified: 1,
            verification_status: 'Approved',
            status: 'active',
            registered_at: '2026-08-15'
        },
        {
            id: 103,
            full_name: 'Blessing Emmanuel',
            email: 'blessing@kadunahair.ng',
            id_number: 'NIN-55647382910',
            phone: '+234 805 123 9876',
            location: 'Kaduna (Barnawa)',
            city: 'Kaduna',
            country: 'Nigeria',
            kin_name: 'David Emmanuel (Brother)',
            kin_phone: '+234 809 333 4455',
            store_name: 'Kaduna Premium Hair & Styles',
            category_name: 'Wigs & Beauty',
            verified: 0,
            verification_status: 'Pending Review',
            status: 'active',
            registered_at: '2026-09-01'
        },
        {
            id: 104,
            full_name: 'David Chen',
            email: 'david@guangzhousmart.cn',
            id_number: 'ID-CN-88992211',
            phone: '+86 138 0013 8000',
            location: 'Guangzhou',
            city: 'Guangzhou',
            country: 'China',
            kin_name: 'Mei Chen',
            kin_phone: '+86 139 0013 8000',
            store_name: 'Guangzhou Smart Mobility Co.',
            category_name: 'Car Sales & Auto',
            verified: 1,
            verification_status: 'Approved',
            status: 'active',
            registered_at: '2026-08-05'
        }
    ],

    fallbackBuyers: [
        {
            id: 201,
            full_name: 'Ahmed Yusuf Al-Mansoor',
            email: 'ahmed.yusuf@diaspora.ae',
            phone: '+234 802 345 6789',
            location: 'Abuja (Maitama)',
            city: 'Abuja',
            country: 'Nigeria',
            delivery_address: 'Plot 42, Gana Street, Maitama, Abuja, Nigeria',
            status: 'active',
            registered_at: '2026-08-12',
            orders_count: 5
        },
        {
            id: 202,
            full_name: 'Chioma Okafor',
            email: 'chioma.okafor@gmail.com',
            phone: '+234 813 456 7890',
            location: 'Kano (Nassarawa)',
            city: 'Kano',
            country: 'Nigeria',
            delivery_address: '14 Bompai Road, Nassarawa GRA, Kano, Nigeria',
            status: 'active',
            registered_at: '2026-08-18',
            orders_count: 3
        },
        {
            id: 203,
            full_name: 'Ibrahim Al-Rashid',
            email: 'ibrahim.rashid@globalinvest.sa',
            phone: '+966 55 112 2334',
            location: 'Riyadh',
            city: 'Riyadh',
            country: 'Saudi Arabia',
            delivery_address: 'Al Olaya District, King Fahd Road, Riyadh, Saudi Arabia',
            status: 'active',
            registered_at: '2026-08-22',
            orders_count: 8
        },
        {
            id: 204,
            full_name: 'Zainab Kabir Musa',
            email: 'zainab.musa@outlook.com',
            phone: '+234 808 222 3344',
            location: 'Abuja (Garki)',
            city: 'Abuja',
            country: 'Nigeria',
            delivery_address: 'Area 11, Garki, Abuja, Nigeria',
            status: 'active',
            registered_at: '2026-08-25',
            orders_count: 2
        }
    ],

    fallbackOrders: [
        {
            id: 301,
            order_number: 'ORD-849201',
            buyer_id: 201,
            buyer_name: 'Ahmed Yusuf Al-Mansoor',
            buyer_phone: '+234 802 345 6789',
            buyer_email: 'ahmed.yusuf@diaspora.ae',
            delivery_address: 'Plot 42, Gana Street, Maitama, Abuja',
            delivery_city: 'Abuja',
            delivery_country: 'Nigeria',
            seller_id: 101,
            seller_name: 'Amina Luxury Ankara & Fabrics',
            seller_phone: '+234 803 456 7890',
            item_name: 'Authentic 6-Yards Premium Ankara Material',
            quantity: 3,
            total_amount: 29.04,
            currency: 'USD',
            status: 'Delivered',
            payment_status: 'Paid (Escrow)',
            payment_method: 'Online Card Payment',
            has_dispute: 0,
            dispute_reason: '',
            created_at: '2026-09-10',
            timeline: [
                { status: 'Pending', timestamp: '10:00 AM', note: 'Order placed by buyer' },
                { status: 'Confirmed', timestamp: '10:30 AM', note: 'Seller accepted order' },
                { status: 'Processing', timestamp: '01:00 PM', note: 'Packaging fabrics' },
                { status: 'Shipped', timestamp: '03:45 PM', note: 'Dispatched via express dispatch rider' },
                { status: 'Delivered', timestamp: '05:30 PM', note: 'Buyer confirmed safe receipt' }
            ]
        },
        {
            id: 302,
            order_number: 'ORD-519283',
            buyer_id: 202,
            buyer_name: 'Chioma Okafor',
            buyer_phone: '+234 813 456 7890',
            buyer_email: 'chioma.okafor@gmail.com',
            delivery_address: '14 Bompai Road, Nassarawa GRA, Kano',
            delivery_city: 'Kano',
            delivery_country: 'Nigeria',
            seller_id: 102,
            seller_name: 'Hajiya Wigs & Beauty Palace',
            seller_phone: '+234 814 999 4455',
            item_name: 'Luxury Double Drawn Bone Straight Human Hair Wig (28-inch)',
            quantity: 1,
            total_amount: 77.42,
            currency: 'USD',
            status: 'Shipped',
            payment_status: 'Paid (Escrow)',
            payment_method: 'Direct Bank Transfer',
            has_dispute: 0,
            dispute_reason: '',
            created_at: '2026-09-14',
            timeline: [
                { status: 'Pending', timestamp: '09:15 AM', note: 'Order placed by Chioma' },
                { status: 'Confirmed', timestamp: '09:40 AM', note: 'Merchant confirmed item in stock' },
                { status: 'Processing', timestamp: '11:00 AM', note: 'Wig customized and packed' },
                { status: 'Shipped', timestamp: '02:15 PM', note: 'Waybill sent via GIG Logistics (Waybill #GIG-99812)' }
            ]
        },
        {
            id: 303,
            order_number: 'ORD-771920',
            buyer_id: 203,
            buyer_name: 'Ibrahim Al-Rashid',
            buyer_phone: '+966 55 112 2334',
            buyer_email: 'ibrahim.rashid@globalinvest.sa',
            delivery_address: 'Al Olaya District, King Fahd Road, Riyadh',
            delivery_city: 'Riyadh',
            delivery_country: 'Saudi Arabia',
            seller_id: 104,
            seller_name: 'Guangzhou Smart Mobility Co.',
            seller_phone: '+86 138 0013 8000',
            item_name: 'High-Performance Foldable Urban Electric Commuter Scooter (35km/h)',
            quantity: 2,
            total_amount: 560.00,
            currency: 'USD',
            status: 'Processing',
            payment_status: 'Paid (Escrow)',
            payment_method: 'International Card (USD)',
            has_dispute: 0,
            dispute_reason: '',
            created_at: '2026-09-15',
            timeline: [
                { status: 'Pending', timestamp: '08:00 AM', note: 'International order placed' },
                { status: 'Confirmed', timestamp: '08:45 AM', note: 'Seller prepared export documentation' },
                { status: 'Processing', timestamp: '10:00 AM', note: 'Battery safety inspection and container loading' }
            ]
        },
        {
            id: 304,
            order_number: 'ORD-339210',
            buyer_id: 204,
            buyer_name: 'Zainab Kabir Musa',
            buyer_phone: '+234 808 222 3344',
            buyer_email: 'zainab.musa@outlook.com',
            delivery_address: 'Area 11, Garki, Abuja',
            delivery_city: 'Abuja',
            delivery_country: 'Nigeria',
            seller_id: 101,
            seller_name: 'Amina Luxury Ankara & Fabrics',
            seller_phone: '+234 803 456 7890',
            item_name: 'Authentic 6-Yards Premium Ankara Material',
            quantity: 1,
            total_amount: 9.68,
            currency: 'USD',
            status: 'Pending',
            payment_status: 'Awaiting Escrow Confirmation',
            payment_method: 'Pay on Delivery / Escrow',
            has_dispute: 0,
            dispute_reason: '',
            created_at: '2026-09-16',
            timeline: [
                { status: 'Pending', timestamp: '06:30 AM', note: 'New order received from buyer' }
            ]
        }
    ],

    fallbackComplaints: [
        {
            id: 401,
            ticket_number: 'TKT-8821',
            type: 'seller_issue',
            subject: 'Seller delayed delivery on Ankara order',
            reported_by: 'Chioma Okafor',
            reporter_phone: '+234 813 456 7890',
            reporter_role: 'buyer',
            target_entity: 'Amina Luxury Ankara & Fabrics',
            target_id: 101,
            details: 'Merchant promised 2-day dispatch but item was delayed by 48 hours without prior notice.',
            status: 'Resolved',
            admin_notes: 'Spoke with seller. Merchant apologized and included free matching headgear.',
            created_at: '2026-09-08'
        },
        {
            id: 402,
            ticket_number: 'TKT-9042',
            type: 'inappropriate_product',
            subject: 'Listing description missing accurate dimensions',
            reported_by: 'Ahmed Yusuf Al-Mansoor',
            reporter_phone: '+234 802 345 6789',
            reporter_role: 'buyer',
            target_entity: 'Product: iPhone 15 Pro Max',
            target_id: 1003,
            details: 'Wanted clarification on whether model is dual physical SIM or eSIM before ordering.',
            status: 'Under Investigation',
            admin_notes: 'Contacted tech merchant to update listing description with global dual eSIM specifications.',
            created_at: '2026-09-12'
        }
    ],

    fallbackAnnouncements: [
        {
            id: 501,
            title: '🎉 Welcome to Market at Home Worldwide Marketplace!',
            message: 'Connect directly with verified sellers across Nigeria, China, USA, UK, UAE and worldwide with Escrow safety protection.',
            target: 'all',
            priority: 'important',
            created_at: '2026-09-01',
            created_by: 'Administrator Desk'
        },
        {
            id: 502,
            title: '🚀 Sourcing Desk Now Active Across All 36 Nigerian States & Global Ports',
            message: 'Need bulk agricultural produce from Kano, fashion from Abuja, or electronics from Guangzhou? Submit a sourcing request for full concierge inspection and doorstep delivery.',
            target: 'buyers',
            priority: 'normal',
            created_at: '2026-09-10',
            created_by: 'Administrator Desk'
        }
    ],

    fallbackBuyingRequests: [
        {
            id: 601,
            tracking_code: 'PBA-00101',
            customer_name: 'Ibrahim Al-Rashid',
            customer_phone: '+966 55 112 2334',
            item_title: '200 Bags of Export-Grade Benue Yam',
            requested_qty: '200 Bags (10,000 Tubers)',
            target_country: 'Nigeria',
            target_city: 'Kano (Dawanau Market)',
            package_type: 'Full Buying Assistance',
            service_fee: 60.00,
            status: 'Sourcing Active',
            assigned_agent: 'Aliyu Garba (Kano Agro Desk)',
            supplier_info: 'Dawanau Export Farmers Syndicate (Line 4)',
            specifications: 'Dry white tubers, zero rot, 2kg+ average weight per tuber, container fumigation certificate required.',
            created_at: '2026-08-16'
        },
        {
            id: 602,
            tracking_code: 'PBA-00102',
            customer_name: 'Ahmed Yusuf Al-Mansoor',
            customer_phone: '+234 802 345 6789',
            item_title: '10 Sets of Grade-A Senegalese Luxury Kaftans',
            requested_qty: '10 Sets',
            target_country: 'Nigeria',
            target_city: 'Abuja (Wuse 2)',
            package_type: 'Price Negotiation',
            service_fee: 40.00,
            status: 'Quality Checked',
            assigned_agent: 'Maryam Sani (Fashion Desk)',
            supplier_info: 'Sahelian Tailoring Guild, Emab Plaza',
            specifications: 'Hand embroidered necklines, 100% original Guinea brocade fabric, XXL & XL sizing.',
            created_at: '2026-09-05'
        }
    ],

    fallbackProducts: [
        {
            id: 1001,
            title: 'Authentic 6-Yards Premium Ankara Material (Holland Wax Grade)',
            price: 9.68,
            category_id: 2,
            category_name: 'Clothing & Fashion',
            seller_name: 'Amina Luxury Ankara & Fabrics',
            country: 'Nigeria',
            state: 'Abuja (FCT)',
            city: 'Abuja',
            area: 'Wuse 2',
            phone: '+234 803 456 7890',
            whatsapp: '+2348034567890',
            description: '100% Cotton, color-fast high density weave Dutch Holland wax print. Direct from importer with worldwide air cargo shipping.',
            photo_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
            delivery_info: 'Local delivery in Abuja/Nigeria & Worldwide DHL/FedEx shipping',
            views: 245,
            business_verified: 1,
            status: 'approved',
            available_qty: 150
        },
        {
            id: 1002,
            title: 'Luxury Double Drawn Bone Straight Human Hair Wig (HD Lace Frontal)',
            price: 77.42,
            category_id: 3,
            category_name: 'Wigs & Beauty',
            seller_name: 'Hajiya Wigs & Beauty Palace',
            country: 'Nigeria',
            state: 'Kano',
            city: 'Kano',
            area: 'Zoo Road',
            phone: '+234 814 999 4455',
            whatsapp: '+2348149994455',
            description: '100% Unprocessed Brazilian Virgin Hair, silky soft double drawn bone straight 28-inch with pre-plucked invisible Swiss HD lace.',
            photo_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
            delivery_info: 'Next-day nationwide courier & Global International Air Delivery',
            views: 412,
            business_verified: 1,
            status: 'approved',
            available_qty: 35
        },
        {
            id: 1003,
            title: 'Apple iPhone 15 Pro Max 256GB Factory Unlocked (Titanium Blue)',
            price: 850.00,
            category_id: 7,
            category_name: 'Mobile Phones',
            seller_name: 'Apex Global Tech USA',
            country: 'United States',
            state: 'California',
            city: 'Los Angeles',
            area: 'Silicon Valley Depot',
            phone: '+1 213 555 0199',
            whatsapp: '+12135550199',
            description: 'Brand new factory sealed US model with Apple 1-Year International Warranty. Works on all 5G networks worldwide with dual eSIM.',
            photo_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
            delivery_info: 'Express Worldwide Courier (FedEx / DHL 3-5 days delivery)',
            views: 580,
            business_verified: 1,
            status: 'approved',
            available_qty: 20
        },
        {
            id: 1004,
            title: 'Wholesale Benue Premium Export Grade White Yam (100 Tubers Bundle)',
            price: 90.32,
            category_id: 10,
            category_name: 'Agriculture & Produce',
            seller_name: 'Kano Agro & Commodity Hub',
            country: 'Nigeria',
            state: 'Kano',
            city: 'Kano',
            area: 'Dawanau International Market',
            phone: '+234 814 999 4455',
            whatsapp: '+2348149994455',
            description: 'Export standard dry tubers with long shelf-life. Ready for interstate distribution or international phytosanitary export container loading.',
            photo_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80',
            delivery_info: 'Interstate haulage trucks & international sea/air freight available',
            views: 310,
            business_verified: 1,
            status: 'approved',
            available_qty: 500
        },
        {
            id: 1005,
            title: 'Designer Luxury AMOLED Smartwatch with Bluetooth Call & Health Tracker',
            price: 45.00,
            category_id: 6,
            category_name: 'Electronics & Gadgets',
            seller_name: 'Gulf Express Trading LLC',
            country: 'United Arab Emirates',
            state: 'Dubai',
            city: 'Dubai',
            area: 'Deira Gold Souk & Tech Mart',
            phone: '+971 50 123 4567',
            whatsapp: '+971501234567',
            description: 'Sleek stainless steel bezel with interchangeable leather and silicone straps, IP68 water resistance, sleep monitor, and 14-day battery.',
            photo_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            delivery_info: 'Gulf Express local dispatch & worldwide air express dispatch',
            views: 198,
            business_verified: 1,
            status: 'approved',
            available_qty: 80
        },
        {
            id: 1006,
            title: 'High-Performance Foldable Urban Electric Commuter Scooter (35km/h)',
            price: 280.00,
            category_id: 9,
            category_name: 'Car Sales & Auto',
            seller_name: 'Guangzhou Smart Mobility Co.',
            country: 'China',
            state: 'Guangdong',
            city: 'Guangzhou',
            area: 'Tianhe District',
            phone: '+86 138 0013 8000',
            whatsapp: '+8613800138000',
            description: 'Aircraft-grade aluminum alloy body, dual regenerative braking system, puncture-proof 10-inch pneumatic tires with 45km battery range per charge.',
            photo_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
            delivery_info: 'Global door-to-door cargo logistics with tracking',
            views: 340,
            business_verified: 1,
            status: 'approved',
            available_qty: 45
        }
    ]
};
