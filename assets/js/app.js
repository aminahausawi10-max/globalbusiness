/**
 * Global Marketplace & Buying Assistance - Core Application Controller
 */

const AppState = {
    activeTab: 'home',
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
    setupCurrencySwitcher();
    setupSearchEngine();
    setupAssistanceModal();
    setupForms();
    
    // Initial Load
    await loadCategories();
    await loadMarketplaceProducts();
    await loadFeaturedBusinesses();
    await loadAdminDashboard();
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

    if (tabName === 'dashboard') {
        loadAdminDashboard();
    } else if (tabName === 'explore') {
        loadExploreDirectory();
    }
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

// Parses prompts like: "I want to buy yam", "Men's clothes in Riyadh", "Phone repair in Kano", "Furniture in Abuja", "Shoes under $50"
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
        alert('Geolocation is not supported by your browser.');
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
            loadMarketplaceProducts({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                near_me: 1,
                radius: 50
            });
        },
        (err) => {
            if (btn) btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Near Me';
            alert('Location access denied or unavailable. Showing all regional items.');
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
                    <div class="product-business-info">
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
            <div class="business-card">
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
                        <div style="display:flex; gap:6px;">
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
                alert(`✅ Request Successfully Submitted!\n\nYour Tracking Code is: ${res.tracking_code}\n\nOur Professional Buying Assistance desk will contact you via WhatsApp/Phone within 1 hour.`);
                form.reset();
            } else {
                alert('Error submitting request: ' + (res.message || 'Please check your inputs'));
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
                alert('🎉 Business successfully registered and placed in category!');
                bizForm.reset();
                switchTab('home');
                loadFeaturedBusinesses();
            } else {
                alert('Registration failed: ' + res.message);
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
                alert('✅ Product/Service successfully published with multimedia assets!');
                prodForm.reset();
                switchTab('home');
                loadMarketplaceProducts();
            } else {
                alert('Publish failed: ' + res.message);
            }
        });
    }
}

/* ==========================================================================
   ADMIN & BUYING AGENT DASHBOARD
   ========================================================================== */
async function loadAdminDashboard() {
    const adminData = await API.getAdminStats();
    const statsContainer = document.getElementById('adminStatsGrid');
    const ticketsTable = document.getElementById('assistanceTicketsBody');

    if (statsContainer && adminData.stats) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${adminData.stats.total_businesses}</span>
                <span class="stat-label">Registered Businesses</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: var(--success);">${adminData.stats.verified_businesses}</span>
                <span class="stat-label">Verified Badges</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: var(--accent);">${adminData.stats.total_products}</span>
                <span class="stat-label">Total Listings (Ads)</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" style="color: var(--warning);">${adminData.stats.total_buying_requests}</span>
                <span class="stat-label">Buying Requests</span>
            </div>
        `;
    }

    if (ticketsTable) {
        const requests = await API.getBuyingRequests();
        let html = '';
        requests.forEach(r => {
            const statusColor = r.status === 'New' ? '#2563eb' : (r.status === 'Sourcing' ? '#d97706' : '#16a34a');
            html += `
                <tr>
                    <td><strong>${r.tracking_code || 'PBA-' + r.id}</strong></td>
                    <td>${r.customer_name}<br><small style="color:var(--text-muted);">${r.customer_phone}</small></td>
                    <td>${r.item_title}<br><small style="color:var(--text-muted);">${r.target_city}, ${r.target_country}</small></td>
                    <td><strong>${r.package_type}</strong></td>
                    <td><span style="background:${statusColor}15; color:${statusColor}; padding:4px 8px; border-radius:12px; font-weight:700; font-size:0.75rem;">${r.status}</span></td>
                    <td><small>${r.assigned_agent}</small></td>
                </tr>
            `;
        });
        ticketsTable.innerHTML = html;
    }
}
