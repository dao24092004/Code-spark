# Organization Service

This is the organization service for the Code-spark application.

## Description

This service manages organizations, members, and recruitment processes. It provides APIs for creating, reading, updating, and deleting organizations and their related data.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the `organization_service` directory:
   ```bash
   cd services/organization_service
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Create a `.env` file in the root of the `organization_service` directory and add the following environment variables:
   ```
   DB_USER=your_db_user
   DB_HOST=your_db_host
   DB_DATABASE=your_db_name
   DB_PASSWORD=your_db_password
   DB_PORT=your_db_port
   JWT_SECRET=your_jwt_secret
   ```
2. Start the server:
   ```bash
   node server.js
   ```

## Dependencies

*   [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a `.env` file.
*   [express](https://www.npmjs.com/package/express): Fast, unopinionated, minimalist web framework for Node.js.
*   [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken): An implementation of JSON Web Tokens.
*   [multer](https://www.npmjs.com/package/multer): Node.js middleware for handling `multipart/form-data`.
*   [pg](https://www.npmjs.com/package/pg): Non-blocking PostgreSQL client for Node.js.
*   [sequelize](https://www.npmjs.com/package/sequelize): A promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server.
*   [xlsx](https://www.npmjs.com/package/xlsx): Parser and writer for various spreadsheet formats.

## Scripts

*   `npm test`: Runs the test suite (currently not implemented).
