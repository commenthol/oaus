module.exports = function (sequelize, DataTypes) {
  const Users = sequelize.define('Users', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    username: DataTypes.STRING(32),
    password: DataTypes.STRING(32),
    scope: DataTypes.STRING
  }, {
    tableName: 'users', // oauth_users
    timestamps: true,
    classMethods: {
      associate: function associate (models) {
        // Users.hasMany(models.OAuthClient);
      }
    }
  })

  return Users
}
