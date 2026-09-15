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
    
    // Load Core Data
    await loadCategories();
    await loadStoriesBar();
    await loadMarketplaceProducts();
    await loadFeaturedBusinesses();
    await loadSellerDashboard();
    await loadAdminPortal();
}

/* ==========================================================================
   PAGE ROUTING & BOTTOM DOCK
   ========================================================================== */
function switchPage(pageName) {
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

function renderProductsHtml(products) {
    return products.map(p => {
        const cleanPhone = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hello ${p.seller_name || p.business_name || 'Seller'}, I am interested in buying "${p.title}" listed on GlobalBiz for ${formatPrice(p.price)}.`);
        const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
        const telLink = `tel:${p.phone || cleanPhone}`;
        const sellerName = p.seller_name || p.business_name || 'Verified Seller';
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
                        <a href="${waLink}" target="_blank" class="btn-card-action btn-whatsapp" title="Chat on WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i> Chat Seller
                        </a>
                        <a href="${telLink}" class="btn-card-action btn-outline" title="Call Seller">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
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

    grid.innerHTML = businesses.slice(0, 3).map(b => `
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
                <a href="https://wa.me/${(b.whatsapp || b.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-whatsapp btn-sm" style="flex:1;">
                    <i class="fa-brands fa-whatsapp"></i> WhatsApp
                </a>
                <button class="btn btn-outline btn-sm" onclick="searchFor('${b.name}')">View Products</button>
            </div>
        </div>
    `).join('');
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

    const cleanPhone = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(`Hello ${p.seller_name || p.business_name || 'Seller'}, I want to buy "${p.title}" listed on GlobalBiz for ${formatPrice(p.price)}. Is it available in ${p.city}?`);
    const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
    const telLink = `tel:${p.phone || cleanPhone}`;

    content.innerHTML = `
        <div style="margin-bottom:16px;">
            <img src="${p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}" alt="${p.title}" style="width:100%; height:240px; object-fit:cover; border-radius:var(--radius-md); box-shadow:var(--shadow-sm);">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size:1.5rem; font-weight:900; color:var(--naira-green);">
                ${formatPrice(p.price)}
            </div>
            <span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Verified Seller</span>
        </div>

        <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-dark); margin-bottom:8px;">
            ${p.title}
        </h3>

        <div style="background:var(--bg-alt); padding:12px; border-radius:var(--radius-md); font-size:0.82rem; margin-bottom:14px; display:flex; flex-direction:column; gap:6px;">
            <div><i class="fa-solid fa-location-dot" style="color:#FA5252;"></i> <strong>Location:</strong> ${p.city || 'Abuja'}, ${p.country || 'Nigeria'} (${p.area || 'Metropolis'})</div>
            <div><i class="fa-solid fa-store" style="color:var(--accent);"></i> <strong>Seller:</strong> ${p.seller_name || p.business_name || 'Amina'}</div>
            <div><i class="fa-solid fa-truck" style="color:var(--naira-green);"></i> <strong>Delivery:</strong> ${p.delivery_info || 'Same-day local delivery & interstate cargo available.'}</div>
        </div>

        <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.55; margin-bottom:20px;">
            ${p.description || 'Authentic product in excellent brand new condition directly from verified supplier.'}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <a href="${waLink}" target="_blank" class="btn btn-whatsapp" style="padding:12px;">
                <i class="fa-brands fa-whatsapp"></i> WhatsApp Seller
            </a>
            <a href="${telLink}" class="btn btn-primary" style="padding:12px;">
                <i class="fa-solid fa-phone"></i> Call Seller
            </a>
        </div>
    `;

    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

/* ==========================================================================
   SELLER DASHBOARD & KYC
   ========================================================================== */
function switchSellerSubTab(tabName) {
    const dashView = document.getElementById('seller-sub-dashboard');
    const kycView = document.getElementById('seller-sub-kyc');
    const dashBtn = document.getElementById('sellerTabDashboardBtn');
    const kycBtn = document.getElementById('sellerTabKycBtn');

    if (tabName === 'dashboard') {
        dashView.style.display = 'block';
        kycView.style.display = 'none';
        dashBtn.classList.add('active');
        kycBtn.classList.remove('active');
        loadSellerDashboard();
    } else {
        dashView.style.display = 'none';
        kycView.style.display = 'block';
        dashBtn.classList.remove('active');
        kycBtn.classList.add('active');
    }
}

async function loadSellerDashboard() {
    const products = await API.getProducts();
    // In our marketplace, show products
    const myProductsContainer = document.getElementById('myProductsContainer');
    const totalListingsEl = document.getElementById('sellerTotalListings');

    if (totalListingsEl) totalListingsEl.innerText = products.length;

    if (myProductsContainer) {
        myProductsContainer.innerHTML = products.map(p => `
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
                        <div class="product-seller-info"><i class="fa-solid fa-store"></i> ${p.seller_name || 'Amina'}</div>
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

function openAddProductModal() {
    document.getElementById('addProductModalTitle').innerText = 'Add New Product';
    document.getElementById('editProductId').value = '';
    document.getElementById('sellerProdTitle').value = '';
    document.getElementById('sellerProdPrice').value = '';
    document.getElementById('sellerProdDesc').value = '';
    document.getElementById('sellerProdSellerName').value = 'Amina';
    document.getElementById('sellerProdLocation').value = 'Abuja';
    document.getElementById('sellerProdPhone').value = '+234 803 456 7890';
    document.getElementById('sellerProdPhoto').value = 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80';
    
    document.getElementById('addProductModal').classList.add('active');
}

async function openEditProductModal(productId) {
    const products = await API.getProducts();
    const p = products.find(x => x.id == productId);
    if (!p) return;

    document.getElementById('addProductModalTitle').innerText = 'Edit / Update Product';
    document.getElementById('editProductId').value = p.id;
    document.getElementById('sellerProdTitle').value = p.title;
    // convert base USD price back to input value
    const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['NGN'];
    document.getElementById('sellerProdPrice').value = Math.round(p.price * curr.rate);
    document.getElementById('sellerProdCategory').value = p.category_id || 1;
    document.getElementById('sellerProdSellerName').value = p.seller_name || 'Amina';
    document.getElementById('sellerProdLocation').value = p.city || 'Abuja';
    document.getElementById('sellerProdPhone').value = p.phone || '+234 803 456 7890';
    document.getElementById('sellerProdDesc').value = p.description || '';
    document.getElementById('sellerProdPhoto').value = p.photo_url || '';

    document.getElementById('addProductModal').classList.add('active');
}

async function handleDeleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product listing?')) {
        await API.deleteProduct(productId);
        showToast('Product listing removed successfully', 'success');
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

    document.getElementById('admin-sellers-view').style.display = tabName === 'sellers' ? 'block' : 'none';
    document.getElementById('admin-products-view').style.display = tabName === 'products' ? 'block' : 'none';
    document.getElementById('admin-requests-view').style.display = tabName === 'requests' ? 'block' : 'none';
}

async function loadAdminPortal() {
    const loginGate = document.getElementById('admin-login-gate');
    const dashboardView = document.getElementById('admin-dashboard-view');

    if (!isAdminAuthenticated()) {
        if (loginGate) loginGate.style.display = 'block';
        if (dashboardView) dashboardView.style.display = 'none';
        return;
    }

    // Authenticated
    if (loginGate) loginGate.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';

    const sellers = await API.getSellers();
    const products = await API.getProducts();
    const requests = await API.getBuyingRequests();

    // 1. Sellers Table
    const sellersTbody = document.getElementById('adminSellersTableBody');
    if (sellersTbody) {
        sellersTbody.innerHTML = sellers.map(s => `
            <tr>
                <td>
                    <strong>${s.full_name}</strong><br>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${s.store_name}</span>
                </td>
                <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${s.id_number}</code></td>
                <td>${s.location}</td>
                <td>
                    <strong>${s.kin_name}</strong><br>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${s.kin_phone}</span>
                </td>
                <td>
                    <span class="badge ${s.verified ? 'badge-verified' : 'badge-warning'}">
                        ${s.verified ? '<i class="fa-solid fa-check"></i> Verified' : '<i class="fa-solid fa-clock"></i> Pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${s.verified ? 'btn-outline' : 'btn-success'}" onclick="handleToggleSellerVerify(${s.id}, ${s.verified ? 0 : 1})">
                        ${s.verified ? 'Revoke' : 'Verify Seller'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 2. Products Table
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

    // 3. Requests Table
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
            const q = document.getElementById('mainSearchInput').value.trim();
            const loc = document.getElementById('locationSelect').value;
            const cat = document.getElementById('heroCategorySelect').value;

            switchPage('marketplace');
            document.getElementById('marketSearchFilter').value = q;
            document.getElementById('marketCityFilter').value = loc;
            document.getElementById('marketCategoryFilter').value = cat;
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
    const city = (document.getElementById('marketCityFilter')?.value || '').toLowerCase().trim();

    loadMarketplaceProducts({
        q: q,
        category_id: cat,
        city: city
    });
}

function setupForms() {
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

    // Seller KYC Form
    const kycForm = document.getElementById('sellerKycForm');
    if (kycForm) {
        kycForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                full_name: document.getElementById('kycFullName').value.trim(),
                id_number: document.getElementById('kycIdNumber').value.trim(),
                phone: document.getElementById('kycPhone').value.trim(),
                location: document.getElementById('kycLocation').value.trim(),
                kin_name: document.getElementById('kycKinName').value.trim(),
                kin_phone: document.getElementById('kycKinPhone').value.trim(),
                store_name: document.getElementById('kycStoreName').value.trim(),
                category_name: document.getElementById('kycCategorySelect').value
            };

            await API.registerSeller(payload);
            showToast('Seller profile & KYC submitted for verification!', 'success');
            switchSellerSubTab('dashboard');
            loadAdminPortal();
        });
    }

    // Add / Edit Product Form
    const prodForm = document.getElementById('sellerProductForm');
    if (prodForm) {
        prodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('editProductId').value;
            const inputPrice = parseFloat(document.getElementById('sellerProdPrice').value) || 0;
            // Convert to base USD for storage
            const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['NGN'];
            const priceInUSD = inputPrice / curr.rate;

            const payload = {
                title: document.getElementById('sellerProdTitle').value.trim(),
                price: priceInUSD,
                category_id: parseInt(document.getElementById('sellerProdCategory').value) || 1,
                seller_name: document.getElementById('sellerProdSellerName').value.trim(),
                city: document.getElementById('sellerProdLocation').value.trim(),
                phone: document.getElementById('sellerProdPhone').value.trim(),
                whatsapp: document.getElementById('sellerProdPhone').value.trim(),
                description: document.getElementById('sellerProdDesc').value.trim(),
                photo_url: document.getElementById('sellerProdPhoto').value.trim()
            };

            if (editId) {
                await API.updateProduct(editId, payload);
                showToast('Product updated successfully!', 'success');
            } else {
                await API.createProduct(payload);
                showToast('New product listed on marketplace!', 'success');
            }

            closeModal('addProductModal');
            loadMarketplaceProducts();
            loadSellerDashboard();
            loadAdminPortal();
        });
    }

    // Buying Assistance Form
    const pbaForm = document.getElementById('buyingAssistanceMainForm');
    if (pbaForm) {
        pbaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
