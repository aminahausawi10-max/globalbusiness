<?php
/**
 * Global Configuration File
 * Database (Neon PostgreSQL / SQLite) & Cloudinary Multimedia Integration
 */

// Cloudinary Credentials
define('CLOUDINARY_CLOUD_NAME', 'dpghoiocq');
define('CLOUDINARY_API_KEY', '748289518863837');
define('CLOUDINARY_API_SECRET', 'lT5EDDnG5XWsuTPZxkHjSj97FF8');
define('CLOUDINARY_UPLOAD_PRESET', 'globalbusiness_preset');

// Neon PostgreSQL Cloud Database Configuration
define('DB_DRIVER', getenv('DB_DRIVER') ?: 'auto'); // 'pgsql', 'sqlite', or 'auto'
define('PG_HOST', 'ep-green-breeze-at2cczuz-pooler.c-9.us-east-1.aws.neon.tech');
define('PG_PORT', '5432');
define('PG_DATABASE', 'neondb');
define('PG_USER', 'neondb_owner');
define('PG_PASSWORD', 'npg_DpIVbjQh3Rz5');
define('PG_SSLMODE', 'require');

// Application Environment
define('APP_NAME', 'Global Business Marketplace');
define('APP_ENV', 'production');
