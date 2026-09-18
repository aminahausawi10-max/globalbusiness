<?php
/**
 * Database Connection & Initialization Layer
 * Seamlessly connects to Neon PostgreSQL (Cloud) with fallback to SQLite.
 */

require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getDB() {
    static $db = null;
    if ($db === null) {
        $connected = false;

        // Try Neon PostgreSQL first if available
        if (in_array('pgsql', PDO::getAvailableDrivers())) {
            try {
                $dsn = sprintf(
                    "pgsql:host=%s;port=%s;dbname=%s;sslmode=%s",
                    PG_HOST, PG_PORT, PG_DATABASE, PG_SSLMODE
                );
                $db = new PDO($dsn, PG_USER, PG_PASSWORD, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
                $connected = true;
                initPostgresDatabase($db);
            } catch (PDOException $e) {
                // Log and fallback to SQLite
                error_log("Neon PostgreSQL connection notice: " . $e->getMessage());
            }
        }

        // Fallback to SQLite if PostgreSQL not available
        if (!$connected) {
            $dataDir = __DIR__ . '/../data';
            if (!is_dir($dataDir)) {
                mkdir($dataDir, 0777, true);
            }
            $dbPath = $dataDir . '/database.sqlite';
            $isNew = !file_exists($dbPath);

            try {
                $db = new PDO('sqlite:' . $dbPath);
                $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                if ($isNew) {
                    initSqliteDatabase($db);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
                exit;
            }
        }
    }
    return $db;
}

function initPostgresDatabase($db) {
    // Categories Table
    $db->exec("CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        icon VARCHAR(100) NOT NULL,
        parent_id INTEGER DEFAULT NULL
    )");

    // Businesses Table
    $db->exec("CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER NOT NULL,
        category_name VARCHAR(255) NOT NULL,
        description TEXT,
        country VARCHAR(100) NOT NULL,
        state_province VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        area VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        latitude NUMERIC(10, 6) DEFAULT 0.0,
        longitude NUMERIC(10, 6) DEFAULT 0.0,
        phone VARCHAR(50) NOT NULL,
        whatsapp VARCHAR(50),
        email VARCHAR(100),
        opening_hours VARCHAR(100) DEFAULT '8:00 AM - 6:00 PM',
        delivery_available SMALLINT DEFAULT 1,
        verified SMALLINT DEFAULT 0,
        rating NUMERIC(3, 1) DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 1,
        logo_url TEXT,
        banner_url TEXT,
        featured SMALLINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Products & Services Table
    $db->exec("CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        is_service SMALLINT DEFAULT 0,
        stock_status VARCHAR(50) DEFAULT 'In Stock',
        size VARCHAR(100),
        color VARCHAR(100),
        brand VARCHAR(100),
        photo_url TEXT,
        video_url TEXT,
        audio_url TEXT,
        delivery_info TEXT,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )");

    // Buying Assistance Requests Table
    $db->exec("CREATE TABLE IF NOT EXISTS buying_requests (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(100),
        item_title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        specifications TEXT,
        quantity VARCHAR(50) DEFAULT '1',
        budget_min NUMERIC(12, 2),
        budget_max NUMERIC(12, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        target_country VARCHAR(100) NOT NULL,
        target_city VARCHAR(100) NOT NULL,
        delivery_date VARCHAR(50),
        package_type VARCHAR(100) DEFAULT 'Full Buying Assistance',
        service_fee NUMERIC(10, 2) DEFAULT 50.0,
        status VARCHAR(50) DEFAULT 'New',
        assigned_agent VARCHAR(255) DEFAULT 'Assigned to Senior Sourcing Desk',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Reviews Table
    $db->exec("CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )");

    // Seed if empty
    $count = $db->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    if ($count == 0) {
        seedInitialData($db);
    }
}

function initSqliteDatabase($db) {
    // Categories Table
    $db->exec("CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT NOT NULL,
        parent_id INTEGER DEFAULT NULL
    )");

    // Businesses Table
    $db->exec("CREATE TABLE IF NOT EXISTS businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        category_name TEXT NOT NULL,
        description TEXT,
        country TEXT NOT NULL,
        state_province TEXT NOT NULL,
        city TEXT NOT NULL,
        area TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL DEFAULT 0.0,
        longitude REAL DEFAULT 0.0,
        phone TEXT NOT NULL,
        whatsapp TEXT,
        email TEXT,
        opening_hours TEXT DEFAULT '8:00 AM - 6:00 PM',
        delivery_available INTEGER DEFAULT 1,
        verified INTEGER DEFAULT 0,
        rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 1,
        logo_url TEXT,
        banner_url TEXT,
        featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Products & Services Table
    $db->exec("CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        is_service INTEGER DEFAULT 0,
        stock_status TEXT DEFAULT 'In Stock',
        size TEXT,
        color TEXT,
        brand TEXT,
        photo_url TEXT,
        video_url TEXT,
        audio_url TEXT,
        delivery_info TEXT,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )");

    // Buying Assistance Requests Table
    $db->exec("CREATE TABLE IF NOT EXISTS buying_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        item_title TEXT NOT NULL,
        category TEXT,
        specifications TEXT,
        quantity TEXT DEFAULT '1',
        budget_min REAL,
        budget_max REAL,
        currency TEXT DEFAULT 'USD',
        target_country TEXT NOT NULL,
        target_city TEXT NOT NULL,
        delivery_date TEXT,
        package_type TEXT DEFAULT 'Full Buying Assistance',
        service_fee REAL DEFAULT 50.0,
        status TEXT DEFAULT 'New',
        assigned_agent TEXT DEFAULT 'Assigned to Senior Sourcing Desk',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Reviews Table
    $db->exec("CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )");

    seedInitialData($db);
}

function seedInitialData($db) {
    $categories = [
        ['Food & Groceries', 'food-groceries', 'fa-utensils', null],
        ['Clothing & Fashion', 'clothing-fashion', 'fa-shirt', null],
        ['Shoes', 'shoes', 'fa-shoe-prints', null],
        ['Bags & Luggage', 'bags-luggage', 'fa-bag-shopping', null],
        ['Furniture & Decor', 'furniture-decor', 'fa-couch', null],
        ['Electronics', 'electronics', 'fa-tv', null],
        ['Mobile Phones', 'mobile-phones', 'fa-mobile-screen', null],
        ['Computers & IT', 'computers-it', 'fa-laptop-code', null],
        ['Car Sales', 'car-sales', 'fa-car-side', null],
        ['Car Wash', 'car-wash', 'fa-soap', null],
        ['Auto Repair', 'auto-repair', 'fa-wrench', null],
        ['Construction', 'construction', 'fa-person-digging', null],
        ['Building Materials', 'building-materials', 'fa-trowel-bricks', null],
        ['Agriculture & Produce', 'agriculture-produce', 'fa-wheat-awn', null],
        ['Restaurants & Dining', 'restaurants-dining', 'fa-bowl-food', null],
        ['Hotels & Hospitality', 'hotels-hospitality', 'fa-hotel', null],
        ['Beauty & Cosmetics', 'beauty-cosmetics', 'fa-spa', null],
        ['Healthcare Services', 'healthcare-services', 'fa-notes-medical', null],
        ['Transportation', 'transportation', 'fa-bus', null],
        ['Logistics & Delivery', 'logistics-delivery', 'fa-truck-fast', null],
        ['Real Estate', 'real-estate', 'fa-building', null],
        ['Education & Tutoring', 'education-tutoring', 'fa-graduation-cap', null],
        ['Professional Services', 'professional-services', 'fa-briefcase', null],
        ['Cleaning Services', 'cleaning-services', 'fa-broom', null],
        ['Repair Services', 'repair-services', 'fa-screwdriver-wrench', null],
        ['Photography', 'photography', 'fa-camera', null],
        ['Printing & Publishing', 'printing-publishing', 'fa-print', null],
        ['Telecommunications', 'telecommunications', 'fa-tower-cell', null],
        ['Spare Parts', 'spare-parts', 'fa-gear', null],
        ['Wholesale Supplies', 'wholesale-supplies', 'fa-boxes-stacked', null],
        ['Retail & General Store', 'retail-general', 'fa-store', null]
    ];

    $stmt = $db->prepare("INSERT INTO categories (name, slug, icon, parent_id) VALUES (?, ?, ?, ?)");
    foreach ($categories as $cat) {
        $stmt->execute($cat);
    }

    $businesses = [
        [
            'Kano Premium Agro & Yam Hub', 14, 'Agriculture & Produce',
            'Wholesale and retail supplier of premium Benue and Niger yams, grains, sesame, and dry agricultural commodities.',
            'Nigeria', 'Kano', 'Kano', 'Dawanau Market', 'Line 4, Dawanau International Grain Market',
            12.0022, 8.5919, '+234 803 111 2233', '+2348031112233', 'agro@kanoyamhub.ng',
            '7:00 AM - 6:00 PM', 1, 1, 4.9, 38,
            'https://res.cloudinary.com/dpghoiocq/image/upload/v1/samples/food/spices.jpg',
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', 1
        ],
        [
            'Al-Malaz Prestige Mens Fashion', 2, 'Clothing & Fashion',
            'Exclusive traditional and contemporary Arabic menswear, thobes, Italian silk fabrics, and bespoke tailoring.',
            'Saudi Arabia', 'Riyadh', 'Riyadh', 'Al Malaz', 'King Abdulaziz Road, Al Malaz District',
            24.6711, 46.7329, '+966 50 123 4567', '+966501234567', 'sales@almalazfashion.sa',
            '9:00 AM - 11:00 PM', 1, 1, 4.8, 54,
            'https://res.cloudinary.com/dpghoiocq/image/upload/v1/samples/people/boy-snow-hoodie.jpg',
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80', 1
        ],
        [
            'Abuja SmartTech & Phone Repairs', 7, 'Mobile Phones',
            'Certified micro-soldering, screen replacement, genuine spare parts for Apple, Samsung, and Google Pixel.',
            'Nigeria', 'FCT', 'Abuja', 'Wuse 2', 'Suite 14, Banex Plaza, Wuse 2',
            9.0765, 7.4798, '+234 809 999 8888', '+2348099998888', 'support@abujasmarttech.com',
            '8:30 AM - 7:00 PM', 1, 1, 4.7, 92,
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&auto=format&fit=crop&q=80', 1
        ],
        [
            'Houston Custom Timber & Modern Furniture', 5, 'Furniture & Decor',
            'Handcrafted solid wood dining tables, executive office desks, and luxury living room furniture with nationwide delivery.',
            'United States', 'Texas', 'Houston', 'Galleria Area', '5085 Westheimer Rd, Houston, TX 77056',
            29.7400, -95.4640, '+1 713 555 0199', '+17135550199', 'orders@houstontimber.com',
            '9:00 AM - 6:00 PM', 1, 1, 4.9, 41,
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80', 1
        ],
        [
            'Nassarawa Eco Car Wash & Auto Detailers', 10, 'Car Wash',
            'High-pressure steam washing, interior ceramic coating, engine degreasing, and mobile door-to-door car wash services.',
            'Nigeria', 'Kano', 'Kano', 'Nassarawa GRA', '12 Bompai Road, Nassarawa GRA',
            12.0000, 8.5300, '+234 812 345 6789', '+2348123456789', 'wash@nassarawacar.ng',
            '7:00 AM - 8:00 PM', 1, 0, 4.6, 23,
            'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&auto=format&fit=crop&q=80', 0
        ]
    ];

    $stmt = $db->prepare("INSERT INTO businesses 
        (name, category_id, category_name, description, country, state_province, city, area, address, latitude, longitude, phone, whatsapp, email, opening_hours, delivery_available, verified, rating, reviews_count, logo_url, banner_url, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($businesses as $b) {
        $stmt->execute($b);
    }

    $products = [
        [
            1, 14, 'Grade-A Fresh Benue Yams (Tubers in Bulk)', 
            'Large size export-quality fresh yams directly from farm gate. Ideal for wholesale, restaurants, or household storage.',
            18.50, 'USD', 0, 'In Stock', 'Large (3-5kg each)', 'Natural Tuber', 'Benue Harvest',
            'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            'Interstate truck haulage & express same-day dispatch'
        ],
        [
            2, 2, 'Luxury Gold-Embroidered Saudi Thobe',
            'Pure Japanese cotton fabric, elegant gold collar embroidery, tailored fit for weddings, Eid, and formal wear.',
            95.00, 'USD', 0, 'In Stock', '54 - 62', 'Pure White & Cream', 'Al-Malaz Bespoke',
            'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80',
            '',
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            'Worldwide DHL / Aramex 3-5 business day shipping'
        ],
        [
            3, 7, 'Express iPhone & Samsung OLED Screen Replacement',
            'Original OEM OLED screen fitting with 6 months warranty. Done within 30 minutes by certified micro-engineers.',
            45.00, 'USD', 1, 'Service Available', 'All Models', 'OEM Black/Color', 'Apple / Samsung Genuine',
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
            '',
            '',
            'In-shop walk-in & doorstep pickup in Abuja'
        ],
        [
            4, 5, 'Handcrafted Solid Walnut 8-Seater Dining Table',
            'Kiln-dried American black walnut with live edge finish and matte black heavy-duty steel base.',
            1250.00, 'USD', 0, 'Custom Order (5 Days)', '96" x 40" x 30"', 'Natural Walnut', 'Houston Timber Co',
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            '',
            'White-glove home delivery and installation included'
        ],
        [
            5, 10, 'Executive Ceramic Steam Car Detail & Polish',
            'Multi-stage paint decontamination, interior leather steam disinfection, and 6-month ceramic sealant.',
            30.00, 'USD', 1, 'Service Available', 'Sedan / SUV', 'Gloss Finish', 'EcoDetail Pro',
            'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop&q=80',
            '',
            '',
            'Mobile van dispatch available to homes and offices in Kano'
        ]
    ];

    $stmt = $db->prepare("INSERT INTO products 
        (business_id, category_id, title, description, price, currency, is_service, stock_status, size, color, brand, photo_url, video_url, audio_url, delivery_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($products as $p) {
        $stmt->execute($p);
    }

    $buyingRequests = [
        [
            'Ibrahim Al-Rashid', '+966551122334', 'ibrahim@example.com',
            'Looking for 200 bags of high-grade raw sesame & dried ginger from Northern Nigeria',
            'Agriculture & Produce',
            'Must be export standard with moisture below 7%, SGS certified inspection before loading.',
            '200 Bags', 3000.0, 5000.0, 'USD', 'Nigeria', 'Kano', '2026-10-15',
            'Business Procurement', 150.0, 'Searching', 'Senior Sourcing Officer S. Bello',
            'Verified 2 top commodity suppliers in Dawanau. Negotiating batch discount.'
        ],
        [
            'Chioma Okafor', '+2348022233445', 'chioma@example.com',
            'Need custom solid oak king-size bed frame shipped to Abuja',
            'Furniture & Decor',
            'Scandinavian minimalist design, integrated bedside lighting, heavy duty joints.',
            '1 Unit', 600.0, 900.0, 'USD', 'Nigeria', 'Abuja', '2026-10-01',
            'Full Buying Assistance', 60.0, 'Customer Approval', 'Agent Mary M.',
            'Sourced 2 master carpenters in Industrial Layout. Samples sent to customer.'
        ]
    ];

    $stmt = $db->prepare("INSERT INTO buying_requests 
        (customer_name, customer_phone, customer_email, item_title, category, specifications, quantity, budget_min, budget_max, currency, target_country, target_city, delivery_date, package_type, service_fee, status, assigned_agent, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($buyingRequests as $br) {
        $stmt->execute($br);
    }
}
