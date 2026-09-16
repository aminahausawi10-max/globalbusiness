/**
 * Market at Home — Unified Reactive Controller
 * Powers Buyer Portal, Seller Portal, and Admin Control Center
 */

const WORLD_LOCATIONS = {
    'Nigeria': ['Abuja (FCT)', 'Lagos', 'Kano', 'Rivers (Port Harcourt)', 'Oyo (Ibadan)', 'Enugu', 'Kaduna', 'Delta', 'Anambra', 'Edo', 'Ogun', 'Plateau', 'Benue', 'Akwa Ibom', 'Ondo', 'Imo', 'Borno', 'Sokoto', 'Bauchi', 'Cross River', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Abia', 'Adamawa', 'Bayelsa', 'Ebonyi', 'Ekiti', 'Gombe', 'Jigawa', 'Kebbi', 'Katsina', 'Taraba', 'Yobe', 'Zamfara'],
    'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Georgia', 'Pennsylvania', 'Ohio', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington', 'Massachusetts', 'Arizona', 'Maryland', 'Indiana', 'Tennessee', 'Missouri', 'Wisconsin', 'Colorado', 'Minnesota'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'West Midlands', 'Greater Manchester', 'Leeds / West Yorkshire', 'Glasgow', 'Liverpool / Merseyside', 'Edinburgh', 'Bristol', 'Sheffield / South Yorkshire', 'Newcastle'],
    'Canada': ['Ontario (Toronto)', 'British Columbia (Vancouver)', 'Quebec (Montreal)', 'Alberta (Calgary / Edmonton)', 'Manitoba (Winnipeg)', 'Saskatchewan', 'Nova Scotia (Halifax)'],
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    'Ghana': ['Greater Accra (Accra)', 'Ashanti (Kumasi)', 'Western (Takoradi)', 'Central (Cape Coast)', 'Eastern (Koforidua)', 'Northern (Tamale)'],
    'China': ['Guangdong (Guangzhou / Shenzhen)', 'Zhejiang (Yiwu / Hangzhou)', 'Shanghai', 'Beijing', 'Jiangsu (Suzhou / Nanjing)', 'Shandong (Qingdao)', 'Fujian (Xiamen)', 'Hong Kong'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    'South Africa': ['Gauteng (Johannesburg / Pretoria)', 'Western Cape (Cape Town)', 'KwaZulu-Natal (Durban)', 'Eastern Cape (Gqeberha / Port Elizabeth)'],
    'Saudi Arabia': ['Riyadh', 'Makkah / Mecca', 'Jeddah', 'Madinah / Medina', 'Eastern Province (Dammam / Khobar)']
};

const AppState = {
    currentPage: 'home',
    currentBuyerTab: 'dashboard',
    currentAdminTab: 'dashboard',
    currentCurrency: 'USD',
    currencyRates: {
        USD: { symbol: '$', rate: 1.0 },
        NGN: { symbol: '₦', rate: 1550.0 },
        GBP: { symbol: '£', rate: 0.78 },
        EUR: { symbol: '€', rate: 0.92 },
        CAD: { symbol: 'CA$', rate: 1.36 },
        AED: { symbol: 'AED ', rate: 3.67 },
        SAR: { symbol: '﷼', rate: 3.75 },
        CNY: { symbol: '¥', rate: 7.24 },
        GHS: { symbol: 'GH₵', rate: 15.60 },
        KES: { symbol: 'KSh ', rate: 129.50 },
        ZAR: { symbol: 'R ', rate: 18.20 }
    },
    activeCategoryFilter: '',
    activeCountryFilter: '',
    activeStateFilter: '',
    selectedAssistancePackage: 'Full Buying Assistance',
    selectedAssistanceFee: 60.00
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupCurrencySwitcher();
    updateNavAuthUI();
    updateCartBadge();
    updateFavBadge();
    renderLiveAnnouncementBanner();

    // Load Data
    await loadCategories();
    await loadMarketplaceProducts();
    await loadBuyerDashboard();
    await loadSellerDashboard();
    await loadAdminPortal();
}

// ==========================================
// AUTHENTICATION & SESSION MANAGEMENT
// ==========================================
function getCurrentUser() {
    try {
        const u = localStorage.getItem('globalbiz_current_user');
        return u ? JSON.parse(u) : null;
    } catch (e) {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem('globalbiz_current_user', JSON.stringify(user));
    updateNavAuthUI();
}

function clearCurrentUser() {
    localStorage.removeItem('globalbiz_current_user');
    updateNavAuthUI();
}

function isAdminAuthenticated() {
    return localStorage.getItem('globalbiz_admin_session') === 'active';
}

function handleAdminLogin(event) {
    if (event) event.preventDefault();
    const u = (document.getElementById('adminUsernameInput')?.value || '').trim();
    const p = (document.getElementById('adminPasswordInput')?.value || '').trim();

    const storedPass = localStorage.getItem('globalbiz_admin_password') || 'admin123';

    if ((u.toLowerCase() === 'admin' || u.toLowerCase() === 'amina' || u === '09090809080') && (p === storedPass || p === 'admin123')) {
        localStorage.setItem('globalbiz_admin_session', 'active');
        showToast('Welcome Administrator Amina! Admin Control Center unlocked.', 'success');
        loadAdminPortal();
    } else {
        showToast('Invalid administrator credentials. Use admin / admin123', 'error');
    }
}

function handleAdminLogout() {
    localStorage.removeItem('globalbiz_admin_session');
    showToast('Signed out of Administrator Portal', 'info');
    loadAdminPortal();
    switchPage('home');
}

function handleUserLogin(event) {
    if (event) event.preventDefault();
    const phoneEmail = (document.getElementById('loginPhoneEmail')?.value || '').trim().toLowerCase();
    const password = (document.getElementById('loginPassword')?.value || '').trim();

    if (!phoneEmail || !password) {
        showToast('Please enter both identifier and password', 'error');
        return;
    }

    // Check if user is buyer or seller
    API.getMembers().then(members => {
        const found = members.find(m => 
            (m.email && m.email.toLowerCase() === phoneEmail) || 
            (m.phone && m.phone.replace(/[^0-9]/g, '').includes(phoneEmail.replace(/[^0-9]/g, ''))) ||
            (m.full_name && m.full_name.toLowerCase() === phoneEmail)
        );

        if (found) {
            const userObj = {
                id: found.id,
                full_name: found.full_name,
                email: found.email || 'user@marketathome.com',
                phone: found.phone,
                role: (found.role || 'Buyer').toLowerCase(),
                location: found.location || 'Abuja, Nigeria'
            };
            setCurrentUser(userObj);
            closeModal('userAuthModal');
            showToast('Welcome back, ' + found.full_name + '!', 'success');
            
            if (userObj.role === 'seller') {
                switchPage('seller');
            } else {
                switchPage('buyer');
            }
        } else {
            // Create user automatically for fast preview
            const isSeller = phoneEmail.includes('seller') || phoneEmail.includes('store');
            const newUser = {
                id: Date.now(),
                full_name: phoneEmail.split('@')[0].toUpperCase(),
                email: phoneEmail.includes('@') ? phoneEmail : (phoneEmail + '@marketathome.com'),
                phone: phoneEmail.includes('@') ? '+234 800 000 0000' : phoneEmail,
                role: isSeller ? 'seller' : 'buyer',
                location: 'Abuja, Nigeria'
            };
            setCurrentUser(newUser);
            closeModal('userAuthModal');
            showToast('Signed in successfully!', 'success');
            switchPage(newUser.role);
        }
    });
}

function handleUserRegister(event) {
    if (event) event.preventDefault();
    const role = document.querySelector('input[name="authRole"]:checked')?.value || 'buyer';
    const fullName = document.getElementById('regFullName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const location = document.getElementById('regLocation')?.value.trim();
    const password = document.getElementById('regPassword')?.value.trim();

    if (!fullName || !phone) {
        showToast('Please fill in all required registration fields', 'error');
        return;
    }

    if (role === 'seller') {
        API.registerSeller({
            full_name: fullName,
            email: email,
            phone: phone,
            location: location,
            store_name: fullName + "'s Store"
        }).then(res => {
            const userObj = {
                id: res.data.id,
                full_name: fullName,
                email: email,
                phone: phone,
                role: 'seller',
                location: location
            };
            setCurrentUser(userObj);
            closeModal('userAuthModal');
            showToast('Seller registration completed! Welcome to your Seller Portal.', 'success');
            switchPage('seller');
        });
    } else {
        API.createBuyer({
            full_name: fullName,
            email: email,
            phone: phone,
            location: location,
            delivery_address: location
        }).then(res => {
            const userObj = {
                id: res.data.id,
                full_name: fullName,
                email: email,
                phone: phone,
                role: 'buyer',
                location: location
            };
            setCurrentUser(userObj);
            closeModal('userAuthModal');
            showToast('Buyer account created successfully! Welcome to your Buyer Portal.', 'success');
            switchPage('buyer');
        });
    }
}

function handleUserLogout() {
    clearCurrentUser();
    showToast('Signed out of account', 'info');
    switchPage('home');
}

function openUserAuthModal(tab = 'login', role = 'buyer') {
    switchAuthTab(tab);
    toggleAuthRole(role);
    document.getElementById('userAuthModal')?.classList.add('active');
}

function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('authTabLoginBtn')?.classList.toggle('active', isLogin);
    document.getElementById('authTabRegisterBtn')?.classList.toggle('active', !isLogin);
    const loginView = document.getElementById('authLoginFormView');
    const regView = document.getElementById('authRegisterFormView');
    if (loginView) loginView.style.display = isLogin ? 'block' : 'none';
    if (regView) regView.style.display = !isLogin ? 'block' : 'none';
}

function toggleAuthRole(role) {
    const isBuyer = role === 'buyer';
    const buyerLabel = document.getElementById('roleBuyerLabel');
    const sellerLabel = document.getElementById('roleSellerLabel');
    if (buyerLabel && sellerLabel) {
        buyerLabel.style.borderColor = isBuyer ? 'var(--brand-green)' : 'var(--border)';
        buyerLabel.style.background = isBuyer ? 'var(--brand-green-soft)' : 'var(--bg-alt)';
        sellerLabel.style.borderColor = !isBuyer ? 'var(--brand-green)' : 'var(--border)';
        sellerLabel.style.background = !isBuyer ? 'var(--brand-green-soft)' : 'var(--bg-alt)';
    }
    const rInputs = document.querySelectorAll('input[name="authRole"]');
    rInputs.forEach(i => { if (i.value === role) i.checked = true; });
}

function handleNavAuthBtnClick() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'seller') switchPage('seller');
        else switchPage('buyer');
    } else if (isAdminAuthenticated()) {
        switchPage('admin');
    } else {
        openUserAuthModal('login');
    }
}

function updateNavAuthUI() {
    const navAuthText = document.getElementById('navAuthText');
    const user = getCurrentUser();
    if (user) {
        if (navAuthText) navAuthText.innerText = user.full_name.split(' ')[0] + ' (' + (user.role === 'seller' ? 'Seller' : 'Buyer') + ')';
    } else if (isAdminAuthenticated()) {
        if (navAuthText) navAuthText.innerText = 'Admin Desk';
    } else {
        if (navAuthText) navAuthText.innerText = 'Sign In';
    }
}

// ==========================================
// ROUTING & PORTAL NAVIGATION
// ==========================================
function switchPage(pageName) {
    AppState.currentPage = pageName;
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));

    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('[data-page="' + pageName + '"]').forEach(el => el.classList.add('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageName === 'buyer') loadBuyerDashboard();
    if (pageName === 'seller') loadSellerDashboard();
    if (pageName === 'admin') loadAdminPortal();
}

function switchBuyerTab(tabName) {
    AppState.currentBuyerTab = tabName;
    document.querySelectorAll('.buyer-subtab-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('#page-buyer .sub-tab-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById('buyer-tab-' + tabName);
    const targetBtn = document.getElementById('buyerTabBtn-' + tabName);
    if (targetView) targetView.style.display = 'block';
    if (targetBtn) targetBtn.classList.add('active');

    if (tabName === 'orders') renderBuyerOrders('all');
    if (tabName === 'cart') renderCart();
    if (tabName === 'favorites') renderBuyerFavorites();
    if (tabName === 'notifications') renderBuyerNotifications();
    if (tabName === 'profile') loadBuyerProfile();
}

function switchAdminTab(tabName) {
    AppState.currentAdminTab = tabName;
    document.querySelectorAll('.admin-tab-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.admin-sidebar-item').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById('admin-tab-' + tabName);
    const targetMenu = document.getElementById('adminMenu-' + tabName);
    if (targetView) targetView.style.display = 'block';
    if (targetMenu) targetMenu.classList.add('active');

    if (tabName === 'analytics') renderAdminAnalytics();
    if (tabName === 'settings') renderAdminCategoriesTable();
}

// ==========================================
// BROADCAST ANNOUNCEMENT TICKER
// ==========================================
async function renderLiveAnnouncementBanner() {
    const banner = document.getElementById('siteAnnouncementBanner');
    const textEl = document.getElementById('siteAnnouncementText');
    if (!banner || !textEl) return;

    const announcements = await API.getAnnouncements();
    if (announcements && announcements.length > 0) {
        textEl.innerHTML = '<strong>' + announcements[0].title + '</strong> — ' + announcements[0].message;
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
}

function dismissAnnouncement() {
    const banner = document.getElementById('siteAnnouncementBanner');
    if (banner) banner.style.display = 'none';
}

// ==========================================
// CURRENCY & FORMATTING
// ==========================================
function setupCurrencySwitcher() {
    const selector = document.getElementById('currencySelector');
    if (!selector) return;
    selector.addEventListener('change', (e) => {
        AppState.currentCurrency = e.target.value;
        loadMarketplaceProducts();
        loadBuyerDashboard();
        renderCart();
        showToast('Currency switched to ' + AppState.currentCurrency, 'info');
    });
}

function formatPrice(usdPrice) {
    const currencyInfo = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates.USD;
    const converted = (parseFloat(usdPrice) || 0) * currencyInfo.rate;
    
    if (AppState.currentCurrency === 'NGN') {
        return '₦' + Math.round(converted).toLocaleString('en-US');
    }
    return currencyInfo.symbol + converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==========================================
// CATEGORIES & MARKETPLACE BROWSING
// ==========================================
async function loadCategories() {
    const categories = await API.getCategories();
    
    // Home Categories Grid
    const homeCatGrid = document.getElementById('homeCategoriesGrid');
    if (homeCatGrid) {
        homeCatGrid.innerHTML = categories.map(c => `
            <div class="category-card" onclick="filterByCategory('${c.id}', '${c.name}')">
                <div class="category-icon"><i class="fa-solid ${c.icon || 'fa-tag'}"></i></div>
                <div class="category-name">${c.name}</div>
                <div class="category-desc">${c.description || 'Verified goods'}</div>
            </div>
        `).join('');
    }

    // Filter dropdowns
    const marketSelect = document.getElementById('marketCategoryFilter');
    if (marketSelect) {
        marketSelect.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    const sellerProdCategory = document.getElementById('sellerProdCategory');
    if (sellerProdCategory) {
        sellerProdCategory.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

function filterByCategory(categoryId, categoryName) {
    switchPage('marketplace');
    const select = document.getElementById('marketCategoryFilter');
    if (select) select.value = categoryId;
    filterMarketplace();
    showToast('Filtered by ' + categoryName, 'info');
}

async function loadMarketplaceProducts() {
    const products = await API.getProducts();
    renderProductsGrid(products, 'marketplaceProductsGrid');
    renderProductsGrid(products.slice(0, 4), 'homeFeaturedProductsGrid');
}

function renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px 20px; color:var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size:2.5rem; margin-bottom:10px; display:block;"></i>
            <h3>No products found</h3>
            <p>Try adjusting your search query, country, or category filters.</p>
        </div>`;
        return;
    }

    container.innerHTML = products.map(p => {
        const isFav = API.isFavorite(p.id);
        return `
            <div class="product-card" onclick="openProductDetailModal(${p.id})">
                <div class="product-img-wrapper" style="position:relative;">
                    <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${p.title}" class="product-img" loading="lazy">
                    <button class="fav-toggle-btn ${isFav ? 'active' : ''}" onclick="toggleFavoriteItem(${p.id}, event)" title="Save to Favorites" style="position:absolute; top:10px; right:10px; z-index:5;">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <span class="product-cat-pill" style="position:absolute; bottom:10px; left:10px; z-index:5;">${p.category_name || 'General'}</span>
                </div>
                <div class="product-content">
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <h3 class="product-title">${p.title}</h3>
                    <p class="product-desc">${p.description || 'High quality verified marketplace listing'}</p>
                    <div class="product-seller-info">
                        <i class="fa-solid fa-store" style="color:var(--brand-green);"></i>
                        <span>${p.seller_name || 'Verified Merchant'} &bull; <strong style="color:var(--text-main);">${p.city || p.location || 'Abuja'}</strong></span>
                    </div>
                    <div class="product-actions" style="margin-top:10px; display:flex; gap:6px;">
                        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="event.stopPropagation(); handleAddToCartFromDetail(${p.id});">
                            <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openProductDetailModal(${p.id});">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function filterMarketplace() {
    const q = document.getElementById('marketSearchFilter')?.value || '';
    const category_id = document.getElementById('marketCategoryFilter')?.value || '';
    const country = document.getElementById('marketCountryFilter')?.value || '';
    const state = document.getElementById('marketStateFilter')?.value || '';

    const products = await API.getProducts({ q, category_id, country, state });
    renderProductsGrid(products, 'marketplaceProductsGrid');
}

function handleHeroSearch(event) {
    if (event) event.preventDefault();
    const query = document.getElementById('heroSearchInput')?.value || '';
    const country = document.getElementById('heroCountrySelect')?.value || '';
    const state = document.getElementById('heroStateSelect')?.value || '';

    switchPage('marketplace');
    const sInput = document.getElementById('marketSearchFilter');
    const cSelect = document.getElementById('marketCountryFilter');
    const stSelect = document.getElementById('marketStateFilter');

    if (sInput) sInput.value = query;
    if (cSelect) {
        cSelect.value = country;
        populateStateDropdown(stSelect, country, state);
    }
    filterMarketplace();
}

function handleHeroCountryChange(country) {
    const stateSelect = document.getElementById('heroStateSelect');
    populateStateDropdown(stateSelect, country);
}

function handleMarketCountryChange(country) {
    const stateSelect = document.getElementById('marketStateFilter');
    populateStateDropdown(stateSelect, country);
    filterMarketplace();
}

function populateStateDropdown(selectEl, country, selectedState = '') {
    if (!selectEl) return;
    const states = WORLD_LOCATIONS[country] || [];
    let html = '<option value="">All States / Regions</option>';
    if (states.length > 0) {
        html += states.map(st => `<option value="${st}" ${st === selectedState ? 'selected' : ''}>${st}</option>`).join('');
    }
    selectEl.innerHTML = html;
}

function filterByWorldwideLocation(country, state, el) {
    document.querySelectorAll('.hero-loc-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');

    switchPage('marketplace');
    const cSelect = document.getElementById('marketCountryFilter');
    if (cSelect) {
        cSelect.value = country;
        handleMarketCountryChange(country);
    }
    const sSelect = document.getElementById('marketStateFilter');
    if (sSelect && state) sSelect.value = state;
    filterMarketplace();
}

function resetMarketplaceFilters() {
    const sInput = document.getElementById('marketSearchFilter');
    const cSelect = document.getElementById('marketCategoryFilter');
    const countrySelect = document.getElementById('marketCountryFilter');
    const stateSelect = document.getElementById('marketStateFilter');
    if (sInput) sInput.value = '';
    if (cSelect) cSelect.value = '';
    if (countrySelect) { countrySelect.value = ''; handleMarketCountryChange(''); }
    if (stateSelect) stateSelect.value = '';
    filterMarketplace();
    showToast('Marketplace filters reset', 'info');
}

function searchFor(keyword) {
    switchPage('marketplace');
    const sInput = document.getElementById('marketSearchFilter');
    if (sInput) sInput.value = keyword;
    filterMarketplace();
}

// ==========================================
// PRODUCT DETAILS & ACTIONS
// ==========================================
async function openProductDetailModal(productId) {
    const product = await API.getProduct(productId);
    if (!product) return;

    const modalTitle = document.getElementById('detailModalTitle');
    const content = document.getElementById('detailModalContent');
    if (modalTitle) modalTitle.innerText = product.title;

    const cleanPhone = (product.seller_phone || product.phone || '+2348000000000').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hello ${product.seller_name || 'Seller'}, I am interested in buying "${product.title}" listed on Market at Home for ${formatPrice(product.price)}.`);
    const waLink = `https://wa.me/${cleanPhone}?text=${waText}`;
    const isFav = API.isFavorite(product.id);

    if (content) {
        content.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                <div>
                    <img src="${product.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${product.title}" style="width:100%; border-radius:12px; object-fit:cover; max-height:340px; border:1px solid var(--border);">
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> ${product.category_name || 'General'}</span>
                        <button class="fav-toggle-btn ${isFav ? 'active' : ''}" onclick="toggleFavoriteItem(${product.id}, event); openProductDetailModal(${product.id});" title="Toggle Favorite">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                    <h2 style="font-size:1.3rem; font-weight:800; color:var(--primary); margin-bottom:8px;">${product.title}</h2>
                    <div style="font-size:1.4rem; font-weight:900; color:var(--brand-green); margin-bottom:12px;">${formatPrice(product.price)}</div>
                    
                    <div style="background:var(--bg-alt); padding:12px 14px; border-radius:var(--radius-md); margin-bottom:14px; font-size:0.85rem;">
                        <div><strong>🏪 Seller:</strong> ${product.seller_name || 'Verified Merchant'}</div>
                        <div><strong>📍 Location:</strong> ${product.city || product.location || 'Abuja'}, ${product.country || 'Nigeria'}</div>
                        <div><strong>📦 Available Qty:</strong> ${product.available_qty || 50} units in stock</div>
                    </div>

                    <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">
                        ${product.description || 'Quality verified marketplace good.'}
                    </p>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-primary" style="flex:2; padding:12px;" onclick="handleAddToCartFromDetail(${product.id}); closeModal('productDetailModal'); openCartModal();">
                                <i class="fa-solid fa-cart-shopping"></i> Buy Now / Checkout
                            </button>
                            <button class="btn btn-success" style="flex:1; padding:12px;" onclick="handleAddToCartFromDetail(${product.id});">
                                <i class="fa-solid fa-plus"></i> Add to Cart
                            </button>
                        </div>
                        <a href="${waLink}" target="_blank" class="btn btn-outline" style="color:#25D366; border-color:#25D366; text-align:center;">
                            <i class="fa-brands fa-whatsapp"></i> Chat / Contact Seller Directly
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById('productDetailModal')?.classList.add('active');
}

function handleAddToCartFromDetail(productId) {
    API.getProduct(productId).then(product => {
        if (product) {
            API.addToCart(product, 1);
            updateCartBadge();
            showToast(`Added "${product.title}" to your cart!`, 'success');
        }
    });
}

// ==========================================
// SHOPPING CART & CHECKOUT ENGINE
// ==========================================
function updateCartBadge() {
    const cart = API.getCart();
    const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const navBadge = document.getElementById('navCartBadge');
    const buyerHeaderBadge = document.getElementById('buyerHeaderCartCount');
    const buyerCartTabCount = document.getElementById('buyerCartTabCount');
    const buyerKpiCart = document.getElementById('buyerKpiCartCount');
    const buyerCartViewCount = document.getElementById('buyerCartViewCount');

    if (navBadge) {
        navBadge.innerText = count;
        navBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (buyerHeaderBadge) buyerHeaderBadge.innerText = count;
    if (buyerCartTabCount) buyerCartTabCount.innerText = count;
    if (buyerKpiCart) buyerKpiCart.innerText = count;
    if (buyerCartViewCount) buyerCartViewCount.innerText = count;
}

function openCartModal() {
    renderCart();
    document.getElementById('cartModal')?.classList.add('active');
}

function renderCart() {
    const cart = API.getCart();
    updateCartBadge();

    // Modal List
    const modalList = document.getElementById('modalCartItemsList');
    const modalTotal = document.getElementById('modalCartTotalDisplay');
    
    // Buyer Page Tab Cart List
    const pageCartList = document.getElementById('buyerCartItemsContainer');
    const checkoutSubtotal = document.getElementById('checkoutSubtotalDisplay');
    const checkoutTotal = document.getElementById('checkoutTotalDisplay');

    const totalUsd = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const formattedTotal = formatPrice(totalUsd);

    if (modalTotal) modalTotal.innerText = formattedTotal;
    if (checkoutSubtotal) checkoutSubtotal.innerText = formattedTotal;
    if (checkoutTotal) checkoutTotal.innerText = formattedTotal;

    const cartHtml = cart.length === 0 
        ? `<div style="text-align:center; padding:30px; color:var(--text-muted);">
            <i class="fa-solid fa-cart-arrow-down" style="font-size:2.5rem; margin-bottom:8px; display:block;"></i>
            Your shopping cart is empty.
        </div>`
        : cart.map(item => `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; border-bottom:1px solid var(--border);">
                <img src="${item.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=100'}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" alt="${item.title}">
                <div style="flex:1;">
                    <strong style="font-size:0.86rem; color:var(--primary); display:block;">${item.title}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted);">Seller: ${item.seller_name || 'Merchant'} &bull; ${formatPrice(item.price)} each</span>
                </div>
                <div class="qty-control">
                    <button class="qty-btn" onclick="handleUpdateCartQty(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="handleUpdateCartQty(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <strong style="color:var(--brand-green); font-size:0.9rem;">${formatPrice(item.price * item.quantity)}</strong>
                <button class="btn btn-sm btn-outline" style="color:#EF4444; border:none; padding:4px;" onclick="handleRemoveFromCart(${item.id})" title="Remove item">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');

    if (modalList) modalList.innerHTML = cartHtml;
    if (pageCartList) pageCartList.innerHTML = cartHtml;
}

function handleUpdateCartQty(productId, newQty) {
    API.updateCartQuantity(productId, newQty);
    renderCart();
}

function handleRemoveFromCart(productId) {
    API.removeFromCart(productId);
    renderCart();
    showToast('Item removed from cart', 'info');
}

function handleClearCart() {
    API.clearCart();
    renderCart();
    showToast('Shopping cart cleared', 'info');
}

async function handleProcessCheckout(event) {
    if (event) event.preventDefault();
    const cart = API.getCart();
    if (!cart || cart.length === 0) {
        showToast('Your shopping cart is empty!', 'error');
        return;
    }

    const name = document.getElementById('checkoutName')?.value.trim();
    const phone = document.getElementById('checkoutPhone')?.value.trim();
    const email = document.getElementById('checkoutEmail')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();
    const city = document.getElementById('checkoutCity')?.value.trim();
    const country = document.getElementById('checkoutCountry')?.value.trim();
    const notes = document.getElementById('checkoutNotes')?.value.trim();

    const totalUsd = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const orderPayload = {
        buyer_name: name,
        buyer_phone: phone,
        buyer_email: email,
        delivery_address: address,
        delivery_city: city,
        delivery_country: country,
        items: cart,
        total_amount: totalUsd,
        notes: notes
    };

    const res = await API.createOrder(orderPayload);
    API.clearCart();
    renderCart();

    showToast(`Order placed successfully! Tracking Order Code: ${res.order_number}`, 'success');
    
    // Switch to Buyer Orders tab
    switchPage('buyer');
    switchBuyerTab('orders');
    loadAdminPortal();
}

// ==========================================
// FAVORITES / WISHLIST ENGINE
// ==========================================
function toggleFavoriteItem(productId, event) {
    if (event) event.stopPropagation();
    const res = API.toggleFavorite(productId);
    updateFavBadge();
    showToast(res.added ? 'Added to your favorites wishlist ❤️' : 'Removed from favorites', 'info');
    loadMarketplaceProducts();
    if (AppState.currentPage === 'buyer' && AppState.currentBuyerTab === 'favorites') {
        renderBuyerFavorites();
    }
}

function updateFavBadge() {
    const favs = API.getFavorites();
    const badge = document.getElementById('navFavBadge');
    const kpi = document.getElementById('buyerKpiFavCount');
    const tabBadge = document.getElementById('buyerFavTabCount');
    if (badge) {
        badge.innerText = favs.length;
        badge.style.display = favs.length > 0 ? 'inline-flex' : 'none';
    }
    if (kpi) kpi.innerText = favs.length;
    if (tabBadge) tabBadge.innerText = favs.length;
}

async function renderBuyerFavorites() {
    const favIds = API.getFavorites();
    const allProducts = await API.getProducts();
    const favProducts = allProducts.filter(p => favIds.includes(p.id));
    renderProductsGrid(favProducts, 'buyerFavoritesGrid');
}

// ==========================================
// BUYER DASHBOARD & ORDERS MANAGEMENT
// ==========================================
async function loadBuyerDashboard() {
    const user = getCurrentUser();
    
    // Update Header Display
    if (user) {
        const nameEl = document.getElementById('buyerDisplayName');
        const phoneEl = document.getElementById('buyerDisplayPhone');
        const emailEl = document.getElementById('buyerDisplayEmail');
        const locEl = document.getElementById('buyerDisplayLocation');
        const avatarEl = document.getElementById('buyerAvatarCircle');

        if (nameEl) nameEl.innerText = user.full_name;
        if (phoneEl) phoneEl.innerHTML = '<i class="fa-solid fa-phone" style="color:#10B981;"></i> ' + user.phone;
        if (emailEl) emailEl.innerHTML = '<i class="fa-solid fa-envelope" style="color:#38BDF8;"></i> ' + (user.email || 'buyer@marketathome.com');
        if (locEl) locEl.innerHTML = '<i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> ' + (user.location || 'Abuja, Nigeria');
        if (avatarEl) avatarEl.innerText = user.full_name.charAt(0).toUpperCase();
    }

    // Recommended goods
    const allProds = await API.getProducts();
    renderProductsGrid(allProds.slice(0, 4), 'buyerRecommendedGrid');

    // Orders Count
    const orders = await API.getOrders();
    const myOrders = user ? await API.getBuyerMarketplaceOrders(user) : orders;
    const kpiOrders = document.getElementById('buyerKpiOrdersCount');
    const tabOrders = document.getElementById('buyerOrdersTabCount');
    if (kpiOrders) kpiOrders.innerText = myOrders.length;
    if (tabOrders) tabOrders.innerText = myOrders.length;

    updateCartBadge();
    updateFavBadge();
}

async function renderBuyerOrders(filterStatus = 'all') {
    const user = getCurrentUser();
    let orders = user ? await API.getBuyerMarketplaceOrders(user) : await API.getOrders();
    
    if (filterStatus !== 'all') {
        orders = orders.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
    }

    const container = document.getElementById('buyerOrdersListContainer');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size:2.5rem; margin-bottom:8px; display:block;"></i>
            No orders found under "${filterStatus}".
        </div>`;
        return;
    }

    container.innerHTML = orders.map(o => {
        const cleanPhone = (o.seller_phone || '+2348000000000').replace(/[^0-9]/g, '');
        const waText = encodeURIComponent(`Hello ${o.seller_name}, I am following up on my Order (${o.order_number} - ${o.item_name}). Live status: ${o.status}`);
        const waLink = `https://wa.me/${cleanPhone}?text=${waText}`;
        
        const statusClass = 'badge-' + o.status.toLowerCase();

        return `
            <div class="card" style="margin-bottom:14px; border:1px solid var(--border); padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:10px;">
                    <div>
                        <span style="font-family:monospace; font-weight:800; font-size:1rem; color:var(--primary);">${o.order_number}</span>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Placed on ${o.created_at || '2026-09-16'} &bull; Escrow Protected</div>
                    </div>
                    <span class="badge ${statusClass}" style="font-size:0.8rem; padding:6px 12px; font-weight:800;">
                        <i class="fa-solid fa-circle-dot"></i> ${o.status}
                    </span>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:0.85rem; margin-bottom:14px;">
                    <div>
                        <strong style="color:var(--primary);">${o.item_name}</strong>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">Qty: ${o.quantity} units &bull; Total: <strong style="color:var(--brand-green);">${formatPrice(o.total_amount)}</strong></div>
                    </div>
                    <div>
                        <strong>🏪 Seller:</strong> ${o.seller_name}<br>
                        <strong>📍 Delivery:</strong> ${o.delivery_address || 'Abuja, Nigeria'}
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <a href="${waLink}" target="_blank" class="btn btn-sm btn-outline" style="color:#25D366; border-color:#25D366;">
                        <i class="fa-brands fa-whatsapp"></i> Message Seller
                    </a>
                    <div style="display:flex; gap:6px;">
                        ${o.status === 'Pending' ? `<button class="btn btn-sm btn-outline" style="color:#EF4444; border-color:#EF4444;" onclick="handleCancelBuyerOrder(${o.id})">Cancel Order</button>` : ''}
                        <button class="btn btn-sm btn-outline" onclick="openReportComplaintModal('${o.order_number}')">
                            <i class="fa-solid fa-flag"></i> Report Issue
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterBuyerOrders(status, btnEl) {
    document.querySelectorAll('#buyerOrderFilterStrip .hero-loc-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderBuyerOrders(status);
}

async function handleCancelBuyerOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        await API.cancelOrder(orderId, 'Cancelled by buyer');
        showToast('Order cancelled successfully', 'info');
        renderBuyerOrders('all');
        loadAdminPortal();
    }
}

// ==========================================
// BUYER NOTIFICATIONS & PROFILE
// ==========================================
function renderBuyerNotifications() {
    const user = getCurrentUser();
    const notifs = API.getUserNotifications(user);
    const container = document.getElementById('buyerNotificationsContainer');
    const tabBadge = document.getElementById('buyerNotifTabCount');
    if (tabBadge) tabBadge.innerText = notifs.length;

    if (!container) return;
    if (notifs.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">No new notifications</p>';
        return;
    }

    container.innerHTML = notifs.map(n => `
        <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--bg-alt); border-radius:var(--radius-md); margin-bottom:10px; border:1px solid var(--border);">
            <div style="width:36px; height:36px; border-radius:50%; background:var(--brand-green-soft); color:var(--brand-green); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0;">
                <i class="fa-solid fa-bell"></i>
            </div>
            <div style="flex:1;">
                <strong style="color:var(--primary); font-size:0.88rem; display:block;">${n.title}</strong>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin:2px 0 0 0;">${n.message}</p>
            </div>
        </div>
    `).join('');
}

function loadBuyerProfile() {
    const user = getCurrentUser();
    if (user) {
        const nameInput = document.getElementById('buyerProfileName');
        const phoneInput = document.getElementById('buyerProfilePhone');
        const emailInput = document.getElementById('buyerProfileEmail');
        const addrInput = document.getElementById('buyerProfileAddress');
        const locInput = document.getElementById('buyerProfileLocation');
        const countryInput = document.getElementById('buyerProfileCountry');

        if (nameInput) nameInput.value = user.full_name || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (emailInput) emailInput.value = user.email || '';
        if (addrInput) addrInput.value = user.delivery_address || user.location || '';
        if (locInput) locInput.value = user.location || 'Abuja';
        if (countryInput) countryInput.value = user.country || 'Nigeria';
    }
}

async function handleSaveBuyerProfile(event) {
    if (event) event.preventDefault();
    const user = getCurrentUser() || {};
    user.full_name = document.getElementById('buyerProfileName')?.value.trim();
    user.phone = document.getElementById('buyerProfilePhone')?.value.trim();
    user.email = document.getElementById('buyerProfileEmail')?.value.trim();
    user.delivery_address = document.getElementById('buyerProfileAddress')?.value.trim();
    user.location = document.getElementById('buyerProfileLocation')?.value.trim();
    user.country = document.getElementById('buyerProfileCountry')?.value.trim();

    setCurrentUser(user);
    showToast('Profile and delivery address updated successfully!', 'success');
    loadBuyerDashboard();
}

// ==========================================
// SELLER DASHBOARD
// ==========================================
async function loadSellerDashboard() {
    const products = await API.getProducts();
    const countEl = document.getElementById('sellerListedProductsCount');
    if (countEl) countEl.innerText = products.length;

    const myProdsGrid = document.getElementById('myProductsContainer');
    if (myProdsGrid) {
        myProdsGrid.innerHTML = products.map(p => `
            <div class="product-card">
                <div class="product-img-wrapper">
                    <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${p.title}" class="product-img">
                </div>
                <div class="product-content">
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <h3 class="product-title">${p.title}</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span class="badge badge-verified">Active</span>
                        <button class="btn btn-sm btn-outline" style="color:#EF4444;" onclick="handleDeleteProduct(${p.id})">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function openAddProductModal() {
    document.getElementById('sellerProductForm')?.reset();
    document.getElementById('addProductModal')?.classList.add('active');
}

function handleProductImageImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('sellerProdPhotoPreviewImg');
            const hidden = document.getElementById('sellerProdPhoto');
            if (preview) preview.src = e.target.result;
            if (hidden) hidden.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function handleProductFormSubmit(event) {
    if (event) event.preventDefault();
    const title = document.getElementById('sellerProdTitle')?.value.trim();
    const price = document.getElementById('sellerProdPrice')?.value.trim();
    const category_id = document.getElementById('sellerProdCategory')?.value;
    const seller_name = document.getElementById('sellerProdSellerName')?.value.trim();
    const country = document.getElementById('sellerProdCountry')?.value;
    const location = document.getElementById('sellerProdLocation')?.value.trim();
    const phone = document.getElementById('sellerProdPhone')?.value.trim();
    const desc = document.getElementById('sellerProdDesc')?.value.trim();
    const photo_url = document.getElementById('sellerProdPhoto')?.value;

    const payload = {
        title, price: parseFloat(price) || 0, category_id, seller_name, country, city: location, phone, description: desc, photo_url
    };

    await API.createProduct(payload);
    closeModal('addProductModal');
    showToast('Product published successfully to marketplace!', 'success');
    loadMarketplaceProducts();
    loadSellerDashboard();
    loadAdminPortal();
}

function handleProductModalCountryChange(country) {
    const stateSelect = document.getElementById('sellerProdStateSelect');
    populateStateDropdown(stateSelect, country);
}

function syncSellerProdLocationInput(stateVal) {
    const locInput = document.getElementById('sellerProdLocation');
    if (locInput && stateVal) locInput.value = stateVal;
}

// ==========================================
// SOURCING CONCIERGE ASSISTANCE
// ==========================================
function selectAssistancePackage(name, fee, el) {
    AppState.selectedAssistancePackage = name;
    AppState.selectedAssistanceFee = fee;
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');
    const mainPkg = document.getElementById('mainSelectedPackage');
    const mainFee = document.getElementById('mainSelectedFee');
    if (mainPkg) mainPkg.value = name;
    if (mainFee) mainFee.value = fee;
}

async function handleAssistanceSubmit(event) {
    if (event) event.preventDefault();
    const item = document.getElementById('mainPbaItem')?.value.trim();
    const qty = document.getElementById('mainPbaQty')?.value.trim();
    const country = document.getElementById('mainPbaCountry')?.value;
    const city = document.getElementById('mainPbaCity')?.value.trim();
    const name = document.getElementById('mainPbaName')?.value.trim();
    const phone = document.getElementById('mainPbaPhone')?.value.trim();
    const specs = document.getElementById('mainPbaSpecs')?.value.trim();
    const pkg = document.getElementById('mainSelectedPackage')?.value || 'Full Buying Assistance';
    const fee = document.getElementById('mainSelectedFee')?.value || 60.00;

    const payload = {
        item_title: item, requested_qty: qty, target_country: country, target_city: city, customer_name: name, customer_phone: phone, specifications: specs, package_type: pkg, service_fee: fee
    };

    const res = await API.submitBuyingAssistance(payload);
    showToast(`Sourcing Request submitted! Tracking Code: ${res.tracking_code}`, 'success');
    document.getElementById('buyingAssistanceMainForm')?.reset();
    loadAdminPortal();
}

// ==========================================
// REPORTS & COMPLAINTS
// ==========================================
function openReportComplaintModal(targetEntity = '') {
    const form = document.getElementById('reportComplaintForm');
    if (form) form.reset();
    const targetInput = document.getElementById('complaintTarget');
    if (targetInput && targetEntity) targetInput.value = targetEntity;

    const user = getCurrentUser();
    if (user) {
        const nameInput = document.getElementById('complaintReporterName');
        const phoneInput = document.getElementById('complaintReporterPhone');
        if (nameInput) nameInput.value = user.full_name;
        if (phoneInput) phoneInput.value = user.phone;
    }

    document.getElementById('reportComplaintModal')?.classList.add('active');
}

async function handleSubmitComplaint(event) {
    if (event) event.preventDefault();
    const type = document.getElementById('complaintType')?.value;
    const subject = document.getElementById('complaintSubject')?.value.trim();
    const target = document.getElementById('complaintTarget')?.value.trim();
    const details = document.getElementById('complaintDetails')?.value.trim();
    const name = document.getElementById('complaintReporterName')?.value.trim();
    const phone = document.getElementById('complaintReporterPhone')?.value.trim();

    await API.createComplaint({
        type, subject, target_entity: target, details, reported_by: name, reporter_phone: phone
    });

    closeModal('reportComplaintModal');
    showToast('Report ticket filed. Our moderation desk will investigate promptly.', 'success');
    loadAdminPortal();
}

// ==========================================
// 🛡️ ADMIN PORTAL CONTROLLER (11 CORE MODULES)
// ==========================================
async function loadAdminPortal() {
    const loginGate = document.getElementById('admin-login-gate');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const quickBar = document.getElementById('adminQuickActionsBar');

    if (!isAdminAuthenticated()) {
        if (loginGate) loginGate.style.display = 'block';
        if (dashboardView) dashboardView.style.display = 'none';
        if (quickBar) quickBar.style.display = 'none';
        updateNavAuthUI();
        return;
    }

    if (loginGate) loginGate.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    if (quickBar) quickBar.style.display = 'block';
    updateNavAuthUI();

    const summary = await API.getAnalyticsSummary();
    const members = await API.getMembers();
    const sellers = await API.getSellers();
    const products = await API.getProducts();
    const orders = await API.getOrders();
    const requests = await API.getBuyingRequests();
    const complaints = await API.getComplaints();

    // 1. Update 10 KPI Counters
    const kpiUsers = document.getElementById('kpiTotalUsers');
    const kpiBuyers = document.getElementById('kpiTotalBuyers');
    const kpiSellers = document.getElementById('kpiTotalSellers');
    const kpiProducts = document.getElementById('kpiTotalProducts');
    const kpiOrders = document.getElementById('kpiTotalOrders');
    const kpiPendingOrders = document.getElementById('kpiPendingOrders');
    const kpiCompletedOrders = document.getElementById('kpiCompletedOrders');
    const kpiPendingVerifications = document.getElementById('kpiPendingVerifications');
    const kpiSourcing = document.getElementById('kpiSourcingRequests');
    const kpiReported = document.getElementById('kpiReportedItems');

    if (kpiUsers) kpiUsers.innerText = summary.total_users;
    if (kpiBuyers) kpiBuyers.innerText = summary.total_buyers;
    if (kpiSellers) kpiSellers.innerText = summary.total_sellers;
    if (kpiProducts) kpiProducts.innerText = summary.total_products;
    if (kpiOrders) kpiOrders.innerText = summary.total_orders;
    if (kpiPendingOrders) kpiPendingOrders.innerText = summary.pending_orders;
    if (kpiCompletedOrders) kpiCompletedOrders.innerText = summary.completed_orders;
    if (kpiPendingVerifications) kpiPendingVerifications.innerText = summary.pending_verifications;
    if (kpiSourcing) kpiSourcing.innerText = summary.sourcing_requests;
    if (kpiReported) kpiReported.innerText = summary.open_reports;

    // Menu Badges
    const mUsers = document.getElementById('adminMenuCountUsers');
    const mVerification = document.getElementById('adminMenuCountVerification');
    const mProducts = document.getElementById('adminMenuCountProducts');
    const mOrders = document.getElementById('adminMenuCountOrders');
    const mSourcing = document.getElementById('adminMenuCountSourcing');
    const mComplaints = document.getElementById('adminMenuCountComplaints');

    if (mUsers) mUsers.innerText = members.length;
    if (mVerification) mVerification.innerText = summary.pending_verifications;
    if (mProducts) mProducts.innerText = products.length;
    if (mOrders) mOrders.innerText = orders.length;
    if (mSourcing) mSourcing.innerText = requests.length;
    if (mComplaints) mComplaints.innerText = complaints.length;

    // 2. Render Sub-Tables
    renderAdminMembersTable(members);
    renderAdminVerificationTable(sellers);
    renderAdminProductsTable(products);
    renderAdminOrdersTable('all');
    renderAdminRequestsTable(requests);
    renderAdminComplaintsTable(complaints);
    renderAdminAnnouncementsTable();
    renderAdminCategoriesTable();
    renderAdminActivityFeed();
}

function renderAdminActivityFeed() {
    const feed = document.getElementById('adminActivityLogList');
    if (!feed) return;
    feed.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.82rem;">
            <div><strong>🛍️ New Marketplace Order:</strong> ORD-849201 for Authentic Ankara was placed.</div>
            <span class="badge badge-delivered">Delivered</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.82rem;">
            <div><strong>🏪 Seller Registration:</strong> Amina Luxury Ankara verified in Abuja (Wuse 2).</div>
            <span class="badge badge-verified">Verified</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.82rem;">
            <div><strong>🔍 Sourcing Desk:</strong> Concierge request for 200 bags of Yam in Kano.</div>
            <span class="badge badge-pending">Active</span>
        </div>
    `;
}

// 2. USER MANAGEMENT TABLE
function renderAdminMembersTable(members) {
    const tbody = document.getElementById('adminMembersTableBody');
    if (!tbody) return;
    if (!members || members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No users found.</td></tr>';
        return;
    }
    tbody.innerHTML = members.map(m => {
        const isSuspended = m.status === 'suspended';
        return `
            <tr>
                <td>
                    <strong>${m.full_name}</strong>
                    <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">ID: ${m.member_id}</div>
                </td>
                <td><span class="badge ${m.role === 'Seller' ? 'badge-verified' : 'badge-confirmed'}">${m.role}</span></td>
                <td>${m.phone} <br><small style="color:var(--text-muted);">${m.email || ''}</small></td>
                <td>${m.city || m.location || 'Abuja'}, ${m.country || 'Nigeria'}</td>
                <td>
                    <span class="badge ${isSuspended ? 'badge-suspended' : 'badge-verified'}">
                        ${isSuspended ? 'Suspended' : 'Active'}
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn btn-sm ${isSuspended ? 'btn-success' : 'btn-outline'}" onclick="handleToggleUserStatus('${m.id}', '${m.source_type}', '${isSuspended ? 'active' : 'suspended'}')">
                            ${isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                        <button class="btn btn-sm btn-outline" style="color:#EF4444;" onclick="handleDeleteMember('${m.id}', '${m.source_type}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleFilterMembers(role, btnEl) {
    document.querySelectorAll('#admin-tab-users .hero-loc-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    const members = await API.getMembers({ role });
    renderAdminMembersTable(members);
}

async function handleAdminMemberSearch(query) {
    const members = await API.getMembers({ q: query });
    renderAdminMembersTable(members);
}

async function handleToggleUserStatus(id, sourceType, newStatus) {
    await API.toggleUserStatus(id, sourceType, newStatus);
    showToast(`User status updated to "${newStatus}"`, 'info');
    loadAdminPortal();
}

async function handleDeleteMember(id, sourceType) {
    if (confirm('Are you sure you want to remove this user from the platform?')) {
        await API.deleteMember(id, sourceType);
        showToast('User removed successfully', 'success');
        loadAdminPortal();
    }
}

// 3. SELLER VERIFICATION QUEUE
function renderAdminVerificationTable(sellers) {
    const tbody = document.getElementById('adminVerificationTableBody');
    if (!tbody) return;
    tbody.innerHTML = sellers.map(s => `
        <tr>
            <td>
                <strong>${s.full_name}</strong>
                <div style="font-size:0.75rem; color:var(--brand-green); font-weight:700;"><i class="fa-solid fa-store"></i> ${s.store_name}</div>
            </td>
            <td><code>${s.id_number || 'NIN-Pending'}</code></td>
            <td>
                ${s.kin_name || 'Relative'}<br>
                <small style="color:var(--text-muted);">${s.kin_phone || ''}</small>
            </td>
            <td>${s.category_name || 'General'} &bull; ${s.city || 'Abuja'}</td>
            <td>
                <span class="badge ${s.verified === 1 ? 'badge-verified' : 'badge-pending'}">
                    ${s.verification_status || (s.verified ? 'Approved' : 'Pending Review')}
                </span>
            </td>
            <td>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-success" onclick="handleVerifySellerAction(${s.id}, 1, 'Verified by Admin')">Approve Badge</button>
                    <button class="btn btn-sm btn-outline" style="color:#EF4444;" onclick="handleVerifySellerAction(${s.id}, -1, 'Documents incomplete')">Reject</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleVerifySellerAction(id, isVerified, notes) {
    await API.verifySeller(id, isVerified, notes);
    showToast(isVerified === 1 ? 'Seller verified with official badge!' : 'Seller verification rejected', 'info');
    loadAdminPortal();
}

// 4. PRODUCT MANAGEMENT & MODERATION
function renderAdminProductsTable(products) {
    const tbody = document.getElementById('adminProductsTableBody');
    if (!tbody) return;
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=100'}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;" alt="${p.title}">
                    <div>
                        <strong>${p.title}</strong>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${p.category_name || 'General'}</div>
                    </div>
                </div>
            </td>
            <td>${p.seller_name}<br><small style="color:var(--text-muted);">${p.phone || p.seller_phone || ''}</small></td>
            <td><strong style="color:var(--brand-green);">${formatPrice(p.price)}</strong></td>
            <td>${p.available_qty || 50} units &bull; ${p.city || 'Abuja'}</td>
            <td><span class="badge ${p.status === 'approved' ? 'badge-verified' : 'badge-pending'}">${p.status || 'approved'}</span></td>
            <td>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-outline" onclick="openProductDetailModal(${p.id})">View</button>
                    <button class="btn btn-sm btn-outline" style="color:#EF4444;" onclick="handleDeleteProduct(${p.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleAdminProductSearch(query) {
    const products = await API.getProducts({ q: query });
    renderAdminProductsTable(products);
}

async function handleDeleteProduct(id) {
    if (confirm('Are you sure you want to remove this product from the marketplace?')) {
        await API.deleteProduct(id);
        showToast('Product removed successfully', 'success');
        loadMarketplaceProducts();
        loadSellerDashboard();
        loadAdminPortal();
    }
}

// 5. ORDER MANAGEMENT MATRIX
async function renderAdminOrdersTable(filterStatus = 'all') {
    let orders = await API.getOrders();
    if (filterStatus !== 'all') {
        orders = orders.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
    }

    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">No orders found under this filter.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const cleanPhone = (o.buyer_phone || '').replace(/[^0-9]/g, '');
        const waText = encodeURIComponent(`Hello ${o.buyer_name}, this is Market at Home Administration regarding your Order ${o.order_number}. Current status: ${o.status}.`);
        const waLink = `https://wa.me/${cleanPhone}?text=${waText}`;

        return `
            <tr>
                <td>
                    <strong style="font-family:monospace; color:var(--primary);">${o.order_number}</strong>
                    <div style="font-size:0.72rem; color:var(--text-muted);">${o.created_at || '2026-09-16'}</div>
                </td>
                <td>${o.buyer_name}<br><small style="color:var(--text-muted);">${o.buyer_phone}</small></td>
                <td>${o.item_name} (${o.quantity}x)</td>
                <td><strong style="color:var(--brand-green);">${formatPrice(o.total_amount)}</strong><br><small style="color:var(--text-muted);">${o.payment_status}</small></td>
                <td>${o.seller_name}</td>
                <td>
                    <select class="form-select" style="padding:4px 8px; font-size:0.75rem; font-weight:700;" onchange="handleAdminUpdateOrderStatus(${o.id}, this.value)">
                        <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>✅ Confirmed</option>
                        <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>📦 Processing</option>
                        <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>🚚 Shipped</option>
                        <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>🎉 Delivered</option>
                        <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                    </select>
                </td>
                <td>
                    <a href="${waLink}" target="_blank" class="btn btn-sm btn-success" style="padding:4px 8px; font-size:0.75rem;">
                        <i class="fa-brands fa-whatsapp"></i> Update Buyer
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

function handleAdminFilterOrders(status, btnEl) {
    document.querySelectorAll('#admin-tab-orders .hero-loc-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderAdminOrdersTable(status);
}

async function handleAdminUpdateOrderStatus(orderId, newStatus) {
    await API.updateOrderStatus(orderId, newStatus);
    showToast(`Order status updated to "${newStatus}"!`, 'success');
    loadAdminPortal();
}

// 6. SOURCING DESK MANAGEMENT
function renderAdminRequestsTable(requests) {
    const tbody = document.getElementById('adminRequestsTableBody');
    if (!tbody) return;
    tbody.innerHTML = requests.map(r => `
        <tr>
            <td><code>${r.tracking_code}</code></td>
            <td>${r.customer_name}<br><small style="color:var(--text-muted);">${r.customer_phone}</small></td>
            <td><strong>${r.item_title}</strong> (${r.requested_qty || '1'})</td>
            <td>${r.target_city || 'Abuja'}, ${r.target_country || 'Nigeria'}</td>
            <td>${r.assigned_agent || 'Senior Desk'}<br><small style="color:var(--text-muted);">${r.supplier_info || 'Searching suppliers'}</small></td>
            <td>
                <select class="form-select" style="padding:4px 8px; font-size:0.75rem; font-weight:700;" onchange="handleUpdateSourcingStatus(${r.id}, this.value)">
                    <option value="Sourcing Active" ${r.status === 'Sourcing Active' ? 'selected' : ''}>⏳ Sourcing Active</option>
                    <option value="Inspecting Goods" ${r.status === 'Inspecting Goods' ? 'selected' : ''}>🔍 Inspecting Goods</option>
                    <option value="Quality Checked" ${r.status === 'Quality Checked' ? 'selected' : ''}>✅ Quality Checked</option>
                    <option value="Shipped & En Route" ${r.status === 'Shipped & En Route' ? 'selected' : ''}>🚚 Shipped</option>
                    <option value="Completed & Delivered" ${r.status === 'Completed & Delivered' ? 'selected' : ''}>🎉 Completed</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showToast('Agent details saved', 'info')">Assign</button>
            </td>
        </tr>
    `).join('');
}

async function handleUpdateSourcingStatus(id, newStatus) {
    await API.updateBuyingRequest({ id, status: newStatus });
    showToast(`Sourcing status updated to "${newStatus}"`, 'success');
    loadAdminPortal();
}

// 7. COMPLAINTS & DISPUTE REVIEW
function renderAdminComplaintsTable(complaints) {
    const tbody = document.getElementById('adminComplaintsTableBody');
    if (!tbody) return;
    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No reports or complaints logged.</td></tr>';
        return;
    }

    tbody.innerHTML = complaints.map(c => `
        <tr>
            <td><code>${c.ticket_number}</code><br><span class="badge badge-pending">${c.type}</span></td>
            <td>${c.reported_by}<br><small style="color:var(--text-muted);">${c.reporter_phone}</small></td>
            <td>${c.target_entity}</td>
            <td>
                <strong>${c.subject}</strong>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin:2px 0 0 0;">${c.details}</p>
            </td>
            <td><span class="badge ${c.status === 'Resolved' ? 'badge-delivered' : 'badge-pending'}">${c.status}</span></td>
            <td>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-success" onclick="handleUpdateComplaintStatus(${c.id}, 'Resolved')">Resolve</button>
                    <button class="btn btn-sm btn-outline" onclick="handleUpdateComplaintStatus(${c.id}, 'Under Investigation')">Investigate</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleUpdateComplaintStatus(id, newStatus) {
    await API.updateComplaintStatus(id, newStatus);
    showToast(`Report ticket marked as ${newStatus}`, 'info');
    loadAdminPortal();
}

// 8. NOTIFICATIONS & BROADCASTS
function openBroadcastModal() {
    document.getElementById('adminBroadcastForm')?.reset();
    document.getElementById('adminBroadcastModal')?.classList.add('active');
}

async function handleSendBroadcast(event) {
    if (event) event.preventDefault();
    const target = document.getElementById('broadcastTarget')?.value || 'all';
    const title = document.getElementById('broadcastTitle')?.value.trim();
    const message = document.getElementById('broadcastMessage')?.value.trim();

    await API.createAnnouncement({ target, title, message });
    closeModal('adminBroadcastModal');
    showToast('Broadcast sent live across marketplace!', 'success');
    renderLiveAnnouncementBanner();
    loadAdminPortal();
}

async function renderAdminAnnouncementsTable() {
    const list = await API.getAnnouncements();
    const tbody = document.getElementById('adminAnnouncementsTableBody');
    if (!tbody) return;
    tbody.innerHTML = list.map(a => `
        <tr>
            <td><strong>${a.title}</strong><br><small style="color:var(--text-secondary);">${a.message}</small></td>
            <td><span class="badge badge-verified">${a.target.toUpperCase()}</span></td>
            <td>${a.priority || 'Normal'}</td>
            <td>${a.created_at}</td>
            <td>
                <button class="btn btn-sm btn-outline" style="color:#EF4444;" onclick="handleDeleteAnnouncement(${a.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleDeleteAnnouncement(id) {
    await API.deleteAnnouncement(id);
    showToast('Announcement removed', 'info');
    renderLiveAnnouncementBanner();
    renderAdminAnnouncementsTable();
}

// 9. REPORTS & ANALYTICS
async function renderAdminAnalytics() {
    const summary = await API.getAnalyticsSummary();
    const container = document.getElementById('adminAnalyticsContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px;">
            <div class="card" style="border:1px solid var(--border);">
                <h4 style="font-size:0.95rem; font-weight:800; color:var(--primary); margin-bottom:12px;">📊 Order Fulfillment Status Breakdown</h4>
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                        <span>Delivered & Completed</span>
                        <strong>${summary.orders_by_status.delivered}</strong>
                    </div>
                    <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${(summary.orders_by_status.delivered / (summary.total_orders || 1)) * 100}%; background:#059669;"></div></div>

                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                        <span>Shipped / In Transit</span>
                        <strong>${summary.orders_by_status.shipped}</strong>
                    </div>
                    <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${(summary.orders_by_status.shipped / (summary.total_orders || 1)) * 100}%; background:#0891B2;"></div></div>

                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                        <span>Processing & Packaging</span>
                        <strong>${summary.orders_by_status.processing}</strong>
                    </div>
                    <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${(summary.orders_by_status.processing / (summary.total_orders || 1)) * 100}%; background:#7C3AED;"></div></div>

                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                        <span>Pending Confirmation</span>
                        <strong>${summary.orders_by_status.pending}</strong>
                    </div>
                    <div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${(summary.orders_by_status.pending / (summary.total_orders || 1)) * 100}%; background:#D97706;"></div></div>
                </div>
            </div>

            <div class="card" style="border:1px solid var(--border);">
                <h4 style="font-size:0.95rem; font-weight:800; color:var(--primary); margin-bottom:12px;">👥 Marketplace Ecosystem Balance</h4>
                <div style="display:flex; flex-direction:column; gap:10px; font-size:0.85rem;">
                    <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-alt); border-radius:8px;">
                        <span>Total Buyers Registered:</span>
                        <strong>${summary.total_buyers}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-alt); border-radius:8px;">
                        <span>Total Sellers Registered:</span>
                        <strong>${summary.total_sellers}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-alt); border-radius:8px;">
                        <span>Products Uploaded:</span>
                        <strong>${summary.total_products}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--bg-alt); border-radius:8px;">
                        <span>Total Gross Volume:</span>
                        <strong style="color:var(--brand-green);">${formatPrice(summary.total_revenue)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 10. CATEGORY MANAGER & SETTINGS
function openCategoryManagerModal() {
    document.getElementById('adminCategoryForm')?.reset();
    document.getElementById('adminCategoryModal')?.classList.add('active');
}

async function handleAddCategory(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('newCategoryName')?.value.trim();
    const desc = document.getElementById('newCategoryDesc')?.value.trim();
    const icon = document.getElementById('newCategoryIcon')?.value.trim() || 'fa-tag';

    await API.addCategory({ name, description: desc, icon });
    closeModal('adminCategoryModal');
    showToast('Category added successfully!', 'success');
    loadCategories();
    renderAdminCategoriesTable();
}

async function renderAdminCategoriesTable() {
    const categories = await API.getCategories();
    const container = document.getElementById('adminCategoriesList');
    if (!container) return;
    container.innerHTML = categories.map(c => `
        <span class="badge" style="background:var(--bg-alt); color:var(--primary); padding:6px 12px; font-size:0.8rem; display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid ${c.icon}"></i> ${c.name}
            <button onclick="handleDeleteCategory(${c.id})" style="background:none; border:none; color:#EF4444; cursor:pointer; margin-left:4px;"><i class="fa-solid fa-xmark"></i></button>
        </span>
    `).join('');
}

async function handleDeleteCategory(id) {
    if (confirm('Delete this product category?')) {
        await API.deleteCategory(id);
        showToast('Category removed', 'info');
        loadCategories();
        renderAdminCategoriesTable();
    }
}

function handleSaveAdminSecurity(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('adminSettingName')?.value.trim();
    const phone = document.getElementById('adminSettingPhone')?.value.trim();
    const newPass = document.getElementById('adminSettingPassword')?.value.trim();

    if (name) localStorage.setItem('globalbiz_admin_name', name);
    if (phone) localStorage.setItem('globalbiz_admin_phone', phone);
    if (newPass) localStorage.setItem('globalbiz_admin_password', newPass);

    showToast('Admin security credentials updated successfully!', 'success');
}

function handleSaveMarketConfig(event) {
    if (event) event.preventDefault();
    showToast('Marketplace configuration updated!', 'success');
}

async function handleExportPlatformData() {
    const backup = {
        platform: "Market at Home",
        version: "3.2",
        exported_at: new Date().toISOString(),
        sellers: await API.getSellers(),
        buyers: await API.getBuyers(),
        products: await API.getProducts(),
        orders: await API.getOrders(),
        requests: await API.getBuyingRequests(),
        complaints: await API.getComplaints(),
        announcements: await API.getAnnouncements()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_at_home_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database backup exported (JSON)', 'success');
}

function handleResetPlatformData() {
    if (confirm('Reset platform data to factory seeds? Custom data will be reset.')) {
        localStorage.clear();
        showToast('Database restored to default seeds', 'info');
        location.reload();
    }
}

function openAdminAddSellerModal() {
    document.getElementById('adminAddSellerForm')?.reset();
    document.getElementById('adminAddSellerModal')?.classList.add('active');
}

async function handleAdminAddSeller(event) {
    if (event) event.preventDefault();
    const fullName = document.getElementById('adminSellerFullName')?.value.trim();
    const phone = document.getElementById('adminSellerPhone')?.value.trim();
    const store = document.getElementById('adminSellerStoreName')?.value.trim();
    const loc = document.getElementById('adminSellerLocation')?.value.trim();

    await API.registerSeller({ full_name: fullName, phone, store_name: store, location: loc, verified: 1 });
    closeModal('adminAddSellerModal');
    showToast('Seller added and verified with badge!', 'success');
    loadAdminPortal();
}

function openAdminAddBuyerModal() {
    document.getElementById('adminAddBuyerForm')?.reset();
    document.getElementById('adminAddBuyerModal')?.classList.add('active');
}

async function handleAdminAddBuyer(event) {
    if (event) event.preventDefault();
    const fullName = document.getElementById('adminBuyerFullName')?.value.trim();
    const phone = document.getElementById('adminBuyerPhone')?.value.trim();
    const loc = document.getElementById('adminBuyerLocation')?.value.trim();

    await API.createBuyer({ full_name: fullName, phone, location: loc });
    closeModal('adminAddBuyerModal');
    showToast('Buyer registered successfully!', 'success');
    loadAdminPortal();
}

// ==========================================
// MODAL & UTILITY HELPERS
// ==========================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info')}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function installPwaApp() {
    showToast('Market at Home app ready for installation on your device!', 'success');
}

function dismissPwaPrompt() {
    const prompt = document.getElementById('pwaFloatingPrompt');
    if (prompt) prompt.style.display = 'none';
}
