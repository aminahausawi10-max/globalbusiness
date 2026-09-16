/**
 * Market at Home — Unified Reactive Application Controller (v4.0 Next-Gen)
 * Seamlessly drives Homepage, AI Search, Nigeria Trade Map, Market Assistant Bot,
 * Buyer Portal (12 Modules), Seller Portal, and Admin Control Center (11 Modules).
 */

// ==========================================
// 1. GEOGRAPHICAL TRADE LOCATIONS & REGIONS
// ==========================================
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

const NIGERIA_STATE_DESCS = {
    'Abuja (FCT)': 'Federal Capital Territory — Prime administrative & luxury lifestyle goods, designer fashion, tech hubs and verified high-grade suppliers.',
    'Kano': 'Northern Commercial Giant — Historic Kurmi textiles, Dawanau international grain and agro-commodities market, leather & hides.',
    'Kaduna': 'Central Industrial Axis — Barnawa textile trade, mechanized agricultural produce, and specialized bulk manufacturing.',
    'Lagos': 'West African Mega Hub — Alaba International electronics, Balogun textile fashion, Trade Fair commercial complexes & sea freight.',
    'Rivers (Port Harcourt)': 'South-South Gateway — Oil & marine equipment, luxury fashion, aquatic food supply & high-yield enterprise trade.',
    'Oyo (Ibadan)': 'South-West Agro & Craft Capital — Bodija wholesale foodstuff, adire & tie-dye artisans, and educational equipment.',
    'Enugu': 'Eastern Commercial Gateway — Ogbete main market, coal city crafts, auto spares, and agricultural produce from the east.'
};

// ==========================================
// 2. GLOBAL REACTIVE APP STATE
// ==========================================
const AppState = {
    currentPage: 'home',
    currentBuyerTab: 'dashboard',
    currentSellerTab: 'dashboard',
    currentAdminTab: 'dashboard',
    currentCurrency: 'NGN',
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
    searchKeyword: '',
    selectedAssistancePackage: 'Full Buying Assistance',
    selectedAssistanceFee: 60.00
};

// ==========================================
// 3. APPLICATION LIFECYCLE INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    initTheme();
    setupCurrencySwitcher();
    updateNavAuthUI();
    updateCartBadge();
    updateFavBadge();
    renderLiveAnnouncementBanner();

    // Populate Initial Catalogs
    await loadCategories();
    await loadHomeFeatured();
    await loadMarketplaceProducts();
    await loadBuyerPortalData();
    await loadSellerPortalData();
    await loadAdminPortalData();

    // Default select Abuja on trade map
    selectNigeriaState('Abuja (FCT)');
    init3DTiltEffects();
}

// ==========================================
// 4. 🎨 THEME SYSTEM (PERMANENT DARK MODE)
// ==========================================
function initTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('mah_theme', 'dark');
}

function toggleTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('mah_theme', 'dark');
}


// ==========================================
// 5. 🌍 INTERACTIVE NIGERIA MAP EXPLORER
// ==========================================
async function selectNigeriaState(stateName) {
    document.querySelectorAll('.state-node-btn').forEach(btn => btn.classList.remove('active'));
    
    const prefix = stateName.split(' ')[0];
    const targetBtn = Array.from(document.querySelectorAll('.state-node-btn')).find(b => b.textContent.includes(prefix));
    if (targetBtn) targetBtn.classList.add('active');

    const titleEl = document.getElementById('mapSelectedStateTitle');
    const descEl = document.getElementById('mapSelectedStateDesc');
    const gridEl = document.getElementById('mapStateProductsGrid');

    if (titleEl) titleEl.textContent = `Products available in ${stateName}`;
    if (descEl) descEl.textContent = NIGERIA_STATE_DESCS[stateName] || `Verified merchant listings and direct trade products sourced directly from ${stateName}.`;

    if (gridEl) {
        gridEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:24px; color:#94A3B8;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading ${stateName} listings...</div>`;
        const products = await API.getProducts({ country: 'Nigeria', search: prefix });
        
        const displayProducts = (products && products.length > 0) ? products.slice(0, 4) : [];
        renderMapProducts(gridEl, displayProducts, stateName);
    }
}

function renderMapProducts(container, products, stateName) {
    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#94A3B8;">No listings currently registered in ${stateName}.</div>`;
        return;
    }

    container.innerHTML = products.map(p => {
        const cleanPhone = (p.phone || '+2348090908090').replace(/[^0-9+]/g, '');
        return `
            <div class="product-card product-card-3d" style="cursor:pointer;" onclick="openProductDetails('${p.id}')">
                <div class="product-img-wrapper" style="height:140px;">
                    <img src="${p.photo}" alt="${p.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                    <span class="product-badge-verified"><i class="fa-solid fa-circle-check"></i> Verified</span>
                    <span class="product-price-pill">${formatPrice(p.price)}</span>
                </div>
                <div class="product-body" style="padding:10px;">
                    <h4 class="product-title" style="font-size:0.88rem; margin-bottom:2px;">${p.name}</h4>
                    <div class="product-location"><i class="fa-solid fa-location-dot"></i> ${p.location || stateName}</div>
                    <div class="product-seller-tag"><i class="fa-solid fa-store"></i> Seller: ${p.seller_name || 'Verified Merchant'}</div>
                    <div class="product-card-actions">
                        <button class="btn-chat-seller" style="padding:6px 10px; font-size:0.75rem;" onclick="event.stopPropagation(); openChatWithSeller('${p.phone || cleanPhone}', '${p.seller_name || 'Merchant'}')">
                            <i class="fa-brands fa-whatsapp"></i> Chat Seller
                        </button>
                        <a href="tel:${cleanPhone}" class="btn-call-seller" style="padding:5px 10px; font-size:0.75rem;" onclick="event.stopPropagation();">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    init3DTiltEffects();
}

// ==========================================
// 6. 🤖 NATURAL LANGUAGE AI SEARCH PARSER
// ==========================================
async function handleAiSearchSubmit(event) {
    if (event) event.preventDefault();
    const query = document.getElementById('aiSearchInput')?.value.trim();
    if (!query) return;
    executeAiQuery(query);
}

async function executeAiQuery(queryText) {
    const inputEl = document.getElementById('aiSearchInput');
    if (inputEl) inputEl.value = queryText;

    showToast(`🤖 AI Analyzing: "${queryText}"...`, 'info');

    const parsed = API.parseNaturalLanguageQuery ? API.parseNaturalLanguageQuery(queryText) : { query: queryText };

    switchPage('marketplace');

    const searchInput = document.getElementById('marketSearchFilter');
    if (searchInput) searchInput.value = parsed.keyword || parsed.query || queryText;

    const products = await API.getProducts({
        search: parsed.keyword || parsed.query,
        category: parsed.category,
        maxPrice: parsed.maxPriceUsd,
        country: parsed.country,
        state: parsed.state
    });

    const grid = document.getElementById('marketplaceProductsGrid');
    renderProductsGrid(products, grid);

    let feedback = `✨ AI Found ${products.length} matching listings`;
    if (parsed.category) feedback += ` in "${parsed.category}"`;
    if (parsed.state) feedback += ` around ${parsed.state}`;
    if (parsed.maxPriceUsd) feedback += ` under ${formatPrice(parsed.maxPriceUsd)}`;

    showToast(feedback, 'success');
}

// ==========================================
// 7. 🧠 "MARKET ASSISTANT" AI CHAT DRAWER
// ==========================================
function toggleMarketAssistant() {
    const drawer = document.getElementById('marketAssistantDrawer');
    if (drawer) {
        drawer.classList.toggle('active');
        if (drawer.classList.contains('active')) {
            document.getElementById('aiChatInput')?.focus();
        }
    }
}

function sendQuickAiPrompt(text) {
    const input = document.getElementById('aiChatInput');
    if (input) {
        input.value = text;
        handleAiChatSubmit(new Event('submit'));
    }
}

async function handleAiChatSubmit(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('aiChatInput');
    const msgBox = document.getElementById('aiChatMessagesList');
    const text = input ? input.value.trim() : '';
    if (!text || !msgBox) return;

    // User Message
    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'align-self:flex-end; background:var(--brand-green); color:#fff; padding:10px 14px; border-radius:14px 14px 2px 14px; max-width:80%; font-size:0.85rem; font-weight:600; margin-bottom:8px;';
    userBubble.textContent = text;
    msgBox.appendChild(userBubble);
    input.value = '';
    msgBox.scrollTop = msgBox.scrollHeight;

    // Bot Typing
    const typingBubble = document.createElement('div');
    typingBubble.id = 'aiTypingIndicator';
    typingBubble.style.cssText = 'align-self:flex-start; background:var(--bg-card); border:1px solid var(--border); padding:8px 12px; border-radius:14px 14px 14px 2px; font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px; margin-bottom:8px;';
    typingBubble.innerHTML = `<i class="fa-solid fa-robot fa-bounce" style="color:var(--brand-green);"></i> Thinking...`;
    msgBox.appendChild(typingBubble);
    msgBox.scrollTop = msgBox.scrollHeight;

    const aiResponse = API.aiAssistantChat ? await API.aiAssistantChat(text) : { reply: "I'm your Market Assistant. How can I help you source goods today?" };
    typingBubble.remove();

    const botBubble = document.createElement('div');
    botBubble.style.cssText = 'align-self:flex-start; background:var(--bg-card); border:1px solid var(--border); padding:12px 14px; border-radius:14px 14px 14px 2px; max-width:85%; font-size:0.85rem; line-height:1.45; margin-bottom:8px;';
    
    let htmlContent = `<div style="font-weight:700; color:var(--brand-green); margin-bottom:4px; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-robot"></i> Market Assistant</div>`;
    htmlContent += `<div>${aiResponse.reply.replace(/\n/g, '<br>')}</div>`;

    if (aiResponse.recommendedProducts && aiResponse.recommendedProducts.length > 0) {
        htmlContent += `<div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:6px;">`;
        aiResponse.recommendedProducts.forEach(p => {
            htmlContent += `
                <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:8px; padding:6px; cursor:pointer; text-align:center;" onclick="openProductDetails('${p.id}'); toggleMarketAssistant();">
                    <img src="${p.photo}" style="width:100%; height:55px; object-fit:cover; border-radius:4px; margin-bottom:4px;">
                    <div style="font-size:0.72rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                    <div style="font-size:0.75rem; color:var(--brand-green); font-weight:800;">${formatPrice(p.price)}</div>
                </div>
            `;
        });
        htmlContent += `</div>`;
    }

    if (aiResponse.actionLink) {
        htmlContent += `
            <div style="margin-top:8px;">
                <button class="btn btn-sm btn-primary" style="font-size:0.75rem; width:100%;" onclick="${aiResponse.actionLink}">
                    <i class="fa-solid fa-arrow-right"></i> View Catalog Matches
                </button>
            </div>
        `;
    }

    botBubble.innerHTML = htmlContent;
    msgBox.appendChild(botBubble);
    msgBox.scrollTop = msgBox.scrollHeight;
}

// ==========================================
// 8. 💬 IN-APP DIRECT MERCHANT CHAT
// ==========================================
let currentChatSellerPhone = '';
let currentChatSellerName = '';

function openChatWithSeller(phone, sellerName) {
    currentChatSellerPhone = phone;
    currentChatSellerName = sellerName || 'Merchant';

    const titleEl = document.getElementById('sellerChatTitle');
    const phoneInput = document.getElementById('chatSellerPhone');
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-comments" style="color:var(--brand-green);"></i> Chat with ${currentChatSellerName}`;
    if (phoneInput) phoneInput.value = phone;

    loadSellerChatMessages(phone);
    document.getElementById('sellerChatModal')?.classList.add('active');
}

function loadSellerChatMessages(phone) {
    const box = document.getElementById('sellerChatBox');
    if (!box) return;

    const messages = API.getChatMessages ? API.getChatMessages(phone) : [];
    if (messages.length === 0) {
        box.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:0.8rem;">
                <div style="width:44px; height:44px; border-radius:50%; background:var(--brand-green-soft); color:var(--brand-green); display:flex; align-items:center; justify-content:center; margin:0 auto 10px auto; font-size:1.2rem;">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <strong>Direct & Verified Merchant Chat</strong><br>
                Ask questions regarding product specifications, live stock, bulk pricing, or instant dispatch.
            </div>
        `;
        return;
    }

    box.innerHTML = messages.map(m => {
        const isBuyer = m.sender === 'buyer';
        return `
            <div style="align-self:${isBuyer ? 'flex-end' : 'flex-start'}; background:${isBuyer ? 'var(--brand-green)' : 'var(--bg-card)'}; color:${isBuyer ? '#fff' : 'var(--text-main)'}; border:${isBuyer ? 'none' : '1px solid var(--border)'}; padding:8px 12px; border-radius:12px; max-width:80%; font-size:0.82rem; margin-bottom:6px;">
                <div>${m.message}</div>
                <div style="font-size:0.65rem; opacity:0.75; text-align:right; margin-top:2px;">${new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

async function handleSendSellerChatMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('chatMessageInput');
    const msg = input ? input.value.trim() : '';
    if (!msg || !currentChatSellerPhone) return;

    if (API.sendChatMessage) {
        API.sendChatMessage(currentChatSellerPhone, msg, 'buyer');
    }
    input.value = '';
    loadSellerChatMessages(currentChatSellerPhone);

    setTimeout(() => {
        if (API.sendChatMessage) {
            API.sendChatMessage(currentChatSellerPhone, "Hello! Thanks for reaching out. This item is fully in stock and ready for immediate delivery.", 'seller');
            loadSellerChatMessages(currentChatSellerPhone);
        }
    }, 1200);
}

// ==========================================
// 9. 🔮 SMART PRODUCT DETAILS PREVIEW
// ==========================================
async function openProductDetails(productId) {
    const product = await API.getProductById(productId);
    if (!product) {
        showToast('Product details not found', 'error');
        return;
    }

    const titleEl = document.getElementById('detailModalTitle');
    const contentEl = document.getElementById('detailModalContent');
    if (titleEl) titleEl.textContent = product.name;

    const formattedPrice = formatPrice(product.price);
    const sellerPhoneClean = (product.phone || '').replace(/[^0-9]/g, '');

    contentEl.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start;" class="product-detail-layout">
            
            <!-- Left: 360 Inspection Simulation & Visuals -->
            <div>
                <div class="product-360-viewer-box" style="position:relative; background:var(--bg-page); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; text-align:center;">
                    <img id="detailMainImage" src="${product.photo}" alt="${product.name}" style="width:100%; height:260px; object-fit:contain; transition:transform 0.2s;" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                    <div style="position:absolute; bottom:8px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.65); color:#fff; font-size:0.72rem; padding:4px 10px; border-radius:20px; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-arrows-spin"></i> 360° Inspection Simulation
                    </div>
                </div>

                <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-rotate-left"></i></span>
                    <input type="range" min="0" max="360" value="0" style="flex:1;" oninput="rotateProductSimulation(this.value)">
                    <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-rotate-right"></i></span>
                </div>
            </div>

            <!-- Right: Specs, Merchant Box, Tabs, Actions -->
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green); font-weight:800;">
                        <i class="fa-solid fa-circle-check"></i> ${product.category || 'General Goods'}
                    </span>
                    <span style="color:var(--gold); font-size:0.85rem; font-weight:700;">
                        <i class="fa-solid fa-star"></i> 4.9 (48 Verified Reviews)
                    </span>
                </div>

                <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:8px; line-height:1.3;">${product.name}</h2>
                <div style="font-size:1.4rem; font-weight:900; color:var(--brand-green); margin-bottom:12px;">${formattedPrice}</div>

                <!-- Verified Merchant Info Box -->
                <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:var(--radius-md); padding:10px 12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:700; font-size:0.85rem;"><i class="fa-solid fa-store" style="color:var(--gold);"></i> ${product.seller_name || 'Verified Supplier'}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${product.location || 'Nigeria'}</div>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="openChatWithSeller('${product.phone}', '${product.seller_name}')" style="padding:4px 10px; font-size:0.75rem;">
                        <i class="fa-solid fa-comment-dots" style="color:var(--brand-green);"></i> Chat
                    </button>
                </div>

                <!-- Tabs: Overview, Specs, Video Demo -->
                <div style="display:flex; gap:6px; border-bottom:1px solid var(--border); margin-bottom:10px;">
                    <button class="btn btn-sm btn-white" id="pTabBtn-desc" onclick="switchProductPreviewTab('desc')" style="border-bottom:2px solid var(--brand-green); border-radius:0; padding:6px 12px; font-size:0.78rem;">Overview</button>
                    <button class="btn btn-sm btn-white" id="pTabBtn-specs" onclick="switchProductPreviewTab('specs')" style="border-bottom:2px solid transparent; border-radius:0; padding:6px 12px; font-size:0.78rem;">Specifications</button>
                    <button class="btn btn-sm btn-white" id="pTabBtn-video" onclick="switchProductPreviewTab('video')" style="border-bottom:2px solid transparent; border-radius:0; padding:6px 12px; font-size:0.78rem;"><i class="fa-solid fa-play" style="color:#EF4444;"></i> Live Video</button>
                </div>

                <div id="pTabContent-desc" style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:14px;">
                    ${product.description || 'Premium grade certified merchandise. Sourced directly from authenticated distributors with full buyer escrow and concierge inspection.'}
                </div>

                <div id="pTabContent-specs" style="display:none; font-size:0.82rem; margin-bottom:14px;">
                    <table style="width:100%; border-collapse:collapse;">
                        <tr><td style="padding:4px 0; color:var(--text-muted);">Origin:</td><td style="font-weight:700;">${product.country || 'Nigeria'}</td></tr>
                        <tr><td style="padding:4px 0; color:var(--text-muted);">Availability:</td><td style="font-weight:700; color:var(--brand-green);">In Stock & Ready to Ship</td></tr>
                        <tr><td style="padding:4px 0; color:var(--text-muted);">Inspection:</td><td style="font-weight:700;">Market at Home Concierge Ready</td></tr>
                    </table>
                </div>

                <div id="pTabContent-video" style="display:none; margin-bottom:14px; text-align:center;">
                    <div style="background:#0F172A; color:#fff; border-radius:var(--radius-md); padding:24px 10px;">
                        <i class="fa-solid fa-circle-play" style="font-size:2.2rem; color:#EF4444; margin-bottom:6px;"></i>
                        <div style="font-size:0.85rem; font-weight:700;">Merchant Live HD Video Stream</div>
                        <div style="font-size:0.75rem; color:#94A3B8;">Physical verification stream of actual product stock</div>
                    </div>
                </div>

                <!-- Add to Cart & WhatsApp Actions -->
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <button class="btn btn-primary" style="flex:2; padding:12px;" onclick="addToCart('${product.id}'); closeModal('productDetailModal');">
                        <i class="fa-solid fa-cart-plus"></i> Add to Cart
                    </button>
                    <a href="https://wa.me/${sellerPhoneClean}?text=Hello%20${encodeURIComponent(product.seller_name)},%20I%20am%20interested%20in%20buying%20${encodeURIComponent(product.name)}%20on%20Market%20at%20Home." target="_blank" class="btn btn-outline" style="flex:1; border-color:#25D366; color:#25D366; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <i class="fa-brands fa-whatsapp" style="font-size:1.1rem;"></i> WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    document.getElementById('productDetailModal')?.classList.add('active');
}

function rotateProductSimulation(deg) {
    const img = document.getElementById('detailMainImage');
    if (img) {
        img.style.transform = `rotate(${(deg - 180) / 15}deg) scale(${1 + Math.sin(deg * Math.PI / 180) * 0.05})`;
    }
}

function switchProductPreviewTab(tab) {
    ['desc', 'specs', 'video'].forEach(t => {
        const btn = document.getElementById('pTabBtn-' + t);
        const content = document.getElementById('pTabContent-' + t);
        if (btn) btn.style.borderBottomColor = (t === tab) ? 'var(--brand-green)' : 'transparent';
        if (content) content.style.display = (t === tab) ? 'block' : 'none';
    });
}

// ==========================================
// 10. 🪄 3D CARD TILT EFFECT ENGINE
// ==========================================
function init3DTiltEffects() {
    const cards = document.querySelectorAll('.product-card-3d');
    cards.forEach(card => {
        card.removeEventListener('mousemove', handleCardTilt);
        card.removeEventListener('mouseleave', resetCardTilt);
        card.addEventListener('mousemove', handleCardTilt);
        card.addEventListener('mouseleave', resetCardTilt);
    });
}

function handleCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
}

function resetCardTilt(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
}

// ==========================================
// 11. 🗺️ LIVE ORDER ROUTE & STEP TRACKER
// ==========================================
function openOrderRouteTracker(orderId) {
    const order = API.getOrderById ? API.getOrderById(orderId) : null;
    if (!order) {
        showToast('Order details not found', 'error');
        return;
    }

    const status = (order.status || 'Pending').toLowerCase();
    let stepIndex = 1;
    if (status === 'processing' || status === 'confirmed') stepIndex = 2;
    if (status === 'shipped' || status === 'in transit' || status === 'out for delivery') stepIndex = 3;
    if (status === 'delivered' || status === 'completed') stepIndex = 4;

    const modalTitle = document.getElementById('detailModalTitle');
    const modalContent = document.getElementById('detailModalContent');
    if (modalTitle) modalTitle.textContent = `Live Tracking — Order #${order.id}`;

    modalContent.innerHTML = `
        <div style="padding:10px 0;">
            <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Tracking Code:</span>
                        <div style="font-weight:800; font-size:0.95rem; color:var(--brand-green);">${order.tracking_code || 'MAH-TRK-984210'}</div>
                    </div>
                    <span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green); font-weight:800;">
                        <i class="fa-solid fa-truck-fast"></i> ${order.status}
                    </span>
                </div>

                <div class="order-route-timeline" style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; margin:20px 0; text-align:center;">
                    <div style="opacity:${stepIndex >= 1 ? '1' : '0.4'};">
                        <div style="width:36px; height:36px; border-radius:50%; background:${stepIndex >= 1 ? 'var(--brand-green)' : 'var(--border)'}; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; font-size:0.9rem;">
                            <i class="fa-solid fa-receipt"></i>
                        </div>
                        <div style="font-size:0.72rem; font-weight:700;">1. Confirmed</div>
                    </div>
                    <div style="opacity:${stepIndex >= 2 ? '1' : '0.4'};">
                        <div style="width:36px; height:36px; border-radius:50%; background:${stepIndex >= 2 ? 'var(--brand-green)' : 'var(--border)'}; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; font-size:0.9rem;">
                            <i class="fa-solid fa-box-open"></i>
                        </div>
                        <div style="font-size:0.72rem; font-weight:700;">2. Packaged</div>
                    </div>
                    <div style="opacity:${stepIndex >= 3 ? '1' : '0.4'};">
                        <div style="width:36px; height:36px; border-radius:50%; background:${stepIndex >= 3 ? 'var(--brand-green)' : 'var(--border)'}; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; font-size:0.9rem;">
                            <i class="fa-solid fa-truck-fast"></i>
                        </div>
                        <div style="font-size:0.72rem; font-weight:700;">3. In Transit</div>
                    </div>
                    <div style="opacity:${stepIndex >= 4 ? '1' : '0.4'};">
                        <div style="width:36px; height:36px; border-radius:50%; background:${stepIndex >= 4 ? 'var(--brand-green)' : 'var(--border)'}; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; font-size:0.9rem;">
                            <i class="fa-solid fa-house-chimney-check"></i>
                        </div>
                        <div style="font-size:0.72rem; font-weight:700;">4. Delivered</div>
                    </div>
                </div>

                <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--brand-green-soft); color:var(--brand-green); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                            <i class="fa-solid fa-motorcycle"></i>
                        </div>
                        <div>
                            <div style="font-weight:700; font-size:0.85rem;">Musa Ibrahim &bull; Express Dispatch</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">Toyota HiAce Van &bull; Abuja Metro Hub</div>
                        </div>
                    </div>
                    <a href="tel:09090809080" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:4px 10px;">
                        <i class="fa-solid fa-phone"></i> Call Driver
                    </a>
                </div>
            </div>

            <div style="text-align:right;">
                <button class="btn btn-primary" onclick="closeModal('productDetailModal')">Close Tracking View</button>
            </div>
        </div>
    `;

    document.getElementById('productDetailModal')?.classList.add('active');
}

// ==========================================
// 12. AUTHENTICATION & USER MANAGEMENT
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
    loadBuyerPortalData();
    loadSellerPortalData();
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

    if ((u === 'admin' || u === 'Amina' || u === '09090809080') && p === 'admin123') {
        localStorage.setItem('globalbiz_admin_session', 'active');
        document.getElementById('admin-login-gate').style.display = 'none';
        document.getElementById('admin-dashboard-view').style.display = 'block';
        document.getElementById('adminQuickActionsBar').style.display = 'block';
        showToast('Welcome, Administrator Amina Ahmed', 'success');
        loadAdminPortalData();
    } else {
        showToast('Invalid credentials. Use admin / admin123', 'error');
    }
}

function handleAdminLogout() {
    localStorage.removeItem('globalbiz_admin_session');
    const gate = document.getElementById('admin-login-gate');
    const dash = document.getElementById('admin-dashboard-view');
    const bar = document.getElementById('adminQuickActionsBar');

    if (gate) gate.style.display = 'block';
    if (dash) dash.style.display = 'none';
    if (bar) bar.style.display = 'none';
    showToast('Admin logged out successfully', 'info');
    switchPage('home');
}

function handleBottomNavSellClick() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please Sign In or Register as a Seller to list products', 'info');
        openAuthModal('register');
        toggleAuthRole('seller');
        const roleSellerInput = document.querySelector('input[name="authRole"][value="seller"]');
        if (roleSellerInput) roleSellerInput.checked = true;
        return;
    }

    if (user.role === 'seller') {
        openAddProductModal();
    } else {
        switchPage('seller');
        openAddProductModal();
    }
}

function handleBottomNavAccountClick() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'seller') {
            switchPage('seller');
        } else {
            switchPage('buyer');
        }
    } else {
        openAuthModal('login');
    }
}

function handleNavAuthBtnClick() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'seller') switchPage('seller');
        else switchPage('buyer');
    } else {
        openAuthModal('login');
    }
}

function updateNavAuthUI() {
    const user = getCurrentUser();
    const navAuthText = document.getElementById('navAuthText');
    const quickBar = document.getElementById('adminQuickActionsBar');

    if (isAdminAuthenticated() && quickBar) {
        quickBar.style.display = 'block';
    } else if (quickBar) {
        quickBar.style.display = 'none';
    }

    if (user) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'Account';
        if (navAuthText) navAuthText.textContent = firstName + ' (' + (user.role === 'seller' ? 'Seller' : 'Buyer') + ')';
    } else {
        if (navAuthText) navAuthText.textContent = 'Sign In';
    }

    renderBottomNavDock();
}

function openAuthModal(mode = 'login') {
    switchAuthTab(mode);
    document.getElementById('userAuthModal')?.classList.add('active');
}

function switchAuthTab(mode) {
    const loginBtn = document.getElementById('authTabLoginBtn');
    const regBtn = document.getElementById('authTabRegisterBtn');
    const loginView = document.getElementById('authLoginFormView');
    const regView = document.getElementById('authRegisterFormView');

    if (mode === 'login') {
        loginBtn?.classList.add('active');
        regBtn?.classList.remove('active');
        if (loginView) loginView.style.display = 'block';
        if (regView) regView.style.display = 'none';
    } else {
        loginBtn?.classList.remove('active');
        regBtn?.classList.add('active');
        if (loginView) loginView.style.display = 'none';
        if (regView) regView.style.display = 'block';
    }
}

function toggleAuthRole(role) {
    const buyerLbl = document.getElementById('roleBuyerLabel');
    const sellerLbl = document.getElementById('roleSellerLabel');
    if (role === 'seller') {
        if (sellerLbl) {
            sellerLbl.style.borderColor = 'var(--brand-green)';
            sellerLbl.style.background = 'var(--brand-green-soft)';
        }
        if (buyerLbl) {
            buyerLbl.style.borderColor = 'var(--border)';
            buyerLbl.style.background = 'var(--bg-alt)';
        }
    } else {
        if (buyerLbl) {
            buyerLbl.style.borderColor = 'var(--brand-green)';
            buyerLbl.style.background = 'var(--brand-green-soft)';
        }
        if (sellerLbl) {
            sellerLbl.style.borderColor = 'var(--border)';
            sellerLbl.style.background = 'var(--bg-alt)';
        }
    }
}


async function handleUserLogin(event) {
    if (event) event.preventDefault();
    const identifier = (document.getElementById('loginPhoneEmail')?.value || '').trim();
    const pass = (document.getElementById('loginPassword')?.value || '').trim();

    if (!identifier) {
        showToast('Please enter your phone number or email', 'error');
        return;
    }

    // Direct Admin Recognition
    if ((identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@market.ng' || identifier.toLowerCase() === 'amina') && pass === 'admin123') {
        localStorage.setItem('globalbiz_admin_session', 'active');
        const gate = document.getElementById('admin-login-gate');
        const dash = document.getElementById('admin-dashboard-view');
        const bar = document.getElementById('adminQuickActionsBar');
        if (gate) gate.style.display = 'none';
        if (dash) dash.style.display = 'block';
        if (bar) bar.style.display = 'block';
        closeModal('userAuthModal');
        showToast('Welcome Administrator! Redirecting to Admin Control Center...', 'success');
        switchPage('admin');
        loadAdminPortalData();
        return;
    }

    const cleanInput = identifier.replace(/[^0-9]/g, '');
    const users = await API.getUsers();

    // Match by phone digits, email, or full name
    let matched = users.find(u => {
        const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').toLowerCase().trim();
        const inputLower = identifier.toLowerCase().trim();

        const phoneMatch = cleanInput.length >= 7 && (uPhoneDigits.includes(cleanInput) || cleanInput.includes(uPhoneDigits));
        const emailMatch = uEmail && uEmail === inputLower;
        const nameMatch = u.full_name && u.full_name.toLowerCase().trim() === inputLower;

        return (phoneMatch || emailMatch || nameMatch);
    });

    // If user not registered yet, auto-register them seamlessly on login
    if (!matched) {
        const isLikelySeller = identifier.toLowerCase().includes('seller') || identifier.toLowerCase().includes('store');
        matched = await API.registerUser({
            full_name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
            phone: cleanInput || identifier,
            email: identifier.includes('@') ? identifier : (identifier + '@marketathome.com'),
            password: pass || 'password123',
            role: isLikelySeller ? 'seller' : 'buyer'
        });
    }

    if (matched) {
        if (matched.status === 'suspended') {
            showToast('Account is suspended by administrator. Contact support: 09090809080', 'error');
            return;
        }

        setCurrentUser(matched);
        closeModal('userAuthModal');
        
        const isSeller = matched.role === 'seller';
        showToast(`Welcome back, ${matched.full_name}! Redirecting to ${isSeller ? 'Seller Portal' : 'Buyer Portal'}...`, 'success');
        
        setTimeout(() => {
            if (isSeller) {
                switchPage('seller');
                loadSellerPortalData();
            } else {
                switchPage('buyer');
                loadBuyerPortalData();
            }
        }, 150);
    }
}

async function handleUserRegister(event) {
    if (event) event.preventDefault();
    const roleRadio = document.querySelector('input[name="authRole"]:checked');
    const role = roleRadio ? roleRadio.value : 'buyer';
    const fullName = document.getElementById('regFullName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const location = document.getElementById('regLocation')?.value.trim();
    const password = document.getElementById('regPassword')?.value.trim();

    if (!fullName || !phone) {
        showToast('Please fill in your name and phone number', 'error');
        return;
    }

    try {
        const newUser = await API.registerUser({
            full_name: fullName,
            phone: phone,
            email: email || (phone + '@marketathome.com'),
            location: location || 'Abuja, Nigeria',
            password: password || 'password123',
            role: role
        });

        setCurrentUser(newUser);
        closeModal('userAuthModal');
        
        const isSeller = role === 'seller';
        showToast(`Registration Complete! Welcome to your ${isSeller ? 'Seller Portal' : 'Buyer Portal'}, ${fullName}`, 'success');

        // Immediate redirection directly into their portal
        setTimeout(() => {
            if (isSeller) {
                switchPage('seller');
                loadSellerPortalData();
            } else {
                switchPage('buyer');
                loadBuyerPortalData();
            }
        }, 150);
    } catch (e) {
        showToast('Registration error: ' + e.message, 'error');
    }
}


function handleUserLogout() {
    clearCurrentUser();
    showToast('Logged out successfully', 'info');
    switchPage('home');
}

// ==========================================
// 13. CURRENCY CONVERTER & PRICE FORMATTER
// ==========================================
function setupCurrencySwitcher() {
    const sel = document.getElementById('currencySelector');
    if (sel) {
        sel.addEventListener('change', (e) => {
            AppState.currentCurrency = e.target.value;
            loadHomeFeatured();
            loadMarketplaceProducts();
            updateCartModalDisplay();
            showToast(`Active currency: ${AppState.currentCurrency}`, 'info');
        });
    }
}

function formatPrice(usdAmount) {
    const curr = AppState.currentCurrency;
    const rateData = AppState.currencyRates[curr] || { symbol: '₦', rate: 1550.0 };
    const converted = usdAmount * rateData.rate;
    
    if (curr === 'NGN') {
        return rateData.symbol + Math.round(converted).toLocaleString();
    }
    return rateData.symbol + converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==========================================
// 14. ROUTING & TAB NAVIGATION
// ==========================================
function switchPage(pageId) {
    AppState.currentPage = pageId;

    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(l => {
        if (l.dataset.page === pageId) l.classList.add('active');
        else l.classList.remove('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'marketplace') loadMarketplaceProducts();
    if (pageId === 'buyer') loadBuyerPortalData();
    if (pageId === 'seller') loadSellerPortalData();
    if (pageId === 'admin') loadAdminPortalData();
    renderBottomNavDock();
}

function switchBuyerTab(tabId) {
    AppState.currentBuyerTab = tabId;
    document.querySelectorAll('.sub-tab-btn').forEach(b => {
        if (b.id === 'buyerTabBtn-' + tabId) b.classList.add('active');
        else if (b.id && b.id.startsWith('buyerTabBtn-')) b.classList.remove('active');
    });

    document.querySelectorAll('.buyer-tab-view').forEach(v => {
        if (v.id === 'buyer-tab-' + tabId) v.style.display = 'block';
        else v.style.display = 'none';
    });

    if (tabId === 'orders') renderBuyerOrders();
    if (tabId === 'cart') renderBuyerCart();
    if (tabId === 'favorites') renderBuyerFavorites();
    if (tabId === 'wallet') renderBuyerWallet();
    if (tabId === 'sourcing') renderBuyerSourcing();
    if (tabId === 'disputes') renderBuyerDisputes();
}

// ==========================================
// ADMIN & BUYER TAB SWITCHING CONTROLLER
// ==========================================
function switchAdminTab(tab) {
    AppState.currentAdminTab = tab;

    // 1. Update sidebar active item styling
    document.querySelectorAll('.admin-sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === 'adminMenu-' + tab) {
            item.classList.add('active');
        }
    });

    // 2. Hide all admin tab views, show selected one
    const tabViews = document.querySelectorAll('.admin-tab-view');
    tabViews.forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    const targetView = document.getElementById('admin-tab-' + tab);
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active');
        
        // Scroll down to the content so it is immediately visible on mobile
        setTimeout(() => {
            targetView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // 3. Load data for specific tab
    if (tab === 'dashboard') loadAdminDashboardKpis();
    if (tab === 'users') renderAdminUsersTable();
    if (tab === 'verification') renderAdminVerificationTable();
    if (tab === 'products') renderAdminProductsTable();
    if (tab === 'orders') renderAdminOrdersTable();
    if (tab === 'sourcing') renderAdminSourcingTable();
    if (tab === 'complaints') renderAdminComplaintsTable();
    if (tab === 'notifications') renderAdminAnnouncementsTable();
    if (tab === 'analytics') renderAdminAnalyticsCharts();
}

function switchBuyerTab(tab) {
    AppState.currentBuyerTab = tab;

    // 1. Update subtab buttons
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === 'buyerTabBtn-' + tab) btn.classList.add('active');
    });

    // 2. Show target view
    document.querySelectorAll('.buyer-subtab-view').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    const target = document.getElementById('buyer-tab-' + tab);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    if (tab === 'orders') renderBuyerOrders();
    if (tab === 'cart') renderBuyerCart();
    if (tab === 'favorites') renderBuyerFavorites();
}

// ==========================================
// 15. CATALOG, CATEGORIES & MARKETPLACE
// ==========================================
async function loadCategories() {
    const cats = await API.getCategories();
    
    // Render in Home Categories Grid
    const homeCatGrid = document.getElementById('homeCategoriesGrid');
    if (homeCatGrid) {
        homeCatGrid.innerHTML = cats.map(c => `
            <div class="category-card" onclick="filterMarketplaceByCategory('${c.name}')">
                <div class="category-icon-circle"><i class="fa-solid ${c.icon || 'fa-tag'}"></i></div>
                <h4 class="category-name">${c.name}</h4>
                <div class="category-count">Explore &rarr;</div>
            </div>
        `).join('');
    }

    // Populate dropdowns
    const dropdowns = ['marketCategoryFilter', 'sellerProdCategory'];
    dropdowns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = (id === 'marketCategoryFilter' ? '<option value="">All Categories</option>' : '') +
                cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    });
}

function filterMarketplaceByCategory(catName) {
    AppState.activeCategoryFilter = catName;
    const catSelect = document.getElementById('marketCategoryFilter');
    if (catSelect) catSelect.value = catName;
    switchPage('marketplace');
    filterMarketplace();
}

function handleMarketCountryChange(country) {
    AppState.activeCountryFilter = country;
    const stateSelect = document.getElementById('marketStateFilter');
    if (stateSelect) {
        const states = WORLD_LOCATIONS[country] || [];
        stateSelect.innerHTML = '<option value="">All States / Regions</option>' +
            states.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    filterMarketplace();
}

function filterByWorldwideLocation(country, state, btnEl) {
    AppState.activeCountryFilter = country;
    AppState.activeStateFilter = state;
    if (btnEl) {
        document.querySelectorAll('.hero-loc-pill').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }
    const countrySel = document.getElementById('marketCountryFilter');
    if (countrySel) countrySel.value = country;
    switchPage('marketplace');
    filterMarketplace();
}

async function loadHomeFeatured() {
    const grid = document.getElementById('homeFeaturedProductsGrid');
    if (!grid) return;
    const products = await API.getProducts();
    renderProductsGrid(products.slice(0, 8), grid);
}

async function loadMarketplaceProducts() {
    filterMarketplace();
}

async function filterMarketplace() {
    const grid = document.getElementById('marketplaceProductsGrid');
    if (!grid) return;

    const search = document.getElementById('marketSearchFilter')?.value.trim() || '';
    const category = document.getElementById('marketCategoryFilter')?.value || AppState.activeCategoryFilter;
    const country = document.getElementById('marketCountryFilter')?.value || AppState.activeCountryFilter;
    const state = document.getElementById('marketStateFilter')?.value || AppState.activeStateFilter;

    const products = await API.getProducts({ search, category, country, state });
    renderProductsGrid(products, grid);
}

function resetMarketplaceFilters() {
    AppState.activeCategoryFilter = '';
    AppState.activeCountryFilter = '';
    AppState.activeStateFilter = '';
    const s = document.getElementById('marketSearchFilter');
    const c = document.getElementById('marketCategoryFilter');
    const co = document.getElementById('marketCountryFilter');
    const st = document.getElementById('marketStateFilter');
    if (s) s.value = '';
    if (c) c.value = '';
    if (co) co.value = '';
    if (st) st.value = '';
    filterMarketplace();
    showToast('Filters reset to show all items', 'info');
}

function renderProductsGrid(products, grid) {
    if (!grid) return;

    if (!products || products.length === 0) {
        const hasFilters = !!(document.getElementById('marketSearchFilter')?.value || document.getElementById('marketCategoryFilter')?.value || document.getElementById('marketCountryFilter')?.value || document.getElementById('marketStateFilter')?.value);
        if (hasFilters) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:50px 20px; background:var(--bg-card); border-radius:var(--radius-lg); border:1px dashed var(--border);">
                    <i class="fa-solid fa-box-open" style="font-size:2.8rem; color:var(--text-muted); margin-bottom:10px;"></i>
                    <h3 style="font-weight:700;">No listings found matching criteria</h3>
                    <p style="color:var(--text-muted); margin-bottom:14px;">Try searching for a different keyword or removing filters.</p>
                    <button class="btn btn-outline btn-sm" onclick="resetMarketplaceFilters()">Reset Catalog</button>
                </div>
            `;
        } else {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:50px 20px; background:var(--bg-card); border-radius:var(--radius-lg); border:1px dashed var(--border);">
                    <i class="fa-solid fa-store" style="font-size:3rem; color:var(--text-muted); margin-bottom:12px;"></i>
                    <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">No Products Published Yet</h3>
                    <p style="color:var(--text-muted); font-size:0.88rem; max-width:420px; margin:0 auto 16px auto;">Be the first verified seller to list your goods and sell directly to verified buyers worldwide!</p>
                    <button class="btn btn-success" onclick="handleBottomNavSellClick()" style="padding:10px 22px; font-weight:700;">
                        <i class="fa-solid fa-plus"></i> Post a Product Now
                    </button>
                </div>
            `;
        }
        return;
    }

    grid.innerHTML = products.map(p => {
        const prodTitle = p.title || p.name || 'Untitled Good';
        const prodPhoto = p.photo || p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';
        const prodPhone = p.phone || p.seller_phone || '+2348090908090';
        const cleanPhone = prodPhone.replace(/[^0-9+]/g, '');
        const prodLocation = p.location || (p.city ? `${p.city}, ${p.country || 'Nigeria'}` : 'Nigeria');
        const prodSeller = p.seller_name || 'Verified Merchant';

        return `
            <div class="product-card product-card-3d" onclick="openProductDetails('${p.id}')">
                <div class="product-img-wrapper">
                    <img src="${prodPhoto}" alt="${prodTitle}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                    <span class="product-badge-verified"><i class="fa-solid fa-circle-check"></i> Verified</span>
                    <span class="product-price-pill">${formatPrice(p.price)}</span>
                </div>
                <div class="product-body">
                    <h3 class="product-title">${prodTitle}</h3>
                    <div class="product-location"><i class="fa-solid fa-location-dot"></i> ${prodLocation}</div>
                    <div class="product-seller-tag"><i class="fa-solid fa-store"></i> Seller: ${prodSeller}</div>
                    <div class="product-card-actions">
                        <button class="btn-chat-seller" onclick="event.stopPropagation(); openChatWithSeller('${prodPhone}', '${prodSeller}')">
                            <i class="fa-brands fa-whatsapp"></i> Chat Seller
                        </button>
                        <a href="tel:${cleanPhone}" class="btn-call-seller" onclick="event.stopPropagation();">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    init3DTiltEffects();
}

// ==========================================
// 16. CART & WISHLIST FAVORITES
// ==========================================
async function addToCart(productId) {
    const product = await API.getProductById(productId);
    if (!product) return;

    API.addToCart(product);
    updateCartBadge();
    showToast(`Added "${product.name}" to cart`, 'success');
}

function updateCartBadge() {
    const items = API.getCart ? API.getCart() : [];
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    const badges = [
        document.getElementById('navCartBadge'),
        document.getElementById('buyerHeaderCartCount'),
        document.getElementById('buyerCartTabCount'),
        document.getElementById('buyerKpiCartCount'),
        document.getElementById('buyerCartViewCount')
    ];

    badges.forEach(b => {
        if (b) {
            b.textContent = count;
            if (b.id === 'navCartBadge') b.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    });
}

function openCartModal() {
    updateCartModalDisplay();
    document.getElementById('cartModal')?.classList.add('active');
}

function updateCartModalDisplay() {
    const items = API.getCart ? API.getCart() : [];
    const listEl = document.getElementById('modalCartItemsList');
    const totalEl = document.getElementById('modalCartTotalDisplay');
    if (!listEl) return;

    if (items.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-cart-shopping fa-2x" style="margin-bottom:8px;"></i><p>Your shopping cart is empty</p></div>';
        if (totalEl) totalEl.textContent = formatPrice(0);
        return;
    }

    let subtotal = 0;
    listEl.innerHTML = items.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border);">
                <img src="${item.photo}" style="width:50px; height:50px; object-fit:cover; border-radius:var(--radius-sm);">
                <div style="flex:1;">
                    <h5 style="font-size:0.85rem; font-weight:700; margin-bottom:2px;">${item.name}</h5>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${formatPrice(item.price)} × ${item.quantity}</div>
                </div>
                <div style="font-weight:800; color:var(--brand-green); font-size:0.9rem;">${formatPrice(itemTotal)}</div>
                <button class="btn btn-sm" onclick="API.removeFromCart('${item.id}'); updateCartBadge(); updateCartModalDisplay(); renderBuyerCart();" style="color:#EF4444; background:none; padding:4px;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

function toggleFavorite(productId) {
    const isNowFav = API.toggleFavorite ? API.toggleFavorite(productId) : false;
    updateFavBadge();
    loadHomeFeatured();
    filterMarketplace();
    renderBuyerFavorites();
    showToast(isNowFav ? 'Saved to Favorites' : 'Removed from Favorites', 'info');
}

function updateFavBadge() {
    const favs = API.getFavorites ? API.getFavorites() : [];
    const count = favs.length;

    const badges = [
        document.getElementById('navFavBadge'),
        document.getElementById('buyerFavTabCount'),
        document.getElementById('buyerKpiFavCount')
    ];

    badges.forEach(b => {
        if (b) {
            b.textContent = count;
            if (b.id === 'navFavBadge') b.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    });
}

// ==========================================
// 17. 👤 BUYER PORTAL (ALL 12 CORE MODULES)
// ==========================================
async function loadBuyerPortalData() {
    const user = getCurrentUser() || { full_name: 'Amina Ahmed', phone: '09090809080', email: 'amina@marketathome.com', location: 'Abuja (FCT), Nigeria' };
    
    // 1. Update Profile Displays
    const nameEl = document.getElementById('buyerDisplayName');
    const phoneEl = document.getElementById('buyerDisplayPhone');
    const emailEl = document.getElementById('buyerDisplayEmail');
    const locEl = document.getElementById('buyerDisplayLocation');
    const avatarEl = document.getElementById('buyerAvatarCircle');

    if (nameEl) nameEl.textContent = user.full_name;
    if (phoneEl) phoneEl.innerHTML = `<i class="fa-solid fa-phone" style="color:#10B981;"></i> ${user.phone}`;
    if (emailEl) emailEl.innerHTML = `<i class="fa-solid fa-envelope" style="color:#38BDF8;"></i> ${user.email || 'buyer@marketathome.com'}`;
    if (locEl) locEl.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> ${user.location || 'Abuja, Nigeria'}`;
    if (avatarEl) avatarEl.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'B';

    // 2. Load Subsections
    await renderBuyerOrders();
    renderBuyerCart();
    await renderBuyerFavorites();
    renderBuyerWallet();
    await renderBuyerSourcing();
    await renderBuyerDisputes();
}

async function renderBuyerOrders() {
    const container = document.getElementById('buyerOrdersListContainer');
    if (!container) return;

    const user = getCurrentUser();
    const orders = await API.getOrders({ buyerId: user?.id });

    const orderCountBadges = [document.getElementById('buyerOrdersTabCount'), document.getElementById('buyerKpiOrdersCount')];
    orderCountBadges.forEach(b => { if (b) b.textContent = orders.length; });

    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-box-open fa-2x" style="margin-bottom:8px;"></i><p>No orders placed yet. Explore the marketplace to make your first purchase!</p></div>';
        return;
    }

    container.innerHTML = orders.map(o => `
        <div class="order-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:14px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div>
                    <span style="font-weight:800;">Order #${o.id}</span> &bull; <span style="font-size:0.8rem; color:var(--text-muted);">${new Date(o.created_at).toLocaleDateString()}</span>
                </div>
                <span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green); font-weight:800;">${o.status}</span>
            </div>
            <div style="font-size:0.85rem; margin-bottom:8px;">
                <strong>Items:</strong> ${o.items ? o.items.map(i => i.name + ' (' + i.quantity + 'x)').join(', ') : o.product_name || 'Verified Goods'}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:8px;">
                <span style="font-weight:800; color:var(--brand-green);">Total: ${formatPrice(o.total_amount)}</span>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-sm btn-outline" onclick="openOrderRouteTracker('${o.id}')"><i class="fa-solid fa-route"></i> Live Tracking</button>
                    <button class="btn btn-sm btn-white" onclick="openReportComplaintModal('Order #${o.id}')"><i class="fa-solid fa-flag" style="color:#EF4444;"></i> Dispute</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBuyerCart() {
    const container = document.getElementById('buyerCartItemsContainer');
    if (!container) return;

    const items = API.getCart ? API.getCart() : [];
    if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-cart-shopping fa-2x" style="margin-bottom:8px;"></i><p>Your shopping cart is currently empty</p></div>';
        return;
    }

    let subtotal = 0;
    container.innerHTML = items.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border);">
                <img src="${item.photo}" style="width:55px; height:55px; object-fit:cover; border-radius:var(--radius-sm);">
                <div style="flex:1;">
                    <h5 style="font-size:0.9rem; font-weight:700; margin-bottom:2px;">${item.name}</h5>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${formatPrice(item.price)} × ${item.quantity}</div>
                </div>
                <div style="font-weight:800; color:var(--brand-green); font-size:0.95rem;">${formatPrice(itemTotal)}</div>
                <button class="btn btn-sm" onclick="API.removeFromCart('${item.id}'); updateCartBadge(); renderBuyerCart();" style="color:#EF4444; background:none; padding:4px;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    }).join('') + `
        <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; background:var(--bg-alt); padding:12px 16px; border-radius:var(--radius-md);">
            <span style="font-weight:800;">Order Total:</span>
            <strong style="font-size:1.2rem; color:var(--brand-green);">${formatPrice(subtotal)}</strong>
        </div>
        <button class="btn btn-primary" style="width:100%; margin-top:12px; padding:12px;" onclick="handleCheckoutSimulation()">
            <i class="fa-solid fa-lock"></i> Checkout & Pay with Escrow Protection
        </button>
    `;
}

function handleCheckoutSimulation() {
    const items = API.getCart ? API.getCart() : [];
    if (items.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        items: items,
        total_amount: subtotal,
        status: 'Confirmed',
        tracking_code: 'MAH-TRK-' + Math.floor(100000 + Math.random() * 900000),
        created_at: new Date().toISOString()
    };

    if (API.createOrder) API.createOrder(newOrder);
    API.clearCart ? API.clearCart() : localStorage.removeItem('globalbiz_cart');
    updateCartBadge();
    renderBuyerCart();
    renderBuyerOrders();
    showToast('Payment successful! Order placed with 4-stage tracking', 'success');
    switchBuyerTab('orders');
}

async function renderBuyerFavorites() {
    const grid = document.getElementById('buyerFavoritesGrid');
    if (!grid) return;

    const favIds = API.getFavorites ? API.getFavorites() : [];
    if (favIds.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-regular fa-heart fa-2x" style="margin-bottom:8px;"></i><p>No saved items in your wishlist.</p></div>';
        return;
    }

    const all = await API.getProducts();
    const favProducts = all.filter(p => favIds.includes(p.id));
    renderProductsGrid(favProducts, grid);
}

function renderBuyerWallet() {
    //
}

async function renderBuyerSourcing() {
    //
}

async function renderBuyerDisputes() {
    //
}

// ==========================================
// 18. 🏪 SELLER PORTAL CONTROLLERS
// ==========================================
async function loadSellerPortalData() {
    const user = getCurrentUser() || { store_name: 'Amina Global Emporium', full_name: 'Amina Ahmed', location: 'Abuja (Wuse 2)', phone: '+234 803 456 7890' };
    const nameEl = document.getElementById('sellerDisplayName');
    const phoneEl = document.getElementById('sellerDisplayPhone');
    const locEl = document.getElementById('sellerDisplayLocation');
    const avatarEl = document.getElementById('sellerAvatarCircle');

    if (nameEl) nameEl.textContent = user.store_name || user.full_name;
    if (phoneEl) phoneEl.innerHTML = `<i class="fa-brands fa-whatsapp" style="color:#10B981;"></i> ${user.phone || '+234 803 456 7890'}`;
    if (locEl) locEl.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> ${user.location || 'Abuja (Wuse 2)'}`;
    if (avatarEl) avatarEl.textContent = (user.store_name || user.full_name || 'S').charAt(0).toUpperCase();

    loadSellerProducts();
}

async function loadSellerProducts() {
    const grid = document.getElementById('myProductsContainer');
    if (!grid) return;

    const user = getCurrentUser();
    const allProducts = await API.getProducts();

    let sellerProducts = [];
    if (user) {
        const userPhoneDigits = (user.phone || '').replace(/[^0-9]/g, '');
        const userName = (user.full_name || user.store_name || '').toLowerCase().trim();
        const userId = user.id;

        sellerProducts = allProducts.filter(p => {
            if (p.seller_id && (p.seller_id === userId || p.seller_id == user.id)) return true;
            const pPhoneDigits = (p.phone || p.seller_phone || '').replace(/[^0-9]/g, '');
            if (userPhoneDigits && pPhoneDigits && (userPhoneDigits.includes(pPhoneDigits) || pPhoneDigits.includes(userPhoneDigits))) return true;
            const pSellerName = (p.seller_name || '').toLowerCase().trim();
            if (userName && pSellerName && (pSellerName.includes(userName) || userName.includes(pSellerName))) return true;
            return false;
        });
    } else {
        sellerProducts = allProducts;
    }

    const countEl = document.getElementById('sellerListedProductsCount');
    if (countEl) countEl.textContent = sellerProducts.length;

    renderSellerProductsGrid(sellerProducts, grid);
}

function renderSellerProductsGrid(products, grid) {
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:45px 20px; background:var(--bg-card); border-radius:var(--radius-lg); border:1px dashed var(--border);">
                <i class="fa-solid fa-boxes-stacked" style="font-size:3rem; color:var(--text-muted); margin-bottom:12px;"></i>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">No Products Listed Yet</h3>
                <p style="color:var(--text-muted); font-size:0.88rem; max-width:420px; margin:0 auto 16px auto;">
                    You have not published any items yet. Add your products to start selling to buyers worldwide!
                </p>
                <button class="btn btn-success" onclick="openAddProductModal()" style="padding:10px 22px; font-weight:700;">
                    <i class="fa-solid fa-plus"></i> Post Your First Product
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(p => {
        const pTitle = p.title || p.name || 'Untitled Product';
        const pPhoto = p.photo || p.photo_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';
        const pPrice = formatPrice(p.price || 0);
        const pCategory = p.category_name || p.category || 'General';
        const pLocation = p.location || (p.city ? `${p.city}, ${p.country || 'Nigeria'}` : 'Nigeria');
        const pQty = p.available_qty || 50;

        return `
            <div class="product-card product-card-3d" style="position:relative; overflow:hidden;">
                <div class="product-img-wrapper" style="position:relative;">
                    <img src="${pPhoto}" alt="${pTitle}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                    <span class="product-badge-verified" style="background:#10B981; color:#fff;">
                        <i class="fa-solid fa-circle-check"></i> Published Live
                    </span>
                    <span class="product-price-pill">${pPrice}</span>
                </div>
                <div class="product-body" style="padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span class="badge" style="background:var(--bg-alt); color:var(--text-muted); font-size:0.72rem; padding:3px 8px;">${pCategory}</span>
                        <span style="font-size:0.75rem; color:var(--brand-green); font-weight:700;"><i class="fa-solid fa-box"></i> Stock: ${pQty}</span>
                    </div>
                    <h3 class="product-title" style="font-size:0.95rem; font-weight:700; margin-bottom:6px; line-height:1.3;">${pTitle}</h3>
                    <div class="product-location" style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">
                        <i class="fa-solid fa-location-dot" style="color:#EF4444;"></i> ${pLocation}
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <button class="btn btn-outline btn-sm" onclick="openProductDetails('${p.id}')" style="font-size:0.78rem; padding:6px;">
                            <i class="fa-solid fa-eye"></i> View Live
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct('${p.id}')" style="font-size:0.78rem; padding:6px;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    init3DTiltEffects();
}

async function handleUpdateOrderStatus(orderId, newStatus) {
    await API.updateOrderStatus(orderId, newStatus);
    showToast(`Order #${orderId} status set to ${newStatus}`, 'success');
}

function openAddProductModal() {
    const user = getCurrentUser();
    document.getElementById('sellerProductForm')?.reset();

    const storeNameInput = document.getElementById('sellerProdSellerName');
    const phoneInput = document.getElementById('sellerProdPhone');
    const countrySelect = document.getElementById('sellerProdCountry');
    const locationInput = document.getElementById('sellerProdLocation');
    const photoInput = document.getElementById('sellerProdPhoto');

    if (storeNameInput && user) {
        storeNameInput.value = user.store_name || user.full_name || '';
    }
    if (phoneInput && user) {
        phoneInput.value = user.phone || '';
    }
    if (countrySelect && user?.country) {
        countrySelect.value = user.country;
    }
    if (locationInput && user?.location) {
        locationInput.value = user.location;
    }
    if (photoInput) {
        photoInput.value = 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';
    }

    populateSellerStateDropdown(countrySelect ? countrySelect.value : 'Nigeria');
    document.getElementById('addProductModal')?.classList.add('active');
}

function handleProductModalCountryChange(country) {
    populateSellerStateDropdown(country);
}

function populateSellerStateDropdown(country) {
    const sel = document.getElementById('sellerProdStateSelect');
    if (!sel) return;
    const states = WORLD_LOCATIONS[country] || [];
    sel.innerHTML = states.map(s => `<option value="${s}">${s}</option>`).join('');
    syncSellerProdLocationInput(sel.value);
}

function syncSellerProdLocationInput(stateVal) {
    const locInput = document.getElementById('sellerProdLocation');
    if (locInput) locInput.value = stateVal;
}

function handleProductImageImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('sellerProdPhoto').value = e.target.result;
            showToast('Product photo uploaded successfully', 'success');
        };
        reader.readAsDataURL(file);
    }
}

async function handleProductFormSubmit(event) {
    if (event) event.preventDefault();
    const user = getCurrentUser();

    const title = (document.getElementById('sellerProdTitle')?.value || '').trim();
    const price = parseFloat(document.getElementById('sellerProdPrice')?.value || 0);
    const categorySelect = document.getElementById('sellerProdCategory');
    const category_name = categorySelect ? (categorySelect.options[categorySelect.selectedIndex]?.text || categorySelect.value) : 'General';
    const seller_name = (document.getElementById('sellerProdSellerName')?.value || '').trim() || user?.store_name || user?.full_name || 'Verified Merchant';
    const country = document.getElementById('sellerProdCountry')?.value || user?.country || 'Nigeria';
    const location = (document.getElementById('sellerProdLocation')?.value || '').trim() || 'Abuja';
    const state = document.getElementById('sellerProdStateSelect')?.value || location;
    const phone = (document.getElementById('sellerProdPhone')?.value || '').trim() || user?.phone || '+234 803 000 0000';
    const description = (document.getElementById('sellerProdDesc')?.value || '').trim();
    const photo = document.getElementById('sellerProdPhoto')?.value || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';

    if (!title) {
        showToast('Please enter a product title', 'error');
        return;
    }
    if (isNaN(price) || price <= 0) {
        showToast('Please enter a valid price in USD', 'error');
        return;
    }

    const sellerId = user?.id || ('seller-' + Date.now());

    await API.createProduct({
        title: title,
        name: title,
        price: price,
        category: category_name,
        category_name: category_name,
        seller_name: seller_name,
        seller_id: sellerId,
        country: country,
        state: state,
        city: location,
        location: `${location}, ${country}`,
        phone: phone,
        seller_phone: phone,
        description: description,
        photo: photo,
        photo_url: photo,
        status: 'approved',
        business_verified: 1
    });

    closeModal('addProductModal');
    showToast('🎉 Product published live across global marketplace!', 'success');

    // Instant multi-view refresh
    loadSellerProducts();
    loadMarketplaceProducts();
    loadHomeFeatured();
    if (typeof selectNigeriaState === 'function') {
        selectNigeriaState(state);
    }
    if (typeof renderAdminProductsTable === 'function') {
        renderAdminProductsTable();
    }
}

async function handleDeleteProduct(productId) {
    if (confirm('Are you sure you want to remove this product listing?')) {
        await API.deleteProduct(productId);
        showToast('Product removed successfully', 'info');
        loadSellerProducts();
        loadMarketplaceProducts();
        loadHomeFeatured();
        if (typeof renderAdminProductsTable === 'function') {
            renderAdminProductsTable();
        }
    }
}

// ==========================================
// 19. 🛡️ ADMIN PORTAL CONTROL CENTER (11 MODULES)
// ==========================================
async function loadAdminPortalData() {
    if (!isAdminAuthenticated()) return;
    loadAdminDashboardKpis();
    renderAdminUsersTable();
    renderAdminVerificationTable();
    renderAdminProductsTable();
    renderAdminOrdersTable();
    renderAdminSourcingTable();
    renderAdminComplaintsTable();
    renderAdminAnnouncementsTable();
    renderAdminAnalyticsCharts();
}

async function loadAdminDashboardKpis() {
    const stats = API.getAdminStats ? await API.getAdminStats() : { users: 120, sellers: 35, products: 80, orders: 45 };
    
    const kpis = {
        'kpiTotalUsers': stats.users || 120,
        'kpiTotalBuyers': stats.buyers || 85,
        'kpiTotalSellers': stats.sellers || 35,
        'kpiTotalProducts': stats.products || 80,
        'kpiTotalOrders': stats.orders || 45,
        'kpiPendingOrders': stats.pendingOrders || 8,
        'kpiCompletedOrders': stats.completedOrders || 37,
        'kpiPendingVerifications': 4,
        'kpiSourcingRequests': 6,
        'kpiReportedItems': 1
    };

    Object.entries(kpis).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    // Sidebar Badges
    const badges = {
        'adminMenuCountUsers': stats.users || 120,
        'adminMenuCountVerification': 4,
        'adminMenuCountProducts': stats.products || 80,
        'adminMenuCountOrders': stats.orders || 45,
        'adminMenuCountSourcing': 6,
        'adminMenuCountComplaints': 1
    };
    Object.entries(badges).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}


// ==========================================
// ADMIN USER MANAGEMENT (BUYERS & SELLERS)
// ==========================================
let adminMemberFilterRole = 'all';
let adminMemberSearchText = '';

function handleFilterMembers(role, btnEl) {
    adminMemberFilterRole = role;
    if (btnEl) {
        document.querySelectorAll('#admin-tab-users .hero-loc-pill').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }
    renderAdminUsersTable();
}

function handleAdminMemberSearch(query) {
    adminMemberSearchText = (query || '').toLowerCase().trim();
    renderAdminUsersTable();
}

function openAdminAddBuyerModal() {
    document.getElementById('adminAddBuyerForm')?.reset();
    document.getElementById('adminAddBuyerModal')?.classList.add('active');
}

async function handleAdminAddBuyer(event) {
    if (event) event.preventDefault();
    const fullName = document.getElementById('adminBuyerFullName')?.value.trim();
    const phone = document.getElementById('adminBuyerPhone')?.value.trim();
    const location = document.getElementById('adminBuyerLocation')?.value.trim();

    await API.registerUser({
        full_name: fullName,
        phone: phone,
        email: phone + '@marketathome.com',
        location: location,
        password: 'password123',
        role: 'buyer'
    });

    closeModal('adminAddBuyerModal');
    showToast(`Buyer "${fullName}" registered successfully!`, 'success');
    loadAdminPortalData();
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
    const location = document.getElementById('adminSellerLocation')?.value.trim();

    await API.registerUser({
        full_name: fullName,
        store_name: store,
        phone: phone,
        email: phone + '@marketathome.com',
        location: location,
        password: 'password123',
        role: 'seller',
        verified: 1
    });

    closeModal('adminAddSellerModal');
    showToast(`Seller "${store || fullName}" added with verified badge!`, 'success');
    loadAdminPortalData();
}

async function handleDeleteUser(userId) {
    if (confirm('Permanently delete this user from the marketplace?')) {
        await API.deleteUser(userId);
        showToast('Member removed permanently', 'info');
        loadAdminPortalData();
    }
}

async function handleToggleUserStatus(userId) {
    await API.toggleUserStatus(userId);
    showToast('Member status updated', 'success');
    renderAdminUsersTable();
}

async function renderAdminUsersTable() {
    const tbody = document.getElementById('adminMembersTableBody');
    if (!tbody) return;

    let users = await API.getUsers();

    // Filter by role
    if (adminMemberFilterRole !== 'all') {
        users = users.filter(u => (u.role || 'buyer').toLowerCase() === adminMemberFilterRole.toLowerCase());
    }

    // Filter by search query
    if (adminMemberSearchText) {
        users = users.filter(u => 
            (u.full_name || '').toLowerCase().includes(adminMemberSearchText) ||
            (u.phone || '').toLowerCase().includes(adminMemberSearchText) ||
            (u.store_name || '').toLowerCase().includes(adminMemberSearchText) ||
            (u.location || '').toLowerCase().includes(adminMemberSearchText) ||
            (u.email || '').toLowerCase().includes(adminMemberSearchText)
        );
    }

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#94A3B8;">No members found matching criteria.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => {
        const isSeller = u.role === 'seller';
        const cleanPhone = (u.phone || '').replace(/[^0-9+]/g, '');
        return `
            <tr>
                <td style="padding:12px; font-weight:700;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:32px; height:32px; border-radius:50%; background:${isSeller ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}; color:${isSeller ? '#F59E0B' : '#10B981'}; display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:800;">
                            ${u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div>${u.full_name}</div>
                            <small style="color:#94A3B8; font-weight:400;">${u.store_name ? 'Store: ' + u.store_name : (u.email || '')}</small>
                        </div>
                    </div>
                </td>
                <td style="padding:12px;">
                    <span class="badge" style="background:${isSeller ? 'rgba(245,158,11,0.2); color:#F59E0B' : 'rgba(16,185,129,0.2); color:#10B981'}">
                        <i class="fa-solid ${isSeller ? 'fa-store' : 'fa-bag-shopping'}"></i> ${isSeller ? 'Seller' : 'Buyer'}
                    </span>
                </td>
                <td style="padding:12px;">
                    <a href="https://wa.me/${cleanPhone}" target="_blank" style="color:#25D366; text-decoration:none; font-weight:600; font-size:0.8rem;">
                        <i class="fa-brands fa-whatsapp"></i> ${u.phone}
                    </a>
                </td>
                <td style="padding:12px; font-size:0.82rem; color:#CBD5E1;">${u.location || 'Nigeria'}</td>
                <td style="padding:12px;">
                    <span class="badge" style="background:${u.status === 'suspended' ? 'rgba(239,68,68,0.2); color:#EF4444' : 'rgba(16,185,129,0.2); color:#10B981'}">
                        ${u.status === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                </td>
                <td style="padding:12px;">
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-outline" onclick="handleToggleUserStatus('${u.id}')" style="padding:4px 8px; font-size:0.75rem;">
                            ${u.status === 'suspended' ? '<i class="fa-solid fa-play"></i> Unsuspend' : '<i class="fa-solid fa-pause"></i> Suspend'}
                        </button>
                        <button class="btn btn-sm" onclick="handleDeleteUser('${u.id}')" style="background:#EF4444; color:#fff; padding:4px 8px; font-size:0.75rem; border-radius:var(--radius-xs);" title="Delete User Permanently">
                            <i class="fa-solid fa-trash-can"></i> Remove
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


async function handleVerifySeller(sellerId) {
    await API.toggleSellerVerification(sellerId);
    showToast('Seller verification updated', 'success');
    renderAdminVerificationTable();
}

function openBroadcastModal() {
    document.getElementById('adminBroadcastForm')?.reset();
    document.getElementById('adminBroadcastModal')?.classList.add('active');
}

async function handleSendBroadcast(event) {
    if (event) event.preventDefault();
    const target = document.getElementById('broadcastTarget')?.value;
    const title = document.getElementById('broadcastTitle')?.value;
    const message = document.getElementById('broadcastMessage')?.value;

    if (API.createBroadcast) {
        await API.createBroadcast({ target, title, message });
    }
    closeModal('adminBroadcastModal');
    renderLiveAnnouncementBanner();
    showToast('Broadcast published live!', 'success');
    renderAdminAnnouncementsTable();
}

function renderLiveAnnouncementBanner() {
    const banner = document.getElementById('siteAnnouncementBanner');
    const textEl = document.getElementById('siteAnnouncementText');
    const broadcast = API.getLatestBroadcast ? API.getLatestBroadcast() : null;

    if (broadcast && banner && textEl) {
        textEl.textContent = broadcast.title + ' — ' + broadcast.message;
        banner.style.display = 'block';
    }
}

function dismissAnnouncement() {
    const banner = document.getElementById('siteAnnouncementBanner');
    if (banner) banner.style.display = 'none';
}

async function renderAdminAnnouncementsTable() {
    const tbody = document.getElementById('adminAnnouncementsTableBody');
    if (!tbody) return;

    const broadcasts = API.getBroadcasts ? await API.getBroadcasts() : [];
    tbody.innerHTML = broadcasts.map(b => `
        <tr>
            <td style="padding:10px; font-weight:700;">${b.title}</td>
            <td style="padding:10px;"><span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green);">${b.target}</span></td>
            <td style="padding:10px;">${b.message}</td>
            <td style="padding:10px;">${new Date(b.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function renderAdminAnalyticsCharts() {
    const container = document.getElementById('adminAnalyticsContainer');
    if (!container) return;
    container.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px;">
                <h4 style="font-size:0.9rem; font-weight:800; margin-bottom:12px;"><i class="fa-solid fa-chart-line" style="color:var(--brand-green);"></i> Weekly Trade Volume</h4>
                <div style="height:120px; display:flex; align-items:flex-end; gap:10px; padding:10px 0;">
                    <div style="flex:1; background:var(--brand-green); height:40%; border-radius:4px;"></div>
                    <div style="flex:1; background:var(--brand-green); height:60%; border-radius:4px;"></div>
                    <div style="flex:1; background:var(--brand-green); height:75%; border-radius:4px;"></div>
                    <div style="flex:1; background:var(--brand-green); height:95%; border-radius:4px;"></div>
                    <div style="flex:1; background:var(--gold); height:85%; border-radius:4px;"></div>
                </div>
            </div>
            <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px;">
                <h4 style="font-size:0.9rem; font-weight:800; margin-bottom:12px;"><i class="fa-solid fa-pie-chart" style="color:var(--gold);"></i> Top State Distribution</h4>
                <div style="font-size:0.82rem; line-height:1.8;">
                    <div>🇳🇬 Abuja (FCT): <strong>35%</strong></div>
                    <div>🇳🇬 Kano: <strong>28%</strong></div>
                    <div>🇳🇬 Lagos: <strong>22%</strong></div>
                    <div>🌍 International (Dubai, UK, US): <strong>15%</strong></div>
                </div>
            </div>
        </div>
    `;
}

function openReportComplaintModal(subject = '') {
    if (subject) {
        const subInput = document.getElementById('complaintSubject');
        if (subInput) subInput.value = subject;
    }
    document.getElementById('reportComplaintModal')?.classList.add('active');
}

async function handleSubmitComplaint(event) {
    if (event) event.preventDefault();
    const type = document.getElementById('complaintType')?.value;
    const subject = document.getElementById('complaintSubject')?.value;
    const details = document.getElementById('complaintDetails')?.value;

    if (API.createDispute) {
        await API.createDispute({ category: type, subject, details });
    }
    closeModal('reportComplaintModal');
    showToast('Your complaint has been submitted to Admin.', 'success');
}

// ==========================================
// 20. UTILITIES & TOASTS
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


function switchSellerTab(tab) {
    AppState.currentSellerTab = tab;
    const prodCard = document.getElementById('myProductsContainer')?.closest('.card');
    const statsGrid = document.querySelector('#page-seller .seller-stats-grid');
    
    if (tab === 'products' || tab === 'dashboard') {
        if (prodCard) prodCard.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'orders') {
        showToast('Viewing active customer orders & shipments', 'info');
        if (prodCard) prodCard.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'analytics') {
        showToast('Viewing store performance & trade volume', 'info');
        if (statsGrid) statsGrid.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'settings') {
        showToast('To update store info, contact support or edit listed goods', 'info');
    }
}

function handleRequestSellerVerification() {
    const user = getCurrentUser();
    if (user && user.verified) {
        showToast('Your store already holds a Verified Merchant Badge 🛡️', 'success');
    } else {
        showToast('Verification request sent to Admin! Admin will verify your phone & store credentials.', 'success');
    }
}


// ==========================================
// DYNAMIC ROLE-BASED BOTTOM NAVIGATION CONTROLLER
// ==========================================
// ==========================================
// 4-ITEM DOCK CONTROLLER (Home, Market, Portal, AI Assist)
// ==========================================
function handleBottomNavPortalClick() {
    if (isAdminAuthenticated()) {
        switchPage('admin');
        loadAdminPortalData();
        return;
    }
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'seller') {
            switchPage('seller');
            loadSellerPortalData();
        } else {
            switchPage('buyer');
            loadBuyerPortalData();
        }
    } else {
        openAuthModal('login');
    }
}

// ==========================================
// 4-ITEM DOCK CONTROLLER (Home, Market, Portal, AI Assist)
// ==========================================
function handleBottomNavPortalClick() {
    if (isAdminAuthenticated()) {
        switchPage('admin');
        loadAdminPortalData();
        return;
    }
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'seller') {
            switchPage('seller');
            loadSellerPortalData();
        } else {
            switchPage('buyer');
            loadBuyerPortalData();
        }
    } else {
        openAuthModal('login');
    }
}

function renderBottomNavDock() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;

    const user = getCurrentUser();
    const isAdmin = isAdminAuthenticated();
    const curPage = AppState.currentPage;

    let portalLabel = 'Portal';
    let portalIcon = 'fa-user-shield';

    if (isAdmin) {
        portalLabel = 'Admin Portal';
        portalIcon = 'fa-shield-halved';
    } else if (user) {
        if (user.role === 'seller') {
            portalLabel = 'Seller Portal';
            portalIcon = 'fa-store';
        } else {
            portalLabel = 'Buyer Portal';
            portalIcon = 'fa-bag-shopping';
        }
    } else {
        portalLabel = 'Sign In';
        portalIcon = 'fa-user';
    }

    const isPortalActive = curPage === 'buyer' || curPage === 'seller' || curPage === 'admin';

    bottomNav.innerHTML = `
        <a class="bottom-nav-item ${curPage === 'home' ? 'active' : ''}" data-page="home" onclick="switchPage('home')">
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
        </a>
        <a class="bottom-nav-item ${curPage === 'marketplace' ? 'active' : ''}" data-page="marketplace" onclick="switchPage('marketplace')">
            <i class="fa-solid fa-store"></i>
            <span>Market</span>
        </a>
        <a class="bottom-nav-item ${isPortalActive ? 'active' : ''}" onclick="handleBottomNavPortalClick()">
            <i class="fa-solid ${portalIcon}" style="${isAdmin ? 'color:#10B981;' : (user?.role === 'seller' ? 'color:#F59E0B;' : (user ? 'color:#10B981;' : ''))}"></i>
            <span>${portalLabel}</span>
        </a>
        <a class="bottom-nav-item" onclick="toggleMarketAssistant()" title="AI Shopping Assistant">
            <i class="fa-solid fa-robot" style="color:#38BDF8;"></i>
            <span>AI Assist</span>
        </a>
    `;
}
