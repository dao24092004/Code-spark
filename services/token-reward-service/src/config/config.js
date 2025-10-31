require('dotenv').config();

module.exports = {
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'fallbackSecret',
      expiration: process.env.JWT_EXPIRATION || '86400000',
    },
  },

  db: {
    postgres: {
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      port: process.env.POSTGRES_PORT || 5432,
      name: process.env.DB_NAME_IDENTITY || 'identity_db',
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },

  eureka: {
    url: process.env.EUREKA_URL || '',
    hostname: process.env.EUREKA_HOSTNAME || 'localhost',
  },
};
