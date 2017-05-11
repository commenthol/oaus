
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_access_tokens__create`(
	IN `accessToken` VARCHAR(255),
	IN `expiresAt` DATETIME,
	IN `scope` VARCHAR(255),
	IN `oauthClientId` BIGINT,
	IN `userId` BIGINT
)
    MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'saveAccessToken(accessToken, expiresAt, scope, oauthClientId, userId)'
BEGIN
	INSERT INTO oauth_access_tokens (accessToken, expiresAt, scope, oauthClientId, userId)
	VALUES (accessToken, expiresAt, scope, oauthClientId, userId);
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_access_tokens__read`(
	IN `accessToken` VARCHAR(255)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getAccessToken(accessToken)'
BEGIN
	SELECT `accessTokens`.`id`,
	  `accessTokens`.`accessToken`,
	  `accessTokens`.`expiresAt` AS `accessTokenExpiresAt`,
	  `accessTokens`.`scope`,
	  `user`.`id` AS `user.id`,
	  `user`.`username` AS `user.username`,
	  `user`.`scope` AS `user.scope`,
	  `client`.`id` AS `client.id`,
	  `client`.`clientId` AS `client.clientId`,
	  `client`.`scope` AS `client.scope`
	FROM `oauth_access_tokens` AS `accessTokens`
	LEFT OUTER JOIN `oauth_users` AS `user` ON `accessTokens`.`userId` = `user`.`id`
	LEFT OUTER JOIN `oauth_clients` AS `client` ON `accessTokens`.`oauthClientId` = `client`.`id`
	WHERE `accessTokens`.`accessToken` = accessToken
	LIMIT 1;
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_authorization_codes__create`(
	IN `authorizationCode` VARCHAR(255),
	IN `expiresAt` DATETIME,
	IN `redirectUri` VARCHAR(2000),
	IN `scope` VARCHAR(255),
	IN `oauthClientId` BIGINT,
	IN `userId` BIGINT
)
    MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'saveAuthorizationCode(authorizationCode, expiresAt, redirectUri, scope, oauthClientId, userId) '
BEGIN
	INSERT INTO `oauth_authorization_codes` (`authorizationCode`,`expiresAt`,`redirectUri`,`scope`,`oauthClientId`,`userId`)
	VALUES (authorizationCode, expiresAt, redirectUri, scope, oauthClientId, userId);
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_authorization_codes__read`(
	IN `authorizationCode` VARCHAR(255)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getAuthorizationCode(authorizationCode)'
BEGIN
	SELECT `authorizationCodes`.`id`,
	`authorizationCodes`.`authorizationCode`,
	`authorizationCodes`.`expiresAt`,
	`authorizationCodes`.`redirectUri`,
	`authorizationCodes`.`scope`,
	`user`.`id` AS `user.id`,
	`user`.`username` AS `user.username`,
	`user`.`scope` AS `user.scope`,
	`client`.`id` AS `client.id`,
	`client`.`clientId` AS `client.clientId`,
	`client`.`scope` AS `client.scope`
	FROM `oauth_authorization_codes` AS `authorizationCodes`
	LEFT OUTER JOIN `oauth_users` AS `user` ON `authorizationCodes`.`userId` = `user`.`id`
	LEFT OUTER JOIN `oauth_clients` AS `client` ON `authorizationCodes`.`oauthClientId` = `client`.`id`
	WHERE `authorizationCodes`.`authorizationCode` = authorizationCode
	LIMIT 1;
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_clients__read`(
	IN `clientId` VARCHAR(80),
	IN `clientSecret` VARCHAR(80)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getClient(clientId, clientSecret)'
BEGIN
	SELECT clients.id, name, clientId, clientSecret, grants,
		refreshTokenLifetime, accessTokenLifetime, scope,
		clients.createdAt, clients.updatedAt, userId, redirects.redirectUri
	FROM oauth_clients AS clients
	INNER JOIN oauth_clients_redirects AS redirects ON redirects.oauthClientId = clients.id
	WHERE clients.clientId = clientId AND
		IF(ISNULL(clientSecret),TRUE,clients.clientSecret = clientSecret)
	LIMIT 5;
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_clients__users__read`(
	IN `clientId` VARCHAR(80),
	IN `clientSecret` VARCHAR(80)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getUserFromClient(clientId, clientSecret)'
BEGIN
	SELECT `clients`.`id`,
	  `clients`.`clientId`,
	  `clients`.`clientSecret`,
	  `user`.`id` AS `user.id`,
	  `user`.`username` AS `user.username`,
	  `user`.`scope` AS `user.scope`,
	  `user`.`createdAt` AS `user.createdAt`,
	  `user`.`updatedAt` AS `user.updatedAt`
	FROM `oauth_clients` AS `clients`
	LEFT OUTER JOIN `oauth_users` AS `user` ON `clients`.`userId` = `user`.`id`
	WHERE `clients`.`clientId` = clientId  AND
		IF(ISNULL(clientSecret),TRUE, `clients`.`clientSecret` = clientSecret)
	LIMIT 1;
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_refresh_tokens__create`(
	IN `refreshToken` VARCHAR(255),
	IN `expiresAt` DATETIME,
	IN `scope` VARCHAR(255),
	IN `oauthClientId` BIGINT,
	IN `userId` BIGINT
)
    MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'saveRefreshToken(refreshToken, expiresAt, scope, oauthClientId, userId)'
BEGIN
	INSERT INTO oauth_refresh_tokens (refreshToken, expiresAt, scope, oauthClientId, userId)
	VALUES (refreshToken, expiresAt, scope, oauthClientId, userId);
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_refresh_tokens__read`(
	IN `refreshToken` VARCHAR(255)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getRefreshToken(refreshToken)'
BEGIN
	SELECT `refreshTokens`.`id`,
	  `refreshTokens`.`refreshToken`,
	  `refreshTokens`.`expiresAt` AS `refreshTokenExpiresAt`,
	  `refreshTokens`.`scope`,
		`user`.`id` AS `user.id`,
	  `user`.`username` AS `user.username`,
	  `user`.`scope` AS `user.scope`,
	  `client`.`id` AS `client.id`,
	  `client`.`clientId` AS `client.clientId`,
	  `client`.`scope` AS `client.scope`
	FROM `oauth_refresh_tokens` AS `refreshTokens`
	LEFT OUTER JOIN `oauth_users` AS `user` ON `refreshTokens`.`userId` = `user`.`id`
	LEFT OUTER JOIN `oauth_clients` AS `client` ON `refreshTokens`.`oauthClientId` = `client`.`id`
	WHERE `refreshTokens`.`refreshToken` = refreshToken
	LIMIT 1;
END//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `oauth_users__read`(
	IN `username` VARCHAR(254)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getUser(username)'
BEGIN
	SELECT id, username, password, scope
	FROM oauth_users
	WHERE oauth_users.username = username
	LIMIT 1;
END//
DELIMITER ;
