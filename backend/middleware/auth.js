const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Read the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // 2. Extract the token
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verify JWT signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach authenticated user info to req
        req.user = decoded;
        
        next();
    } catch (error) {
        // Reject invalid/missing/expired tokens safely without exposing stack traces
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authMiddleware;
