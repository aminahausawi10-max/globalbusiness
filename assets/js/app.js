/**
 * Market at Home — Buy & Sell Worldwide
 * Mobile-First, Vibrant & Reactive Global Controller
 */

const WORLD_LOCATIONS = {
    'Nigeria': ['Abuja (FCT)', 'Lagos', 'Kano', 'Rivers (Port Harcourt)', 'Oyo (Ibadan)', 'Enugu', 'Kaduna', 'Delta', 'Anambra', 'Edo', 'Ogun', 'Plateau', 'Benue', 'Akwa Ibom', 'Ondo', 'Imo', 'Borno', 'Sokoto', 'Bauchi', 'Cross River', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Abia', 'Adamawa', 'Bayelsa', 'Ebonyi', 'Ekiti', 'Gombe', 'Jigawa', 'Kebbi', 'Katsina', 'Taraba', 'Yobe', 'Zamfara'],
    'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Georgia', 'Pennsylvania', 'Ohio', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington', 'Massachusetts', 'Arizona', 'Maryland', 'Indiana', 'Tennessee', 'Missouri', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa', 'Nevada', 'Arkansas'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'West Midlands', 'Greater Manchester', 'Leeds / West Yorkshire', 'Glasgow', 'Liverpool / Merseyside', 'Edinburgh', 'Bristol', 'Sheffield / South Yorkshire', 'Newcastle', 'Belfast', 'Cardiff', 'Nottingham', 'Southampton', 'Leicester'],
    'Canada': ['Ontario (Toronto)', 'British Columbia (Vancouver)', 'Quebec (Montreal)', 'Alberta (Calgary / Edmonton)', 'Manitoba (Winnipeg)', 'Saskatchewan', 'Nova Scotia (Halifax)', 'New Brunswick', 'Newfoundland and Labrador'],
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    'Ghana': ['Greater Accra (Accra)', 'Ashanti (Kumasi)', 'Western (Takoradi)', 'Central (Cape Coast)', 'Eastern (Koforidua)', 'Northern (Tamale)', 'Volta (Ho)'],
    'China': ['Guangdong (Guangzhou / Shenzhen)', 'Zhejiang (Yiwu / Hangzhou)', 'Shanghai', 'Beijing', 'Jiangsu (Suzhou / Nanjing)', 'Shandong (Qingdao)', 'Fujian (Xiamen)', 'Hong Kong', 'Sichuan (Chengdu)', 'Hubei (Wuhan)'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Machakos', 'Kilifi'],
    'South Africa': ['Gauteng (Johannesburg / Pretoria)', 'Western Cape (Cape Town)', 'KwaZulu-Natal (Durban)', 'Eastern Cape (Gqeberha / Port Elizabeth)', 'Free State (Bloemfontein)', 'Mpumalanga', 'Limpopo'],
    'Saudi Arabia': ['Riyadh', 'Makkah / Mecca', 'Jeddah', 'Madinah / Medina', 'Eastern Province (Dammam / Khobar)', 'Asir (Abha)', 'Tabuk', 'Qassim'],
    'Germany': ['Berlin', 'Bavaria (Munich)', 'North Rhine-Westphalia (Cologne / Dusseldorf)', 'Baden-Württemberg (Stuttgart)', 'Hesse (Frankfurt)', 'Hamburg', 'Saxony (Leipzig / Dresden)'],
    'France': ['Île-de-France (Paris)', 'Auvergne-Rhône-Alpes (Lyon)', 'Provence-Alpes-Côte d\'Azur (Marseille / Nice)', 'Occitanie (Toulouse)', 'Nouvelle-Aquitaine (Bordeaux)', 'Hauts-de-France (Lille)'],
    'India': ['Maharashtra (Mumbai / Pune)', 'Delhi (NCR / New Delhi)', 'Karnataka (Bengaluru)', 'Tamil Nadu (Chennai)', 'Telangana (Hyderabad)', 'Gujarat (Ahmedabad / Surat)', 'West Bengal (Kolkata)', 'Kerala', 'Rajasthan (Jaipur)', 'Punjab'],
    'Australia': ['New South Wales (Sydney)', 'Victoria (Melbourne)', 'Queensland (Brisbane)', 'Western Australia (Perth)', 'South Australia (Adelaide)', 'Australian Capital Territory (Canberra)'],
    'Egypt': ['Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Port Said', 'Suez', 'Luxor', 'Aswan'],
    'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya']
};

const AppState = {
    currentPage: 'home',
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
        ZAR: { symbol: 'R ', rate: 18.20 },
        AUD: { symbol: 'A$', rate: 1.52 }
    },
    activeCategoryFilter: '',
    activeCountryFilter: '',
    activeStateFilter: '',
    selectedAssistancePackage: 'Full Buying Assistance',
    selectedAssistanceFee: 60.00
};

// Location helpers
function populateStateDropdown(selectEl, country, selectedState = '') {
    if (!selectEl) return;
    const states = WORLD_LOCATIONS[country] || [];
    let html = '<option value="">All States / Regions</option>';
    if (states.length > 0) {
        html += states.map(st => `<option value="${st}" ${st === selectedState ? 'selected' : ''}>${st}</option>`).join('');
    } else if (country) {
        html += `<option value="Main Region" ${selectedState === 'Main Region' ? 'selected' : ''}>Main Region / Capital</option>`;
    }
    selectEl.innerHTML = html;
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

function handleProductModalCountryChange(country, selectedState = '') {
    const stateSelect = document.getElementById('sellerProdStateSelect');
    populateStateDropdown(stateSelect, country, selectedState);
    const locInput = document.getElementById('sellerProdLocation');
    if (locInput && selectedState) {
        locInput.value = selectedState;
    } else if (locInput && country) {
        locInput.value = (WORLD_LOCATIONS[country] && WORLD_LOCATIONS[country][0]) || country;
    }
}

function syncSellerProdLocationInput(stateVal) {
    const locInput = document.getElementById('sellerProdLocation');
    if (locInput && stateVal) {
        locInput.value = stateVal;
    }
}

function handleRegCountryChange(country) {
    const locInput = document.getElementById('regLocation');
    if (locInput && !locInput.value) {
        const topState = (WORLD_LOCATIONS[country] && WORLD_LOCATIONS[country][0]) || '';
        if (topState) locInput.placeholder = `e.g. ${topState}`;
    }
}

function filterByWorldwideLocation(country, state, el) {
    document.querySelectorAll('.hero-loc-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');

    switchPage('marketplace');
    const countrySelect = document.getElementById('marketCountryFilter');
    if (countrySelect) {
        countrySelect.value = country || '';
        handleMarketCountryChange(country || '');
    }
    const stateSelect = document.getElementById('marketStateFilter');
    if (stateSelect && state) {
        stateSelect.value = state;
    }
    filterMarketplace();
    if (country && state) {
        showToast(`Filtered listings in ${state}, ${country}`, 'info');
    } else if (country) {
        showToast(`Filtered listings in ${country}`, 'info');
    } else {
        showToast('Showing all worldwide listings', 'info');
    }
}

function resetMarketplaceFilters() {
    const sInput = document.getElementById('marketSearchFilter');
    const cSelect = document.getElementById('marketCategoryFilter');
    const countrySelect = document.getElementById('marketCountryFilter');
    const stateSelect = document.getElementById('marketStateFilter');
    if (sInput) sInput.value = '';
    if (cSelect) cSelect.value = '';
    if (countrySelect) {
        countrySelect.value = '';
        handleMarketCountryChange('');
    }
    if (stateSelect) stateSelect.value = '';
    document.querySelectorAll('.hero-loc-pill').forEach(p => p.classList.remove('active'));
    filterMarketplace();
    showToast('Marketplace filters reset', 'info');
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupCurrencySwitcher();
    setupSearchEngine();
    setupForms();
    updateNavAuthUI();
    
    // Load Core Data
    await loadCategories();
    await loadMarketplaceProducts();
    await loadFeaturedBusinesses();
    await loadSellerDashboard();
    await loadBuyerDashboard();
    await loadAdminPortal();
}

/* ==========================================================================
   PAGE ROUTING & BOTTOM DOCK
   ========================================================================== */
function isAuthenticated() {
    return !!(getCurrentUser() || isAdminAuthenticated());
}

function requireAuth(actionName = 'perform this action') {
    if (!isAuthenticated()) {
        showToast(`Account required: Please sign in or register to ${actionName}`, 'info');
        openAuthModal('login');
        return false;
    }
    return true;
}

function handleNavPortalClick() {
    if (isAdminAuthenticated()) {
        switchPage('admin');
    } else {
        const user = getCurrentUser();
        if (!user) {
            requireAuth('access your dashboard portal');
            return;
        }
        if (user.role === 'buyer') {
            switchPage('buyer');
        } else {
            switchPage('seller');
        }
    }
}

function switchPage(pageName) {
    // Route guards
    if ((pageName === 'seller' || pageName === 'buyer') && !isAuthenticated()) {
        requireAuth(`access the ${pageName === 'buyer' ? 'Buyer' : 'Seller'} Portal`);
        return;
    }

    AppState.currentPage = pageName;

    // Update Nav Links & Bottom Dock Items
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
        const target = link.getAttribute('data-page');
        link.classList.toggle('active', target === pageName);
    });

    // Update Page Views
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.toggle('active', view.id === `page-${pageName}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageName === 'marketplace') {
        loadMarketplaceProducts();
    } else if (pageName === 'seller') {
        loadSellerDashboard();
    } else if (pageName === 'buyer') {
        loadBuyerDashboard();
    } else if (pageName === 'admin') {
        loadAdminPortal();
    }
}

function handleRequestAssistanceClick() {
    if (!requireAuth('request verified Buying Assistance & purchase inspection')) {
        return;
    }
    switchPage('assistance');
}

/* ==========================================================================
   USER & ADMIN AUTHENTICATION & PROFILE DROPDOWN
   ========================================================================== */
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('globalbiz_user_session'));
    } catch (e) {
        return null;
    }
}

function updateNavAuthUI() {
    const user = getCurrentUser();
    const isAdmin = isAdminAuthenticated();
    const guestNav = document.getElementById('guestAuthNav');
    const userNav = document.getElementById('userProfileNav');
    const userNameEl = document.getElementById('navUserName');
    const roleBadgeEl = document.getElementById('dropdownUserRoleBadge');
    const dropNameEl = document.getElementById('dropdownUserFullName');
    const dropPhoneEl = document.getElementById('dropdownUserPhone');
    const guestBanner = document.getElementById('guestNoticeBanner');
    const navPortalText = document.getElementById('navPortalText');
    const navPortalLink = document.getElementById('navPortalLink');
    const bottomDockPortalText = document.getElementById('bottomDockPortalText');
    const bottomDockPortalIcon = document.getElementById('bottomDockPortalIcon');

    if (isAdmin) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.style.display = 'inline-block';
        if (guestBanner) guestBanner.style.display = 'none';
        if (userNameEl) userNameEl.innerText = 'Admin (Amina)';
        if (roleBadgeEl) {
            roleBadgeEl.innerText = 'ADMIN';
            roleBadgeEl.className = 'badge badge-verified';
        }
        if (dropNameEl) dropNameEl.innerText = 'Amina Ahmed (Admin)';
        if (dropPhoneEl) dropPhoneEl.innerText = 'WhatsApp: 09090809080';

        if (navPortalText) navPortalText.innerText = 'Admin Desk';
        if (navPortalLink) navPortalLink.setAttribute('data-page', 'admin');
        if (bottomDockPortalText) bottomDockPortalText.innerText = 'Admin';
        if (bottomDockPortalIcon) bottomDockPortalIcon.className = 'fa-solid fa-shield-halved';
    } else if (user && user.full_name) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.style.display = 'inline-block';
        if (guestBanner) guestBanner.style.display = 'none';
        const isSeller = user.role === 'seller';
        const roleLabel = isSeller ? ' (Seller)' : ' (Buyer)';
        if (userNameEl) userNameEl.innerText = user.full_name.split(' ')[0] + roleLabel;
        if (roleBadgeEl) {
            roleBadgeEl.innerText = isSeller ? 'VERIFIED SELLER' : 'VERIFIED BUYER';
            roleBadgeEl.className = isSeller ? 'badge badge-verified' : 'badge badge-warning';
        }
        if (dropNameEl) dropNameEl.innerText = user.full_name;
        if (dropPhoneEl) dropPhoneEl.innerText = user.phone || 'Verified User';

        if (navPortalText) navPortalText.innerText = isSeller ? 'Seller Portal' : 'Buyer Portal';
        if (navPortalLink) navPortalLink.setAttribute('data-page', isSeller ? 'seller' : 'buyer');
        if (bottomDockPortalText) bottomDockPortalText.innerText = isSeller ? 'Seller Hub' : 'Buyer Hub';
        if (bottomDockPortalIcon) bottomDockPortalIcon.className = isSeller ? 'fa-solid fa-store' : 'fa-solid fa-bag-shopping';
    } else {
        if (guestNav) guestNav.style.display = 'block';
        if (userNav) userNav.style.display = 'none';
        if (guestBanner) guestBanner.style.display = 'block';

        if (navPortalText) navPortalText.innerText = 'Portal';
        if (navPortalLink) navPortalLink.setAttribute('data-page', 'seller');
        if (bottomDockPortalText) bottomDockPortalText.innerText = 'Portal';
        if (bottomDockPortalIcon) bottomDockPortalIcon.className = 'fa-solid fa-gauge-high';
    }
}

function toggleProfileDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const menu = document.getElementById('profileDropdownMenu');
    const chevron = document.getElementById('navDropdownChevron');
    const btn = document.getElementById('userProfileBtn');
    
    if (menu) {
        const isShown = menu.classList.toggle('show');
        if (chevron) {
            chevron.style.transform = isShown ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        if (btn) {
            btn.classList.toggle('active', isShown);
        }
    }
}

function closeProfileDropdown() {
    const menu = document.getElementById('profileDropdownMenu');
    const chevron = document.getElementById('navDropdownChevron');
    const btn = document.getElementById('userProfileBtn');
    if (menu) menu.classList.remove('show');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    if (btn) btn.classList.remove('active');
}

// Close dropdown when clicking anywhere outside
document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userProfileNav');
    if (wrapper && !wrapper.contains(e.target)) {
        closeProfileDropdown();
    }
});

function handleDropdownPortal() {
    closeProfileDropdown();
    if (isAdminAuthenticated()) {
        switchPage('admin');
    } else {
        const user = getCurrentUser();
        if (user && user.role === 'buyer') {
            switchPage('buyer');
        } else if (user && user.role === 'seller') {
            switchPage('seller');
        } else {
            switchPage('marketplace');
        }
    }
}

function handleDropdownGoToWebsite() {
    closeProfileDropdown();
    switchPage('home');
}

function handleUnifiedLogout() {
    closeProfileDropdown();
    localStorage.removeItem('globalbiz_user_session');
    localStorage.removeItem('globalbiz_admin_session');
    updateNavAuthUI();
    showToast('You have logged out successfully', 'info');
    loadAdminPortal();
    switchPage('home');
}

function openAuthModal(tab = 'login') {
    switchAuthTab(tab);
    document.getElementById('userAuthModal').classList.add('active');
}

function switchAuthTab(tab) {
    const loginView = document.getElementById('authLoginFormView');
    const registerView = document.getElementById('authRegisterFormView');
    const loginBtn = document.getElementById('authTabLoginBtn');
    const registerBtn = document.getElementById('authTabRegisterBtn');

    if (tab === 'login') {
        if (loginView) loginView.style.display = 'block';
        if (registerView) registerView.style.display = 'none';
        if (loginBtn) loginBtn.classList.add('active');
        if (registerBtn) registerBtn.classList.remove('active');
        document.getElementById('userAuthModalTitle').innerText = 'Sign In to Market at Home';
    } else {
        if (loginView) loginView.style.display = 'none';
        if (registerView) registerView.style.display = 'block';
        if (loginBtn) loginBtn.classList.remove('active');
        if (registerBtn) registerBtn.classList.add('active');
        document.getElementById('userAuthModalTitle').innerText = 'Create Account (Buyer or Seller)';
    }
}

function toggleAuthRole(role) {
    const buyerLabel = document.getElementById('roleBuyerLabel');
    const sellerLabel = document.getElementById('roleSellerLabel');

    if (role === 'seller') {
        if (sellerLabel) {
            sellerLabel.style.borderColor = 'var(--brand-green)';
            sellerLabel.style.background = 'var(--brand-green-soft)';
        }
        if (buyerLabel) {
            buyerLabel.style.borderColor = 'var(--border)';
            buyerLabel.style.background = 'var(--bg-alt)';
        }
    } else {
        if (buyerLabel) {
            buyerLabel.style.borderColor = 'var(--brand-green)';
            buyerLabel.style.background = 'var(--brand-green-soft)';
        }
        if (sellerLabel) {
            sellerLabel.style.borderColor = 'var(--border)';
            sellerLabel.style.background = 'var(--bg-alt)';
        }
    }
}

function handleUserLogout() {
    handleUnifiedLogout();
}

function handlePostAdClick() {
    const user = getCurrentUser();
    const isAdmin = isAdminAuthenticated();
    if (!user && !isAdmin) {
        showToast('Please sign in or create a seller account to post products', 'info');
        openAuthModal('login');
        return;
    }
    openAddProductModal();
}

/* ==========================================================================
   TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');
    const iconColor = type === 'success' ? '#10B981' : (type === 'error' ? '#FA5252' : '#60A5FA');
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}" style="color: ${iconColor};"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ==========================================================================
   CURRENCY CONVERTER
   ========================================================================== */
function setupCurrencySwitcher() {
    const switcher = document.getElementById('currencySelector');
    if (switcher) {
        switcher.value = AppState.currentCurrency;
        switcher.addEventListener('change', (e) => {
            AppState.currentCurrency = e.target.value;
            loadMarketplaceProducts();
            loadFeaturedBusinesses();
            loadSellerDashboard();
            showToast(`Currency switched to ${AppState.currentCurrency}`, 'info');
        });
    }
}

function formatPrice(amountInUSD) {
    const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['NGN'];
    const converted = amountInUSD * curr.rate;
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
}

/* ==========================================================================
   CATEGORIES & STORIES BAR LOADER
   ========================================================================== */
async function loadCategories() {
    const categories = await API.getCategories();
    
    // Populate Select Dropdowns
    const heroSelect = document.getElementById('heroCategorySelect');
    const marketCatFilter = document.getElementById('marketCategoryFilter');
    const kycCatSelect = document.getElementById('kycCategorySelect');
    const sellerProdCategory = document.getElementById('sellerProdCategory');

    const optionsHtml = '<option value="">All Categories</option>' + 
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (heroSelect) heroSelect.innerHTML = optionsHtml;
    if (marketCatFilter) marketCatFilter.innerHTML = optionsHtml;
    if (kycCatSelect) kycCatSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    if (sellerProdCategory) sellerProdCategory.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // Populate Home Categories Grid
    const homeCatGrid = document.getElementById('homeCategoriesGrid');
    if (homeCatGrid) {
        homeCatGrid.innerHTML = categories.slice(0, 9).map(c => `
            <div class="category-box" onclick="filterByCategory(${c.id}, '${c.name}')">
                <div class="category-icon">
                    <i class="fa-solid ${c.icon}"></i>
                </div>
                <div class="category-name">${c.name}</div>
            </div>
        `).join('');
    }
}

async function loadStoriesBar() {
    const track = document.getElementById('storiesTrack');
    if (!track) return;

    const categories = await API.getCategories();
    track.innerHTML = categories.map(c => `
        <div class="story-item" onclick="filterByCategory(${c.id}, '${c.name}')">
            <div class="story-icon-ring">
                <div class="story-icon-inner">
                    <i class="fa-solid ${c.icon}"></i>
                </div>
            </div>
            <span class="story-label">${c.name}</span>
        </div>
    `).join('');
}

function filterByCategory(catId, catName) {
    AppState.activeCategoryFilter = catId;
    switchPage('marketplace');
    const catSelect = document.getElementById('marketCategoryFilter');
    if (catSelect) catSelect.value = catId;
    filterMarketplace();
    showToast(`Filtering by ${catName}`, 'info');
}

/* ==========================================================================
   MARKETPLACE & PRODUCTS RENDERING
   ========================================================================== */
async function loadMarketplaceProducts(filterParams = {}) {
    const products = await API.getProducts(filterParams);
    
    // Home grid
    const homeGrid = document.getElementById('homeProductsGrid');
    if (homeGrid) {
        homeGrid.innerHTML = renderProductsHtml(products.slice(0, 6));
    }

    // Marketplace grid
    const marketGrid = document.getElementById('marketplaceProductsGrid');
    if (marketGrid) {
        marketGrid.innerHTML = products.length > 0 
            ? renderProductsHtml(products) 
            : `<div style="grid-column: 1/-1; text-align:center; padding:50px 20px; background:var(--bg-alt); border-radius:var(--radius-lg); border:1.5px dashed var(--border);">
                <div style="width:56px; height:56px; background:var(--brand-green-soft); color:var(--brand-green); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:12px;">
                    <i class="fa-solid fa-boxes-packing"></i>
                </div>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary); margin-bottom:6px;">No Goods Listed Yet</h3>
                <p style="font-size:0.85rem; color:var(--text-secondary); max-width:440px; margin:0 auto 16px auto;">
                    Marketplace goods are posted directly by verified merchants. Are you a seller? Add and publish your products now so buyers can discover and buy them!
                </p>
                <button class="btn btn-primary" onclick="handlePostAdClick()">
                    <i class="fa-solid fa-plus"></i> Post & Publish a Good
                </button>
               </div>`;
    }
}

function handleProtectedContact(type, link, sellerName, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (!requireAuth(`contact ${sellerName || 'this verified seller'} directly`)) {
        return false;
    }
    if (type === 'whatsapp') {
        window.open(link, '_blank');
    } else if (type === 'tel') {
        window.location.href = link;
    }
    return true;
}

function renderProductsHtml(products) {
    return products.map(p => {
        const cleanPhone = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hello ${p.seller_name || p.business_name || 'Seller'}, I am interested in buying "${p.title}" listed on Market at Home for ${formatPrice(p.price)}.`);
        const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
        const telLink = `tel:${p.phone || cleanPhone}`;
        const sellerName = p.seller_name || p.business_name || 'Verified Seller';
        const safeSellerName = sellerName.replace(/'/g, "\\'");
        const displayLoc = (p.state || p.city) ? `${p.state || p.city}, ${p.country || 'Worldwide'}` : (p.country || 'Worldwide');

        return `
            <div class="product-card" onclick="openProductDetail(${p.id})">
                <div class="product-img-wrap">
                    <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${p.title}" class="product-img" loading="lazy">
                    <div class="product-badges">
                        <span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Verified</span>
                    </div>
                    <div class="product-price-badge">
                        ${formatPrice(p.price)}
                    </div>
                </div>

                <div class="product-body">
                    <div>
                        <div class="product-title">${p.title}</div>
                        <div class="product-location">
                            <i class="fa-solid fa-location-dot"></i> ${displayLoc}
                        </div>
                        <div class="product-seller-info">
                            <i class="fa-solid fa-store"></i> Seller: <strong>${sellerName}</strong>
                        </div>
                    </div>

                    <div class="product-actions" onclick="event.stopPropagation();">
                        <button type="button" class="btn-card-action btn-whatsapp" onclick="handleProtectedContact('whatsapp', '${waLink}', '${safeSellerName}', event)" title="Chat on WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i> Chat Seller
                        </button>
                        <button type="button" class="btn-card-action btn-outline" onclick="handleProtectedContact('tel', '${telLink}', '${safeSellerName}', event)" title="Call Seller">
                            <i class="fa-solid fa-phone"></i> Call
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadFeaturedBusinesses() {
    const businesses = await API.getBusinesses();
    const grid = document.getElementById('homeBusinessesGrid');
    if (!grid) return;

    grid.innerHTML = businesses.slice(0, 3).map(b => {
        const safeName = (b.name || 'Business').replace(/'/g, "\\'");
        const waLink = `https://wa.me/${(b.whatsapp || b.phone || '').replace(/[^0-9]/g, '')}`;
        return `
            <div class="business-card">
                <div class="business-header">
                    <img src="${b.logo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=200'}" alt="${b.name}" class="business-logo">
                    <div class="business-title-wrap">
                        <div class="business-name">${b.name}</div>
                        <div class="business-category">${b.category_name}</div>
                    </div>
                </div>
                <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.45; margin-bottom:12px; flex:1;">
                    ${b.description || 'Verified global supplier providing quality goods with worldwide shipping.'}
                </p>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-location-dot" style="color:#FA5252;"></i> ${b.city ? b.city + ', ' : ''}${b.country || 'Worldwide'}
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="handleProtectedContact('whatsapp', '${waLink}', '${safeName}', event)">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="searchFor('${safeName}')">View Products</button>
                </div>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
   PRODUCT DETAILS MODAL
   ========================================================================== */
async function openProductDetail(productId) {
    const products = await API.getProducts();
    const p = products.find(x => x.id == productId);
    if (!p) return;

    const modal = document.getElementById('productDetailModal');
    const content = document.getElementById('detailModalContent');
    const title = document.getElementById('detailModalTitle');

    if (title) title.innerText = p.title;

    const cleanPhone = (p.whatsapp || p.phone || p.seller_phone || '').replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(`Hello ${p.seller_name || p.business_name || 'Seller'}, I want to buy "${p.title}" listed on Market at Home for ${formatPrice(p.price)}. Please let me know how to proceed with payment and delivery to my location.`);
    const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
    const telLink = `tel:${p.phone || p.seller_phone || cleanPhone}`;
    const sellerName = p.seller_name || p.business_name || 'Verified Seller';
    const safeSellerName = sellerName.replace(/'/g, "\\'");
    const displayLoc = (p.state || p.city) ? `${p.state || p.city}, ${p.country || 'Worldwide'}` : (p.country || 'Worldwide');

    content.innerHTML = `
        <div style="position:relative; border-radius:14px; overflow:hidden; margin-bottom:16px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${p.title}" style="width:100%; height:260px; object-fit:cover; display:block;">
            <div style="position:absolute; bottom:12px; left:12px; background:rgba(15,23,42,0.85); backdrop-filter:blur(6px); color:#FFFFFF; font-size:1.25rem; font-weight:900; padding:6px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.2);">
                ${formatPrice(p.price)}
            </div>
            <div style="position:absolute; top:12px; right:12px;">
                <span class="badge badge-verified" style="padding:6px 12px; font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> Verified Good</span>
            </div>
        </div>

        <h3 style="font-size:1.2rem; font-weight:800; color:#0F172A; margin-bottom:12px; line-height:1.35;">
            ${p.title}
        </h3>

        <div class="form-section-block" style="padding:12px 14px; margin-bottom:14px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.82rem;">
                <div><i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> <strong>Location:</strong> ${displayLoc}</div>
                <div><i class="fa-solid fa-store" style="color:var(--brand-green);"></i> <strong>Seller:</strong> ${sellerName}</div>
                <div><i class="fa-solid fa-shield-halved" style="color:#3B82F6;"></i> <strong>Trust:</strong> Direct Verified</div>
                <div><i class="fa-solid fa-truck-fast" style="color:var(--brand-green);"></i> <strong>Delivery:</strong> Worldwide / Local</div>
            </div>
        </div>

        <div class="form-section-block" style="padding:12px 14px; margin-bottom:16px;">
            <div class="form-section-title" style="margin-bottom:6px; padding-bottom:4px;">
                <i class="fa-solid fa-align-left" style="color:var(--brand-green);"></i>
                <span>Product Description</span>
            </div>
            <p style="font-size:0.84rem; color:#475569; line-height:1.55; margin:0;">
                ${p.description || 'Authentic quality product listed directly by verified merchant on Market at Home.'}
            </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
            <button type="button" class="btn btn-whatsapp" style="padding:12px 14px; font-size:0.88rem; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="handleProtectedContact('whatsapp', '${waLink}', '${safeSellerName}', event)">
                <i class="fa-brands fa-whatsapp" style="font-size:1.15rem;"></i> Buy on WhatsApp
            </button>
            <button type="button" class="btn btn-publish-lux" style="padding:12px 14px; font-size:0.88rem; font-weight:800; width:100%;" onclick="handleProtectedContact('tel', '${telLink}', '${safeSellerName}', event)">
                <i class="fa-solid fa-phone"></i> Call Seller
            </button>
        </div>
    `;

    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

/* ==========================================================================
   SELLER DASHBOARD & PRODUCT OWNERSHIP (STRICT ACCESS CONTROL)
   ========================================================================== */

function isProductOwner(product, user) {
    if (!product) return false;
    if (isAdminAuthenticated()) return true; // Administrator has oversight
    if (!user) return false;

    // 1. Phone matching (exact or normalized)
    const userPhoneClean = (user.phone || '').replace(/[^0-9]/g, '');
    const prodPhoneClean = (product.seller_phone || product.phone || product.whatsapp || '').replace(/[^0-9]/g, '');
    if (userPhoneClean && prodPhoneClean && (userPhoneClean === prodPhoneClean || prodPhoneClean.endsWith(userPhoneClean) || userPhoneClean.endsWith(prodPhoneClean))) {
        return true;
    }

    // 2. Name / Store name matching
    const userName = (user.full_name || user.name || user.store_name || '').toLowerCase().trim();
    const prodSellerName = (product.seller_name || product.business_name || '').toLowerCase().trim();
    if (userName && prodSellerName && (userName === prodSellerName || prodSellerName.includes(userName) || userName.includes(prodSellerName))) {
        return true;
    }

    // 3. User ID matching
    if (user.id && product.user_id && user.id == product.user_id) {
        return true;
    }

    return false;
}

async function loadSellerDashboard() {
    const user = getCurrentUser();
    const isAdmin = isAdminAuthenticated();

    if (!user && !isAdmin) {
        return;
    }

    const allProducts = await API.getProducts();
    
    // Strict isolation: Seller ONLY has access to THEIR OWN goods
    const myProducts = isAdmin 
        ? allProducts 
        : allProducts.filter(p => isProductOwner(p, user));

    const myProductsContainer = document.getElementById('myProductsContainer');
    const totalListingsEl = document.getElementById('sellerTotalListings');

    if (totalListingsEl) totalListingsEl.innerText = myProducts.length;

    if (myProductsContainer) {
        if (myProducts.length === 0) {
            myProductsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:40px 20px; background:var(--bg-alt); border-radius:var(--radius-lg); border:1px dashed var(--border);">
                    <div style="width:56px; height:56px; background:var(--brand-green-soft); color:var(--brand-green); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:1.5rem; margin-bottom:12px;">
                        <i class="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary); margin-bottom:6px;">No Goods in Your Store Yet</h3>
                    <p style="font-size:0.85rem; color:var(--text-secondary); max-width:420px; margin:0 auto 16px auto;">
                        You have not listed any goods yet. Add your products now so buyers searching on the marketplace can discover and purchase from you!
                    </p>
                    <button class="btn btn-primary" onclick="openAddProductModal()">
                        <i class="fa-solid fa-plus"></i> Add Your First Good
                    </button>
                </div>
            `;
        } else {
            myProductsContainer.innerHTML = myProducts.map(p => `
                <div class="product-card">
                    <div class="product-img-wrap">
                        <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${p.title}" class="product-img">
                        <div class="product-price-badge">
                            ${formatPrice(p.price)}
                        </div>
                    </div>
                    <div class="product-body">
                        <div>
                            <div class="product-title">${p.title}</div>
                            <div class="product-location"><i class="fa-solid fa-location-dot"></i> ${p.city || 'Abuja'}</div>
                            <div class="product-seller-info"><i class="fa-solid fa-store"></i> ${p.seller_name || (user ? user.full_name : 'My Store')}</div>
                        </div>
                        <div class="product-actions" style="margin-top:10px;">
                            <button class="btn btn-outline btn-sm" onclick="openEditProductModal(${p.id})">
                                <i class="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button class="btn btn-outline btn-sm" style="color:#FA5252; border-color:#FA5252;" onclick="handleDeleteProduct(${p.id})">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

function setProductImagePreview(imageUrl) {
    const previewCard = document.getElementById('sellerProdPhotoPreviewCard');
    const previewImg = document.getElementById('sellerProdPhotoPreviewImg');
    const dropzone = document.getElementById('sellerProdPhotoDropzone');
    const photoInput = document.getElementById('sellerProdPhoto');

    if (photoInput) photoInput.value = imageUrl || '';

    if (imageUrl) {
        if (previewImg) previewImg.src = imageUrl;
        if (previewCard) previewCard.style.display = 'flex';
        if (dropzone) dropzone.style.display = 'none';
    } else {
        if (previewCard) previewCard.style.display = 'none';
        if (dropzone) dropzone.style.display = 'flex';
    }
}

function handleProductImageImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
        return;
    }

    // Limit client file size if larger than 10MB
    if (file.size > 10 * 1024 * 1024) {
        showToast('Image size exceeds 10MB. Please choose a smaller photo.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Url = e.target.result;
        setProductImagePreview(base64Url);
        showToast('Photo imported successfully!', 'success');
    };
    reader.onerror = function() {
        showToast('Failed to read photo file', 'error');
    };
    reader.readAsDataURL(file);
}

function setProductSamplePhoto(url) {
    setProductImagePreview(url);
    showToast('Sample photo selected!', 'info');
}

function openAddProductModal() {
    if (!requireAuth('add and manage your products')) {
        return;
    }
    const user = getCurrentUser() || (isAdminAuthenticated() ? { full_name: 'Admin', phone: '+234 803 456 7890' } : null);

    document.getElementById('addProductModalTitle').innerText = 'Add New Good / Product';
    document.getElementById('editProductId').value = '';
    document.getElementById('sellerProdTitle').value = '';
    document.getElementById('sellerProdPrice').value = '';
    document.getElementById('sellerProdDesc').value = '';
    document.getElementById('sellerProdSellerName').value = (user && user.full_name) || 'My Store';
    document.getElementById('sellerProdLocation').value = (user && user.location) || 'Abuja';
    document.getElementById('sellerProdPhone').value = (user && user.phone) || '+234 803 456 7890';
    
    // Country & State initialization
    const countrySelect = document.getElementById('sellerProdCountry');
    if (countrySelect) {
        countrySelect.value = (user && user.country) || 'Nigeria';
        handleProductModalCountryChange(countrySelect.value, (user && (user.state || user.location)) || 'Abuja (FCT)');
    }

    // Default preset image preview
    const defaultPhoto = 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80';
    setProductImagePreview(defaultPhoto);
    
    // Reset file input
    const fileInput = document.getElementById('sellerProdPhotoFileInput');
    if (fileInput) fileInput.value = '';
    
    document.getElementById('addProductModal').classList.add('active');
}

async function openEditProductModal(productId) {
    const user = getCurrentUser();
    const products = await API.getProducts();
    const p = products.find(x => x.id == productId);
    if (!p) return;

    // Strict access control: only the owner or admin can edit
    if (!isProductOwner(p, user)) {
        showToast('Access Denied: You can only edit your own goods.', 'error');
        return;
    }

    document.getElementById('addProductModalTitle').innerText = 'Edit / Update Good';
    document.getElementById('editProductId').value = p.id;
    document.getElementById('sellerProdTitle').value = p.title;
    // convert base USD price back to input value
    const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['USD'];
    document.getElementById('sellerProdPrice').value = Math.round(p.price * curr.rate);
    document.getElementById('sellerProdCategory').value = p.category_id || 1;
    document.getElementById('sellerProdSellerName').value = p.seller_name || (user ? user.full_name : 'My Store');
    document.getElementById('sellerProdLocation').value = p.city || p.state || 'Abuja';
    document.getElementById('sellerProdPhone').value = p.phone || (user ? user.phone : '+234 803 456 7890');
    document.getElementById('sellerProdDesc').value = p.description || '';
    
    // Country & State initialization
    const countrySelect = document.getElementById('sellerProdCountry');
    if (countrySelect) {
        countrySelect.value = p.country || 'Nigeria';
        handleProductModalCountryChange(countrySelect.value, p.state || p.city || '');
    }

    const photoUrl = p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80';
    setProductImagePreview(photoUrl);

    // Reset file input
    const fileInput = document.getElementById('sellerProdPhotoFileInput');
    if (fileInput) fileInput.value = '';

    document.getElementById('addProductModal').classList.add('active');
}

async function handleDeleteProduct(productId) {
    const user = getCurrentUser();
    const products = await API.getProducts();
    const p = products.find(x => x.id == productId);

    // Strict access control: only the owner or admin can delete
    if (p && !isProductOwner(p, user)) {
        showToast('Access Denied: You can only remove your own goods.', 'error');
        return;
    }

    if (confirm('Are you sure you want to remove this good from your store and search?')) {
        await API.deleteProduct(productId);
        showToast('Good removed successfully!', 'success');
        loadMarketplaceProducts();
        loadSellerDashboard();
        loadAdminPortal();
    }
}

/* ==========================================================================
   BUYER PORTAL & ACTIVITY HUB
   ========================================================================== */
async function loadBuyerDashboard() {
    const user = getCurrentUser() || (isAdminAuthenticated() ? { full_name: 'Admin (Buyer View)', phone: '09090809080', location: 'Abuja', country: 'Nigeria', role: 'buyer', id: 201 } : null);

    if (!user) return;

    // 1. Populate Profile Information
    const avatarEl = document.getElementById('buyerAvatarCircle');
    const nameEl = document.getElementById('buyerDisplayName');
    const phoneEl = document.getElementById('buyerDisplayPhone');
    const locEl = document.getElementById('buyerDisplayLocation');
    const memberIdEl = document.getElementById('buyerMemberId');

    if (avatarEl) avatarEl.innerText = (user.full_name || 'B').charAt(0).toUpperCase();
    if (nameEl) nameEl.innerText = user.full_name || 'Verified Buyer';
    if (phoneEl) phoneEl.innerHTML = `<i class="fa-solid fa-phone" style="color:#10B981;"></i> ${user.phone || '+234 800 000 0000'}`;
    if (locEl) locEl.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> ${user.location || 'Worldwide'}, ${user.country || 'Global'}`;
    if (memberIdEl) memberIdEl.innerText = user.member_id || `ID: MBR-BYR-${user.id || Math.floor(100 + Math.random() * 900)}`;

    // 2. Fetch Buyer's Assisted Orders
    const allRequests = await API.getBuyingRequests();
    let myOrders = await API.getBuyerOrders(user);

    // If fresh user has no orders yet, seed from active requests so portal is rich
    if (myOrders.length === 0 && allRequests.length > 0) {
        myOrders = allRequests.slice(0, 2);
    }

    const totalOrdersEl = document.getElementById('buyerTotalOrdersCount');
    if (totalOrdersEl) totalOrdersEl.innerText = myOrders.length;

    // 3. Render Orders Container
    const ordersContainer = document.getElementById('buyerOrdersContainer');
    if (ordersContainer) {
        if (myOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div style="text-align:center; padding:36px 16px; background:var(--bg-alt); border-radius:var(--radius-md); border:1px dashed var(--border);">
                    <div style="width:48px; height:48px; border-radius:50%; background:var(--brand-green-soft); color:var(--brand-green); display:inline-flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:10px;">
                        <i class="fa-solid fa-bag-shopping"></i>
                    </div>
                    <h4 style="font-size:1rem; font-weight:800; color:var(--primary); margin:0 0 6px 0;">No Active Sourcing Orders</h4>
                    <p style="font-size:0.8rem; color:var(--text-secondary); max-width:380px; margin:0 auto 14px auto;">
                        Need goods inspected, negotiated, and delivered from any city or country? Submit your first sourcing request!
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="switchPage('assistance')">
                        <i class="fa-solid fa-plus"></i> Request Buying Assistance
                    </button>
                </div>
            `;
        } else {
            ordersContainer.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${myOrders.map(ord => {
                        const cleanPhone = '2349090809080';
                        const waMsg = encodeURIComponent(`Hello Market at Home Desk, I am inquiring about my Buying Assistance Order ${ord.tracking_code} (${ord.item_title}) for delivery to ${ord.target_city || ord.target_country || 'Worldwide'}.`);
                        const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;

                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:14px 16px; background:var(--bg-alt); border:1px solid var(--border); border-radius:var(--radius-md); transition:all 0.2s ease;">
                                <div style="display:flex; align-items:flex-start; gap:12px;">
                                    <div style="width:40px; height:40px; border-radius:10px; background:var(--brand-green-soft); color:var(--brand-green); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; margin-top:2px;">
                                        <i class="fa-solid fa-box-open"></i>
                                    </div>
                                    <div>
                                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                            <strong style="font-size:0.92rem; color:var(--primary);">${ord.item_title}</strong>
                                            <span class="badge badge-verified" style="font-size:0.7rem;"><i class="fa-solid fa-clock"></i> ${ord.status || 'Sourcing Active'}</span>
                                        </div>
                                        <div style="font-size:0.76rem; color:var(--text-secondary); margin-top:4px;">
                                            <span style="font-family:monospace; font-weight:700; color:var(--brand-green);">${ord.tracking_code}</span> &bull; 
                                            <span>Destination: <strong>${ord.target_city || 'Worldwide'}, ${ord.target_country || 'Global'}</strong></span> &bull; 
                                            <span>Service: ${ord.package_type || 'Full Assistance'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style="display:flex; align-items:center; gap:8px;">
                                    <a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm" style="font-size:0.78rem; padding:6px 12px; display:inline-flex; align-items:center; gap:6px;">
                                        <i class="fa-brands fa-whatsapp"></i> Chat Support
                                    </a>
                                    <button type="button" class="btn btn-outline btn-sm" style="font-size:0.78rem; padding:6px 12px;" onclick="trackSpecificOrder('${ord.tracking_code}')">
                                        <i class="fa-solid fa-location-crosshairs"></i> Status
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    }

    // 4. Render Recommended Worldwide Products for Buyer
    const allProducts = await API.getProducts();
    const recGrid = document.getElementById('buyerRecommendedGrid');
    if (recGrid) {
        recGrid.innerHTML = renderProductsHtml(allProducts.slice(0, 4));
    }
}

function trackSpecificOrder(code) {
    const input = document.getElementById('buyerTrackingInput');
    if (input) {
        input.value = code;
        handleBuyerTrackOrder();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

async function handleBuyerTrackOrder() {
    const code = (document.getElementById('buyerTrackingInput')?.value || '').trim().toUpperCase();
    const resultBox = document.getElementById('buyerTrackingResultBox');
    if (!resultBox) return;

    if (!code) {
        showToast('Please enter a tracking code (e.g. PBA-00101)', 'error');
        return;
    }

    const allRequests = await API.getBuyingRequests();
    const found = allRequests.find(r => r.tracking_code && r.tracking_code.toUpperCase() === code);

    resultBox.style.display = 'block';

    if (!found) {
        resultBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; color:#EF4444; font-size:0.85rem;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:1.2rem;"></i>
                <div>
                    <strong>Order Not Found:</strong> No order matching tracking code <code>${code}</code>. Please double-check the code or contact support.
                </div>
            </div>
        `;
        return;
    }

    resultBox.innerHTML = `
        <div style="border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
                <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Tracking Code</span>
                <div style="font-size:1.1rem; font-weight:900; color:var(--brand-green); font-family:monospace;">${found.tracking_code}</div>
            </div>
            <span class="badge badge-verified" style="font-size:0.8rem; padding:6px 12px;"><i class="fa-solid fa-circle-check"></i> ${found.status || 'Sourcing Active'}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.82rem; margin-bottom:14px;">
            <div><strong>Item:</strong> ${found.item_title}</div>
            <div><strong>Destination:</strong> ${found.target_city || 'Worldwide'}, ${found.target_country || 'Global'}</div>
            <div><strong>Package:</strong> ${found.package_type || 'Full Assistance'}</div>
            <div><strong>Agent:</strong> ${found.assigned_agent || 'Senior Sourcing Desk'}</div>
        </div>

        <!-- Milestones Step Tracker -->
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; text-align:center; font-size:0.72rem; margin-top:8px;">
            <div style="padding:8px 4px; background:#ECFDF5; color:#059669; border-radius:8px; border:1px solid #A7F3D0; font-weight:700;">
                <i class="fa-solid fa-check"></i> 1. Received
            </div>
            <div style="padding:8px 4px; background:#ECFDF5; color:#059669; border-radius:8px; border:1px solid #A7F3D0; font-weight:700;">
                <i class="fa-solid fa-check"></i> 2. Sourcing Active
            </div>
            <div style="padding:8px 4px; background:#EFF6FF; color:#2563EB; border-radius:8px; border:1px solid #BFDBFE; font-weight:700;">
                <i class="fa-solid fa-magnifying-glass"></i> 3. Inspection
            </div>
            <div style="padding:8px 4px; background:var(--bg-alt); color:var(--text-muted); border-radius:8px; border:1px solid var(--border); font-weight:600;">
                <i class="fa-solid fa-plane"></i> 4. Delivered
            </div>
        </div>
    `;
}

/* ==========================================================================
   ADMIN PORTAL (AUTHENTICATION & ACCESS CONTROL)
   ========================================================================== */
function isAdminAuthenticated() {
    return localStorage.getItem('globalbiz_admin_session') === 'active';
}

function handleAdminLogout() {
    localStorage.removeItem('globalbiz_admin_session');
    showToast('Signed out of Administrator Portal', 'info');
    loadAdminPortal();
}

function switchAdminTab(tabName, btnEl) {
    document.querySelectorAll('#page-admin .admin-tab-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    document.getElementById('admin-overview-view').style.display = tabName === 'overview' ? 'block' : 'none';
    const memView = document.getElementById('admin-members-view');
    if (memView) memView.style.display = tabName === 'members' ? 'block' : 'none';
    document.getElementById('admin-sellers-view').style.display = tabName === 'sellers' ? 'block' : 'none';
    document.getElementById('admin-buyers-view').style.display = tabName === 'buyers' ? 'block' : 'none';
    document.getElementById('admin-products-view').style.display = tabName === 'products' ? 'block' : 'none';
    document.getElementById('admin-requests-view').style.display = tabName === 'requests' ? 'block' : 'none';
}

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

    // Authenticated
    if (loginGate) loginGate.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    if (quickBar) quickBar.style.display = 'block';
    updateNavAuthUI();

    const members = await API.getMembers();
    const sellers = await API.getSellers();
    const buyers = await API.getBuyers();
    const products = await API.getProducts();
    const requests = await API.getBuyingRequests();

    // 0. Update KPI Counters
    const totalMembersEl = document.getElementById('adminTotalMembers');
    const totalSellersEl = document.getElementById('adminTotalSellers');
    const totalBuyersEl = document.getElementById('adminTotalBuyers');
    const totalProductsEl = document.getElementById('adminTotalProducts');
    const totalRequestsEl = document.getElementById('adminTotalRequests');

    if (totalMembersEl) totalMembersEl.innerText = members.length;
    if (totalSellersEl) totalSellersEl.innerText = sellers.length;
    if (totalBuyersEl) totalBuyersEl.innerText = buyers.length;
    if (totalProductsEl) totalProductsEl.innerText = products.length;
    if (totalRequestsEl) totalRequestsEl.innerText = requests.length;

    // Tab badges
    const tabMemberCount = document.getElementById('adminTabMemberCount');
    const tabSellerCount = document.getElementById('adminTabSellerCount');
    const tabBuyerCount = document.getElementById('adminTabBuyerCount');
    const tabProductCount = document.getElementById('adminTabProductCount');
    const tabRequestCount = document.getElementById('adminTabRequestCount');

    if (tabMemberCount) tabMemberCount.innerText = members.length;
    if (tabSellerCount) tabSellerCount.innerText = sellers.length;
    if (tabBuyerCount) tabBuyerCount.innerText = buyers.length;
    if (tabProductCount) tabProductCount.innerText = products.length;
    if (tabRequestCount) tabRequestCount.innerText = requests.length;

    // 0b. Live Activity Log List
    const activityLogEl = document.getElementById('adminActivityLogList');
    if (activityLogEl) {
        activityLogEl.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--brand-green-soft); color:var(--brand-green); display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
                        <i class="fa-solid fa-user-plus"></i>
                    </div>
                    <div>
                        <strong>Seller Registration:</strong> Amina Bello Lawal created store in <em>Abuja (Wuse 2)</em>.
                        <div style="font-size:0.72rem; color:var(--text-muted);">Store: Amina Luxury Ankara & Fabrics &bull; Phone: +234 803 456 7890</div>
                    </div>
                </div>
                <span class="badge badge-verified">Verified</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--indigo-soft, #EEF2FF); color:#4F46E5; display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
                        <i class="fa-solid fa-bag-shopping"></i>
                    </div>
                    <div>
                        <strong>Buyer Registered:</strong> Ahmed Yusuf Al-Mansoor joined from <em>Abuja (Maitama)</em>.
                        <div style="font-size:0.72rem; color:var(--text-muted);">Phone: +234 802 345 6789 &bull; Direct Buyer</div>
                    </div>
                </div>
                <span class="badge badge-verified">Active</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--gold-soft); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
                        <i class="fa-solid fa-box-open"></i>
                    </div>
                    <div>
                        <strong>New Product Listed:</strong> "Authentic 6-Yards Premium Ankara Material" for <em>₦15,000</em>.
                        <div style="font-size:0.72rem; color:var(--text-muted);">Seller: Amina &bull; City: Abuja</div>
                    </div>
                </div>
                <span class="badge badge-verified">Active</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-alt); border-radius:var(--radius-md); font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--gold-soft); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
                        <i class="fa-solid fa-handshake-angle"></i>
                    </div>
                    <div>
                        <strong>Buying Assistance Order:</strong> Ibrahim Al-Rashid requested <em>200 bags of Benue Yam</em> in Kano.
                        <div style="font-size:0.72rem; color:var(--text-muted);">Code: PBA-00101 &bull; Status: Sourcing Desk Active</div>
                    </div>
                </div>
                <span class="badge badge-verified">In Progress</span>
            </div>
        `;
    }

    // 0c. Render All Members Directory Table
    renderAdminMembersTable(members);

    // 1. Render Sellers Table
    renderAdminSellersTable(sellers);

    // 2. Render Buyers Table
    renderAdminBuyersTable(buyers);

    // 3. Products Table
    const productsTbody = document.getElementById('adminProductsTableBody');
    if (productsTbody) {
        productsTbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${p.photo_url || ''}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;">
                        <strong>${p.title}</strong>
                    </div>
                </td>
                <td>${p.seller_name || p.business_name}</td>
                <td><strong style="color:var(--brand-green);">${formatPrice(p.price)}</strong></td>
                <td>${p.city}</td>
                <td>
                    <button class="btn btn-sm btn-outline" style="color:#FA5252; border-color:#FA5252;" onclick="handleDeleteProduct(${p.id})">
                        <i class="fa-solid fa-trash"></i> Remove
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 4. Requests Table
    const requestsTbody = document.getElementById('adminRequestsTableBody');
    if (requestsTbody) {
        requestsTbody.innerHTML = requests.map(r => `
            <tr>
                <td><strong>${r.tracking_code}</strong></td>
                <td>${r.customer_name}<br><span style="font-size:0.75rem; color:var(--text-muted);">${r.customer_phone}</span></td>
                <td>${r.item_title}</td>
                <td>${r.target_city}</td>
                <td>${r.package_type}</td>
                <td><span class="badge badge-verified">${r.status}</span></td>
            </tr>
        `).join('');
    }
}

// ==========================================
// ALL MEMBERS DIRECTORY HANDLERS (ADMIN)
// ==========================================
function renderAdminMembersTable(members) {
    const tbody = document.getElementById('adminMembersTableBody');
    if (!tbody) return;
    if (!members || members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted); font-size:0.84rem;"><i class="fa-solid fa-user-slash" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>No registered members found matching your search.</td></tr>`;
        return;
    }
    tbody.innerHTML = members.map(m => {
        const isSeller = (m.role || '').toLowerCase() === 'seller';
        const roleBadge = isSeller 
            ? `<span class="badge" style="background:#ECFDF5; color:#059669; font-weight:800; border:1px solid #A7F3D0;"><i class="fa-solid fa-store"></i> Seller Store</span>`
            : `<span class="badge" style="background:#EFF6FF; color:#2563EB; font-weight:800; border:1px solid #BFDBFE;"><i class="fa-solid fa-bag-shopping"></i> Verified Buyer</span>`;
        
        const cleanPhone = (m.phone || '').replace(/[^0-9]/g, '');
        const waLink = `https://wa.me/${cleanPhone}`;

        return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:${isSeller ? 'var(--brand-green-soft)' : '#EFF6FF'}; color:${isSeller ? 'var(--brand-green)' : '#2563EB'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; flex-shrink:0;">
                            ${(m.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong style="color:var(--primary); font-size:0.85rem;">${m.full_name}</strong>
                            <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace; font-weight:700;">ID: ${m.member_id}</div>
                            ${m.store_name && m.store_name !== 'Direct Customer' ? `<div style="font-size:0.72rem; color:var(--brand-green); font-weight:700;"><i class="fa-solid fa-shop"></i> ${m.store_name}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>${roleBadge}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <strong style="font-size:0.82rem;">${m.phone}</strong>
                        ${cleanPhone ? `<a href="${waLink}" target="_blank" style="color:#22C55E; font-size:0.95rem;" title="Chat Member on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                    </div>
                </td>
                <td>
                    <div style="font-size:0.82rem; font-weight:700;">
                        <i class="fa-solid fa-location-dot" style="color:#EF4444; font-size:0.75rem;"></i> ${m.location || m.city || 'Abuja'}
                    </div>
                    <span style="font-size:0.7rem; color:var(--text-muted);">${m.country || 'Nigeria'}</span>
                </td>
                <td>
                    <span style="font-size:0.78rem; color:var(--text-secondary);">${m.registered_at || '2026-08-15'}</span>
                </td>
                <td>
                    <span class="badge ${m.verified ? 'badge-verified' : 'badge-warning'}" style="font-size:0.72rem;">
                        ${m.verified ? '<i class="fa-solid fa-circle-check"></i> Verified' : '<i class="fa-solid fa-clock"></i> Active'}
                    </span>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <button class="btn btn-sm ${m.verified ? 'btn-outline' : 'btn-success'}" onclick="handleToggleMemberVerify(${m.id}, '${m.source_type || 'seller'}', ${m.verified ? 0 : 1})" title="${m.verified ? 'Revoke verification badge' : 'Verify member'}">
                            ${m.verified ? 'Revoke' : 'Verify'}
                        </button>
                        <button class="btn btn-sm btn-outline" style="color:#EF4444; border-color:#EF4444;" onclick="handleDeleteMember(${m.id}, '${m.source_type || 'seller'}')" title="Delete Member">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

let currentAdminMemberFilter = 'all';

async function handleFilterMembers(role, btnEl) {
    currentAdminMemberFilter = role;
    document.querySelectorAll('#admin-members-view .hero-loc-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    const searchVal = document.getElementById('adminMemberSearchInput')?.value || '';
    const members = await API.getMembers({ role, q: searchVal });
    renderAdminMembersTable(members);
}

async function handleAdminMemberSearch(query) {
    const members = await API.getMembers({ role: currentAdminMemberFilter, q: query });
    renderAdminMembersTable(members);
}

async function handleToggleMemberVerify(id, sourceType, newStatus) {
    await API.toggleMemberVerification(id, sourceType, newStatus);
    showToast(newStatus ? 'Member verified with verified badge!' : 'Member verification revoked.', 'info');
    loadAdminPortal();
}

async function handleDeleteMember(id, sourceType) {
    if (!confirm('Are you sure you want to remove this member from the directory?')) return;
    await API.deleteMember(id, sourceType);
    showToast('Member removed successfully.', 'success');
    loadAdminPortal();
}

function renderAdminSellersTable(sellers) {
    const sellersTbody = document.getElementById('adminSellersTableBody');
    if (!sellersTbody) return;
    if (sellers.length === 0) {
        sellersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No registered sellers found.</td></tr>`;
        return;
    }
    sellersTbody.innerHTML = sellers.map(s => `
        <tr>
            <td>
                <strong>${s.full_name}</strong><br>
                <span style="font-size:0.75rem; color:var(--text-muted);">${s.store_name}</span>
            </td>
            <td><span class="badge" style="background:var(--bg-alt); color:var(--primary); font-size:0.72rem;">${s.category_name || 'General'}</span></td>
            <td>
                <strong>${s.phone}</strong>
            </td>
            <td>
                ${s.location || 'Nigeria'}
            </td>
            <td>
                <span class="badge ${s.verified ? 'badge-verified' : 'badge-warning'}">
                    ${s.verified ? '<i class="fa-solid fa-check"></i> Verified' : '<i class="fa-solid fa-clock"></i> Active'}
                </span>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:4px;">
                    <button class="btn btn-sm ${s.verified ? 'btn-outline' : 'btn-success'}" onclick="handleToggleSellerVerify(${s.id}, ${s.verified ? 0 : 1})" title="${s.verified ? 'Revoke badge' : 'Verify seller'}">
                        ${s.verified ? 'Revoke' : 'Verify'}
                    </button>
                    <button class="btn btn-sm btn-outline" style="color:#EF4444; border-color:#EF4444;" onclick="handleDeleteSeller(${s.id})" title="Delete Seller">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderAdminBuyersTable(buyers) {
    const buyersTbody = document.getElementById('adminBuyersTableBody');
    if (!buyersTbody) return;
    if (buyers.length === 0) {
        buyersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No registered buyers found.</td></tr>`;
        return;
    }
    buyersTbody.innerHTML = buyers.map(b => `
        <tr>
            <td>
                <strong>${b.full_name}</strong>
            </td>
            <td><strong>${b.phone}</strong></td>
            <td>${b.location || b.city || 'Nigeria'}</td>
            <td><span style="font-size:0.75rem; color:var(--text-muted);">${b.registered_at || '2026-08-15'}</span></td>
            <td><span class="badge badge-verified">${b.orders_count || 0} Orders</span></td>
            <td>
                <button class="btn btn-sm btn-outline" style="color:#EF4444; border-color:#EF4444;" onclick="handleDeleteBuyer(${b.id})" title="Delete Buyer">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleAdminSellerSearch(query) {
    const sellers = await API.getSellers({ q: query });
    renderAdminSellersTable(sellers);
}

async function handleAdminBuyerSearch(query) {
    const buyers = await API.getBuyers({ q: query });
    renderAdminBuyersTable(buyers);
}

async function handleDeleteSeller(sellerId) {
    if (confirm('Are you sure you want to remove this seller from the platform?')) {
        await API.deleteSeller(sellerId);
        showToast('Seller removed successfully', 'success');
        loadAdminPortal();
    }
}

async function handleDeleteBuyer(buyerId) {
    if (confirm('Are you sure you want to remove this buyer account?')) {
        await API.deleteBuyer(buyerId);
        showToast('Buyer account removed successfully', 'success');
        loadAdminPortal();
    }
}

function openAdminAddSellerModal() {
    document.getElementById('adminAddSellerForm')?.reset();
    document.getElementById('adminAddSellerModal')?.classList.add('active');
}

function openAdminAddBuyerModal() {
    document.getElementById('adminAddBuyerForm')?.reset();
    document.getElementById('adminAddBuyerModal')?.classList.add('active');
}

async function handleToggleSellerVerify(sellerId, status) {
    await API.verifySeller(sellerId, status);
    showToast(status ? 'Seller verified with badge!' : 'Verification revoked', 'success');
    loadAdminPortal();
}

/* ==========================================================================
   FORMS & SEARCH ENGINES
   ========================================================================== */
function setupSearchEngine() {
    const mainForm = document.getElementById('mainSearchForm');
    if (mainForm) {
        mainForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = (document.getElementById('mainSearchInput')?.value || '').trim();
            const heroCountry = (document.getElementById('heroCountrySelect')?.value || '').trim();
            const heroState = (document.getElementById('heroStateSelect')?.value || '').trim();

            switchPage('marketplace');
            const marketSearchInput = document.getElementById('marketSearchFilter');
            if (marketSearchInput) marketSearchInput.value = q;

            const marketCountryFilter = document.getElementById('marketCountryFilter');
            if (marketCountryFilter) {
                marketCountryFilter.value = heroCountry;
                handleMarketCountryChange(heroCountry);
            }

            const marketStateFilter = document.getElementById('marketStateFilter');
            if (marketStateFilter && heroState) {
                marketStateFilter.value = heroState;
            }

            filterMarketplace();
        });
    }
}

function searchFor(keyword) {
    switchPage('marketplace');
    const input = document.getElementById('marketSearchFilter');
    if (input) {
        input.value = keyword;
        filterMarketplace();
    }
}

function filterMarketplace() {
    const q = (document.getElementById('marketSearchFilter')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('marketCategoryFilter')?.value || '';
    const country = document.getElementById('marketCountryFilter')?.value || '';
    const state = document.getElementById('marketStateFilter')?.value || '';

    loadMarketplaceProducts({
        q: q,
        category_id: cat,
        country: country,
        state: state
    });
}

function setupForms() {
    // 1. User Sign In Form
    const userLoginForm = document.getElementById('userLoginForm');
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneEmail = document.getElementById('loginPhoneEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (!phoneEmail || !password) {
                showToast('Please enter both phone/email and password', 'error');
                return;
            }

            // Check if user is registered in buyers or sellers
            const sellers = await API.getSellers();
            const buyers = await API.getBuyers();
            const cleanInput = phoneEmail.replace(/[^0-9]/g, '');

            const matchedSeller = sellers.find(s => s.phone && (s.phone.replace(/[^0-9]/g, '') === cleanInput || s.full_name.toLowerCase() === phoneEmail.toLowerCase()));
            const matchedBuyer = buyers.find(b => b.phone && (b.phone.replace(/[^0-9]/g, '') === cleanInput || b.full_name.toLowerCase() === phoneEmail.toLowerCase()));

            const role = matchedSeller ? 'seller' : (matchedBuyer ? 'buyer' : (phoneEmail.toLowerCase().includes('seller') ? 'seller' : 'buyer'));
            const matchedObj = matchedSeller || matchedBuyer;

            const userName = matchedObj ? matchedObj.full_name : (phoneEmail.includes('@') ? phoneEmail.split('@')[0] : phoneEmail);
            const userSession = {
                id: matchedObj ? matchedObj.id : Date.now(),
                full_name: matchedObj ? matchedObj.full_name : (userName.charAt(0).toUpperCase() + userName.slice(1)),
                phone: matchedObj ? matchedObj.phone : phoneEmail,
                location: matchedObj ? (matchedObj.location || matchedObj.city) : 'Worldwide',
                country: matchedObj ? (matchedObj.country || 'Nigeria') : 'Worldwide',
                role: role,
                store_name: matchedSeller ? matchedSeller.store_name : undefined
            };

            localStorage.setItem('globalbiz_user_session', JSON.stringify(userSession));
            updateNavAuthUI();
            closeModal('userAuthModal');
            showToast(`Welcome back, ${userSession.full_name}!`, 'success');
            userLoginForm.reset();

            if (role === 'seller') {
                switchPage('seller');
            } else {
                switchPage('buyer');
            }
        });
    }

    // 2. User Register Form (Buyer / Seller)
    const userRegForm = document.getElementById('userRegisterForm');
    if (userRegForm) {
        userRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const role = document.querySelector('input[name="authRole"]:checked')?.value || 'buyer';
            const fullName = document.getElementById('regFullName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const country = document.getElementById('regCountry')?.value.trim() || 'Nigeria';
            const location = document.getElementById('regLocation')?.value.trim() || 'Abuja';
            const password = document.getElementById('regPassword').value.trim();

            const userSession = {
                id: Date.now(),
                full_name: fullName,
                phone: phone,
                country: country,
                location: location,
                role: role
            };

            if (role === 'seller') {
                const storeName = `${fullName}'s Store`;
                userSession.store_name = storeName;

                // Register seller in API/state
                await API.registerSeller({
                    full_name: fullName,
                    phone: phone,
                    country: country,
                    location: location,
                    store_name: storeName
                });
            } else {
                // Register buyer in API/state
                await API.createBuyer({
                    full_name: fullName,
                    phone: phone,
                    country: country,
                    location: location,
                    city: location
                });
            }

            localStorage.setItem('globalbiz_user_session', JSON.stringify(userSession));
            updateNavAuthUI();
            closeModal('userAuthModal');
            userRegForm.reset();
            loadAdminPortal();

            if (role === 'seller') {
                showToast(`Welcome Seller ${fullName}! Your global seller dashboard is ready.`, 'success');
                switchPage('seller');
            } else {
                showToast(`Welcome Buyer ${fullName}! Your buyer portal & activity hub is ready.`, 'success');
                switchPage('buyer');
            }
        });
    }

    // Admin Login Form
    const adminForm = document.getElementById('adminLoginForm');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = (document.getElementById('adminUsernameInput')?.value || '').trim();
            const p = (document.getElementById('adminPasswordInput')?.value || '').trim();

            if ((u === 'admin' || u === 'admin@globalbiz.ng' || u === 'Amina') && (p === 'admin123' || p === '09090809080')) {
                localStorage.setItem('globalbiz_admin_session', 'active');
                showToast('Welcome to Administrator Desk, Amina!', 'success');
                adminForm.reset();
                loadAdminPortal();
            } else {
                showToast('Invalid administrator username or password!', 'error');
            }
        });
    }

    // Add / Edit Product Form
    const prodForm = document.getElementById('sellerProductForm');
    if (prodForm) {
        prodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!requireAuth('publish product listings')) {
                return;
            }
            const user = getCurrentUser() || (isAdminAuthenticated() ? { full_name: 'Admin', phone: '+234 803 456 7890' } : null);
            const editId = document.getElementById('editProductId').value;
            const inputPrice = parseFloat(document.getElementById('sellerProdPrice').value) || 0;
            // Convert to base USD for storage
            const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['USD'];
            const priceInUSD = inputPrice / curr.rate;

            const inputSellerName = document.getElementById('sellerProdSellerName').value.trim();
            const inputSellerPhone = document.getElementById('sellerProdPhone').value.trim();
            const sellerName = inputSellerName || (user && user.full_name) || 'Verified Seller';
            const sellerPhone = inputSellerPhone || (user && user.phone) || '+234 800 000 0000';
            const country = document.getElementById('sellerProdCountry')?.value.trim() || 'Nigeria';
            const stateVal = document.getElementById('sellerProdStateSelect')?.value.trim() || '';
            const cityVal = document.getElementById('sellerProdLocation')?.value.trim() || stateVal || 'Abuja';

            const payload = {
                title: document.getElementById('sellerProdTitle').value.trim(),
                price: priceInUSD,
                category_id: parseInt(document.getElementById('sellerProdCategory').value) || 1,
                seller_name: sellerName,
                seller_phone: sellerPhone,
                phone: sellerPhone,
                whatsapp: sellerPhone,
                country: country,
                state: stateVal || cityVal,
                city: cityVal,
                description: document.getElementById('sellerProdDesc').value.trim(),
                photo_url: document.getElementById('sellerProdPhoto').value.trim(),
                user_id: user ? (user.id || user.phone) : (sellerPhone || Date.now())
            };

            if (editId) {
                // Verify ownership before updating
                const products = await API.getProducts();
                const existing = products.find(x => x.id == editId);
                if (existing && !isProductOwner(existing, user)) {
                    showToast('Access Denied: You can only edit your own goods.', 'error');
                    return;
                }
                await API.updateProduct(editId, payload);
                showToast('Good updated and live on marketplace!', 'success');
            } else {
                await API.createProduct(payload);
                showToast('🎉 Good published! Buyers worldwide in search & marketplace can now view and buy it.', 'success');
            }

            closeModal('addProductModal');
            await loadMarketplaceProducts();
            await loadSellerDashboard();
            await loadAdminPortal();
        });
    }

    // Buying Assistance Form
    const pbaForm = document.getElementById('buyingAssistanceMainForm');
    if (pbaForm) {
        pbaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!requireAuth('submit a buying assistance order')) {
                return;
            }
            const targetCountry = document.getElementById('mainPbaCountry')?.value.trim() || 'Nigeria';
            const targetCity = document.getElementById('mainPbaCity')?.value.trim() || 'Lagos / Worldwide';
            const payload = {
                item_title: document.getElementById('mainPbaItem').value.trim(),
                target_country: targetCountry,
                target_city: targetCity,
                customer_name: document.getElementById('mainPbaName').value.trim(),
                customer_phone: document.getElementById('mainPbaPhone').value.trim(),
                specifications: document.getElementById('mainPbaSpecs').value.trim(),
                package_type: AppState.selectedAssistancePackage,
                service_fee: AppState.selectedAssistanceFee
            };

            const res = await API.submitBuyingAssistance(payload);
            showToast(`Request submitted! Tracking Code: ${res.tracking_code}`, 'success');
            pbaForm.reset();
            await loadBuyerDashboard();
            await loadAdminPortal();
            if (AppState.currentPage === 'assistance') {
                setTimeout(() => {
                    showToast('Viewing your order in Buyer Portal...', 'info');
                    switchPage('buyer');
                }, 1200);
            }
        });
    }

    // 6. Admin Add Seller Form
    const adminSellerForm = document.getElementById('adminAddSellerForm');
    if (adminSellerForm) {
        adminSellerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('adminSellerFullName').value.trim();
            const phone = document.getElementById('adminSellerPhone').value.trim();
            const storeName = document.getElementById('adminSellerStoreName').value.trim();
            const location = document.getElementById('adminSellerLocation').value.trim();
            const category = document.getElementById('adminSellerCategory').value;
            const isVerified = document.getElementById('adminSellerVerifiedCheck').checked ? 1 : 0;

            await API.registerSeller({
                full_name: fullName,
                phone: phone,
                store_name: storeName,
                location: location,
                category_name: category,
                verified: isVerified
            });

            closeModal('adminAddSellerModal');
            adminSellerForm.reset();
            showToast(`Seller "${fullName}" registered successfully!`, 'success');
            loadAdminPortal();
        });
    }

    // 7. Admin Add Buyer Form
    const adminBuyerForm = document.getElementById('adminAddBuyerForm');
    if (adminBuyerForm) {
        adminBuyerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('adminBuyerFullName').value.trim();
            const phone = document.getElementById('adminBuyerPhone').value.trim();
            const location = document.getElementById('adminBuyerLocation').value.trim();
            const country = document.getElementById('adminBuyerCountry').value.trim() || 'Nigeria';

            await API.createBuyer({
                full_name: fullName,
                phone: phone,
                location: location,
                country: country,
                orders_count: 0
            });

            closeModal('adminAddBuyerModal');
            adminBuyerForm.reset();
            showToast(`Buyer "${fullName}" registered successfully!`, 'success');
            loadAdminPortal();
        });
    }
}

function selectAssistancePackage(pkgName, fee, el) {
    AppState.selectedAssistancePackage = pkgName;
    AppState.selectedAssistanceFee = fee;

    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');

    const pkgInput = document.getElementById('mainSelectedPackage');
    const feeInput = document.getElementById('mainSelectedFee');
    if (pkgInput) pkgInput.value = pkgName;
    if (feeInput) feeInput.value = fee;
}

/* ==========================================================================
   PWA (PROGRESSIVE WEB APP) SERVICE WORKER & APP LIFECYCLE
   ========================================================================== */
let deferredPwaInstallPrompt = null;

// 1. Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ [Market at Home PWA] Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.warn('⚠️ [Market at Home PWA] Service Worker registration failed:', error);
            });
    });
}

// 2. Catch native beforeinstallprompt event (Android, Chrome, Edge)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaInstallPrompt = e;
    
    // Check if dismissed recently (within 3 days)
    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
    const isDismissedRecently = lastDismissed && (Date.now() - parseInt(lastDismissed, 10) < 3 * 24 * 60 * 60 * 1000);
    
    const floatingPrompt = document.getElementById('pwaFloatingPrompt');
    if (floatingPrompt && !isDismissedRecently) {
        // Show after a gentle 3-second delay so user can orient on page first
        setTimeout(() => {
            if (floatingPrompt && deferredPwaInstallPrompt) {
                floatingPrompt.style.display = 'block';
            }
        }, 3000);
    }
});

// Dismiss floating PWA install prompt
function dismissPwaPrompt() {
    const floatingPrompt = document.getElementById('pwaFloatingPrompt');
    if (floatingPrompt) {
        floatingPrompt.style.display = 'none';
    }
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
}

// 3. User trigger to install PWA app
async function installPwaApp() {
    const floatingPrompt = document.getElementById('pwaFloatingPrompt');
    if (floatingPrompt) floatingPrompt.style.display = 'none';

    if (deferredPwaInstallPrompt) {
        deferredPwaInstallPrompt.prompt();
        const { outcome } = await deferredPwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast('🎉 Thank you for installing Market at Home!', 'success');
        }
        deferredPwaInstallPrompt = null;
    } else {
        // Fallback instructions for iOS Safari or already installed browsers
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            showToast('To install on iPhone/iPad: Tap Share (⎋) then "Add to Home Screen"', 'info');
        } else {
            showToast('To install: Tap your browser menu (⋮) and select "Install app" or "Add to Home Screen"', 'info');
        }
    }
}

// 4. Listen for successful PWA installation
window.addEventListener('appinstalled', () => {
    console.log('✅ [Market at Home PWA] App installed to user device');
    showToast('🎉 Market at Home is now installed on your home screen!', 'success');
    const floatingPrompt = document.getElementById('pwaFloatingPrompt');
    if (floatingPrompt) floatingPrompt.style.display = 'none';
    deferredPwaInstallPrompt = null;
});

// 5. Network Connectivity Listeners (Online / Offline state handling)
window.addEventListener('online', () => {
    const offlineIndicator = document.getElementById('pwaOfflineIndicator');
    if (offlineIndicator) offlineIndicator.style.display = 'none';
    showToast('🟢 Connection restored! Live marketplace synchronized.', 'success');
});

window.addEventListener('offline', () => {
    const offlineIndicator = document.getElementById('pwaOfflineIndicator');
    if (offlineIndicator) offlineIndicator.style.display = 'block';
    showToast('🟠 You are currently offline. Viewing cached products & catalog.', 'warning');
});

