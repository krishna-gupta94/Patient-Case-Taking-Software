const requireRole = (requiredRole) => {
    return (req, res, next) => {
        // Verify req.user exists (set by authMiddleware)
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Compare roles case-insensitively
        if (req.user.role.toLowerCase() !== requiredRole.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient privileges'
            });
        }

        next();
    };
};

module.exports = requireRole;
