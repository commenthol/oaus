module.exports = function (sequelize, DataTypes) {
  const OAuthScopes = sequelize.define('OAuthScopes', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    scope: DataTypes.STRING(80),
    isDefault: DataTypes.BOOLEAN
  }, {
    tableName: 'oauth_scopes',
    timestamps: true
  })

  return OAuthScopes
}
