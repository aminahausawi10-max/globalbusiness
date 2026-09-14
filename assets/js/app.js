/**
 * Global Marketplace & Professional Buying Assistance - Core Application
 * 100% Pure English Architecture & Reactivity
 */

const AppState = {
    currentPage: 'home',
    currentAdminTab: 'overview',
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
    selectedAssistancePackage: 'Full Buying Assistance',
    selectedAssistanceFee: 60.00
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupCurrencySwitcher();
    setupSearchEngine();
    setupAssistanceForms();
    setupRegistrationForms();
    
    // Initial Data Loads
    await loadCategories();
    await loadMarketplaceProducts();
    await loadFeaturedBusinesses();
    await loadAdminOverview();
}

/* ==========================================================================
   PAGE ROUTING & NAVIGATION
   ========================================================================== */
function switchPage(pageName) {
    AppState.currentPage = pageName;

    // Update Nav Links & Bottom Nav Items
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-page') === pageName);
    });

    // Update Page Views
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.toggle('active', view.id === `page-${pageName}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageName === 'marketplace') {
        renderMarketplacePage();
    } else if (pageName === 'directory') {
        renderDirectoryPage();
    } else if (pageName === 'admin') {
        switchAdminSubTab(AppState.currentAdminTab || 'overview');
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
   CURRENCY CONVERTER
   ========================================================================== */
function setupCurrencySwitcher() {
    const switcher = document.getElementById('currencySelector');
    if (switcher) {
        switcher.addEventListener('change', (e) => {
            AppState.currentCurrency = e.target.value;
            loadMarketplaceProducts();
            loadFeaturedBusinesses();
            if (AppState.currentPage === 'admin') loadAdminOverview();
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
    const heroSelect = document.getElementById('heroCategorySelect');
    const homeCatGrid = document.getElementById('homeCategoriesGrid');
    const marketCatFilter = document.getElementById('marketCategoryFilter');
    const bizCatSelect = document.getElementById('bizCategorySelect');
    const prodCatSelect = document.getElementById('prodCategorySelect');
    const mainPbaCat = document.getElementById('mainPbaCategory');

    let selectOptions = '<option value="">All Categories</option>';
    let gridHtml = '';

    categories.forEach(cat => {
        selectOptions += `<option value="${cat.id}">${cat.name}</option>`;
        gridHtml += `
            <div class="category-box" onclick="filterByCategoryId(${cat.id}, this)">
                <div class="category-icon">
                    <i class="fa-solid ${cat.icon}"></i>
                </div>
                <span class="category-name">${cat.name}</span>
            </div>
        `;
    });

    if (heroSelect) heroSelect.innerHTML = selectOptions;
    if (marketCatFilter) marketCatFilter.innerHTML = selectOptions;
    if (bizCatSelect) bizCatSelect.innerHTML = selectOptions;
    if (prodCatSelect) prodCatSelect.innerHTML = selectOptions;
    if (mainPbaCat) mainPbaCat.innerHTML = selectOptions;
    if (homeCatGrid) homeCatGrid.innerHTML = gridHtml;
}

function filterByCategoryId(catId, element) {
    document.querySelectorAll('.category-box').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');

    loadMarketplaceProducts({ category_id: catId });
    const prodSection = document.getElementById('homeProductsGrid');
    if (prodSection) prodSection.scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   SEARCH ENGINE & GEOLOCATION
   ========================================================================== */
function setupSearchEngine() {
    const form = document.getElementById('mainSearchForm');
    const nearMeBtn = document.getElementById('btnNearMe');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            executeHeroSearch();
        });
    }

    if (nearMeBtn) {
        nearMeBtn.addEventListener('click', () => {
            triggerNearMeSearch();
        });
    }
}

function searchFor(query) {
    const input = document.getElementById('mainSearchInput');
    if (input) {
        input.value = query;
        executeHeroSearch();
    }
}

function executeHeroSearch() {
    const query = document.getElementById('mainSearchInput').value.trim();
    const catId = document.getElementById('heroCategorySelect').value;
    const location = document.getElementById('locationSelect').value;

    const params = {};
    if (query) params.q = query;
    if (catId) params.category_id = catId;
    if (location) params.country = location;

    loadMarketplaceProducts(params);
    const prodGrid = document.getElementById('homeProductsGrid');
    if (prodGrid) prodGrid.scrollIntoView({ behavior: 'smooth' });
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
                btn.classList.add('btn-primary');
                btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Near Me Active';
            }
            showToast('GPS Location Locked! Showing nearby sellers and listings.', 'success');
            loadMarketplaceProducts({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                near_me: 1,
                radius: 50
            });
        },
        (err) => {
            if (btn) btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Near Me';
            showToast('Location permission denied. Showing all regional items.', 'info');
        }
    );
}

/* ==========================================================================
   MARKETPLACE PRODUCTS & SERVICES LISTINGS
   ========================================================================== */
async function loadMarketplaceProducts(params = {}) {
    const homeGrid = document.getElementById('homeProductsGrid');
    if (!homeGrid) return;

    homeGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent);"></i><p style="margin-top:8px; color:var(--text-secondary);">Loading listings...</p></div>';

    const products = await API.getProducts(params);
    renderProductsInto(homeGrid, products);
}

async function renderMarketplacePage() {
    const grid = document.getElementById('marketplaceProductsGrid');
    if (!grid) return;
    const products = await API.getProducts();
    renderProductsInto(grid, products);
}

async function filterMarketplace() {
    const q = document.getElementById('marketSearchFilter').value.trim();
    const category_id = document.getElementById('marketCategoryFilter').value;
    const is_service = document.getElementById('marketTypeFilter').value;

    const params = {};
    if (q) params.q = q;
    if (category_id) params.category_id = category_id;
    if (is_service !== '') params.is_service = is_service;

    const products = await API.getProducts(params);
    const grid = document.getElementById('marketplaceProductsGrid');
    renderProductsInto(grid, products);
}

function renderProductsInto(container, products) {
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px 20px; background:#fff; border-radius:var(--radius-lg); border:1px solid var(--border);">
                <i class="fa-solid fa-magnifying-glass fa-2x" style="color:var(--text-muted); margin-bottom:10px;"></i>
                <h4 style="font-size:1.1rem; color:var(--primary); font-weight:800;">No exact listings found</h4>
                <p style="font-size:0.88rem; color:var(--text-secondary); max-width:460px; margin:6px auto 16px auto;">
                    We couldn't find matches for this filter. Submit a Buying Assistance Request and our certified sourcing agents will find it for you!
                </p>
                <button class="btn btn-primary" onclick="switchPage('assistance')">
                    <i class="fa-solid fa-handshake-angle"></i> Request Buying Assistance
                </button>
            </div>
        `;
        return;
    }

    let html = '';
    products.forEach(p => {
        const isVerified = p.business_verified || p.verified;
        const mediaBadge = p.video_url ? '<span class="badge badge-warning"><i class="fa-solid fa-video"></i> Video</span>' : 
                          (p.audio_url ? '<span class="badge badge-success"><i class="fa-solid fa-volume-high"></i> Voice Pitch</span>' : '');

        html += `
            <div class="product-card">
                <div class="product-img-wrap">
                    <img src="${p.photo_url}" alt="${p.title}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'">
                    <div class="product-badges">
                        ${isVerified ? '<span class="badge badge-success"><i class="fa-solid fa-shield-check"></i> Verified</span>' : ''}
                        ${p.is_service ? '<span class="badge" style="background:#4338ca; color:#fff;"><i class="fa-solid fa-wrench"></i> Service</span>' : ''}
                        ${mediaBadge}
                    </div>
                </div>

                <div class="product-body">
                    <div class="product-store-link" onclick="openBusinessModal(${p.business_id})">
                        <i class="fa-solid fa-store" style="color:var(--accent);"></i>
                        <strong>${p.business_name}</strong>
                        <span>• ${p.city}, ${p.country}</span>
                    </div>

                    <h3 class="product-title">${p.title}</h3>
                    <p class="product-desc">${p.description}</p>

                    ${p.audio_url ? `
                        <div class="audio-bar">
                            <button class="btn-play-voice" onclick="playVoicePitch('${p.audio_url}', this)">
                                <i class="fa-solid fa-play"></i>
                            </button>
                            <div class="waveform">
                                <div class="waveform-bar" style="height:40%"></div>
                                <div class="waveform-bar" style="height:70%"></div>
                                <div class="waveform-bar" style="height:100%"></div>
                                <div class="waveform-bar" style="height:60%"></div>
                                <div class="waveform-bar" style="height:90%"></div>
                                <div class="waveform-bar" style="height:50%"></div>
                                <div class="waveform-bar" style="height:80%"></div>
                            </div>
                            <span style="font-size:0.72rem; font-weight:700; color:var(--text-secondary);">Seller Voice Pitch</span>
                        </div>
                    ` : ''}

                    <div class="product-footer">
                        <div class="product-price">${formatPrice(p.price)}</div>
                        <div class="product-actions">
                            ${p.video_url ? `
                                <button class="btn-icon" title="Watch Product Video" onclick="openVideoModal('${p.video_url}', '${p.title}')">
                                    <i class="fa-solid fa-circle-play" style="color:var(--accent);"></i>
                                </button>
                            ` : ''}
                            <a href="https://wa.me/${(p.whatsapp || p.phone || '').replace(/[^0-9]/g, '')}?text=Hello,%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(p.title)}" target="_blank" class="btn-icon whatsapp" title="Chat on WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <a href="tel:${p.phone}" class="btn-icon" title="Call Seller">
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
    const homeGrid = document.getElementById('homeBusinessesGrid');
    if (!homeGrid) return;

    const businesses = await API.getBusinesses();
    renderBusinessesInto(homeGrid, businesses);
}

async function renderDirectoryPage() {
    const grid = document.getElementById('directoryBusinessesGrid');
    if (!grid) return;
    const businesses = await API.getBusinesses();
    renderBusinessesInto(grid, businesses);
}

function renderBusinessesInto(container, businesses) {
    if (!container) return;

    let html = '';
    businesses.forEach(b => {
        html += `
            <div class="business-card" onclick="openBusinessModal(${b.id})">
                <img src="${b.logo_url}" alt="${b.name}" class="biz-logo" onerror="this.src='https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200'">
                <div class="biz-info">
                    <h4 class="biz-name">
                        ${b.name}
                        ${b.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--success);" title="Verified Business"></i>' : ''}
                    </h4>
                    <div class="biz-cat">${b.category_name}</div>
                    <div class="biz-location">
                        <i class="fa-solid fa-location-dot" style="color:var(--text-muted);"></i>
                        <span>${b.area}, ${b.city}, ${b.country}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                        <span style="font-size:0.8rem; font-weight:700; color:var(--warning);">
                            ★ ${b.rating || '5.0'} (${b.reviews_count || 1} reviews)
                        </span>
                        <div style="display:flex; gap:6px;" onclick="event.stopPropagation();">
                            <a href="https://wa.me/${(b.whatsapp || b.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="btn-icon whatsapp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <a href="tel:${b.phone}" class="btn-icon">
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
    verifiedBadge.innerHTML = biz.verified ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Verified Business</span>' : '<span class="badge badge-warning">Standard Business</span>';

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
                        <img src="${p.photo_url}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
                        <div>
                            <div style="font-size:0.82rem; font-weight:700;">${p.title}</div>
                            <div style="font-size:0.78rem; color:var(--accent); font-weight:800;">${formatPrice(p.price)}</div>
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
        document.querySelectorAll('.btn-play-voice i').forEach(icon => {
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
   BUYING ASSISTANCE CONCIERGE CONTROLLER
   ========================================================================== */
function selectAssistancePackage(pkgName, fee, element) {
    AppState.selectedAssistancePackage = pkgName;
    AppState.selectedAssistanceFee = fee;

    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    if (element) element.classList.add('selected');

    document.getElementById('mainSelectedPackage').value = pkgName;
    document.getElementById('mainSelectedFee').value = fee;
}

function setupAssistanceForms() {
    const form = document.getElementById('buyingAssistanceMainForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Request...';

            const payload = {
                customer_name: document.getElementById('mainPbaName').value,
                customer_phone: document.getElementById('mainPbaPhone').value,
                customer_email: document.getElementById('mainPbaEmail').value,
                item_title: document.getElementById('mainPbaItem').value,
                package_type: document.getElementById('mainSelectedPackage').value || 'Full Buying Assistance',
                service_fee: parseFloat(document.getElementById('mainSelectedFee').value) || 60.00,
                category: document.getElementById('mainPbaCategory').options[document.getElementById('mainPbaCategory').selectedIndex]?.text || 'General',
                specifications: document.getElementById('mainPbaSpecs').value,
                quantity: document.getElementById('mainPbaQuantity').value,
                budget_min: parseFloat(document.getElementById('mainPbaBudgetMin').value) || 0,
                budget_max: parseFloat(document.getElementById('mainPbaBudgetMax').value) || 0,
                currency: AppState.currentCurrency,
                target_country: document.getElementById('mainPbaCountry').value,
                target_city: document.getElementById('mainPbaCity').value,
                delivery_date: document.getElementById('mainPbaDate').value,
                notes: document.getElementById('mainPbaNotes').value
            };

            const res = await API.submitBuyingAssistance(payload);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Sourcing Request';

            if (res.status === 'success') {
                showToast(`Request submitted! Tracking: ${res.tracking_code}`, 'success');
                alert(`✅ Sourcing Request Successfully Logged!\n\nYour Tracking Code is: ${res.tracking_code}\n\nOur Professional Buying Assistance desk will review specifications and contact you on WhatsApp within 1 hour.`);
                form.reset();
            } else {
                showToast(res.message || 'Error submitting request', 'error');
            }
        });
    }
}

/* ==========================================================================
   REGISTRATION & AD POSTING FORMS
   ========================================================================== */
function setupRegistrationForms() {
    // Business Register Form
    const bizForm = document.getElementById('businessRegisterForm');
    if (bizForm) {
        bizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = bizForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

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
                logo_url: document.getElementById('regBizLogo').value || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200'
            };

            const res = await API.registerBusiness(payload);
            btn.disabled = false;
            btn.innerHTML = 'Register Business Profile';

            if (res.status === 'success') {
                showToast('Business successfully registered and verified!', 'success');
                bizForm.reset();
                switchPage('directory');
                loadFeaturedBusinesses();
            } else {
                showToast('Registration failed: ' + res.message, 'error');
            }
        });
    }

    // Product Publish Form
    const prodForm = document.getElementById('productPublishForm');
    if (prodForm) {
        prodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = prodForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

            const payload = {
                business_id: 1,
                category_id: parseInt(document.getElementById('prodCategorySelect').value),
                title: document.getElementById('postProdTitle').value,
                price: parseFloat(document.getElementById('postProdPrice').value),
                currency: AppState.currentCurrency,
                is_service: parseInt(document.getElementById('postIsService').value),
                description: document.getElementById('postProdDesc').value,
                photo_url: document.getElementById('postPhotoUrl').value || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
                video_url: document.getElementById('postVideoUrl').value,
                audio_url: document.getElementById('postAudioUrl').value,
                delivery_info: document.getElementById('postDeliveryInfo').value
            };

            const res = await API.createProduct(payload);
            btn.disabled = false;
            btn.innerHTML = 'Publish Listing with Multimedia';

            if (res.status === 'success') {
                showToast('Listing published successfully with multimedia!', 'success');
                prodForm.reset();
                switchPage('marketplace');
                loadMarketplaceProducts();
            } else {
                showToast('Publish failed: ' + res.message, 'error');
            }
        });
    }

    // Admin Category Create Form
    const addCatForm = document.getElementById('addCategoryForm');
    if (addCatForm) {
        addCatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('newCatName').value.trim();
            const slug = document.getElementById('newCatSlug').value.trim();
            const icon = document.getElementById('newCatIcon').value.trim() || 'fa-folder';

            const res = await API.createCategory({ name, slug, icon });
            if (res.status === 'success') {
                showToast(`Category "${name}" created!`, 'success');
                addCatForm.reset();
                await loadCategories();
                await loadAdminCategories();
            } else {
                showToast(res.message || 'Error creating category', 'error');
            }
        });
    }
}

/* ==========================================================================
   ADMIN PORTAL OPERATIONS & SUB-TABS
   ========================================================================== */
function switchAdminSubTab(tabName) {
    AppState.currentAdminTab = tabName;

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.admin-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `admin-subtab-${tabName}`);
    });

    if (tabName === 'overview') loadAdminOverview();
    else if (tabName === 'businesses') loadAdminBusinesses();
    else if (tabName === 'listings') loadAdminListings();
    else if (tabName === 'buying_desk') loadAdminBuyingDesk();
    else if (tabName === 'categories') loadAdminCategories();
    else if (tabName === 'reviews') loadAdminReviews();
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
                <span class="stat-number" style="color:var(--success);">${data.stats.verified_businesses}</span>
                <span class="stat-label">Verified Badges</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color:var(--accent);">${data.stats.total_products}</span>
                <span class="stat-label">Total Listings (Ads)</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color:var(--warning);">${data.stats.total_buying_requests}</span>
                <span class="stat-label">Buying Assistance Requests</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color:#6366f1;">${formatPrice(data.stats.estimated_revenue || 0)}</span>
                <span class="stat-label">Est. Service Revenue</span>
            </div>
        `;
    }
}

async function loadAdminBusinesses() {
    const res = await API.getAdminData('businesses');
    const tbody = document.getElementById('adminBusinessesTableBody');
    if (!tbody) return;

    const businesses = res.data || [];
    let html = '';
    businesses.forEach(b => {
        html += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${b.logo_url}" style="width:30px; height:30px; border-radius:6px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100'">
                        <div>
                            <strong>${b.name}</strong>
                            ${b.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--success);" title="Verified"></i>' : ''}
                        </div>
                    </div>
                </td>
                <td><small>${b.category_name}</small></td>
                <td><small>${b.city}, ${b.country}</small></td>
                <td><small>${b.phone}</small></td>
                <td>
                    <span class="badge ${b.verified ? 'badge-success' : 'badge-warning'}">
                        ${b.verified ? 'Verified' : 'Unverified'}
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="handleToggleVerify(${b.id}, ${b.verified})">
                            ${b.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openBusinessModal(${b.id})">
                            View
                        </button>
                        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:var(--danger);" onclick="handleDeleteBusiness(${b.id})">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;">No businesses found</td></tr>';
}

async function handleToggleVerify(id, currentStatus) {
    const res = await API.verifyBusiness(id, !currentStatus);
    showToast(res.message || 'Status updated', 'success');
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
                        <img src="${p.photo_url}" style="width:34px; height:34px; border-radius:6px; object-fit:cover;">
                        <div>
                            <strong>${p.title}</strong>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${p.is_service ? 'Service' : 'Product'}</div>
                        </div>
                    </div>
                </td>
                <td><small>${p.business_name || 'Business #' + p.business_id}</small></td>
                <td><strong>${formatPrice(p.price)}</strong></td>
                <td>
                    ${p.video_url ? '<span class="badge badge-warning"><i class="fa-solid fa-video"></i> Video</span> ' : ''}
                    ${p.audio_url ? '<span class="badge badge-success"><i class="fa-solid fa-microphone"></i> Audio</span>' : ''}
                </td>
                <td>
                    <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:var(--danger);" onclick="handleDeleteProduct(${p.id})">
                        Delete
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
                    <select id="desk_status_${r.id}" class="form-select" style="padding:4px 8px; font-size:0.75rem;">
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
                    <input type="text" id="desk_agent_${r.id}" class="form-input" style="padding:4px 8px; font-size:0.75rem; margin-bottom:4px;" value="${r.assigned_agent || ''}" placeholder="Agent Name">
                    <input type="text" id="desk_notes_${r.id}" class="form-input" style="padding:4px 8px; font-size:0.75rem;" value="${r.notes || ''}" placeholder="Internal Notes">
                </td>
                <td>
                    <button class="btn btn-primary" style="padding:5px 10px; font-size:0.75rem;" onclick="handleSaveDesk(${r.id})">
                        Save
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || '<tr><td colspan="7" style="text-align:center;">No requests found</td></tr>';
}

async function handleSaveDesk(id) {
    const status = document.getElementById(`desk_status_${id}`).value;
    const assigned_agent = document.getElementById(`desk_agent_${id}`).value;
    const notes = document.getElementById(`desk_notes_${id}`).value;

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
            <div style="background:var(--bg-alt); padding:6px 12px; border-radius:var(--radius-sm); display:flex; align-items:center; gap:8px; font-size:0.85rem;">
                <i class="fa-solid ${c.icon}" style="color:var(--accent);"></i>
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
            <div style="padding:10px 0; border-bottom:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${r.customer_name}</strong>
                    <span style="color:var(--warning); font-weight:700;">★ ${r.rating}</span>
                </div>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin:4px 0;">${r.comment || ''}</p>
                <small style="color:var(--text-muted);">For: ${r.business_name || 'Business'}</small>
            </div>
        `;
    });
    container.innerHTML = html;
}
