module.exports = (sequelize, Sequelize) => {
    const MultisigWallet = sequelize.define('MultisigWallet', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        contractAddress: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
        },
        // Giả sử creatorId là 1 UUID từ identity-service
        creatorId: {
            type: Sequelize.UUID, 
            allowNull: true // Cho phép null nếu link ví
        },
        owners: {
            type: Sequelize.ARRAY(Sequelize.STRING), // Lưu mảng địa chỉ owners
            allowNull: false
        },
        threshold: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    });
    return MultisigWallet;
};

