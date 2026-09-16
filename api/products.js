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
            const { id, q, country, state } = req.query;

            if (id) {
                const query = 'SELECT * FROM global_products WHERE id = $1';
                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    return res.status(404).json({ status: 'error', message: 'Product not found' });
                }
                return res.status(200).json({ status: 'success', data: result.rows[0] });
            }

            let query = 'SELECT * FROM global_products WHERE 1=1';
            const params = [];
            let paramIdx = 1;

            if (q) {
                query += ` AND (LOWER(title) LIKE $${paramIdx} OR LOWER(description) LIKE $${paramIdx} OR LOWER(seller_name) LIKE $${paramIdx} OR LOWER(location) LIKE $${paramIdx})`;
                params.push(`%${q.toLowerCase()}%`);
                paramIdx++;
            }

            if (country && country !== 'all') {
                query += ` AND LOWER(country) = $${paramIdx}`;
                params.push(country.toLowerCase());
                paramIdx++;
            }

            if (state && state !== 'all') {
                query += ` AND (LOWER(state) LIKE $${paramIdx} OR LOWER(city) LIKE $${paramIdx} OR LOWER(location) LIKE $${paramIdx})`;
                params.push(`%${state.toLowerCase()}%`);
                paramIdx++;
            }

            query += ' ORDER BY created_at DESC';

            const result = await client.query(query, params);
            return res.status(200).json({
                status: 'success',
                count: result.rows.length,
                data: result.rows
            });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
            const title = body.title || body.name;

            if (!title) {
                return res.status(400).json({ status: 'error', message: 'Product title is required' });
            }

            const id = body.id || ('prod-' + Date.now());
            const price = parseFloat(body.price) || 0;
            const photo_url = body.photo_url || body.photo || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600';
            const photo = photo_url;
            const seller_name = body.seller_name || 'Verified Merchant';
            const seller_phone = body.seller_phone || body.phone || '';
            const phone = seller_phone;
            const seller_id = body.seller_id || ('seller-' + Date.now());
            const country = body.country || 'Nigeria';
            const state = body.state || 'Abuja (FCT)';
            const city = body.city || state;
            const location = body.location || `${city}, ${country}`;
            const description = body.description || '';
            const status = body.status || 'approved';
            const business_verified = body.business_verified !== undefined ? body.business_verified : 1;
            const available_qty = parseInt(body.available_qty) || 50;

            const upsertQuery = `
                INSERT INTO global_products (
                    id, title, name, price, photo_url, photo, seller_name, seller_phone, phone,
                    seller_id, country, state, city, location, description, status, business_verified, available_qty
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    name = EXCLUDED.name,
                    price = EXCLUDED.price,
                    photo_url = EXCLUDED.photo_url,
                    photo = EXCLUDED.photo,
                    seller_name = EXCLUDED.seller_name,
                    seller_phone = EXCLUDED.seller_phone,
                    phone = EXCLUDED.phone,
                    country = EXCLUDED.country,
                    state = EXCLUDED.state,
                    city = EXCLUDED.city,
                    location = EXCLUDED.location,
                    description = EXCLUDED.description,
                    status = EXCLUDED.status,
                    business_verified = EXCLUDED.business_verified,
                    available_qty = EXCLUDED.available_qty
                RETURNING *;
            `;

            const values = [
                id, title, title, price, photo_url, photo, seller_name, seller_phone, phone,
                seller_id, country, state, city, location, description, status, business_verified, available_qty
            ];

            const result = await client.query(upsertQuery, values);
            return res.status(200).json({
                status: 'success',
                message: 'Product published live to global cloud database',
                data: result.rows[0]
            });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ status: 'error', message: 'Product ID is required' });
            }

            await client.query('DELETE FROM global_products WHERE id = $1', [id]);
            return res.status(200).json({ status: 'success', message: 'Product deleted successfully' });
        }

        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    } finally {
        await client.end();
    }
};
