/**
 * Global Marketplace & Buying Assistance - Core Application Controller
 */

const AppState = {
    activeTab: 'home',
    activeAdminSubTab: 'overview',
    currentCurrency: 'USD',
    currencyRates: {
        USD: { symbol: '$', rate: 1.0 },
        NGN: { symbol: '₦', rate: 1550.0 },
        SAR: { symbol: '﷼', rate: 3.75 },
        EUR: { symbol: '€', rate: 0.92 },
        GBP: { symbol: '£', rate: 0.78 }
    },
    userCoordinates: null,
    activeAudioPlayer: null,
    selectedAssistancePackage: 'Full Buying Assistance'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupNavigation();
    setupAdminSubNav();
    setupCurrencySwitcher();
    setupSearchEngine();
    setupAssistanceModal();
    setupForms();
    
    // Initial Load
    await loadCategories();
    await loadMarketplaceProducts();
    await loadFeaturedBusinesses();
    await loadAdminOverview();
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
    const iconColor = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#3b82f6');
    
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
   NAVIGATION & TAB ROUTING (BOTTOM NAVIGATION BAR)
   ========================================================================== */
function setupNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabName = item.getAttribute('data-tab');
            if (tabName) {
                e.preventDefault();
                switchTab(tabName);
            }
        });
    });
}

function switchTab(tabName) {
    AppState.activeTab = tabName;

    // Update Bottom Nav Active State
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });

    // Update Panels
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `view-${tabName}`);
    });

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabName === 'admin') {
        switchAdminSubTab(AppState.activeAdminSubTab || 'overview');
    } else if (tabName === 'explore') {
        loadExploreDirectory();
    }
}

/* ==========================================================================
   ADMIN PORTAL CONTROLLER & SUB-TABS
   ========================================================================== */
function setupAdminSubNav() {
    const tabs = document.querySelectorAll('.admin-nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-admin-tab');
            if (target) {
                switchAdminSubTab(target);
            }
        });
    });

    const addCatForm = document.getElementById('addCategoryForm');
    if (addCatForm) {
        addCatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('newCatName').value.trim();
            const slug = document.getElementById('newCatSlug').value.trim();
            const icon = document.getElementById('newCatIcon').value.trim() || 'fa-folder';

            const res = await API.createCategory({ name, slug, icon });
            if (res.status === 'success') {
                showToast(`Category "${name}" created successfully!`, 'success');
                addCatForm.reset();
                await loadCategories();
                await loadAdminCategories();
            } else {
                showToast(res.message || 'Error creating category', 'error');
            }
        });
    }
}

function switchAdminSubTab(subTabName) {
    AppState.activeAdminSubTab = subTabName;

    document.querySelectorAll('.admin-nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-admin-tab') === subTabName);
    });

    document.querySelectorAll('.admin-tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `admin-tab-${subTabName}`);
    });

    if (subTabName === 'overview') loadAdminOverview();
    else if (subTabName === 'businesses') loadAdminBusinesses();
    else if (subTabName === 'listings') loadAdminListings();
    else if (subTabName === 'buying_desk') loadAdminBuyingDesk();
    else if (subTabName === 'categories') loadAdminCategories();
    else if (subTabName === 'reviews') loadAdminReviews();
}

async function loadAdminOverview() {
    const data = await API.getAdminData('overview');
    const statsContainer = document.getElementById('adminStatsGrid');

    if (statsContainer && data.stats) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${data.stats.total_businesses}</span>
                <span class="stat-label">Registered Businesses</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: var(--success);">${data.stats.verified_businesses}</span>
                <span class="stat-label">Verified Badges</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: var(--accent);">${data.stats.total_products}</span>
                <span class="stat-label">Total Listings (Ads)</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: var(--warning);">${data.stats.total_buying_requests}</span>
                <span class="stat-label">Buying Requests</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: #6366f1;">${formatPrice(data.stats.estimated_revenue || 0)}</span>
                <span class="stat-label">Est. Service Revenue</span>
            </div>
        `;
    }
}

async function loadAdminBusinesses() {
    const res = await API.getAdminData('businesses');
    const tbody = document.getElementById('adminBusinessesTableBody');
    const badge = document.getElementById('bizCountBadge');
    if (!tbody) return;

    const businesses = res.data || [];
    if (badge) badge.textContent = `${businesses.length} Businesses`;

    let html = '';
    businesses.forEach(b => {
        html += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${b.logo_url}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100'">
                        <div>
                            <strong>${b.name}</strong>
                            ${b.verified ? '<i class="fa-solid fa-circle-check verified-badge-icon" title="Verified"></i>' : ''}
                            ${b.featured ? '<span class="badge-pill badge-verified" style="position:static; margin-left:4px; font-size:0.65rem;">Featured</span>' : ''}
                        </div>
                    </div>
                </td>
                <td><small>${b.category_name}</small></td>
                <td><small>${b.city}, ${b.country}</small></td>
                <td><small>${b.phone}</small></td>
                <td>
                    <span class="status-badge ${b.verified ? 'status-completed' : 'status-searching'}">
                        ${b.verified ? 'Verified' : 'Unverified'}
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-sm-action ${b.verified ? 'btn-sm-unverify' : 'btn-sm-verify'}" onclick="handleToggleVerifyBusiness(${b.id}, ${b.verified})">
                            <i class="fa-solid ${b.verified ? 'fa-xmark' : 'fa-check'}"></i> ${b.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button class="btn-sm-action btn-sm-feature" onclick="handleToggleFeatureBusiness(${b.id}, ${b.featured})">
                            <i class="fa-solid fa-star"></i>
                        </button>
                        <button class="btn-sm-action" onclick="openBusinessModal(${b.id})">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-sm-action btn-sm-delete" onclick="handleDeleteBusiness(${b.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;">No businesses found</td></tr>';
}

async function handleToggleVerifyBusiness(id, currentStatus) {
    const res = await API.verifyBusiness(id, !currentStatus);
    showToast(res.message || 'Verification updated', 'success');
    loadAdminBusinesses();
    loadFeaturedBusinesses();
}

async function handleToggleFeatureBusiness(id, currentStatus) {
    const res = await API.toggleFeaturedBusiness(id, !currentStatus);
    showToast(res.message || 'Featured status updated', 'success');
    loadAdminBusinesses();
    loadFeaturedBusinesses();
}

async function handleDeleteBusiness(id) {
    if (!confirm('Are you sure you want to remove this business?')) return;
    const res = await API.deleteBusiness(id);
    showToast(res.message || 'Business removed', 'success');
    loadAdminBusinesses();
    loadFeaturedBusinesses();
}

async function loadAdminListings() {
    const res = await API.getAdminData('products');
    const tbody = document.getElementById('adminListingsTableBody');
    if (!tbody) return;

    const products = res.data || [];
    let html = '';
    products.forEach(p => {
        html += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${p.photo_url}" style="width:36px; height:36px; border-radius:var(--radius-sm); object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'">
                        <div>
                            <strong>${p.title}</strong>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${p.is_service ? 'Service' : 'Product'}</div>
                        </div>
                    </div>
                </td>
                <td><small>${p.business_name || 'Business #' + p.business_id}</small></td>
                <td><strong>${formatPrice(p.price)}</strong></td>
                <td>
                    ${p.video_url ? '<span class="status-badge status-found"><i class="fa-solid fa-video"></i> Video</span> ' : ''}
                    ${p.audio_url ? '<span class="status-badge status-negotiating"><i class="fa-solid fa-microphone"></i> Audio</span>' : ''}
                </td>
                <td>
                    <button class="btn-sm-action btn-sm-delete" onclick="handleDeleteProduct(${p.id})">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;">No listings found</td></tr>';
}

async function handleDeleteProduct(id) {
    if (!confirm('Delete this listing ad?')) return;
    const res = await API.deleteProduct(id);
    showToast(res.message || 'Listing removed', 'success');
    loadAdminListings();
    loadMarketplaceProducts();
}

async function loadAdminBuyingDesk() {
    const res = await API.getAdminData('buying_requests');
    const tbody = document.getElementById('adminBuyingRequestsTableBody');
    if (!tbody) return;

    const requests = res.data || [];
    let html = '';
    requests.forEach(r => {
        html += `
            <tr>
                <td><strong>${r.tracking_code || 'PBA-' + r.id}</strong></td>
                <td>${r.customer_name}<br><small style="color:var(--text-muted);">${r.customer_phone}</small></td>
                <td>${r.item_title}<br><small style="color:var(--text-muted);">${r.target_city}, ${r.target_country}</small></td>
                <td>${formatPrice(r.service_fee || 60)}<br><small style="color:var(--text-muted);">${r.package_type}</small></td>
                <td>
                    <select id="status_select_${r.id}" class="form-select" style="padding:4px 8px; font-size:0.75rem;">
                        <option value="New" ${r.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Assigned" ${r.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="Searching" ${r.status === 'Searching' ? 'selected' : ''}>Searching</option>
                        <option value="Seller Found" ${r.status === 'Seller Found' ? 'selected' : ''}>Seller Found</option>
                        <option value="Negotiating" ${r.status === 'Negotiating' ? 'selected' : ''}>Negotiating</option>
                        <option value="Customer Approval" ${r.status === 'Customer Approval' ? 'selected' : ''}>Customer Approval</option>
                        <option value="Purchase Coordination" ${r.status === 'Purchase Coordination' ? 'selected' : ''}>Purchase Coordination</option>
                        <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
                <td>
                    <input type="text" id="agent_input_${r.id}" class="form-input" style="padding:4px 8px; font-size:0.75rem; margin-bottom:4px;" value="${r.assigned_agent || ''}" placeholder="Assigned Agent">
                    <input type="text" id="notes_input_${r.id}" class="form-input" style="padding:4px 8px; font-size:0.75rem;" value="${r.notes || ''}" placeholder="Sourcing Notes">
                </td>
                <td>
                    <button class="btn-sm-action btn-sm-verify" onclick="handleSaveBuyingRequest(${r.id})">
                        <i class="fa-solid fa-floppy-disk"></i> Save
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || '<tr><td colspan="7" style="text-align:center;">No buying requests found</td></tr>';
}

async function handleSaveBuyingRequest(id) {
    const status = document.getElementById(`status_select_${id}`).value;
    const assigned_agent = document.getElementById(`agent_input_${id}`).value;
    const notes = document.getElementById(`notes_input_${id}`).value;

    const res = await API.updateBuyingRequest({ id, status, assigned_agent, notes });
    showToast(res.message || 'Ticket updated', 'success');
    loadAdminBuyingDesk();
}

async function loadAdminCategories() {
    const res = await API.getAdminData('categories');
    const container = document.getElementById('adminCategoriesList');
    if (!container) return;

    const categories = res.data || [];
    let html = '';
    categories.forEach(c => {
        html += `
            <div style="background:var(--bg-alt); padding:6px 12px; border-radius:var(--radius-sm); display:flex; align-items:center; gap:8px; font-size:0.82rem;">
                <i class="fa-solid ${c.icon}"></i>
                <span>${c.name}</span>
                <button style="border:none; background:transparent; color:var(--danger); cursor:pointer;" onclick="handleDeleteCategory(${c.id})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
    container.innerHTML = html || '<p>No categories.</p>';
}

async function handleDeleteCategory(id) {
    if (!confirm('Remove this category?')) return;
    const res = await API.deleteCategory(id);
    showToast(res.message || 'Category deleted', 'success');
    await loadCategories();
    await loadAdminCategories();
}

async function loadAdminReviews() {
    const res = await API.getAdminData('reviews');
    const container = document.getElementById('adminReviewsList');
    if (!container) return;

    const reviews = res.data || [];
    if (reviews.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem;">No reviews logged yet.</p>';
        return;
    }

    let html = '';
    reviews.forEach(r => {
        html += `
            <div style="padding:10px 0; border-bottom:1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${r.customer_name}</strong>
                    <span style="color:var(--warning); font-size:0.85rem;">★ ${r.rating}</span>
                </div>
                <p style="font-size:0.82rem; color:var(--text-secondary); margin:4px 0;">${r.comment || ''}</p>
                <small style="color:var(--text-muted);">For: ${r.business_name || 'Business'}</small>
            </div>
        `;
    });
    container.innerHTML = html;
}

/* ==========================================================================
   CURRENCY CONVERTER
   ========================================================================== */
function setupCurrencySwitcher() {
    const switcher = document.getElementById('currencySelector');
    if (switcher) {
        switcher.addEventListener('change', (e) => {
            AppState.currentCurrency = e.target.value;
            loadMarketplaceProducts();
            loadFeaturedBusinesses();
            if (AppState.activeTab === 'admin') loadAdminOverview();
        });
    }
}

function formatPrice(amountInUSD) {
    const curr = AppState.currencyRates[AppState.currentCurrency] || AppState.currencyRates['USD'];
    const converted = amountInUSD * curr.rate;
    return `${curr.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: converted % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/* ==========================================================================
   CATEGORIES LOADER & FILTERING
   ========================================================================== */
async function loadCategories() {
    const categories = await API.getCategories();
    const container = document.getElementById('categoriesContainer');
    const exploreContainer = document.getElementById('exploreCategoriesGrid');
    const selectBizCat = document.getElementById('bizCategorySelect');
    const selectProdCat = document.getElementById('prodCategorySelect');

    if (!container) return;

    let html = `
        <div class="category-card active" onclick="filterByCategory(null, this)">
            <i class="fa-solid fa-layer-group"></i>
            <span>All Items</span>
        </div>
    `;

    let optionsHtml = '<option value="">Select Category</option>';

    categories.forEach(cat => {
        html += `
            <div class="category-card" onclick="filterByCategory(${cat.id}, this)">
                <i class="fa-solid ${cat.icon}"></i>
                <span>${cat.name}</span>
            </div>
        `;
        optionsHtml += `<option value="${cat.id}">${cat.name}</option>`;
    });

    container.innerHTML = html;

    if (exploreContainer) {
        exploreContainer.innerHTML = html;
    }
    if (selectBizCat) selectBizCat.innerHTML = optionsHtml;
    if (selectProdCat) selectProdCat.innerHTML = optionsHtml;
}

function filterByCategory(categoryId, element) {
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');

    const params = {};
    if (categoryId) params.category_id = categoryId;
    loadMarketplaceProducts(params);
}

/* ==========================================================================
   SMART NATURAL LANGUAGE SEARCH & GEOLOCATION
   ========================================================================== */
function setupSearchEngine() {
    const searchForm = document.getElementById('mainSearchForm');
    const searchInput = document.getElementById('mainSearchInput');
    const locationSelect = document.getElementById('locationSelect');
    const nearMeBtn = document.getElementById('btnNearMe');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            executeSmartSearch();
        });
    }

    if (nearMeBtn) {
        nearMeBtn.addEventListener('click', () => {
            triggerNearMeSearch();
        });
    }

    // Quick tags
    document.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            const query = chip.getAttribute('data-query');
            if (searchInput) {
                searchInput.value = query;
                executeSmartSearch();
            }
        });
    });
}

function executeSmartSearch() {
    const rawQuery = document.getElementById('mainSearchInput').value.trim();
    const locationVal = document.getElementById('locationSelect').value;

    const parsedParams = parseNaturalSearchQuery(rawQuery);

    if (locationVal) {
        parsedParams.country = locationVal;
    }

    loadMarketplaceProducts(parsedParams);
}

function parseNaturalSearchQuery(text) {
    const params = {};
    if (!text) return params;

    let clean = text.toLowerCase();

    // Check "under $XX" or "under XX"
    const priceMatch = clean.match(/under\s*\$?([0-9]+)/i);
    if (priceMatch) {
        params.max_price = parseFloat(priceMatch[1]);
        clean = clean.replace(priceMatch[0], '').trim();
    }

    // Check "in [City]"
    const cityMatch = clean.match(/\bin\s+([a-zA-Z\s]+)$/i);
    if (cityMatch) {
        params.city = cityMatch[1].trim();
        clean = clean.replace(cityMatch[0], '').trim();
    }

    // Check "near me"
    if (clean.includes('near me')) {
        params.near_me = 1;
        clean = clean.replace('near me', '').trim();
        triggerNearMeSearch();
    }

    // Clean conversational filler
    clean = clean.replace(/^(i want to buy|looking for|where can i find|need a|search for)/i, '').trim();

    params.q = clean;
    return params;
}

function triggerNearMeSearch() {
    const btn = document.getElementById('btnNearMe');
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.', 'error');
        return;
    }

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            AppState.userCoordinates = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Near Me Active';
            }
            showToast('GPS Location locked! Showing nearby businesses & products.', 'success');
            loadMarketplaceProducts({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                near_me: 1,
                radius: 50
            });
        },
        (err) => {
            if (btn) btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Near Me';
            showToast('Location access unavailable. Showing regional items.', 'info');
        }
    );
}

/* ==========================================================================
   MARKETPLACE PRODUCTS & SERVICES LISTINGS
   ========================================================================== */
async function loadMarketplaceProducts(params = {}) {
    const container = document.getElementById('productsGridContainer');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--accent);"></i><p style="margin-top:10px; color:var(--text-secondary);">Searching marketplace...</p></div>';

    const products = await API.getProducts(params);

    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                <i class="fa-solid fa-magnifying-glass fa-2x" style="color: var(--text-muted); margin-bottom: 12px;"></i>
                <h4 style="font-size: 1.1rem; color: var(--primary);">No exact products found</h4>
                <p style="font-size: 0.88rem; color: var(--text-secondary); max-width: 460px; margin: 8px auto 16px auto;">
                    We couldn't find items matching your filter. Submit a Buying Assistance Request and our certified sourcing agents will find it for you!
                </p>
                <button class="btn-assistance" style="background: var(--primary); color: #fff; margin: 0 auto;" onclick="openBuyingAssistanceModal()">
                    <i class="fa-solid fa-handshake-angle"></i> Request Buying Assistance
                </button>
            </div>
        `;
        return;
    }

    let html = '';
    products.forEach(p => {
        const isVerified = p.business_verified || p.verified;
        const mediaBadge = p.video_url ? '<span class="badge-media-type"><i class="fa-solid fa-video"></i> Video</span>' : 
                          (p.audio_url ? '<span class="badge-media-type"><i class="fa-solid fa-volume-high"></i> Voice Pitch</span>' : '');

        html += `
            <div class="product-card">
                <div class="product-media-container">
                    <img src="${p.photo_url}" alt="${p.title}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'">
                    ${isVerified ? '<span class="badge-pill badge-verified"><i class="fa-solid fa-shield-check"></i> Verified</span>' : ''}
                    ${p.is_service ? '<span class="badge-pill badge-service" style="top: 10px; right: 10px; left: auto;"><i class="fa-solid fa-wrench"></i> Service</span>' : ''}
                    ${mediaBadge}
                </div>
                <div class="product-body">
                    <div class="product-business-info" style="cursor:pointer;" onclick="openBusinessModal(${p.business_id})">
                        <i class="fa-solid fa-store"></i>
                        <strong>${p.business_name}</strong>
                        <span>• ${p.city}, ${p.country}</span>
                    </div>
                    <h3 class="product-title">${p.title}</h3>
                    <p class="product-description">${p.description}</p>
                    
                    ${p.audio_url ? `
                        <div class="audio-voice-bar">
                            <button class="btn-audio-play" onclick="playVoicePitch('${p.audio_url}', this)">
                                <i class="fa-solid fa-play"></i>
                            </button>
                            <div class="audio-waveform">
                                <div class="waveform-bar" style="height:40%"></div>
                                <div class="waveform-bar" style="height:70%"></div>
                                <div class="waveform-bar" style="height:100%"></div>
                                <div class="waveform-bar" style="height:60%"></div>
                                <div class="waveform-bar" style="height:90%"></div>
                                <div class="waveform-bar" style="height:50%"></div>
                                <div class="waveform-bar" style="height:80%"></div>
                                <div class="waveform-bar" style="height:30%"></div>
                            </div>
                            <span class="audio-label">Seller Voice Note</span>
                        </div>
                    ` : ''}

                    <div class="product-footer">
                        <div class="product-price">${formatPrice(p.price)}</div>
                        <div class="product-actions">
                            ${p.video_url ? `
                                <button class="btn-icon-action" title="Watch Product Video" onclick="openVideoModal('${p.video_url}', '${p.title}')">
                                    <i class="fa-solid fa-circle-play" style="color: var(--accent);"></i>
                                </button>
                            ` : ''}
                            <a href="https://wa.me/${(p.whatsapp || p.phone || '').replace(/[^0-9]/g, '')}?text=Hello,%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(p.title)}" target="_blank" class="btn-icon-action btn-whatsapp" title="Chat on WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <a href="tel:${p.phone}" class="btn-icon-action" title="Call Business">
                                <i class="fa-solid fa-phone"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* ==========================================================================
   FEATURED BUSINESS DIRECTORY
   ========================================================================== */
async function loadFeaturedBusinesses() {
    const container = document.getElementById('businessesGridContainer');
    if (!container) return;

    const businesses = await API.getBusinesses();
    let html = '';

    businesses.forEach(b => {
        html += `
            <div class="business-card" style="cursor:pointer;" onclick="openBusinessModal(${b.id})">
                <img src="${b.logo_url}" alt="${b.name}" class="business-logo" onerror="this.src='https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80'">
                <div class="business-details">
                    <h4 class="business-name">
                        ${b.name}
                        ${b.verified ? '<i class="fa-solid fa-circle-check verified-badge-icon" title="Verified Business"></i>' : ''}
                    </h4>
                    <div class="business-category">${b.category_name}</div>
                    <div class="business-location">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${b.area}, ${b.city}, ${b.country}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                        <div class="business-rating">
                            <i class="fa-solid fa-star"></i>
                            <span>${b.rating || '5.0'} (${b.reviews_count || 1} reviews)</span>
                        </div>
                        <div style="display:flex; gap:6px;" onclick="event.stopPropagation();">
                            <a href="https://wa.me/${(b.whatsapp || b.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="btn-icon-action btn-whatsapp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <a href="tel:${b.phone}" class="btn-icon-action">
                                <i class="fa-solid fa-phone"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function loadExploreDirectory() {
    await loadFeaturedBusinesses();
}

/* ==========================================================================
   BUSINESS PROFILE DETAIL MODAL
   ========================================================================== */
async function openBusinessModal(businessId) {
    const modal = document.getElementById('businessProfileModal');
    const biz = await API.getBusiness(businessId);
    if (!modal || !biz) return;

    document.getElementById('bizModalBanner').src = biz.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800';
    document.getElementById('bizModalLogo').src = biz.logo_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200';
    document.getElementById('bizModalTitle').textContent = biz.name;
    document.getElementById('bizModalCategory').textContent = biz.category_name;
    document.getElementById('bizModalDescription').textContent = biz.description || 'Verified registered supplier on Global Business Marketplace.';
    document.getElementById('bizModalAddress').textContent = `${biz.address || biz.area}, ${biz.city}, ${biz.country}`;
    document.getElementById('bizModalHours').textContent = biz.opening_hours || '8:00 AM - 6:00 PM';

    document.getElementById('bizModalWhatsappBtn').href = `https://wa.me/${(biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '')}`;
    document.getElementById('bizModalCallBtn').href = `tel:${biz.phone}`;

    const verifiedBadge = document.getElementById('bizModalVerifiedBadge');
    verifiedBadge.innerHTML = biz.verified ? '<span class="status-badge status-completed"><i class="fa-solid fa-circle-check"></i> Verified Business</span>' : '<span class="status-badge status-searching">Standard Directory Listing</span>';

    // Products catalog
    const prodContainer = document.getElementById('bizModalProductsContainer');
    if (prodContainer) {
        const products = await API.getProducts({ business_id: businessId });
        if (products.length === 0) {
            prodContainer.innerHTML = '<p style="grid-column:1/-1; font-size:0.85rem; color:var(--text-secondary);">No products listed yet.</p>';
        } else {
            let html = '';
            products.forEach(p => {
                html += `
                    <div style="background:var(--bg-alt); border-radius:var(--radius-sm); padding:8px; display:flex; gap:8px; align-items:center;">
                        <img src="${p.photo_url}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;">
                        <div>
                            <div style="font-size:0.8rem; font-weight:700;">${p.title}</div>
                            <div style="font-size:0.75rem; color:var(--accent); font-weight:800;">${formatPrice(p.price)}</div>
                        </div>
                    </div>
                `;
            });
            prodContainer.innerHTML = html;
        }
    }

    modal.classList.add('active');
}

function closeBusinessModal() {
    const modal = document.getElementById('businessProfileModal');
    if (modal) modal.classList.remove('active');
}

/* ==========================================================================
   AUDIO & VIDEO MULTIMEDIA PLAYERS
   ========================================================================== */
function playVoicePitch(audioUrl, btnElement) {
    if (AppState.activeAudioPlayer) {
        AppState.activeAudioPlayer.pause();
        document.querySelectorAll('.btn-audio-play i').forEach(icon => {
            icon.className = 'fa-solid fa-play';
        });
        if (AppState.activeAudioPlayer.src === audioUrl && !AppState.activeAudioPlayer.paused) {
            AppState.activeAudioPlayer = null;
            return;
        }
    }

    const audio = new Audio(audioUrl);
    AppState.activeAudioPlayer = audio;
    const icon = btnElement.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-pause';

    audio.play();

    audio.onended = () => {
        if (icon) icon.className = 'fa-solid fa-play';
        AppState.activeAudioPlayer = null;
    };
}

function openVideoModal(videoUrl, title) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('videoPlayerElement');
    const titleEl = document.getElementById('videoModalTitle');

    if (modal && video) {
        titleEl.textContent = title || 'Product Video Showcase';
        video.src = videoUrl;
        modal.classList.add('active');
        video.play().catch(() => {});
    }
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('videoPlayerElement');
    if (modal && video) {
        video.pause();
        video.src = '';
        modal.classList.remove('active');
    }
}

/* ==========================================================================
   BUYING ASSISTANCE MODAL & SUBMISSION
   ========================================================================== */
function setupAssistanceModal() {
    // Package card selection
    document.querySelectorAll('.package-card-option').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.package-card-option').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            AppState.selectedAssistancePackage = card.getAttribute('data-package');
            document.getElementById('selectedPackageInput').value = AppState.selectedAssistancePackage;
        });
    });

    const form = document.getElementById('buyingAssistanceForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Request...';

            const payload = {
                customer_name: document.getElementById('pbaName').value,
                customer_phone: document.getElementById('pbaPhone').value,
                customer_email: document.getElementById('pbaEmail').value,
                item_title: document.getElementById('pbaItem').value,
                package_type: document.getElementById('selectedPackageInput').value || 'Full Buying Assistance',
                specifications: document.getElementById('pbaSpecs').value,
                quantity: document.getElementById('pbaQuantity').value,
                budget_min: parseFloat(document.getElementById('pbaBudgetMin').value) || 0,
                budget_max: parseFloat(document.getElementById('pbaBudgetMax').value) || 0,
                currency: AppState.currentCurrency,
                target_country: document.getElementById('pbaCountry').value,
                target_city: document.getElementById('pbaCity').value,
                delivery_date: document.getElementById('pbaDate').value,
                notes: document.getElementById('pbaNotes').value
            };

            const res = await API.submitBuyingAssistance(payload);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Buying Request';

            if (res.status === 'success') {
                closeBuyingAssistanceModal();
                showToast(`Request submitted! Tracking: ${res.tracking_code}`, 'success');
                alert(`✅ Request Successfully Submitted!\n\nYour Tracking Code is: ${res.tracking_code}\n\nOur Professional Buying Assistance desk will contact you via WhatsApp/Phone within 1 hour.`);
                form.reset();
                if (AppState.activeTab === 'admin') loadAdminOverview();
            } else {
                showToast(res.message || 'Error submitting request', 'error');
            }
        });
    }
}

function openBuyingAssistanceModal() {
    const modal = document.getElementById('buyingAssistanceModal');
    if (modal) modal.classList.add('active');
}

function closeBuyingAssistanceModal() {
    const modal = document.getElementById('buyingAssistanceModal');
    if (modal) modal.classList.remove('active');
}

/* ==========================================================================
   FORMS & POSTING (BUSINESS & PRODUCTS)
   ========================================================================== */
function setupForms() {
    // Business Registration Form
    const bizForm = document.getElementById('businessRegisterForm');
    if (bizForm) {
        bizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = bizForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering Business...';

            const payload = {
                name: document.getElementById('regBizName').value,
                category_id: parseInt(document.getElementById('bizCategorySelect').value),
                category_name: document.getElementById('bizCategorySelect').options[document.getElementById('bizCategorySelect').selectedIndex].text,
                country: document.getElementById('regBizCountry').value,
                city: document.getElementById('regBizCity').value,
                area: document.getElementById('regBizArea').value,
                address: document.getElementById('regBizAddress').value,
                phone: document.getElementById('regBizPhone').value,
                whatsapp: document.getElementById('regBizWhatsapp').value,
                email: document.getElementById('regBizEmail').value,
                description: document.getElementById('regBizDesc').value,
                opening_hours: document.getElementById('regBizHours').value,
                delivery_available: parseInt(document.getElementById('regBizDelivery').value),
                logo_url: document.getElementById('regBizLogo').value || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80'
            };

            const res = await API.registerBusiness(payload);
            btn.disabled = false;
            btn.innerHTML = 'Register Business & Create Profile';

            if (res.status === 'success') {
                showToast('Business successfully registered!', 'success');
                bizForm.reset();
                switchTab('home');
                loadFeaturedBusinesses();
            } else {
                showToast('Registration failed: ' + res.message, 'error');
            }
        });
    }

    // Product & Service Posting Form
    const prodForm = document.getElementById('productPublishForm');
    if (prodForm) {
        prodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = prodForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

            const payload = {
                business_id: 1, // Default primary business ID for demonstration
                category_id: parseInt(document.getElementById('prodCategorySelect').value),
                title: document.getElementById('postProdTitle').value,
                price: parseFloat(document.getElementById('postProdPrice').value),
                currency: AppState.currentCurrency,
                is_service: parseInt(document.getElementById('postIsService').value),
                description: document.getElementById('postProdDesc').value,
                photo_url: document.getElementById('postPhotoUrl').value || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
                video_url: document.getElementById('postVideoUrl').value,
                audio_url: document.getElementById('postAudioUrl').value,
                delivery_info: document.getElementById('postDeliveryInfo').value
            };

            const res = await API.createProduct(payload);
            btn.disabled = false;
            btn.innerHTML = 'Publish Listing with Multimedia';

            if (res.status === 'success') {
                showToast('Listing published successfully!', 'success');
                prodForm.reset();
                switchTab('home');
                loadMarketplaceProducts();
            } else {
                showToast('Publish failed: ' + res.message, 'error');
            }
        });
    }
}
