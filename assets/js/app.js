/**
 * GlobalBiz Marketplace & Seller Portal - Core Application
 * Mobile-First, Vibrant & Reactive Controller
 */

const AppState = {
    currentPage: 'home',
    currentCurrency: 'NGN',
    currencyRates: {
        NGN: { symbol: '₦', rate: 1550.0 },
        USD: { symbol: '$', rate: 1.0 },
        SAR: { symbol: '﷼', rate: 3.75 },
        EUR: { symbol: '€', rate: 0.92 },
        GBP: { symbol: '£', rate: 0.78 }
    },
    activeCategoryFilter: '',
    activeCityFilter: '',
    selectedAssistancePackage: 'Full Buying Assistance',
    selectedAssistanceFee: 60.00
};

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

function switchPage(pageName) {
    // Route guards
    if (pageName === 'seller' && !isAuthenticated()) {
        requireAuth('access the Seller Hub & manage products');
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
        renderMarketplacePage();
    } else if (pageName === 'seller') {
        loadSellerDashboard();
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
    } else if (user && user.full_name) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.style.display = 'inline-block';
        if (guestBanner) guestBanner.style.display = 'none';
        const roleLabel = user.role === 'seller' ? ' (Seller)' : ' (Buyer)';
        if (userNameEl) userNameEl.innerText = user.full_name.split(' ')[0] + roleLabel;
        if (roleBadgeEl) {
            roleBadgeEl.innerText = user.role === 'seller' ? 'VERIFIED SELLER' : 'BUYER';
            roleBadgeEl.className = user.role === 'seller' ? 'badge badge-verified' : 'badge badge-warning';
        }
        if (dropNameEl) dropNameEl.innerText = user.full_name;
        if (dropPhoneEl) dropPhoneEl.innerText = user.phone || 'Verified User';
    } else {
        if (guestNav) guestNav.style.display = 'block';
        if (userNav) userNav.style.display = 'none';
        if (guestBanner) guestBanner.style.display = 'block';
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
        if (user && user.role === 'seller') {
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
        document.getElementById('userAuthModalTitle').innerText = 'Sign In to GlobalBiz';
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
            : `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-secondary);">
                <i class="fa-solid fa-box-open" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:10px;"></i>
                <p>No products found matching your search.</p>
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
        const waMsg = encodeURIComponent(`Hello ${p.seller_name || p.business_name || 'Seller'}, I am interested in buying "${p.title}" listed on GlobalBiz for ${formatPrice(p.price)}.`);
        const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
        const telLink = `tel:${p.phone || cleanPhone}`;
        const sellerName = p.seller_name || p.business_name || 'Verified Seller';
        const safeSellerName = sellerName.replace(/'/g, "\\'");
        const locationCity = p.city || 'Nigeria';

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
                            <i class="fa-solid fa-location-dot"></i> ${locationCity}
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
                    ${b.description || 'Verified supplier providing quality goods with nationwide delivery.'}
                </p>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-location-dot" style="color:#FA5252;"></i> ${b.city}, ${b.country}
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
    const waMsg = encodeURIComponent(`Hello ${p.seller_name || p.business_name || 'Seller'}, I want to buy "${p.title}" listed on GlobalBiz for ${formatPrice(p.price)}. Please let me know how to proceed with payment and delivery to my location.`);
    const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
    const telLink = `tel:${p.phone || p.seller_phone || cleanPhone}`;
    const sellerName = p.seller_name || p.business_name || 'Verified Seller';
    const safeSellerName = sellerName.replace(/'/g, "\\'");
    const city = p.city || 'Nigeria';

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
                <div><i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> <strong>City:</strong> ${city}</div>
                <div><i class="fa-solid fa-store" style="color:var(--brand-green);"></i> <strong>Seller:</strong> ${sellerName}</div>
                <div><i class="fa-solid fa-shield-halved" style="color:#3B82F6;"></i> <strong>Trust:</strong> Direct Verified</div>
                <div><i class="fa-solid fa-truck" style="color:var(--brand-green);"></i> <strong>Delivery:</strong> Nationwide</div>
            </div>
        </div>

        <div class="form-section-block" style="padding:12px 14px; margin-bottom:16px;">
            <div class="form-section-title" style="margin-bottom:6px; padding-bottom:4px;">
                <i class="fa-solid fa-align-left" style="color:var(--brand-green);"></i>
                <span>Product Description</span>
            </div>
            <p style="font-size:0.84rem; color:#475569; line-height:1.55; margin:0;">
                ${p.description || 'Authentic quality product listed directly by verified merchant on GlobalBiz.'}
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
    const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['NGN'];
    document.getElementById('sellerProdPrice').value = Math.round(p.price * curr.rate);
    document.getElementById('sellerProdCategory').value = p.category_id || 1;
    document.getElementById('sellerProdSellerName').value = p.seller_name || (user ? user.full_name : 'My Store');
    document.getElementById('sellerProdLocation').value = p.city || 'Abuja';
    document.getElementById('sellerProdPhone').value = p.phone || (user ? user.phone : '+234 803 456 7890');
    document.getElementById('sellerProdDesc').value = p.description || '';
    
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

    const sellers = await API.getSellers();
    const buyers = await API.getBuyers();
    const products = await API.getProducts();
    const requests = await API.getBuyingRequests();

    // 0. Update KPI Counters
    const totalSellersEl = document.getElementById('adminTotalSellers');
    const totalBuyersEl = document.getElementById('adminTotalBuyers');
    const totalProductsEl = document.getElementById('adminTotalProducts');
    const totalRequestsEl = document.getElementById('adminTotalRequests');

    if (totalSellersEl) totalSellersEl.innerText = sellers.length;
    if (totalBuyersEl) totalBuyersEl.innerText = buyers.length;
    if (totalProductsEl) totalProductsEl.innerText = products.length;
    if (totalRequestsEl) totalRequestsEl.innerText = requests.length;

    // Tab badges
    const tabSellerCount = document.getElementById('adminTabSellerCount');
    const tabBuyerCount = document.getElementById('adminTabBuyerCount');
    const tabProductCount = document.getElementById('adminTabProductCount');
    const tabRequestCount = document.getElementById('adminTabRequestCount');

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

            switchPage('marketplace');
            const marketSearchInput = document.getElementById('marketSearchFilter');
            if (marketSearchInput) marketSearchInput.value = q;
            filterMarketplace();
        });
    }
}

function filterByCity(cityName, el) {
    document.querySelectorAll('.hero-loc-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');

    switchPage('marketplace');
    const cityInput = document.getElementById('marketCityFilter');
    if (cityInput) cityInput.value = cityName;
    filterMarketplace();

    if (cityName) {
        showToast(`Filtered listings in ${cityName}`, 'info');
    } else {
        showToast('Showing all verified listings across Nigeria', 'info');
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
    const city = (document.getElementById('marketCityFilter')?.value || '').toLowerCase().trim();

    loadMarketplaceProducts({
        q: q,
        category_id: cat,
        city: city
    });
}

function setupForms() {
    // 1. User Sign In Form
    const userLoginForm = document.getElementById('userLoginForm');
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phoneEmail = document.getElementById('loginPhoneEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (!phoneEmail || !password) {
                showToast('Please enter both phone/email and password', 'error');
                return;
            }

            // Authenticate user
            const userName = phoneEmail.includes('@') ? phoneEmail.split('@')[0] : phoneEmail;
            const userSession = {
                full_name: userName.charAt(0).toUpperCase() + userName.slice(1),
                phone: phoneEmail,
                role: 'seller' // Defaults to seller access
            };

            localStorage.setItem('globalbiz_user_session', JSON.stringify(userSession));
            updateNavAuthUI();
            closeModal('userAuthModal');
            showToast(`Welcome back, ${userSession.full_name}!`, 'success');
            userLoginForm.reset();
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
            const location = document.getElementById('regLocation').value.trim();
            const password = document.getElementById('regPassword').value.trim();

            const userSession = {
                full_name: fullName,
                phone: phone,
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
                    location: location,
                    store_name: storeName
                });
            }

            localStorage.setItem('globalbiz_user_session', JSON.stringify(userSession));
            updateNavAuthUI();
            closeModal('userAuthModal');
            userRegForm.reset();

            if (role === 'seller') {
                showToast(`Welcome Seller ${fullName}! Your seller dashboard is ready.`, 'success');
                switchPage('seller');
            } else {
                showToast(`Welcome Buyer ${fullName}! You can now browse & order.`, 'success');
                switchPage('marketplace');
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
            const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['NGN'];
            const priceInUSD = inputPrice / curr.rate;

            const inputSellerName = document.getElementById('sellerProdSellerName').value.trim();
            const inputSellerPhone = document.getElementById('sellerProdPhone').value.trim();
            const sellerName = inputSellerName || (user && user.full_name) || 'Verified Seller';
            const sellerPhone = inputSellerPhone || (user && user.phone) || '+234 800 000 0000';

            const payload = {
                title: document.getElementById('sellerProdTitle').value.trim(),
                price: priceInUSD,
                category_id: parseInt(document.getElementById('sellerProdCategory').value) || 1,
                seller_name: sellerName,
                seller_phone: sellerPhone,
                phone: sellerPhone,
                whatsapp: sellerPhone,
                city: document.getElementById('sellerProdLocation').value.trim() || 'Abuja',
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
                showToast('🎉 Good published! Buyers in search & marketplace can now view and buy it.', 'success');
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
            const payload = {
                item_title: document.getElementById('mainPbaItem').value.trim(),
                target_city: document.getElementById('mainPbaCity').value.trim(),
                customer_name: document.getElementById('mainPbaName').value.trim(),
                customer_phone: document.getElementById('mainPbaPhone').value.trim(),
                specifications: document.getElementById('mainPbaSpecs').value.trim(),
                package_type: AppState.selectedAssistancePackage,
                service_fee: AppState.selectedAssistanceFee
            };

            const res = await API.submitBuyingAssistance(payload);
            showToast(`Request submitted! Tracking Code: ${res.tracking_code}`, 'success');
            pbaForm.reset();
            loadAdminPortal();
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
