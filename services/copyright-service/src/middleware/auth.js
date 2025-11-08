const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, config.security.jwt.secret, (err, decoded) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        
        // Extract user info and permissions from JWT token
        req.user = {
            userId: decoded.userId,
            username: decoded.sub || decoded.username,
            email: decoded.email,
            roles: decoded.roles || [],
            permissions: decoded.permissions || []
        };
        
        console.log('Authenticated user:', {
            userId: req.user.userId,
            username: req.user.username,
            email: req.user.email,
            permissions: req.user.permissions
        });
        next();
    });
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({ message: `Forbidden: Requires ${permission} permission` });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    checkPermission,
};
