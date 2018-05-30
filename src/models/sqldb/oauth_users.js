module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_users', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255) + ' COLLATE utf8mb4_bin',
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    remember: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    logoutToken: {
      type: DataTypes.STRING(255) + ' COLLATE utf8mb4_bin',
      allowNull: true
    },
    lastSignInAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastSignOutAt: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'oauth_users',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  })
}
