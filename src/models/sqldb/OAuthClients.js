module.exports = function (sequelize, DataTypes) {
  const OAuthClients = sequelize.define('OAuthClients', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: DataTypes.STRING(255),
    clientId: DataTypes.STRING(80),
    clientSecret: DataTypes.STRING(80),
    redirectUri: DataTypes.STRING(2000),
    grants: DataTypes.STRING(80),
    refreshTokenLifetime: DataTypes.INTEGER(14).UNSIGNED,
    accessTokenLifetime: DataTypes.INTEGER(14).UNSIGNED,
    scope: DataTypes.STRING
  }, {
    tableName: 'oauth_clients',
    timestamps: true,
    classMethods: {
      associate: function associate (models) {
        OAuthClients.belongsTo(models.Users, {
          foreignKey: 'userId'
        })
      }
    }
  })

  return OAuthClients
}
