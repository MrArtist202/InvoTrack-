import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import dotenv from 'dotenv';
import Stripe from 'stripe';


dotenv.config();
console.log('Environment loaded');
console.log('Stripe Key exists:', !!process.env.STRIPE_SECRET_KEY);

// Auto-migration for currency support
const runMigrations = async () => {
    try {
        await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'AUD'`);
        console.log('Schema updated: currency column added');
    } catch (err) {
        console.error('Migration error:', err.message);
    }
};
runMigrations();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'invotrack_secret';

// Auth middleware
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

        req.user = result.rows[0];
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ==================== AUTH ROUTES ====================

// Register (Admin only)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone, role) 
       VALUES ($1, $2, $3, $4, 'ADMIN') RETURNING id, name, email, phone, role, avatar, created_at`,
            [name, email, hashedPassword, phone]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user, token });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        delete user.password_hash;
        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current user
app.get('/api/auth/me', authenticate, (req, res) => {
    delete req.user.password_hash;
    res.json(req.user);
});

// Update profile
app.put('/api/auth/profile', authenticate, async (req, res) => {
    try {
        const { name, email, phone, avatar } = req.body;
        const result = await pool.query(
            `UPDATE users SET name = $1, email = $2, phone = $3, avatar = $4, updated_at = NOW() 
       WHERE id = $5 RETURNING id, name, email, phone, role, avatar`,
            [name, email, phone, avatar, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password
app.put('/api/auth/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const validPassword = await bcrypt.compare(currentPassword, req.user.password_hash);
        if (!validPassword) return res.status(400).json({ error: 'Current password is incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== MEMBERS ROUTES ====================

// Get members (Admin only)
app.get('/api/members', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

        const result = await pool.query(
            'SELECT id, name, email, phone, avatar, created_at FROM users WHERE admin_id = $1 AND role = $2',
            [req.user.id, 'MEMBER']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create member
app.post('/api/members', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

        const { name, email, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone, role, admin_id) 
       VALUES ($1, $2, $3, $4, 'MEMBER', $5) RETURNING id, name, email, phone, role, avatar, created_at`,
            [name, email, hashedPassword, phone, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Update member
app.put('/api/members/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

        const { name, email, phone, password } = req.body;
        let query, params;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = `UPDATE users SET name = $1, email = $2, phone = $3, password_hash = $4, updated_at = NOW() 
                     WHERE id = $5 AND admin_id = $6 RETURNING id, name, email, phone, role, avatar, created_at`;
            params = [name, email, phone, hashedPassword, req.params.id, req.user.id];
        } else {
            query = `UPDATE users SET name = $1, email = $2, phone = $3, updated_at = NOW() 
                     WHERE id = $4 AND admin_id = $5 RETURNING id, name, email, phone, role, avatar, created_at`;
            params = [name, email, phone, req.params.id, req.user.id];
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Member not found' });

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Delete member
app.delete('/api/members/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

        await pool.query('DELETE FROM users WHERE id = $1 AND admin_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== PROFILES ROUTES ====================

// Get profiles
app.get('/api/profiles', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM profiles 
             WHERE member_id = $1 
             OR member_id IN (SELECT id FROM users WHERE admin_id = $1)
             ORDER BY is_default DESC, created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create profile
app.post('/api/profiles', authenticate, async (req, res) => {
    try {
        const { name, address, phone, email, avatar, is_default } = req.body;

        // If setting as default, unset other defaults
        if (is_default) {
            await pool.query('UPDATE profiles SET is_default = false WHERE member_id = $1', [req.user.id]);
        }

        const result = await pool.query(
            `INSERT INTO profiles (member_id, name, address, phone, email, avatar, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.user.id, name, address, phone, email, avatar, is_default || false]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile
app.put('/api/profiles/:id', authenticate, async (req, res) => {
    try {
        const { name, address, phone, email, avatar, is_default } = req.body;

        if (is_default) {
            await pool.query('UPDATE profiles SET is_default = false WHERE member_id = $1', [req.user.id]);
        }

        const result = await pool.query(
            `UPDATE profiles SET name = $1, address = $2, phone = $3, email = $4, avatar = $5, is_default = $6, updated_at = NOW() 
       WHERE id = $7 AND member_id = $8 RETURNING *`,
            [name, address, phone, email, avatar, is_default, req.params.id, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete profile
app.delete('/api/profiles/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM profiles WHERE id = $1 AND member_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Profile deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set default profile
app.put('/api/profiles/:id/default', authenticate, async (req, res) => {
    try {
        await pool.query('UPDATE profiles SET is_default = false WHERE member_id = $1', [req.user.id]);
        await pool.query('UPDATE profiles SET is_default = true WHERE id = $1 AND member_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Default profile updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== INVOICES ROUTES ====================

// Get invoices
app.get('/api/invoices', authenticate, async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'ADMIN') {
            // Admin sees invoices from their members
            // Added u.name as member_name to identify which member created the invoice
            query = `SELECT i.*, p.name as profile_name, p.avatar as profile_avatar, u.name as member_name
               FROM invoices i 
               LEFT JOIN profiles p ON i.profile_id = p.id
               LEFT JOIN users u ON i.member_id = u.id
                WHERE u.admin_id = $1 OR i.member_id = $1
                ORDER BY i.created_at DESC`;
            params = [req.user.id];
        } else {
            // Member sees their own invoices
            query = `SELECT i.*, p.name as profile_name, p.avatar as profile_avatar 
               FROM invoices i 
               LEFT JOIN profiles p ON i.profile_id = p.id
               WHERE i.member_id = $1
               ORDER BY i.created_at DESC`;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single invoice
app.get('/api/invoices/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.*, p.name as profile_name, p.address as profile_address, p.phone as profile_phone, p.email as profile_email, p.avatar as profile_avatar 
       FROM invoices i 
       LEFT JOIN profiles p ON i.profile_id = p.id
       WHERE i.id = $1 OR i.reference_id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create invoice
app.post('/api/invoices', authenticate, async (req, res) => {
    try {
        const { reference_id, invoice_number, profile_id, from_name, to_name, to_email, subject, description, amount, currency, stripe_link, qr_code_url } = req.body;

        const result = await pool.query(
            `INSERT INTO invoices (reference_id, invoice_number, member_id, profile_id, from_name, to_name, to_email, subject, description, amount, currency, stripe_link, qr_code_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [reference_id, invoice_number, req.user.id, profile_id, from_name, to_name, to_email, subject, description, amount, currency || 'AUD', stripe_link, qr_code_url]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update invoice status
app.put('/api/invoices/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete invoice
app.delete('/api/invoices/:id', authenticate, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'ADMIN') {
            // Admin can delete ANY invoice if it belongs to them or their team members
            // Sub-query checks if the invoice owner (member_id) is part of the admin's team (users table admin_id link) OR is the admin themselves
            result = await pool.query(
                `DELETE FROM invoices 
                 WHERE id = $1 
                 AND (member_id = $2 OR member_id IN (SELECT id FROM users WHERE admin_id = $2))`,
                [req.params.id, req.user.id]
            );
        } else {
            // Member can only delete their own
            result = await pool.query('DELETE FROM invoices WHERE id = $1 AND member_id = $2', [req.params.id, req.user.id]);
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Invoice not found or permission denied' });
        }
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== STATS ROUTE ====================

app.get('/api/stats', authenticate, async (req, res) => {
    try {
        let memberCondition = '';
        let params = [];

        if (req.user.role === 'ADMIN') {
            memberCondition = 'WHERE i.member_id IN (SELECT id FROM users WHERE admin_id = $1)';
            params = [req.user.id];
        } else {
            memberCondition = 'WHERE i.member_id = $1';
            params = [req.user.id];
        }

        // Aggregate by currency
        const statsQuery = `
      SELECT 
        currency,
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_received,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COALESCE(SUM(amount), 0) as total_amount
      FROM invoices i ${memberCondition}
      GROUP BY currency
    `;

        const result = await pool.query(statsQuery, params);

        // Transform into an easier shapre for frontend { AUD: {...}, USD: {...} }
        const stats = {};
        // Initialize defaults
        ['AUD', 'USD'].forEach(curr => {
            stats[curr] = {
                total_invoices: 0,
                pending_count: 0,
                paid_count: 0,
                total_received: 0,
                pending_amount: 0,
                total_amount: 0
            };
        });

        result.rows.forEach(row => {
            stats[row.currency] = {
                total_invoices: parseInt(row.total_invoices),
                pending_count: parseInt(row.pending_count),
                paid_count: parseInt(row.paid_count),
                total_received: parseFloat(row.total_received),
                pending_amount: parseFloat(row.pending_amount),
                total_amount: parseFloat(row.total_amount)
            };
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== NOTIFICATIONS ROUTES ====================

// Get notifications
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE admin_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create notification (internal use mostly, but exposed for member actions)
app.post('/api/notifications', authenticate, async (req, res) => {
    try {
        const { adminId, type, title, message, memberId, invoiceId, amount } = req.body;

        // Validate that the target is an admin
        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [adminId]);
        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
            return res.status(400).json({ error: 'Invalid admin ID' });
        }

        const result = await pool.query(
            `INSERT INTO notifications (admin_id, type, title, message, member_id, invoice_id, amount) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [adminId, type, title, message, memberId, invoiceId, amount]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark as read
app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND admin_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all as read
app.put('/api/notifications/read-all', authenticate, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE admin_id = $1',
            [req.user.id]
        );
        res.json({ message: 'Marked all as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==================== STRIPE ROUTES ====================

// Initialize Stripe conditionally
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('WARNING: STRIPE_SECRET_KEY is missing. Payment features will be disabled.');
}

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment system is not configured (Stripe key missing)' });
        }

        const { amount, currency = 'aud', description, referenceId, customerEmail } = req.body;
        console.log('Creating checkout session for:', { amount, currency, referenceId });

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0.50) {
            throw new Error(`Invalid amount: ${amount}. Minimum is $0.50`);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: `Invoice ${referenceId}`,
                        description: description || 'Invoice Payment',
                    },
                    unit_amount: Math.round(parsedAmount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:5173'}/invoices`,
            customer_email: customerEmail || undefined,
            metadata: { referenceId },
        });

        await pool.query('UPDATE invoices SET stripe_link = $1 WHERE reference_id = $2', [session.url, referenceId]);
        res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Stripe checkout error full object:', JSON.stringify(err, null, 2));
        res.status(500).json({ error: err.message, details: err.raw ? err.raw.message : 'Unknown Stripe error' });
    }
});

// Verify payment session
app.post('/api/payment/verify-session', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment system is not configured (Stripe key missing)' });
        }
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const referenceId = session.metadata.referenceId;
            const result = await pool.query(
                "UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE reference_id = $1 RETURNING *",
                [referenceId]
            );
            res.json({ success: true, invoice: result.rows[0] });
        } else {
            res.json({ success: false, status: session.payment_status });
        }
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check payment status
app.get('/api/check-payment/:referenceId', async (req, res) => {
    try {
        const result = await pool.query('SELECT status FROM invoices WHERE reference_id = $1', [req.params.referenceId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        res.json({ status: result.rows[0].status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stripe webhook
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const event = req.body;
        if (event.type === 'checkout.session.completed') {
            const referenceId = event.data.object.metadata?.referenceId;
            if (referenceId) {
                await pool.query("UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE reference_id = $1", [referenceId]);
                console.log(`✓ Invoice ${referenceId} marked as paid`);
            }
        }
        res.json({ received: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;

// Only start server if run directly (local dev), not when imported by Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
    });
}

export default app;
