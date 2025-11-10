module.exports = (sequelize, Sequelize) => {
    const MultisigTransaction = sequelize.define('MultisigTransaction', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        // transactionId on-chain (là index trong mảng)
        txIndexOnChain: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        txHash: { // Hash của giao dịch on-chain (submit, confirm, execute)
            type: Sequelize.STRING,
            allowNull: true
        },
        destination: {
            type: Sequelize.STRING,
            allowNull: false
        },
        value: { // Lưu dưới dạng string (Wei)
            type: Sequelize.STRING,
            allowNull: false
        },
        data: {
            type: Sequelize.TEXT,
            defaultValue: '0x'
        },
        status: {
            type: Sequelize.ENUM('submitted', 'confirmed', 'executed', 'failed'),
            defaultValue: 'submitted'
        },
        // Mảng các địa chỉ đã xác nhận
        confirmations: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            defaultValue: []
        }
    });
    return MultisigTransaction;
};

