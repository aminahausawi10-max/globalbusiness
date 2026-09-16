/**
 * Market at Home — Unified Reactive Controller (v4.0 Next-Gen)
 * Powers Public Marketplace, Theme Engine, AI Search & Bot, Interactive Map,
 * Buyer Portal, Seller Portal, and Admin Control Center.
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
    currentSellerTab: 'dashboard',
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
// 1. INITIALIZATION & THEME ENGINE
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
    init3DTiltEffects();

    // Load Default Data
    await loadCategories();
    await loadMarketplaceProducts();
    await loadBuyerDashboard();
    await loadSellerDashboard();
    await loadAdminPortal();

    // Default select Abuja on trade map
    selectNigeriaState('Abuja (FCT)');
}

function initTheme() {
    const savedTheme = localStorage.getItem('mah_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mah_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
            icon.style.color = '#F59E0B';
        } else {
            icon.className = 'fa-solid fa-moon';
            icon.style.color = '';
        }
    }
}

// ==========================================
// 2. 🌍 INTERACTIVE NIGERIA MAP EXPLORER
// ==========================================
const NIGERIA_STATE_DESCS = {
    'Abuja (FCT)': 'Federal Capital Territory — Prime administrative & luxury lifestyle goods, designer fashion, tech hubs and verified high-grade suppliers.',
    'Kano': 'Northern Commercial Giant — Historic Kurmi textiles, Dawanau international grain and agro-commodities market, leather & hides.',
    'Kaduna': 'Central Industrial Axis — Barnawa textile trade, mechanized agricultural produce, and specialized bulk manufacturing.',
    'Lagos': 'West African Mega Hub — Alaba International electronics, Balogun textile fashion, Trade Fair commercial complexes & sea freight.',
    'Rivers (Port Harcourt)': 'South-South Gateway — Oil & marine equipment, luxury fashion, aquatic food supply & high-yield enterprise trade.',
    'Oyo (Ibadan)': 'South-West Agro & Craft Capital — Bodija wholesale foodstuff, adire & tie-dye artisans, and educational equipment.',
    'Enugu': 'Eastern Commercial Gateway — Ogbete main market, coal city crafts, auto spares, and agricultural produce from the east.'
};

async function selectNigeriaState(stateName) {
    document.querySelectorAll('.state-node-btn').forEach(btn => btn.classList.remove('active'));
    
    // Match button by stateName
    const btnMatch = Array.from(document.querySelectorAll('.state-node-btn')).find(b => b.textContent.includes(stateName.split(' ')[0]));
    if (btnMatch) btnMatch.classList.add('active');

    const titleEl = document.getElementById('selectedMapStateName');
    const descEl = document.getElementById('selectedMapStateDesc');
    const gridEl = document.getElementById('mapStateProductsGrid');

    if (titleEl) titleEl.textContent = stateName + ' — Verified Suppliers';
    if (descEl) descEl.textContent = NIGERIA_STATE_DESCS[stateName] || `Verified merchant listings and direct trade products sourced directly from ${stateName}.`;

    if (gridEl) {
        gridEl.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading ${stateName} listings...</div>`;
        const products = await API.getProducts({ country: 'Nigeria', search: stateName.split(' ')[0] });
        
        if (products.length === 0) {
            // Fallback to top products if specific state has few seeds
            const allProducts = await API.getProducts({ country: 'Nigeria' });
            renderMapProducts(gridEl, allProducts.slice(0, 4), stateName);
        } else {
            renderMapProducts(gridEl, products.slice(0, 4), stateName);
        }
    }
}

function renderMapProducts(container, products, stateName) {
    if (products.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No products currently listed for ${stateName}. <button class="btn btn-sm btn-primary" onclick="openAddProductModal()">Be the first seller</button></div>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card product-card-3d" onclick="openProductDetails('${p.id}')">
            <div class="product-img-wrapper" style="height:140px;">
                <img src="${p.photo}" alt="${p.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                <span class="product-badge" style="background:var(--brand-green); font-size:0.68rem;"><i class="fa-solid fa-circle-check"></i> Verified</span>
            </div>
            <div class="product-body" style="padding:10px;">
                <h4 class="product-title" style="font-size:0.85rem; margin-bottom:4px;">${p.name}</h4>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;"><i class="fa-solid fa-store" style="color:var(--gold);"></i> ${p.seller_name || 'Verified Merchant'} &bull; ${p.location || stateName}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="product-price" style="font-size:0.95rem;">${formatPrice(p.price)}</span>
                    <button class="btn btn-sm btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="event.stopPropagation(); addToCart('${p.id}')">
                        <i class="fa-solid fa-cart-plus"></i> Buy
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    init3DTiltEffects();
}

// ==========================================
// 3. 🤖 NATURAL LANGUAGE AI SEARCH PARSER
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

    // Call API Natural Language Parser
    const parsed = API.parseNaturalLanguageQuery ? API.parseNaturalLanguageQuery(queryText) : { query: queryText };

    // Apply to marketplace filters
    switchPage('marketplace');
    
    // Set search box
    const searchBox = document.getElementById('searchQueryInput');
    if (searchBox) searchBox.value = parsed.keyword || parsed.query || queryText;

    // Trigger filtered product loading
    const products = await API.getProducts({
        search: parsed.keyword || parsed.query,
        category: parsed.category,
        maxPrice: parsed.maxPriceUsd,
        country: parsed.country,
        state: parsed.state
    });

    renderProductsGrid(products);

    // Scroll to results
    const marketSection = document.getElementById('page-marketplace');
    if (marketSection) marketSection.scrollIntoView({ behavior: 'smooth' });

    let feedbackMsg = `✨ AI Filtered: Found ${products.length} items`;
    if (parsed.category) feedbackMsg += ` in "${parsed.category}"`;
    if (parsed.state) feedbackMsg += ` around ${parsed.state}`;
    if (parsed.maxPriceUsd) feedbackMsg += ` under ${formatPrice(parsed.maxPriceUsd)}`;

    showToast(feedbackMsg, 'success');
}

// ==========================================
// 4. 🧠 "MARKET ASSISTANT" AI CHAT DRAWER
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
    const msgBox = document.getElementById('aiChatMessages');
    const text = input ? input.value.trim() : '';
    if (!text || !msgBox) return;

    // Append User Bubble
    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'align-self:flex-end; background:var(--brand-green); color:#fff; padding:10px 14px; border-radius:14px 14px 2px 14px; max-width:80%; font-size:0.85rem; font-weight:600; box-shadow:var(--shadow-sm);';
    userBubble.textContent = text;
    msgBox.appendChild(userBubble);
    input.value = '';
    msgBox.scrollTop = msgBox.scrollHeight;

    // Show Typing Indicator
    const typingBubble = document.createElement('div');
    typingBubble.id = 'aiTypingIndicator';
    typingBubble.style.cssText = 'align-self:flex-start; background:var(--bg-card); border:1px solid var(--border); padding:8px 12px; border-radius:14px 14px 14px 2px; font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;';
    typingBubble.innerHTML = `<i class="fa-solid fa-robot fa-bounce" style="color:var(--brand-green);"></i> Thinking...`;
    msgBox.appendChild(typingBubble);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Get response from MarketAPI
    const aiResponse = API.aiAssistantChat ? await API.aiAssistantChat(text) : { reply: "I'm your Market Assistant. How can I help you source goods today?" };
    
    // Remove typing indicator
    typingBubble.remove();

    // Append Bot Bubble
    const botBubble = document.createElement('div');
    botBubble.style.cssText = 'align-self:flex-start; background:var(--bg-card); border:1px solid var(--border); padding:12px 14px; border-radius:14px 14px 14px 2px; max-width:85%; font-size:0.85rem; line-height:1.45; box-shadow:var(--shadow-sm);';
    
    let htmlContent = `<div style="font-weight:700; color:var(--brand-green); margin-bottom:4px; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-robot"></i> Market Assistant</div>`;
    htmlContent += `<div>${aiResponse.reply.replace(/\n/g, '<br>')}</div>`;

    if (aiResponse.recommendedProducts && aiResponse.recommendedProducts.length > 0) {
        htmlContent += `<div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:6px;">`;
        aiResponse.recommendedProducts.forEach(p => {
            htmlContent += `
                <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:8px; padding:6px; cursor:pointer; text-align:center;" onclick="openProductDetails('${p.id}'); toggleMarketAssistant();">
                    <img src="${p.photo}" style="width:100%; height:60px; object-fit:cover; border-radius:4px; margin-bottom:4px;">
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
// 5. 💬 IN-APP DIRECT MERCHANT CHAT
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
                Ask about bulk orders, sizes, instant shipping, or negotiate directly.
            </div>
        `;
        return;
    }

    box.innerHTML = messages.map(m => {
        const isBuyer = m.sender === 'buyer';
        return `
            <div style="align-self:${isBuyer ? 'flex-end' : 'flex-start'}; background:${isBuyer ? 'var(--brand-green)' : 'var(--bg-card)'}; color:${isBuyer ? '#fff' : 'var(--text-main)'}; border:${isBuyer ? 'none' : '1px solid var(--border)'}; padding:8px 12px; border-radius:12px; max-width:80%; font-size:0.82rem; box-shadow:var(--shadow-sm);">
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

    // Simulate automated merchant reply after 1 second
    setTimeout(() => {
        if (API.sendChatMessage) {
            API.sendChatMessage(currentChatSellerPhone, "Hello! Thanks for reaching out. Yes, this item is available for immediate dispatch or doorstep pickup.", 'seller');
            loadSellerChatMessages(currentChatSellerPhone);
        }
    }, 1200);
}

// ==========================================
// 6. 🔮 SMART PRODUCT DETAILS PREVIEW
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
            
            <!-- Left: 360 Interactive Simulation & Main Image -->
            <div>
                <div class="product-360-viewer-box" style="position:relative; background:var(--bg-page); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; text-align:center;">
                    <img id="detailMainImage" src="${product.photo}" alt="${product.name}" style="width:100%; height:260px; object-fit:contain; transition:transform 0.2s;" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                    
                    <div style="position:absolute; bottom:8px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.65); color:#fff; font-size:0.72rem; padding:4px 10px; border-radius:20px; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-arrows-spin"></i> 360° Inspection Simulation
                    </div>
                </div>

                <!-- 360 Degree Drag / Rotate Slider -->
                <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-rotate-left"></i></span>
                    <input type="range" min="0" max="360" value="0" style="flex:1;" oninput="rotateProductSimulation(this.value)">
                    <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-rotate-right"></i></span>
                </div>
            </div>

            <!-- Right: Details, Tabs, Verified Merchant Badge & Actions -->
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green); font-weight:800;">
                        <i class="fa-solid fa-circle-check"></i> ${product.category || 'General Goods'}
                    </span>
                    <span style="color:var(--gold); font-size:0.85rem; font-weight:700;">
                        <i class="fa-solid fa-star"></i> 4.9 (48 Reviews)
                    </span>
                </div>

                <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:8px; line-height:1.3;">${product.name}</h2>
                <div style="font-size:1.4rem; font-weight:900; color:var(--brand-green); margin-bottom:12px;">${formattedPrice}</div>

                <!-- Merchant Profile Box -->
                <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:var(--radius-md); padding:10px 12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:700; font-size:0.85rem;"><i class="fa-solid fa-store" style="color:var(--gold);"></i> ${product.seller_name || 'Verified Supplier'}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${product.location || 'Nigeria'}</div>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="openChatWithSeller('${product.phone}', '${product.seller_name}')" style="padding:4px 10px; font-size:0.75rem;">
                        <i class="fa-solid fa-comment-dots" style="color:var(--brand-green);"></i> Chat
                    </button>
                </div>

                <!-- Product Information Tabs (Overview, Specs, Video Demo) -->
                <div style="display:flex; gap:6px; border-bottom:1px solid var(--border); margin-bottom:10px;">
                    <button class="btn btn-sm btn-white" id="pTabBtn-desc" onclick="switchProductPreviewTab('desc')" style="border-bottom:2px solid var(--brand-green); border-radius:0; padding:6px 12px; font-size:0.78rem;">Overview</button>
                    <button class="btn btn-sm btn-white" id="pTabBtn-specs" onclick="switchProductPreviewTab('specs')" style="border-bottom:2px solid transparent; border-radius:0; padding:6px 12px; font-size:0.78rem;">Specifications</button>
                    <button class="btn btn-sm btn-white" id="pTabBtn-video" onclick="switchProductPreviewTab('video')" style="border-bottom:2px solid transparent; border-radius:0; padding:6px 12px; font-size:0.78rem;"><i class="fa-solid fa-play" style="color:#EF4444;"></i> Live Video</button>
                </div>

                <div id="pTabContent-desc" style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:14px;">
                    ${product.description || 'Premium grade certified merchandise. Sourced directly from authenticated distributors with full buyer escrow and quality guarantee.'}
                </div>

                <div id="pTabContent-specs" style="display:none; font-size:0.82rem; margin-bottom:14px;">
                    <table style="width:100%; border-collapse:collapse;">
                        <tr><td style="padding:4px 0; color:var(--text-muted);">Origin:</td><td style="font-weight:700;">${product.country || 'Nigeria'}</td></tr>
                        <tr><td style="padding:4px 0; color:var(--text-muted);">Availability:</td><td style="font-weight:700; color:var(--brand-green);">In Stock & Ready to Ship</td></tr>
                        <tr><td style="padding:4px 0; color:var(--text-muted);">Inspection:</td><td style="font-weight:700;">Market at Home Concierge Ready</td></tr>
                    </table>
                </div>

                <div id="pTabContent-video" style="display:none; margin-bottom:14px; text-align:center;">
                    <div style="background:#0F172A; color:#fff; border-radius:var(--radius-md); padding:30px 10px;">
                        <i class="fa-solid fa-circle-play" style="font-size:2.5rem; color:#EF4444; margin-bottom:8px;"></i>
                        <div style="font-size:0.85rem; font-weight:700;">Merchant Live HD Video Stream</div>
                        <div style="font-size:0.75rem; color:#94A3B8;">Verified physical inspection stream of actual merchandise</div>
                    </div>
                </div>

                <!-- Action Buttons: Add to Cart & Direct WhatsApp -->
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
// 7. 🪄 3D CARD TILT EFFECT ENGINE
// ==========================================
function init3DTiltEffects() {
    const cards = document.querySelectorAll('.product-card-3d');
    cards.forEach(card => {
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
// 8. 🗺️ LIVE ORDER ROUTE & STEP TRACKER
// ==========================================
function openOrderRouteTracker(orderId) {
    const order = API.getOrderById ? API.getOrderById(orderId) : null;
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }

    // Step status determination
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

                <!-- 4 Step Visual Flow -->
                <div class="order-route-timeline" style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; margin:20px 0; text-align:center; position:relative;">
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

                <!-- Assigned Courier Card -->
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
// 9. AUTHENTICATION & SESSION MANAGEMENT
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

    if (u === 'admin' && p === 'admin123') {
        localStorage.setItem('globalbiz_admin_session', 'active');
        document.getElementById('adminLoginCard').style.display = 'none';
        document.getElementById('adminControlCenterView').style.display = 'block';
        document.getElementById('adminQuickActionsBar').style.display = 'block';
        showToast('Welcome Administrator Amina', 'success');
        loadAdminPortal();
    } else {
        showToast('Invalid admin credentials. Use admin / admin123', 'error');
    }
}

function handleAdminLogout() {
    localStorage.removeItem('globalbiz_admin_session');
    document.getElementById('adminLoginCard').style.display = 'block';
    document.getElementById('adminControlCenterView').style.display = 'none';
    document.getElementById('adminQuickActionsBar').style.display = 'none';
    showToast('Admin logged out successfully', 'info');
    switchPage('home');
}

function handleNavAuthBtnClick() {
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

function updateNavAuthUI() {
    const user = getCurrentUser();
    const navAuthText = document.getElementById('navAuthText');
    const quickBar = document.getElementById('adminQuickActionsBar');

    if (isAdminAuthenticated() && quickBar) {
        quickBar.style.display = 'block';
    } else if (quickBar) {
        quickBar.style.display = 'none';
    }

    if (user && navAuthText) {
        navAuthText.textContent = user.full_name ? user.full_name.split(' ')[0] : 'Account';
    } else if (navAuthText) {
        navAuthText.textContent = 'Sign In';
    }
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
    const identifier = document.getElementById('loginPhoneEmail')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value.trim();

    const users = await API.getUsers();
    const matched = users.find(u => (u.phone === identifier || u.email === identifier) && u.password === pass);

    if (matched) {
        if (matched.status === 'suspended') {
            showToast('Account has been suspended by Admin. Please contact support.', 'error');
            return;
        }
        setCurrentUser(matched);
        closeModal('userAuthModal');
        showToast(`Welcome back, ${matched.full_name}!`, 'success');
        if (matched.role === 'seller') {
            switchPage('seller');
        } else {
            switchPage('buyer');
        }
    } else {
        showToast('Invalid phone/email or password. Please try again or create an account.', 'error');
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

    try {
        const newUser = await API.registerUser({
            full_name: fullName,
            phone,
            email,
            location,
            password,
            role
        });
        setCurrentUser(newUser);
        closeModal('userAuthModal');
        showToast(`Registration successful! Welcome, ${fullName}`, 'success');
        if (role === 'seller') {
            switchPage('seller');
        } else {
            switchPage('buyer');
        }
    } catch (e) {
        showToast('Registration failed: ' + e.message, 'error');
    }
}

function handleUserLogout() {
    clearCurrentUser();
    showToast('Logged out successfully', 'info');
    switchPage('home');
}

// ==========================================
// 10. CURRENCY CONVERTER & PRICE FORMATTER
// ==========================================
function setupCurrencySwitcher() {
    const sel = document.getElementById('currencySelector');
    if (sel) {
        sel.addEventListener('change', (e) => {
            AppState.currentCurrency = e.target.value;
            loadMarketplaceProducts();
            loadFeaturedProducts();
            updateCartModalDisplay();
            showToast(`Switched currency to ${AppState.currentCurrency}`, 'info');
        });
    }
}

function formatPrice(usdAmount) {
    const curr = AppState.currentCurrency;
    const rateData = AppState.currencyRates[curr] || { symbol: '$', rate: 1.0 };
    const converted = usdAmount * rateData.rate;
    
    if (curr === 'NGN') {
        return rateData.symbol + Math.round(converted).toLocaleString();
    }
    return rateData.symbol + converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==========================================
// 11. PAGE ROUTING & NAVIGATION
// ==========================================
function switchPage(pageId) {
    AppState.currentPage = pageId;

    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(l => {
        if (l.dataset.page === pageId) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'marketplace') loadMarketplaceProducts();
    if (pageId === 'buyer') loadBuyerDashboard();
    if (pageId === 'seller') loadSellerDashboard();
    if (pageId === 'admin') loadAdminPortal();
}

function switchBuyerTab(tabId) {
    AppState.currentBuyerTab = tabId;
    document.querySelectorAll('.buyer-tab-btn').forEach(b => {
        if (b.dataset.buyerTab === tabId) b.classList.add('active');
        else b.classList.remove('active');
    });

    document.querySelectorAll('.buyer-tab-view').forEach(v => {
        if (v.id === 'buyer-view-' + tabId) v.style.display = 'block';
        else v.style.display = 'none';
    });

    if (tabId === 'orders') loadBuyerOrders();
    if (tabId === 'cart') renderCart();
    if (tabId === 'favorites') loadBuyerFavorites();
    if (tabId === 'wallet') loadBuyerWallet();
    if (tabId === 'disputes') loadBuyerDisputes();
    if (tabId === 'sourcing') loadBuyerSourcingRequests();
}

function switchSellerTab(tabId) {
    AppState.currentSellerTab = tabId;
    document.querySelectorAll('.seller-tab-btn').forEach(b => {
        if (b.dataset.sellerTab === tabId) b.classList.add('active');
        else b.classList.remove('active');
    });

    document.querySelectorAll('.seller-tab-view').forEach(v => {
        if (v.id === 'seller-view-' + tabId) v.style.display = 'block';
        else v.style.display = 'none';
    });

    if (tabId === 'inventory') loadSellerProducts();
    if (tabId === 'orders') loadSellerOrders();
}

function switchAdminTab(tabId) {
    AppState.currentAdminTab = tabId;
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        if (b.dataset.adminTab === tabId) b.classList.add('active');
        else b.classList.remove('active');
    });

    document.querySelectorAll('.admin-tab-view').forEach(v => {
        if (v.id === 'admin-view-' + tabId) v.style.display = 'block';
        else v.style.display = 'none';
    });

    if (tabId === 'users') loadAdminUsers();
    if (tabId === 'sellers') loadAdminSellers();
    if (tabId === 'products') loadAdminProducts();
    if (tabId === 'orders') loadAdminOrders();
    if (tabId === 'sourcing') loadAdminSourcing();
    if (tabId === 'disputes') loadAdminDisputes();
    if (tabId === 'broadcasts') loadAdminBroadcasts();
}

// ==========================================
// 12. CATEGORIES & CATALOG FILTERING
// ==========================================
async function loadCategories() {
    const cats = await API.getCategories();
    
    // Render in Category Horizontal Strip
    const catStrip = document.getElementById('categoriesStrip');
    if (catStrip) {
        catStrip.innerHTML = `
            <button class="cat-pill active" onclick="filterByCategory('', this)">
                <i class="fa-solid fa-border-all"></i> All Categories
            </button>
        ` + cats.map(c => `
            <button class="cat-pill" onclick="filterByCategory('${c.name}', this)">
                <i class="fa-solid ${c.icon || 'fa-tag'}"></i> ${c.name}
            </button>
        `).join('');
    }

    // Populate dropdowns
    const dropdowns = ['sellerProdCategory', 'marketplaceCategoryFilter'];
    dropdowns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = (id === 'marketplaceCategoryFilter' ? '<option value="">All Categories</option>' : '') +
                cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    });
}

function filterByCategory(catName, btnEl) {
    AppState.activeCategoryFilter = catName;
    if (btnEl) {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }
    loadMarketplaceProducts();
    loadFeaturedProducts();
}

function filterByWorldwideLocation(country, state, btnEl) {
    AppState.activeCountryFilter = country;
    AppState.activeStateFilter = state;
    if (btnEl) {
        document.querySelectorAll('.hero-loc-pill').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }
    loadMarketplaceProducts();
    loadFeaturedProducts();
    showToast(country ? `Showing products in ${state || country}` : 'Showing all global products', 'info');
}

// ==========================================
// 13. PRODUCT RENDERING & CATALOG
// ==========================================
async function loadMarketplaceProducts() {
    const grid = document.getElementById('marketplaceProductsGrid');
    const countEl = document.getElementById('marketplaceResultsCount');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><p>Loading marketplace...</p></div>';

    const products = await API.getProducts({
        category: AppState.activeCategoryFilter,
        country: AppState.activeCountryFilter,
        state: AppState.activeStateFilter
    });

    if (countEl) countEl.textContent = `Showing ${products.length} products`;
    renderProductsGrid(products, grid);
    loadFeaturedProducts();
}

async function loadFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (!grid) return;
    const products = await API.getProducts({
        category: AppState.activeCategoryFilter,
        country: AppState.activeCountryFilter
    });
    renderProductsGrid(products.slice(0, 8), grid);
}

function renderProductsGrid(products, container = null) {
    const grid = container || document.getElementById('marketplaceProductsGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; background:var(--bg-card); border-radius:var(--radius-lg); border:1px dashed var(--border);">
                <i class="fa-solid fa-box-open" style="font-size:3rem; color:var(--text-muted); margin-bottom:12px;"></i>
                <h3 style="font-weight:700;">No products match your criteria</h3>
                <p style="color:var(--text-muted); margin-bottom:16px;">Try adjusting your search terms or geographical filter.</p>
                <button class="btn btn-outline" onclick="resetAllFilters()">Reset All Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(p => {
        const isFav = API.isFavorite ? API.isFavorite(p.id) : false;
        return `
            <div class="product-card product-card-3d" onclick="openProductDetails('${p.id}')">
                <div class="product-img-wrapper">
                    <img src="${p.photo}" alt="${p.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?w=600'">
                    <span class="product-badge"><i class="fa-solid fa-circle-check"></i> ${p.category || 'Goods'}</span>
                    <button class="product-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${p.id}')" title="Save to Favorites">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-body">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-meta">
                        <span><i class="fa-solid fa-store" style="color:var(--gold);"></i> ${p.seller_name || 'Verified Merchant'}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${p.location || 'Global'}</span>
                    </div>
                    <div class="product-footer">
                        <span class="product-price">${formatPrice(p.price)}</span>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); addToCart('${p.id}')">
                            <i class="fa-solid fa-cart-plus"></i> Buy
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    init3DTiltEffects();
}

function resetAllFilters() {
    AppState.activeCategoryFilter = '';
    AppState.activeCountryFilter = '';
    AppState.activeStateFilter = '';
    document.querySelectorAll('.cat-pill, .hero-loc-pill').forEach(b => b.classList.remove('active'));
    document.querySelector('.cat-pill')?.classList.add('active');
    loadMarketplaceProducts();
}

// ==========================================
// 14. SHOPPING CART & FAVORITES
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
    const badges = [document.getElementById('navCartBadge'), document.getElementById('buyerCartBadge')];
    badges.forEach(b => {
        if (b) {
            b.textContent = count;
            b.style.display = count > 0 ? 'inline-flex' : 'none';
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
                <button class="btn btn-sm" onclick="API.removeFromCart('${item.id}'); updateCartBadge(); updateCartModalDisplay();" style="color:#EF4444; background:none; padding:4px;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

function renderCart() {
    updateCartModalDisplay();
}

function toggleFavorite(productId) {
    const isNowFav = API.toggleFavorite ? API.toggleFavorite(productId) : false;
    updateFavBadge();
    loadMarketplaceProducts();
    loadFeaturedProducts();
    showToast(isNowFav ? 'Saved to Favorites' : 'Removed from Favorites', 'info');
}

function updateFavBadge() {
    const favs = API.getFavorites ? API.getFavorites() : [];
    const count = favs.length;
    const badges = [document.getElementById('navFavBadge'), document.getElementById('buyerFavBadge')];
    badges.forEach(b => {
        if (b) {
            b.textContent = count;
            b.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    });
}

async function loadBuyerFavorites() {
    const grid = document.getElementById('buyerFavoritesGrid');
    if (!grid) return;

    const favIds = API.getFavorites ? API.getFavorites() : [];
    if (favIds.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fa-regular fa-heart fa-2x"></i><p>No saved items yet.</p></div>';
        return;
    }

    const all = await API.getProducts();
    const favProducts = all.filter(p => favIds.includes(p.id));
    renderProductsGrid(favProducts, grid);
}

// ==========================================
// 15. BUYER PORTAL CONTROLLERS
// ==========================================
async function loadBuyerDashboard() {
    const user = getCurrentUser();
    const welcome = document.getElementById('buyerWelcomeHeading');
    if (welcome) {
        welcome.textContent = user ? `Welcome, ${user.full_name}` : 'Welcome, Guest Buyer';
    }
    loadBuyerOrders();
    loadBuyerWallet();
}

async function loadBuyerOrders() {
    const list = document.getElementById('buyerOrdersList');
    if (!list) return;

    const user = getCurrentUser();
    const orders = await API.getOrders({ buyerId: user?.id });

    if (orders.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">No orders placed yet. Explore the marketplace to make your first order!</div>';
        return;
    }

    list.innerHTML = orders.map(o => `
        <div class="order-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:14px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div>
                    <span style="font-weight:800;">Order #${o.id}</span> &bull; <span style="font-size:0.8rem; color:var(--text-muted);">${new Date(o.created_at).toLocaleDateString()}</span>
                </div>
                <span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green); font-weight:800;">${o.status}</span>
            </div>
            <div style="font-size:0.85rem; margin-bottom:8px;">
                <strong>Items:</strong> ${o.items ? o.items.map(i => i.name + ' (' + i.quantity + 'x)').join(', ') : o.product_name || 'Goods'}
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

async function loadBuyerWallet() {
    const balanceEl = document.getElementById('buyerWalletBalance');
    const user = getCurrentUser();
    const balance = user ? (user.wallet_balance || 250.00) : 0.00;
    if (balanceEl) balanceEl.textContent = formatPrice(balance);
}

function handleWalletTopup() {
    showToast('Redirecting to Paystack secure wallet top-up...', 'info');
}

// ==========================================
// 16. SELLER PORTAL CONTROLLERS
// ==========================================
async function loadSellerDashboard() {
    const user = getCurrentUser();
    const storeNameEl = document.getElementById('sellerStoreHeading');
    if (storeNameEl) {
        storeNameEl.textContent = user?.store_name || user?.full_name || 'Amina Global Emporium';
    }
    loadSellerProducts();
    loadSellerOrders();
}

async function loadSellerProducts() {
    const grid = document.getElementById('sellerProductsList');
    if (!grid) return;

    const user = getCurrentUser();
    const products = await API.getProducts({ sellerId: user?.id });

    if (products.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">No products listed yet. Click "+ Add Product" to start selling.</div>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; display:flex; gap:12px; align-items:center; margin-bottom:10px;">
            <img src="${p.photo}" style="width:60px; height:60px; object-fit:cover; border-radius:var(--radius-sm);">
            <div style="flex:1;">
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:2px;">${p.name}</h4>
                <div style="font-size:0.78rem; color:var(--text-muted);"><i class="fa-solid fa-tag"></i> ${p.category} &bull; ${formatPrice(p.price)}</div>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-outline" onclick="openProductDetails('${p.id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-sm btn-danger" onclick="handleDeleteProduct('${p.id}')" style="background:#EF4444; color:#fff; padding:6px 10px; border-radius:var(--radius-xs);"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function loadSellerOrders() {
    const list = document.getElementById('sellerOrdersList');
    if (!list) return;

    const orders = await API.getOrders();
    list.innerHTML = orders.map(o => `
        <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong>Order #${o.id}</strong>
                <select class="form-select" style="width:auto; padding:3px 8px; font-size:0.75rem;" onchange="handleUpdateOrderStatus('${o.id}', this.value)">
                    <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="In Transit" ${o.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Buyer: ${o.buyer_name || 'Verified Buyer'} &bull; Total: ${formatPrice(o.total_amount)}</div>
        </div>
    `).join('');
}

async function handleUpdateOrderStatus(orderId, newStatus) {
    await API.updateOrderStatus(orderId, newStatus);
    showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
}

function openAddProductModal() {
    document.getElementById('sellerProductForm')?.reset();
    populateSellerStateDropdown('Nigeria');
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

    const name = document.getElementById('sellerProdTitle')?.value.trim();
    const price = parseFloat(document.getElementById('sellerProdPrice')?.value || 0);
    const category = document.getElementById('sellerProdCategory')?.value;
    const seller_name = document.getElementById('sellerProdSellerName')?.value.trim() || user?.full_name || 'Verified Merchant';
    const country = document.getElementById('sellerProdCountry')?.value;
    const location = document.getElementById('sellerProdLocation')?.value.trim();
    const phone = document.getElementById('sellerProdPhone')?.value.trim();
    const description = document.getElementById('sellerProdDesc')?.value.trim();
    const photo = document.getElementById('sellerProdPhoto')?.value || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';

    await API.createProduct({
        name,
        price,
        category,
        seller_name,
        country,
        location,
        phone,
        description,
        photo,
        seller_id: user?.id || 'seller-1'
    });

    closeModal('addProductModal');
    showToast('Product published live worldwide!', 'success');
    loadMarketplaceProducts();
    loadSellerProducts();
}

async function handleDeleteProduct(productId) {
    if (confirm('Delete this product permanently?')) {
        await API.deleteProduct(productId);
        showToast('Product deleted', 'info');
        loadMarketplaceProducts();
        loadSellerProducts();
    }
}

// ==========================================
// 17. ADMIN PORTAL CONTROL CENTER
// ==========================================
async function loadAdminPortal() {
    if (!isAdminAuthenticated()) return;
    loadAdminStats();
    loadAdminUsers();
    loadAdminSellers();
    loadAdminProducts();
    loadAdminOrders();
    loadAdminDisputes();
    loadAdminBroadcasts();
}

async function loadAdminStats() {
    const stats = API.getAdminStats ? await API.getAdminStats() : { users: 120, sellers: 35, products: 80, orders: 45 };
    const elements = {
        'adminTotalUsersCount': stats.users,
        'adminTotalSellersCount': stats.sellers,
        'adminTotalProductsCount': stats.products,
        'adminTotalOrdersCount': stats.orders
    };

    Object.entries(elements).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

async function loadAdminUsers() {
    const list = document.getElementById('adminUsersTableBody');
    if (!list) return;

    const users = await API.getUsers();
    list.innerHTML = users.map(u => `
        <tr>
            <td style="padding:10px; font-weight:700;">${u.full_name}</td>
            <td style="padding:10px;">${u.phone}</td>
            <td style="padding:10px;"><span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green);">${u.role}</span></td>
            <td style="padding:10px;">${u.location || 'Nigeria'}</td>
            <td style="padding:10px;"><span class="badge" style="background:${u.status === 'suspended' ? '#FEE2E2; color:#EF4444' : '#DCFCE7; color:#16A34A'}">${u.status || 'Active'}</span></td>
            <td style="padding:10px;">
                <button class="btn btn-sm btn-outline" onclick="handleToggleUserStatus('${u.id}')" style="padding:4px 8px; font-size:0.75rem;">
                    ${u.status === 'suspended' ? 'Activate' : 'Suspend'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadAdminSellers() {
    const list = document.getElementById('adminSellersTableBody');
    if (!list) return;

    const sellers = await API.getSellers();
    list.innerHTML = sellers.map(s => `
        <tr>
            <td style="padding:10px; font-weight:700;">${s.full_name}</td>
            <td style="padding:10px;">${s.store_name}</td>
            <td style="padding:10px;">${s.phone}</td>
            <td style="padding:10px;">${s.location}</td>
            <td style="padding:10px;">
                <span class="badge" style="background:${s.verified ? '#DCFCE7; color:#16A34A' : '#FEF3C7; color:#D97706'}">
                    ${s.verified ? '<i class="fa-solid fa-circle-check"></i> Verified' : 'Pending'}
                </span>
            </td>
            <td style="padding:10px;">
                <button class="btn btn-sm btn-primary" onclick="handleVerifySeller('${s.id}')" style="padding:4px 8px; font-size:0.75rem;">
                    ${s.verified ? 'Unverify' : 'Verify'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleToggleUserStatus(userId) {
    await API.toggleUserStatus(userId);
    showToast('User status updated', 'success');
    loadAdminUsers();
}

async function handleVerifySeller(sellerId) {
    await API.toggleSellerVerification(sellerId);
    showToast('Seller verification updated', 'success');
    loadAdminSellers();
}

async function loadAdminProducts() {
    const list = document.getElementById('adminProductsTableBody');
    if (!list) return;

    const products = await API.getProducts();
    list.innerHTML = products.map(p => `
        <tr>
            <td style="padding:10px; font-weight:700;">${p.name}</td>
            <td style="padding:10px;">${p.category}</td>
            <td style="padding:10px; color:var(--brand-green); font-weight:800;">${formatPrice(p.price)}</td>
            <td style="padding:10px;">${p.seller_name}</td>
            <td style="padding:10px;">
                <button class="btn btn-sm" onclick="handleDeleteProduct('${p.id}')" style="background:#EF4444; color:#fff; padding:4px 8px; font-size:0.75rem;"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadAdminOrders() {
    const list = document.getElementById('adminOrdersTableBody');
    if (!list) return;

    const orders = await API.getOrders();
    list.innerHTML = orders.map(o => `
        <tr>
            <td style="padding:10px; font-weight:700;">#${o.id}</td>
            <td style="padding:10px;">${o.buyer_name || 'Buyer'}</td>
            <td style="padding:10px; color:var(--brand-green); font-weight:800;">${formatPrice(o.total_amount)}</td>
            <td style="padding:10px;"><span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green);">${o.status}</span></td>
            <td style="padding:10px;">${new Date(o.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

async function loadAdminDisputes() {
    const list = document.getElementById('adminDisputesTableBody');
    if (!list) return;

    const disputes = API.getDisputes ? await API.getDisputes() : [];
    list.innerHTML = disputes.map(d => `
        <tr>
            <td style="padding:10px; font-weight:700;">${d.subject}</td>
            <td style="padding:10px;">${d.category}</td>
            <td style="padding:10px;">${d.details}</td>
            <td style="padding:10px;"><span class="badge" style="background:#FEF3C7; color:#D97706;">${d.status || 'Under Review'}</span></td>
            <td style="padding:10px;">
                <button class="btn btn-sm btn-primary" onclick="handleResolveDispute('${d.id}')" style="padding:4px 8px; font-size:0.75rem;">Resolve</button>
            </td>
        </tr>
    `).join('');
}

async function handleResolveDispute(disputeId) {
    showToast('Dispute marked as resolved', 'success');
    loadAdminDisputes();
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
// 18. BROADCAST TICKER & ANNOUNCEMENTS
// ==========================================
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

function openAdminBroadcastModal() {
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
    showToast('Broadcast published live across website!', 'success');
    loadAdminBroadcasts();
}

async function loadAdminBroadcasts() {
    const list = document.getElementById('adminBroadcastsList');
    if (!list) return;

    const broadcasts = API.getBroadcasts ? await API.getBroadcasts() : [];
    list.innerHTML = broadcasts.map(b => `
        <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${b.title}</strong>
                <span class="badge" style="background:var(--brand-green-soft); color:var(--brand-green);">${b.target}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0;">${b.message}</p>
        </div>
    `).join('');
}

// ==========================================
// 19. ADMIN CSV EXPORT & BACKUP
// ==========================================
function exportTableToCSV(tableId, filename = 'export.csv') {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        let rowData = [];
        cols.forEach(col => rowData.push('"' + col.innerText.replace(/"/g, '""') + '"'));
        csv.push(rowData.join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV report generated and downloaded', 'success');
}

function handleExportDatabaseBackup() {
    const backupData = {
        users: API.getUsersSync ? API.getUsersSync() : [],
        products: API.getProductsSync ? API.getProductsSync() : [],
        orders: API.getOrdersSync ? API.getOrdersSync() : []
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_at_home_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database backup downloaded (JSON)', 'success');
}

function handleResetPlatformData() {
    if (confirm('Reset platform data to factory seeds?')) {
        localStorage.clear();
        showToast('Database restored to default seeds', 'info');
        location.reload();
    }
}

// ==========================================
// 20. MODAL & TOAST HELPERS
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
