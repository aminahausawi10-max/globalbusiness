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
            // Local fallback
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

    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        try {
            const res = await fetch(`${this.baseUrl}/products.php?${query}`);
            if (res.ok) {
                const data = await res.json();
                return data.data || [];
            }
        } catch (e) {
            console.warn('Backend offline, using fallback products');
        }
        return this.filterFallbackProducts(params);
    },

    async createProduct(payload) {
        try {
            const res = await fetch(`${this.baseUrl}/products.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            const newProd = { id: Date.now(), ...payload, views: 0 };
            this.fallbackProducts.unshift(newProd);
            return { status: 'success', id: newProd.id, message: 'Product published (Local Mode)' };
        }
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
                message: 'Buying assistance request submitted (Local Mode)'
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

    async getAdminStats() {
        try {
            const res = await fetch(`${this.baseUrl}/admin.php`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Backend offline');
        }
        return {
            status: 'success',
            stats: {
                total_businesses: this.fallbackBusinesses.length,
                verified_businesses: this.fallbackBusinesses.filter(b => b.verified).length,
                total_products: this.fallbackProducts.length,
                total_services: this.fallbackProducts.filter(p => p.is_service).length,
                total_buying_requests: this.fallbackBuyingRequests.length,
                active_assistance_cases: this.fallbackBuyingRequests.filter(r => r.status === 'New' || r.status === 'Sourcing').length
            },
            recent_businesses: this.fallbackBusinesses.slice(0, 5),
            recent_requests: this.fallbackBuyingRequests.slice(0, 5)
        };
    },

    // In-memory fallback dataset for smooth instant rendering
    fallbackCategories: [
        { id: 1, name: 'Food & Groceries', slug: 'food-groceries', icon: 'fa-utensils' },
        { id: 2, name: 'Clothing & Fashion', slug: 'clothing-fashion', icon: 'fa-shirt' },
        { id: 3, name: 'Electronics & IT', slug: 'electronics-it', icon: 'fa-laptop' },
        { id: 4, name: 'Mobile Phones', slug: 'mobile-phones', icon: 'fa-mobile-screen' },
        { id: 5, name: 'Automotive & Repair', slug: 'automotive-repair', icon: 'fa-car' },
        { id: 6, name: 'Furniture & Decor', slug: 'furniture-decor', icon: 'fa-couch' },
        { id: 7, name: 'Agriculture & Produce', slug: 'agriculture-produce', icon: 'fa-wheat-awn' },
        { id: 8, name: 'Building & Construction', slug: 'building-construction', icon: 'fa-trowel-bricks' },
        { id: 9, name: 'Beauty & Cosmetics', slug: 'beauty-cosmetics', icon: 'fa-spa' },
        { id: 10, name: 'Professional Services', slug: 'professional-services', icon: 'fa-briefcase' },
        { id: 11, name: 'Logistics & Delivery', slug: 'logistics-delivery', icon: 'fa-truck-fast' },
        { id: 12, name: 'Real Estate', slug: 'real-estate', icon: 'fa-building' }
    ],

    fallbackBusinesses: [
        {
            id: 1,
            name: 'Kano Premium Agro & Yam Hub',
            category_id: 7,
            category_name: 'Agriculture & Produce',
            description: 'Wholesale and retail supplier of premium Benue and Niger yams, grains, sesame, and dry agricultural commodities.',
            country: 'Nigeria',
            state_province: 'Kano',
            city: 'Kano',
            area: 'Dawanau Market',
            address: 'Line 4, Dawanau International Grain Market',
            latitude: 12.0022,
            longitude: 8.5919,
            phone: '+234 803 111 2233',
            whatsapp: '+2348031112233',
            email: 'agro@kanoyamhub.ng',
            opening_hours: '7:00 AM - 6:00 PM',
            delivery_available: 1,
            verified: 1,
            rating: 4.9,
            reviews_count: 38,
            logo_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200&auto=format&fit=crop&q=80',
            banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
            featured: 1
        },
        {
            id: 2,
            name: 'Al-Malaz Prestige Mens Fashion',
            category_id: 2,
            category_name: 'Clothing & Fashion',
            description: 'Exclusive traditional and contemporary Arabic menswear, thobes, Italian silk fabrics, and bespoke tailoring.',
            country: 'Saudi Arabia',
            state_province: 'Riyadh',
            city: 'Riyadh',
            area: 'Al Malaz',
            address: 'King Abdulaziz Road, Al Malaz District',
            latitude: 24.6711,
            longitude: 46.7329,
            phone: '+966 50 123 4567',
            whatsapp: '+966501234567',
            email: 'sales@almalazfashion.sa',
            opening_hours: '9:00 AM - 11:00 PM',
            delivery_available: 1,
            verified: 1,
            rating: 4.8,
            reviews_count: 54,
            logo_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=200&auto=format&fit=crop&q=80',
            banner_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
            featured: 1
        },
        {
            id: 3,
            name: 'Abuja SmartTech & Phone Repairs',
            category_id: 4,
            category_name: 'Mobile Phones',
            description: 'Certified micro-soldering, screen replacement, genuine spare parts for Apple, Samsung, and Google Pixel.',
            country: 'Nigeria',
            state_province: 'FCT',
            city: 'Abuja',
            area: 'Wuse 2',
            address: 'Suite 14, Banex Plaza, Wuse 2',
            latitude: 9.0765,
            longitude: 7.4798,
            phone: '+234 809 999 8888',
            whatsapp: '+2348099998888',
            email: 'support@abujasmarttech.com',
            opening_hours: '8:30 AM - 7:00 PM',
            delivery_available: 1,
            verified: 1,
            rating: 4.7,
            reviews_count: 92,
            logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80',
            banner_url: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&auto=format&fit=crop&q=80',
            featured: 1
        },
        {
            id: 4,
            name: 'Houston Custom Timber & Modern Furniture',
            category_id: 6,
            category_name: 'Furniture & Decor',
            description: 'Handcrafted solid wood dining tables, executive office desks, and luxury living room furniture with nationwide delivery.',
            country: 'United States',
            state_province: 'Texas',
            city: 'Houston',
            area: 'Galleria Area',
            address: '5085 Westheimer Rd, Houston, TX 77056',
            latitude: 29.7400,
            longitude: -95.4640,
            phone: '+1 713 555 0199',
            whatsapp: '+17135550199',
            email: 'orders@houstontimber.com',
            opening_hours: '9:00 AM - 6:00 PM',
            delivery_available: 1,
            verified: 1,
            rating: 4.9,
            reviews_count: 41,
            logo_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
            banner_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80',
            featured: 1
        },
        {
            id: 5,
            name: 'Nassarawa Eco Car Wash & Auto Detailers',
            category_id: 5,
            category_name: 'Automotive & Repair',
            description: 'High-pressure steam washing, interior ceramic coating, engine degreasing, and mobile door-to-door car wash services.',
            country: 'Nigeria',
            state_province: 'Kano',
            city: 'Kano',
            area: 'Nassarawa GRA',
            address: '12 Bompai Road, Nassarawa GRA',
            latitude: 12.0000,
            longitude: 8.5300,
            phone: '+234 812 345 6789',
            whatsapp: '+2348123456789',
            email: 'wash@nassarawacar.ng',
            opening_hours: '7:00 AM - 8:00 PM',
            delivery_available: 1,
            verified: 0,
            rating: 4.6,
            reviews_count: 23,
            logo_url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=200&auto=format&fit=crop&q=80',
            banner_url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&auto=format&fit=crop&q=80',
            featured: 0
        }
    ],

    fallbackProducts: [
        {
            id: 1,
            business_id: 1,
            business_name: 'Kano Premium Agro & Yam Hub',
            country: 'Nigeria',
            city: 'Kano',
            area: 'Dawanau Market',
            phone: '+234 803 111 2233',
            whatsapp: '+2348031112233',
            business_verified: 1,
            category_id: 7,
            title: 'Grade-A Fresh Benue Yams (Tubers in Bulk)',
            description: 'Large size export-quality fresh yams directly from farm gate. Ideal for wholesale, restaurants, or household storage.',
            price: 18.50,
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: 'Large (3-5kg each)',
            color: 'Natural Tuber',
            brand: 'Benue Harvest',
            photo_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            delivery_info: 'Interstate truck haulage & express same-day dispatch'
        },
        {
            id: 2,
            business_id: 2,
            business_name: 'Al-Malaz Prestige Mens Fashion',
            country: 'Saudi Arabia',
            city: 'Riyadh',
            area: 'Al Malaz',
            phone: '+966 50 123 4567',
            whatsapp: '+966501234567',
            business_verified: 1,
            category_id: 2,
            title: 'Luxury Gold-Embroidered Saudi Thobe',
            description: 'Pure Japanese cotton fabric, elegant gold collar embroidery, tailored fit for weddings, Eid, and formal wear.',
            price: 95.00,
            currency: 'USD',
            is_service: 0,
            stock_status: 'In Stock',
            size: '54 - 62',
            color: 'Pure White & Cream',
            brand: 'Al-Malaz Bespoke',
            photo_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            delivery_info: 'Worldwide DHL / Aramex 3-5 business day shipping'
        },
        {
            id: 3,
            business_id: 3,
            business_name: 'Abuja SmartTech & Phone Repairs',
            country: 'Nigeria',
            city: 'Abuja',
            area: 'Wuse 2',
            phone: '+234 809 999 8888',
            whatsapp: '+2348099998888',
            business_verified: 1,
            category_id: 4,
            title: 'Express iPhone & Samsung OLED Screen Replacement',
            description: 'Original OEM OLED screen fitting with 6 months warranty. Done within 30 minutes by certified micro-engineers.',
            price: 45.00,
            currency: 'USD',
            is_service: 1,
            stock_status: 'Service Available',
            size: 'All Models',
            color: 'OEM Black/Color',
            brand: 'Apple / Samsung Genuine',
            photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'In-shop walk-in & doorstep pickup in Abuja'
        },
        {
            id: 4,
            business_id: 4,
            business_name: 'Houston Custom Timber & Modern Furniture',
            country: 'United States',
            city: 'Houston',
            area: 'Galleria Area',
            phone: '+1 713 555 0199',
            whatsapp: '+17135550199',
            business_verified: 1,
            category_id: 6,
            title: 'Handcrafted Solid Walnut 8-Seater Dining Table',
            description: 'Kiln-dried American black walnut with live edge finish and matte black heavy-duty steel base.',
            price: 1250.00,
            currency: 'USD',
            is_service: 0,
            stock_status: 'Custom Order (5 Days)',
            size: '96" x 40" x 30"',
            color: 'Natural Walnut',
            brand: 'Houston Timber Co',
            photo_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            audio_url: '',
            delivery_info: 'White-glove home delivery and installation included'
        },
        {
            id: 5,
            business_id: 5,
            business_name: 'Nassarawa Eco Car Wash & Auto Detailers',
            country: 'Nigeria',
            city: 'Kano',
            area: 'Nassarawa GRA',
            phone: '+234 812 345 6789',
            whatsapp: '+2348123456789',
            business_verified: 0,
            category_id: 5,
            title: 'Executive Ceramic Steam Car Detail & Polish',
            description: 'Multi-stage paint decontamination, interior leather steam disinfection, and 6-month ceramic sealant.',
            price: 30.00,
            currency: 'USD',
            is_service: 1,
            stock_status: 'Service Available',
            size: 'Sedan / SUV',
            color: 'Gloss Finish',
            brand: 'EcoDetail Pro',
            photo_url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop&q=80',
            video_url: '',
            audio_url: '',
            delivery_info: 'Mobile van dispatch available to homes and offices in Kano'
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
        },
        {
            id: 2,
            tracking_code: 'PBA-00102',
            customer_name: 'Chioma Okafor',
            customer_phone: '+2348022233445',
            item_title: 'Need custom solid oak king-size bed frame shipped to Abuja',
            category: 'Furniture & Decor',
            specifications: 'Scandinavian minimalist design, integrated bedside lighting, heavy duty joints.',
            quantity: '1 Unit',
            budget_min: 600.0,
            budget_max: 900.0,
            currency: 'USD',
            target_country: 'Nigeria',
            target_city: 'Abuja',
            delivery_date: '2026-10-01',
            package_type: 'Full Buying Assistance',
            service_fee: 45.0,
            status: 'Customer Approval',
            assigned_agent: 'Agent Mary M.',
            notes: 'Sourced 2 master carpenters in Industrial Layout. Samples sent to customer.'
        }
    ],

    filterFallbackProducts(params) {
        let results = [...this.fallbackProducts];
        if (params.q) {
            const q = params.q.toLowerCase();
            results = results.filter(p => 
                p.title.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q) ||
                p.city.toLowerCase().includes(q) ||
                p.country.toLowerCase().includes(q)
            );
        }
        if (params.category_id) {
            results = results.filter(p => p.category_id == params.category_id);
        }
        if (params.country) {
            results = results.filter(p => p.country.toLowerCase() === params.country.toLowerCase());
        }
        if (params.city) {
            results = results.filter(p => p.city.toLowerCase() === params.city.toLowerCase());
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
                b.city.toLowerCase().includes(q) ||
                b.country.toLowerCase().includes(q) ||
                b.category_name.toLowerCase().includes(q)
            );
        }
        if (params.category_id) {
            results = results.filter(b => b.category_id == params.category_id);
        }
        if (params.country) {
            results = results.filter(b => b.country.toLowerCase() === params.country.toLowerCase());
        }
        if (params.city) {
            results = results.filter(b => b.city.toLowerCase() === params.city.toLowerCase());
        }
        return results;
    }
};
