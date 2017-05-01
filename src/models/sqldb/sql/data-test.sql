INSERT INTO `oauth_users` (`id`, `username`, `password`, `scope`, `createdAt`, `updatedAt`) VALUES
  (1, 'admin@admin', 'admin', NULL, '2017-04-22 18:36:40', '2017-04-22 18:36:40'),
  (2, 'user@user', 'user', NULL, '2017-04-22 18:36:40', '2017-04-22 18:36:40');

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
