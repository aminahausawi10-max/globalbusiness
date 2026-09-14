# Global Business Marketplace & Professional Buying Assistance Platform

A modern, minimalistic, responsive web marketplace and business directory combining **Global Classifieds**, **Multimedia Product/Service Ads (Photo, Video, Audio/Voice Pitch)**, **Location-Based & 'Near Me' Search**, and an integrated **Professional Buying Assistance Concierge**.

---

## 🌟 Key Features

1. **Minimalistic UI with Docked Bottom Navigation Bar**
   - App-like mobile and desktop experience with persistent bottom tabs (`Home`, `Explore`, `Post Ad`, `Assistance`, `Dashboard`).
2. **Multimedia Advertising Engine**
   - Physical products & professional services support.
   - High-definition image galleries, video previews, and **voice pitch / audio note players**.
3. **Smart Natural Language Search & Location Engine**
   - Understands searches such as:
     - *"Yam in Kano"*
     - *"Men clothes in Riyadh"*
     - *"Phone repair in Kano"*
     - *"Furniture in Abuja"*
     - *"Shoes under \$50"*
     - *"Car wash near me"*
   - Built-in GPS "Near Me" detection with Haversine distance calculations.
4. **Professional Buying Assistance Concierge**
   - 4-Tier Service Package selector (`Basic Search`, `Price Negotiation`, `Full Assistance`, `Business Procurement`).
   - Sourcing request tickets with tracking codes, budget ranges, and agent assignment.
5. **Business Directory & Verification Badges**
   - Verified Business badges with direct WhatsApp and phone action triggers.
6. **Multi-Currency Converter**
   - Instant real-time toggle between USD (\$), NGN (₦), SAR (﷼), EUR (€), and GBP (£).
7. **Operations & Admin Dashboard**
   - Live metrics, category controls, and assistance assignment desk.

---

## 📁 Project Architecture

```
golbalbusiness/
├── index.php                 # Primary PHP web application entry point
├── index.html                # Standalone zero-server browser mirror
├── README.md                 # Project documentation
├── assets/
│   ├── css/
│   │   └── style.css         # Minimalistic responsive stylesheet & bottom navigation
│   └── js/
│       ├── api.js            # Unified API client with automatic offline fallback
│       └── app.js            # Core application controller & search parser
└── api/
    ├── db.php                # SQLite PDO layer + automated seeding
    ├── businesses.php        # Business registration & spatial search
    ├── products.php          # Product & service multimedia listings
    ├── categories.php        # Hierarchical category management
    ├── buying_assistance.php # Concierge request engine & package calculator
    ├── reviews.php           # Customer reviews & ratings
    └── admin.php             # Admin analytics & ticket queue
```

---

## 🚀 How to Run the Project

### Option A: Using PHP Built-In Server (Recommended)
Open PowerShell or Command Prompt in this folder and run:
```bash
php -S localhost:8000
```
Then visit: `http://localhost:8000` in your web browser.

### Option B: Using XAMPP / WAMP / Laragon
1. Place this project folder inside your `htdocs` or `www` directory.
2. Open `http://localhost/golbalbusiness/index.php`.

### Option C: Direct Browser Open (Zero Server Setup)
Double-click `index.html` to open directly in Google Chrome, Microsoft Edge, or Safari. The built-in client store will immediately power the interface with zero setup required.
