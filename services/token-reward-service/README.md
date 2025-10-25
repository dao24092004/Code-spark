# Token Reward Service

This service is responsible for managing token rewards for users. It provides endpoints for awarding tokens and tracking user balances.

## Technologies Used

*   Node.js
*   Express.js
*   Sequelize
*   PostgreSQL
*   Hardhat
*   Ethers.js

## Getting Started

### Prerequisites

*   Node.js
*   PostgreSQL

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up the database by creating a `.env` file with the following variables:
    ```
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_NAME=your_db_name
    ```
4.  Run database migrations (if you have migration files):
    ```bash
    npx sequelize-cli db:migrate
    ```

### Running the Service

```bash
npm start
```

### Seeding the Database

To populate the database with sample data, run the following command:

```bash
node scripts/populate-db.js
```

## API Endpoints

*   `POST /api/tokens/reward`: Award tokens to a user.
*   `GET /api/users/:id/balance`: Get the token balance of a user.

## Authorization

Các routes sau đây được bảo vệ và yêu cầu quyền cụ thể:

| Method | Route                   | Permission Required   |
|--------|-------------------------|-----------------------|
| POST   | `/grant`                | `token:grant`         |
| POST   | `/spend`                | `token:spend`         |
| GET    | `/balance/:studentId`   | `token:read:self`     |
| GET    | `/history/:studentId`   | `token:read:self`     |
| POST   | `/withdraw`             | `token:withdraw`      |
