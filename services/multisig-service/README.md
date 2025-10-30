Multisig Service (backend prototype)

This service provides a simple in-memory multisig wallet implementation for testing and development.

APIs:
- POST /api/wallets   -> create a multisig wallet {owners: [addresses], threshold: number}
- GET  /api/wallets/:id -> get wallet
- POST /api/wallets/:id/tx -> propose a transaction {to, value, data, proposer}
- POST /api/wallets/:id/tx/:txId/approve -> approve a transaction {owner}
- POST /api/wallets/:id/tx/:txId/execute -> (optional) attempt execute

This is a prototype with in-memory storage. For production, persist to DB and integrate real contract signing/execution.
