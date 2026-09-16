const { Client } = require('pg');

function getDbClient() {
    return new Client({
        host: process.env.PG_HOST || 'ep-green-breeze-at2cczuz-pooler.c-9.us-east-1.aws.neon.tech',
        port: parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'neondb',
        user: process.env.PG_USER || 'neondb_owner',
        password: process.env.PG_PASSWORD || 'npg_DpIVbjQh3Rz5',
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const client = getDbClient();

    try {
        await client.connect();

        if (req.method === 'GET') {
            const { role, search } = req.query;
            let query = 'SELECT * FROM global_users WHERE 1=1';
            const params = [];
            let pIdx = 1;

            if (role) {
                query += ` AND LOWER(role) = $${pIdx}`;
                params.push(role.toLowerCase());
                pIdx++;
            }

            if (search) {
                query += ` AND (LOWER(full_name) LIKE $${pIdx} OR LOWER(store_name) LIKE $${pIdx} OR phone LIKE $${pIdx} OR LOWER(email) LIKE $${pIdx})`;
                params.push(`%${search.toLowerCase()}%`);
                pIdx++;
            }

            query += ' ORDER BY created_at DESC';

            const result = await client.query(query, params);
            return res.status(200).json({ status: 'success', count: result.rows.length, data: result.rows });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
            const fullName = body.full_name || body.name;
            const phone = body.phone;

            if (!fullName || !phone) {
                return res.status(400).json({ status: 'error', message: 'Full name and phone are required' });
            }

            const id = body.id || ('usr-' + Date.now());
            const storeName = body.store_name || (fullName + "'s Store");
            const email = body.email || (phone.replace(/[^0-9]/g, '') + '@globalbiz.com');
            const password = body.password || 'password123';
            const role = body.role || 'buyer';
            const location = body.location || 'Nigeria';
            const country = body.country || 'Nigeria';
            const verified = body.verified !== undefined ? body.verified : (role === 'buyer' ? 1 : 0);

            const upsertQuery = `
                INSERT INTO global_users (id, full_name, store_name, phone, email, password, role, location, country, verified, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
                ON CONFLICT (phone) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    store_name = EXCLUDED.store_name,
                    email = EXCLUDED.email,
                    location = EXCLUDED.location,
                    country = EXCLUDED.country
                RETURNING *;
            `;

            const result = await client.query(upsertQuery, [
                id, fullName, storeName, phone, email, password, role, location, country, verified
            ]);

            return res.status(200).json({ status: 'success', message: 'User registered successfully', data: result.rows[0] });
        }

        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    } catch(err) {
        console.error('User API error:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    } finally {
        await client.end();
    }
};
