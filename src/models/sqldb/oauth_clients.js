module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_clients', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientId: {
      type: DataTypes.STRING(80) + ' COLLATE utf8mb4_bin',
      allowNull: true,
      primaryKey: true,
      unique: true
    },
    secret: {
      type: DataTypes.STRING(255) + ' COLLATE utf8mb4_bin',
      allowNull: true
    },
    grants: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    refreshTokenLifetime: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true
    },
    accessTokenLifetime: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    logoutURI: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
      // references: {
      //   model: 'oauth_users',
      //   key: 'id'
      // }
    },
    createdAt: {
      type: DataTypes.DATE, // + ' CURRENT_TIMESTAMP'
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE, // + ' CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      allowNull: true
    }
  }, {
    tableName: 'oauth_clients',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  })
}
