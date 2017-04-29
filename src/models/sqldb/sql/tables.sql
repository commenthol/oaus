-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.18 - MySQL Community Server (GPL)
-- Server OS:                    Linux
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping database structure for oauth2
CREATE DATABASE IF NOT EXISTS `oauth2` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `oauth2`;

-- Dumping structure for table oauth2.oauth_access_tokens
CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `accessToken` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accessToken` (`accessToken`),
  KEY `FK1_clients_id` (`oauthClientId`),
  KEY `FK1_users_id` (`userId`),
  CONSTRAINT `FK1_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`),
  CONSTRAINT `FK1_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping structure for table oauth2.oauth_authorization_codes
CREATE TABLE IF NOT EXISTS `oauth_authorization_codes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `authorizationCode` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expiresAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `redirectUri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authorizationCode` (`authorizationCode`),
  KEY `oauthClientId` (`oauthClientId`),
  KEY `userId` (`userId`),
  CONSTRAINT `FK2_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`),
  CONSTRAINT `FK2_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping structure for table oauth2.oauth_clients
CREATE TABLE IF NOT EXISTS `oauth_clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clientId` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clientSecret` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `grants` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `refreshTokenLifetime` int(10) DEFAULT NULL,
  `accessTokenLifetime` int(10) DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK0_users_id` (`userId`),
  CONSTRAINT `FK0_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping structure for table oauth2.oauth_clients_redirects
CREATE TABLE IF NOT EXISTS `oauth_clients_redirects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `redirectUri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK4_client_id` (`oauthClientId`),
  CONSTRAINT `FK5_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping structure for table oauth2.oauth_refresh_tokens
CREATE TABLE IF NOT EXISTS `oauth_refresh_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `refreshToken` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refreshToken` (`refreshToken`),
  KEY `FK3_clients_id` (`oauthClientId`),
  KEY `FK3_users_id` (`userId`),
  CONSTRAINT `FK3_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`),
  CONSTRAINT `FK3_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping structure for table oauth2.oauth_scopes
CREATE TABLE IF NOT EXISTS `oauth_scopes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `isDefault` bit(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping structure for table oauth2.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(254) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
