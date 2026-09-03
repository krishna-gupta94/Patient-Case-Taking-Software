const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const login = async (req, res, next) => {
    try {
        const { mobile, password } = req.body;

        // Validate presence
        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and password are required'
            });
        }

        // Fetch user by mobile (parameterized)
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE mobile = ? LIMIT 1',
            [mobile]
        );

        if (users.length === 0) {
            // Generic message so we don't reveal if account exists
            return res.status(401).json({
                success: false,
                message: 'Invalid mobile number or password'
            });
        }

        const user = users[0];

        // Check account status
        if (user.status !== 'Active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive or suspended'
            });
        }

        // Compare bcrypt password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid mobile number or password'
            });
        }

        // Create JWT payload (minimal identity)
        const payload = {
            userId: user.id,
            role: user.role
        };

        // Sign JWT
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        });

        // Safe user object for response (no hashes)
        const safeUser = {
            id: user.id,
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: safeUser
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        // req.user is set by authMiddleware
        const userId = req.user.userId;

        const [users] = await pool.execute(
            'SELECT id, name, mobile, email, role, status FROM users WHERE id = ? LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    getMe
};
