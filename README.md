# Global Business Marketplace & Professional Buying Assistance Platform

A modern, minimalistic, responsive web marketplace and business directory combining **Global Classifieds**, **Multimedia Product/Service Ads (Photos, Videos, Audio/Voice Pitches)**, **Location-Based & 'Near Me' Search**, and an integrated **Professional Buying Assistance Concierge**.

---

## 🌟 Key Features

1. **Minimalistic Modern UI with Persistent Docked Navigation Bar**
   - App-like mobile and desktop layout with bottom docked tabs (`Home`, `Explore`, `Post Ad`, `Assistance`, `Admin Portal`).
2. **Complete 30+ Business Categories Directory**
   - Covers: Food & Groceries, Clothing & Fashion, Shoes, Bags, Furniture, Electronics, Mobile Phones, Computers & IT, Car Sales, Car Wash, Auto Repair, Construction, Building Materials, Agriculture, Restaurants, Hotels, Beauty & Cosmetics, Healthcare Services, Transportation, Logistics & Delivery, Real Estate, Education, Professional Services, Cleaning Services, Repair Services, Photography, Printing, Telecommunications, Spare Parts, Wholesale, Retail.
3. **Multimedia Advertising Engine**
   - Supports Photos, Embedded Video Player modal, and **Voice Pitch / Audio waveform player**.
4. **Smart Natural Language Search & Location Engine**
   - Understands searches such as:
     - *"Yam in Kano"*
     - *"Men clothes in Riyadh"*
     - *"Phone repair in Kano"*
     - *"Furniture in Abuja"*
     - *"Shoes under \$50"*
     - *"Car wash near me"*
   - Built-in GPS "Near Me" radius search with Haversine distance calculations.
5. **Professional Buying Assistance Concierge**
   - Multi-tiered service packages:
     - **Basic Search (\$15)**
     - **Consultation (\$25)**
     - **Seller Contact & Verification (\$35)**
     - **Price Negotiation (\$40)**
     - **Full Buying Assistance (\$60)**
     - **Business Procurement (\$150)**
   - Automated tracking code generator (`PBA-XXXXX`).
6. **Dedicated Admin & Staff Portal**
   - **Overview**: Real-time platform KPI metrics and estimated revenue.
   - **Businesses**: 1-click verify badge toggle, feature toggle, view profile, delete.
   - **Listings & Ads**: Moderation, multimedia inspection, deletion.
   - **Buying Sourcing Desk**: Status workflow (`New` $\rightarrow$ `Assigned` $\rightarrow$ `Searching` $\rightarrow$ `Seller Found` $\rightarrow$ `Negotiating` $\rightarrow$ `Customer Approval` $\rightarrow$ `Purchase Coordination` $\rightarrow$ `Completed`), assign staff agent, and update internal sourcing notes.
   - **Category Manager**: Add new categories with FontAwesome icons, delete categories.
   - **Reviews Moderation**: Rating moderation and review management.
7. **Business Profile Modal & Direct Communication**
   - 1-Click WhatsApp chat with pre-filled product inquiries.
   - Direct phone call links.
8. **Multi-Currency Converter**
   - Real-time conversion across USD (\$), NGN (₦), SAR (﷼), EUR (€), and GBP (£).
9. **Cloud Integrations**
   - **Neon PostgreSQL Cloud DB**: Seamless connection with automatic SQLite local fallback.
   - **Cloudinary CDN**: Multimedia asset hosting.
   - **Vercel & GitHub**: Pre-configured `vercel.json` routing.

---

## 📁 Project Architecture

```
golbalbusiness/
├── index.php                 # Primary PHP web application entry point
├── index.html                # High-performance responsive web app
├── vercel.json               # Vercel serverless deployment config
├── README.md                 # Project documentation
├── assets/
│   ├── css/
│   │   └── style.css         # Minimalistic responsive stylesheet & Admin styles
│   └── js/
│       ├── api.js            # Unified API client with automatic offline fallback
│       └── app.js            # Core application controller & search parser
└── api/
    ├── config.php            # Cloudinary & Neon PostgreSQL configuration
    ├── db.php                # Neon PostgreSQL PDO layer + automated 30+ category seeding
    ├── businesses.php        # Business registration & spatial search
    ├── products.php          # Product & service multimedia listings
    ├── categories.php        # Hierarchical category management
    ├── buying_assistance.php # Concierge request engine & package calculator
    ├── reviews.php           # Customer reviews & ratings
    ├── upload.php            # Cloudinary upload handler
    └── admin.php             # Full Admin management & statistics API
```

---

## 🚀 How to Run the Project

### Option A: Deploy to Vercel (Production)
```bash
vercel
```
Or push to your GitHub repository connected to Vercel.

### Option B: Using PHP Built-In Server
```bash
php -S localhost:8000
```
Then visit: `http://localhost:8000` in your web browser.

### Option C: Direct Browser Open (Zero Server Setup)
Double-click `index.html` to open directly in Chrome, Edge, or Safari. The built-in client layer will immediately power the interface with zero setup required.
