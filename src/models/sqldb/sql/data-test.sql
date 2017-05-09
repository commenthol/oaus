-- passwords are stored with bcrypt hash; use the following line to generate
-- require('bcrypt').hashSync(plainpasswd, 10)

-- plain passwords
-- admin@admin  admin
-- user@user    user
INSERT INTO `oauth_users` (`id`, `username`, `password`, `scope`, `createdAt`, `updatedAt`) VALUES
  (1, 'admin@admin', '$2a$10$naxhPt.X9Q03TxIhTo9bJelp57aneUvqx7.18F8TESV/T2.yZ38wm', NULL, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
  (2, 'user@user', '$2a$10$HuAzaQ1xLtsAzJz6snzQluButYKezbb2jELgOYwr/OHwsoFXsccz2', NULL, '2017-04-22 18:36:40', '2017-04-22 18:36:40');

-- using plain secrets due to performance reasons
INSERT INTO `oauth_clients` (`id`, `name`, `clientId`, `clientSecret`, `grants`, `refreshTokenLifetime`, `accessTokenLifetime`, `scope`, `userId`, `createdAt`, `updatedAt`) VALUES
	(1, 'demoName', 'demo', 'demosecret', 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
	(2, 'loginName', 'login', 'loginsecret', 'password,refresh_token', NULL, NULL, NULL, 1, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
	(3, 'clientName', 'client', NULL, 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 18:36:40', '2017-04-22 18:36:40');

INSERT INTO `oauth_clients_redirects` (`id`, `redirectUri`, `oauthClientId`, `createdAt`, `updatedAt`) VALUES
  (1, 'http://localhost:3000/cb', 1, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
  (2, 'http://localhost:3000/cb1', 1, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
  (3, '/', 2, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
  (4, '/cb2', 3, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
  (5, 'http://localhost:3000/cb', 1, '2017-04-22 18:36:40', '2017-04-22 18:36:40');
