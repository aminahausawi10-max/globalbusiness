/**
 * API Client Layer
 * Handles asynchronous communication with PHP backend endpoints
 * Includes automated fallback to local state for zero-server instant preview.
 */

const API = {
    baseUrl: 'api',

    async getCategories() {
        try {
            const res = await fetch(`${this.baseUrl}/categories.php`);
            if (res.ok) {
                const data = await res.json();
                return data.data || [];
            }
        } catch (e) {
            console.warn('Backend offline, using fallback categories');
        }
        return this.fallbackCategories;
    },

    async getBusinesses(params = {}) {
        const query = new URLSearchParams(params).toString();
        try {
            const res = await fetch(`${this.baseUrl}/businesses.php?${query}`);
            if (res.ok) {
                const data = await res.json();
                return data.data || [];
            }
        } catch (e) {
            console.warn('Backend offline, using fallback businesses');
        }
        return this.filterFallbackBusinesses(params);
    },

    async getBusiness(id) {
        try {
            const res = await fetch(`${this.baseUrl}/businesses.php?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                return data.data;
            }
        } catch (e) {
            console.warn('Backend offline');
        }
        return this.fallbackBusinesses.find(b => b.id == id);
    },

    async registerBusiness(payload) {
        try {
            const res = await fetch(`${this.baseUrl}/businesses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            const newBiz = {
                id: Date.now(),
                ...payload,
                category_name: payload.category_name || 'General',
                verified: 0,
                rating: 5.0,
                reviews_count: 0
            };
            this.fallbackBusinesses.unshift(newBiz);
            return { status: 'success', id: newBiz.id, message: 'Business registered (Local Mode)' };
        }
    },

    // Seller KYC Registration & Management
    async registerSeller(payload) {
        this.initLocalData();
        const newSeller = {
            id: Date.now(),
            full_name: payload.full_name,
            id_number: payload.id_number || ('NIN-' + Math.floor(10000000000 + Math.random() * 90000000000)),
            phone: payload.phone,
            location: payload.location,
            city: payload.city || payload.location,
            country: payload.country || 'Nigeria',
            kin_name: payload.kin_name || 'Relative',
            kin_phone: payload.kin_phone || '+234 800 000 0000',
            store_name: payload.store_name || `${payload.full_name}'s Store`,
            category_name: payload.category_name || 'General Marketplace',
            verified: payload.verified !== undefined ? payload.verified : 1,
            registered_at: new Date().toISOString().split('T')[0]
        };
        this.fallbackSellers.unshift(newSeller);
        this.saveLocalData('sellers', this.fallbackSellers);
        localStorage.setItem('currentUserSeller', JSON.stringify(newSeller));
        return { status: 'success', data: newSeller, message: 'Seller registered successfully!' };
    },

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
        return list;
    },

    async deleteSeller(id) {
        this.initLocalData();
        this.fallbackSellers = this.fallbackSellers.filter(s => s.id != id);
        this.saveLocalData('sellers', this.fallbackSellers);
        return { status: 'success', message: 'Seller removed successfully from system' };
    },

    async verifySeller(id, isVerified = 1) {
        this.initLocalData();
        const seller = this.fallbackSellers.find(s => s.id == id);
        if (seller) {
            seller.verified = isVerified;
            this.saveLocalData('sellers', this.fallbackSellers);
            // Also update any matching businesses
            const biz = this.fallbackBusinesses.find(b => b.name === seller.store_name);
            if (biz) {
                biz.verified = isVerified;
                this.saveLocalData('businesses', this.fallbackBusinesses);
            }
        }
        return { status: 'success', message: isVerified ? 'Seller verified with badge!' : 'Seller verification updated.' };
    },

    // Buyer Account Management
    async getBuyers(params = {}) {
        this.initLocalData();
        let list = [...this.fallbackBuyers];
        if (params.q) {
            const q = params.q.toLowerCase();
            list = list.filter(b => 
                (b.full_name && b.full_name.toLowerCase().includes(q)) ||
                (b.location && b.location.toLowerCase().includes(q)) ||
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
            phone: payload.phone,
            location: payload.location || 'Abuja, Nigeria',
            city: payload.city || payload.location || 'Abuja',
            country: payload.country || 'Nigeria',
            orders_count: payload.orders_count || 0,
            registered_at: new Date().toISOString().split('T')[0]
        };
        this.fallbackBuyers.unshift(newBuyer);
        this.saveLocalData('buyers', this.fallbackBuyers);
        return { status: 'success', data: newBuyer, message: 'Buyer registered successfully!' };
    },

    async deleteBuyer(id) {
        this.initLocalData();
        this.fallbackBuyers = this.fallbackBuyers.filter(b => b.id != id);
        this.saveLocalData('buyers', this.fallbackBuyers);
        return { status: 'success', message: 'Buyer removed successfully from system' };
    },

    // Unified Members Directory (Sellers, Buyers & Platform Members)
    async getMembers(params = {}) {
        this.initLocalData();
        const sellersList = this.fallbackSellers.map(s => ({
            id: s.id,
            member_id: s.id_number || `NIG-SELLER-${s.id}`,
            full_name: s.full_name,
            phone: s.phone,
            role: 'Seller',
            store_name: s.store_name,
            location: s.location || s.city || 'Nigeria',
            city: s.city || s.location || 'Abuja',
            country: s.country || 'Nigeria',
            verified: s.verified !== undefined ? s.verified : 1,
            registered_at: s.registered_at || '2026-08-10',
            source_type: 'seller'
        }));

        const buyersList = this.fallbackBuyers.map(b => ({
            id: b.id,
            member_id: `NIG-BUYER-${b.id}`,
            full_name: b.full_name,
            phone: b.phone,
            role: 'Buyer',
            store_name: 'Direct Customer',
            location: b.location || b.city || 'Nigeria',
            city: b.city || b.location || 'Abuja',
            country: b.country || 'Nigeria',
            verified: 1,
            registered_at: b.registered_at || '2026-08-12',
            source_type: 'buyer',
            orders_count: b.orders_count || 0
        }));

        let combined = [...sellersList, ...buyersList];

        if (params.role && params.role !== 'all') {
            combined = combined.filter(m => m.role.toLowerCase() === params.role.toLowerCase());
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
                (m.location && m.location.toLowerCase().includes(q)) ||
                (m.store_name && m.store_name.toLowerCase().includes(q)) ||
                (m.role && m.role.toLowerCase().includes(q))
            );
        }

        return combined;
    },

    async deleteMember(id, sourceType = 'seller') {
        if (sourceType === 'seller') {
            return await this.deleteSeller(id);
        } else {
            return await this.deleteBuyer(id);
        }
    },

    async toggleMemberVerification(id, sourceType = 'seller', isVerified = 1) {
        if (sourceType === 'seller') {
            return await this.verifySeller(id, isVerified);
        } else {
            const buyer = this.fallbackBuyers.find(b => b.id == id);
            if (buyer) {
                buyer.verified = isVerified;
                this.saveLocalData('buyers', this.fallbackBuyers);
            }
            return { status: 'success', message: 'Buyer verification status updated' };
        }
    },

    async getProducts(params = {}) {
        this.initLocalData();
        const query = new URLSearchParams(params).toString();
        try {
            const res = await fetch(`${this.baseUrl}/products.php?${query}`);
            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.length) return data.data;
            }
        } catch (e) {
            console.warn('Backend offline, using fallback products');
        }
        return this.filterFallbackProducts(params);
    },

    async createProduct(payload) {
        this.initLocalData();
        try {
            const res = await fetch(`${this.baseUrl}/products.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data && data.id) {
                this.fallbackProducts.unshift({ id: data.id, views: 1, business_verified: 1, ...payload });
                this.saveLocalData('products', this.fallbackProducts);
                return data;
            }
        } catch (e) {
            // Local mode fallback
        }
        const newProd = {
            id: Date.now(),
            views: 1,
            business_verified: 1,
            seller_phone: payload.seller_phone || payload.phone || '',
            ...payload
        };
        this.fallbackProducts.unshift(newProd);
        this.saveLocalData('products', this.fallbackProducts);
        return { status: 'success', id: newProd.id, message: 'Good listed on marketplace successfully!' };
    },

    async updateProduct(id, payload) {
        this.initLocalData();
        const idx = this.fallbackProducts.findIndex(p => p.id == id);
        if (idx !== -1) {
            this.fallbackProducts[idx] = { ...this.fallbackProducts[idx], ...payload };
            this.saveLocalData('products', this.fallbackProducts);
            return { status: 'success', message: 'Good updated successfully!' };
        }
        return { status: 'error', message: 'Good not found' };
    },

    async deleteProduct(id) {
        this.initLocalData();
        try {
            const res = await fetch(`${this.baseUrl}/admin.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_product', id })
            });
            await res.json();
        } catch (e) {}
        this.fallbackProducts = this.fallbackProducts.filter(x => x.id != id);
        this.saveLocalData('products', this.fallbackProducts);
        return { status: 'success', message: 'Good removed successfully from your store and search!' };
    },

    async submitBuyingAssistance(payload) {
        try {
            const res = await fetch(`${this.baseUrl}/buying_assistance.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            const newReq = {
                id: Date.now(),
                tracking_code: 'PBA-' + Math.floor(10000 + Math.random() * 90000),
                status: 'New',
                assigned_agent: 'Assigned to Senior Sourcing Desk',
                ...payload
            };
            this.fallbackBuyingRequests.unshift(newReq);
            return {
                status: 'success',
                id: newReq.id,
                tracking_code: newReq.tracking_code,
                message: 'Buying assistance request submitted!'
            };
        }
    },

    async getBuyingRequests() {
        try {
            const res = await fetch(`${this.baseUrl}/buying_assistance.php`);
            if (res.ok) {
                const data = await res.json();
                return data.data || [];
            }
        } catch (e) {
            console.warn('Backend offline');
        }
        return this.fallbackBuyingRequests;
    },

    async getAdminData(action = 'overview') {
        try {
            const res = await fetch(`${this.baseUrl}/admin.php?action=${action}`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Backend offline, using fallback admin data');
        }

        const totalRevenue = this.fallbackBuyingRequests.reduce((acc, r) => acc + (parseFloat(r.service_fee) || 0), 0);
        return {
            status: 'success',
            metrics: {
                total_businesses: this.fallbackBusinesses.length,
                total_products: this.fallbackProducts.length,
                total_requests: this.fallbackBuyingRequests.length,
                total_sellers: this.fallbackSellers.length,
                total_revenue: totalRevenue
            },
            sellers: this.fallbackSellers,
            businesses: this.fallbackBusinesses,
            products: this.fallbackProducts,
            requests: this.fallbackBuyingRequests
        };
    },

    async toggleBusinessVerification(id, verified) {
        const biz = this.fallbackBusinesses.find(x => x.id == id);
        if (biz) biz.verified = verified ? 1 : 0;
        return { status: 'success', message: 'Verification status updated' };
    },

    async deleteBusiness(id) {
        this.fallbackBusinesses = this.fallbackBusinesses.filter(x => x.id != id);
        return { status: 'success', message: 'Business removed' };
    },

    async updateBuyingRequest(payload) {
        const req = this.fallbackBuyingRequests.find(x => x.id == payload.id);
        if (req) {
            req.status = payload.status;
            if (payload.assigned_agent) req.assigned_agent = payload.assigned_agent;
            if (payload.notes) req.notes = payload.notes;
        }
        return { status: 'success', message: 'Request status updated' };
    },

    // Categories
    fallbackCategories: [
        { id: 1, name: 'Food & Groceries', slug: 'food-groceries', icon: 'fa-utensils' },
        { id: 2, name: 'Clothing & Fashion', slug: 'clothing-fashion', icon: 'fa-shirt' },
        { id: 3, name: 'Wigs & Beauty', slug: 'wigs-beauty', icon: 'fa-wand-magic-sparkles' },
        { id: 4, name: 'Shoes & Bags', slug: 'shoes-bags', icon: 'fa-bag-shopping' },
        { id: 5, name: 'Furniture & Decor', slug: 'furniture-decor', icon: 'fa-couch' },
        { id: 6, name: 'Electronics & Gadgets', slug: 'electronics', icon: 'fa-tv' },
        { id: 7, name: 'Mobile Phones', slug: 'mobile-phones', icon: 'fa-mobile-screen' },
        { id: 8, name: 'Computers & IT', slug: 'computers-it', icon: 'fa-laptop-code' },
        { id: 9, name: 'Car Sales & Auto', slug: 'car-sales', icon: 'fa-car-side' },
        { id: 10, name: 'Agriculture & Produce', slug: 'agriculture-produce', icon: 'fa-wheat-awn' },
        { id: 11, name: 'Real Estate & Rent', slug: 'real-estate', icon: 'fa-building' },
        { id: 12, name: 'Professional Services', slug: 'professional-services', icon: 'fa-briefcase' }
    ],

    // Seed Registered Sellers with KYC & Guarantor
    fallbackSellers: [
        {
            id: 101,
            full_name: 'Amina Bello Lawal',
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
            registered_at: '2026-08-10'
        },
        {
            id: 102,
            full_name: 'Fatima Zahra Mohammed',
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
            registered_at: '2026-08-15'
        },
        {
            id: 103,
            full_name: 'Blessing Emmanuel',
            id_number: 'NIN-55647382910',
            phone: '+234 805 123 9876',
            location: 'Kaduna (Barnawa)',
            city: 'Kaduna',
            country: 'Nigeria',
            kin_name: 'David Emmanuel (Brother)',
            kin_phone: '+234 809 333 4455',
            store_name: 'Kaduna Premium Hair & Styles',
            category_name: 'Wigs & Beauty',
            verified: 1,
            registered_at: '2026-08-20'
        }
    ],

    // Seed Registered Buyers & Customers
    fallbackBuyers: [
        {
            id: 201,
            full_name: 'Ahmed Yusuf Al-Mansoor',
            phone: '+234 802 345 6789',
            location: 'Abuja (Maitama)',
            city: 'Abuja',
            country: 'Nigeria',
            registered_at: '2026-08-12',
            orders_count: 5
        },
        {
            id: 202,
            full_name: 'Chioma Okafor',
            phone: '+234 813 456 7890',
            location: 'Kano (Nassarawa)',
            city: 'Kano',
            country: 'Nigeria',
            registered_at: '2026-08-18',
            orders_count: 3
        },
        {
            id: 203,
            full_name: 'Ibrahim Al-Rashid',
            phone: '+966 55 112 2334',
            location: 'Kaduna / International',
            city: 'Kaduna',
            country: 'Saudi Arabia',
            registered_at: '2026-08-22',
            orders_count: 8
        },
        {
            id: 204,
            full_name: 'Zainab Kabir Musa',
            phone: '+234 808 222 3344',
            location: 'Abuja (Garki)',
            city: 'Abuja',
            country: 'Nigeria',
            registered_at: '2026-08-25',
            orders_count: 2
        }
    ],

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
                if (p) this.fallbackProducts = JSON.parse(p);
                else localStorage.setItem('globalbiz_products_store', JSON.stringify(this.fallbackProducts));
            } catch (e) {
                console.warn('Local storage sync notice', e);
            }
            this._initialized = true;
        }
    },

    saveLocalData(type, data) {
        try {
            if (type === 'sellers') localStorage.setItem('globalbiz_sellers_store', JSON.stringify(data));
            if (type === 'buyers') localStorage.setItem('globalbiz_buyers_store', JSON.stringify(data));
            if (type === 'products') localStorage.setItem('globalbiz_products_store', JSON.stringify(data));
            if (type === 'businesses') localStorage.setItem('globalbiz_biz_store', JSON.stringify(data));
        } catch (e) {}
    },

    // Seed Registered Businesses
    fallbackBusinesses: [
        {
            id: 1,
            name: 'Amina Luxury Ankara & Fabrics',
            category_id: 2,
            category_name: 'Clothing & Fashion',
            description: 'Direct importer and wholesaler of Grade-A authentic Dutch Wax, Guinea Brocade, and premium Ankara materials.',
            country: 'Nigeria',
            state_province: 'FCT',
            city: 'Abuja',
            area: 'Wuse 2',
            address: 'Shop 18, Emab Plaza, Wuse 2',
            phone: '+234 803 456 7890',
            whatsapp: '+2348034567890',
            email: 'amina@luxurankara.ng',
            opening_hours: '8:30 AM - 6:30 PM',
            delivery_available: 1,
            verified: 1,
            rating: 5.0,
            reviews_count: 42,
            logo_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80',
            featured: 1
        },
        {
            id: 2,
            name: 'Hajiya Wigs & Beauty Palace',
            category_id: 3,
            category_name: 'Wigs & Beauty',
            description: '100% Raw Virgin Human Hair, Double Drawn Bone Straight, frontal closures, and luxury wigs with instant nationwide delivery.',
            country: 'Nigeria',
            state_province: 'Kano',
            city: 'Kano',
            area: 'Kano Municipal',
            address: 'Suite 5, Golden Plaza, Zoo Road',
            phone: '+234 814 999 4455',
            whatsapp: '+2348149994455',
            email: 'orders@kanowigs.ng',
            opening_hours: '9:00 AM - 7:00 PM',
            delivery_available: 1,
            verified: 1,
            rating: 4.9,
            reviews_count: 67,
            logo_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=200&auto=format&fit=crop&q=80',
            featured: 1
        },
        {
            id: 3,
            name: 'Kano Premium Agro & Yam Hub',
            category_id: 10,
            category_name: 'Agriculture & Produce',
            description: 'Wholesale and retail supplier of premium Benue and Niger yams, grains, sesame, and dry agricultural commodities.',
            country: 'Nigeria',
            state_province: 'Kano',
            city: 'Kano',
            area: 'Dawanau Market',
            address: 'Line 4, Dawanau International Grain Market',
            phone: '+234 803 111 2233',
            whatsapp: '+2348031112233',
            email: 'agro@kanoyamhub.ng',
            opening_hours: '7:00 AM - 6:00 PM',
            delivery_available: 1,
            verified: 1,
            rating: 4.9,
            reviews_count: 38,
            logo_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200&auto=format&fit=crop&q=80',
            featured: 1
        }
    ],

    // Seed Marketplace Products Directly Matching User Prompt
    fallbackProducts: [
        {
            id: 1,
            business_id: 1,
            business_name: 'Amina Luxury Ankara & Fabrics',
            seller_name: 'Amina',
            country: 'Nigeria',
            city: 'Abuja',
            area: 'Wuse 2',
            phone: '+234 803 456 7890',
            whatsapp: '+2348034567890',
            business_verified: 1,
            category_id: 2,
            title: 'Authentic 6-Yards Premium Ankara Material',
            description: '100% pure cotton, non-fade vibrant colors. Suitable for men and women traditional wear, weddings, and events.',
            price: 9.68, // Exactly ₦15,000 at 1550 rate
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: '6 Yards (Full Piece)',
            color: 'Vibrant Multi-Color Print',
            brand: 'Original Holland Vlisco Print',
            photo_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Same-day delivery in Abuja, 24h interstate dispatch nationwide.'
        },
        {
            id: 2,
            business_id: 2,
            business_name: 'Hajiya Wigs & Beauty Palace',
            seller_name: 'Hajiya Fatima',
            country: 'Nigeria',
            city: 'Abuja',
            area: 'Garki 2',
            phone: '+234 814 999 4455',
            whatsapp: '+2348149994455',
            business_verified: 1,
            category_id: 3,
            title: 'Luxury Human Hair Wig (HD Lace Frontal)',
            description: '100% natural human hair, pre-plucked hairline with bleached knots. Can be bleached, dyed, and heat styled.',
            price: 51.61, // Exactly ₦80,000 at 1550 rate
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: '22 Inches / 250g Density',
            color: 'Natural Black #1B',
            brand: 'Virgin Glam Hair',
            photo_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Free delivery within Abuja metropolis.'
        },
        {
            id: 3,
            business_id: 2,
            business_name: 'Hajiya Wigs & Beauty Palace',
            seller_name: 'Hajiya Fatima',
            country: 'Nigeria',
            city: 'Kano',
            area: 'Zoo Road',
            phone: '+234 814 999 4455',
            whatsapp: '+2348149994455',
            business_verified: 1,
            category_id: 3,
            title: 'Double Drawn Bone Straight Wig (Super Silky)',
            description: 'Super double drawn Vietnamese bone straight hair. 100% tangle free, flows naturally in the wind, long-lasting shine.',
            price: 77.42, // Exactly ₦120,000 at 1550 rate
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: '28 Inches (Super Long)',
            color: 'Jet Black / Piano Color',
            brand: 'Hajiya Royal Bone Straight',
            photo_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Same-day pickup in Kano or express air/road cargo nationwide.'
        },
        {
            id: 4,
            business_id: 3,
            business_name: 'Kaduna Premium Hair & Styles',
            seller_name: 'Blessing',
            country: 'Nigeria',
            city: 'Kaduna',
            area: 'Barnawa',
            phone: '+234 805 123 9876',
            whatsapp: '+2348051239876',
            business_verified: 1,
            category_id: 3,
            title: 'Chic Short Bob Wig (Ready to Wear)',
            description: 'Classic blunt-cut bob wig, comfortable breathable cap, glueless wear with adjustable straps.',
            price: 22.58, // Exactly ₦35,000 at 1550 rate
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: '10 Inches Bob Cut',
            color: 'Dark Brown & Auburn Highlights',
            brand: 'Kaduna Chic Collection',
            photo_url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Available for immediate pickup in Kaduna or courier shipping.'
        },
        {
            id: 5,
            business_id: 3,
            business_name: 'Kano Premium Agro & Yam Hub',
            seller_name: 'Alhaji Bello',
            country: 'Nigeria',
            city: 'Kano',
            area: 'Dawanau Market',
            phone: '+234 803 111 2233',
            whatsapp: '+2348031112233',
            business_verified: 1,
            category_id: 10,
            title: 'Grade-A Fresh Benue Yams (Tubers in Bulk)',
            description: 'Large size export-quality fresh yams directly from farm gate. Ideal for wholesale, restaurants, or household storage.',
            price: 16.13, // ₦25,000
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: 'Large (3-5kg each)',
            color: 'Natural Tuber',
            brand: 'Benue Harvest',
            photo_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Interstate truck haulage & express same-day dispatch'
        },
        {
            id: 6,
            business_id: 1,
            business_name: 'Abuja SmartTech Banex Hub',
            seller_name: 'Emeka Banex',
            country: 'Nigeria',
            city: 'Abuja',
            area: 'Wuse 2 Banex',
            phone: '+234 809 999 8888',
            whatsapp: '+2348099998888',
            business_verified: 1,
            category_id: 7,
            title: 'Samsung Galaxy S23 Ultra (512GB 5G Phantom Black)',
            description: 'Original brand new factory unlocked with 1-year warranty and original Samsung 45W supercharger.',
            price: 548.38, // ₦850,000
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: '512GB Storage / 12GB RAM',
            color: 'Phantom Black',
            brand: 'Samsung Original',
            photo_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Banex walk-in pickup or secured doorstep delivery in Abuja.'
        }
    ],

    fallbackBuyingRequests: [
        {
            id: 1,
            tracking_code: 'PBA-00101',
            customer_name: 'Ibrahim Al-Rashid',
            customer_phone: '+966551122334',
            item_title: 'Looking for 200 bags of high-grade raw sesame & dried ginger from Northern Nigeria',
            category: 'Agriculture & Produce',
            specifications: 'Must be export standard with moisture below 7%, SGS certified inspection before loading.',
            quantity: '200 Bags',
            budget_min: 3000.0,
            budget_max: 5000.0,
            currency: 'USD',
            target_country: 'Nigeria',
            target_city: 'Kano',
            delivery_date: '2026-10-15',
            package_type: 'Business Procurement',
            service_fee: 150.0,
            status: 'Sourcing',
            assigned_agent: 'Senior Sourcing Officer S. Bello',
            notes: 'Verified 2 top commodity suppliers in Dawanau. Negotiating batch discount.'
        }
    ],

    filterFallbackProducts(params) {
        let results = [...this.fallbackProducts];
        if (params.q) {
            const q = params.q.toLowerCase();
            results = results.filter(p => 
                p.title.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q) ||
                (p.city && p.city.toLowerCase().includes(q)) ||
                (p.country && p.country.toLowerCase().includes(q)) ||
                (p.seller_name && p.seller_name.toLowerCase().includes(q))
            );
        }
        if (params.category_id) {
            results = results.filter(p => p.category_id == params.category_id);
        }
        if (params.country) {
            results = results.filter(p => p.country && p.country.toLowerCase() === params.country.toLowerCase());
        }
        if (params.city) {
            results = results.filter(p => p.city && p.city.toLowerCase() === params.city.toLowerCase());
        }
        if (params.max_price) {
            results = results.filter(p => p.price <= parseFloat(params.max_price));
        }
        return results;
    },

    filterFallbackBusinesses(params) {
        let results = [...this.fallbackBusinesses];
        if (params.q) {
            const q = params.q.toLowerCase();
            results = results.filter(b => 
                b.name.toLowerCase().includes(q) || 
                b.description.toLowerCase().includes(q) ||
                (b.city && b.city.toLowerCase().includes(q)) ||
                (b.country && b.country.toLowerCase().includes(q)) ||
                (b.category_name && b.category_name.toLowerCase().includes(q))
            );
        }
        if (params.category_id) {
            results = results.filter(b => b.category_id == params.category_id);
        }
        if (params.country) {
            results = results.filter(b => b.country && b.country.toLowerCase() === params.country.toLowerCase());
        }
        if (params.city) {
            results = results.filter(b => b.city && b.city.toLowerCase() === params.city.toLowerCase());
        }
        return results;
    }
};
