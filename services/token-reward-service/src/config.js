require('dotenv').config();

module.exports = {
    security: {
        jwt: {
            secret: process.env.JWT_SECRET
        }
    }
};
