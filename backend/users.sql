/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80016 (8.0.16)
 Source Host           : localhost:3306
 Source Schema         : paizhu_db

 Target Server Type    : MySQL
 Target Server Version : 80016 (8.0.16)
 File Encoding         : 65001

 Date: 30/01/2026 15:03:21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(加密)',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `prison_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '派驻监所名称',
  `role` enum('admin','inspector','leader','top_viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'inspector' COMMENT '角色: admin-管理员, inspector-派驻检察官, leader-业务分管领导, top_viewer-院领导',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系电话',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '账号状态',
  `last_login` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', '$2a$10$J6OK/gCMHUMbOdAH7lD7t.XmRJX9sBnnFQolzcxbBOoELNP8EGUE.', '系统管理员', '女子监狱', 'admin', '', 'active', '2026-01-29 16:01:56', '2026-01-26 16:14:03', '2026-01-29 16:01:56');
INSERT INTO `users` VALUES (2, 'admin1', '$2a$10$xFIIqEk6O7uN3bn5MDLXAuzKMZUwoDsc7hEJYtebfCD0TbMt8f./K', '111', '女子监狱', 'leader', '15070081262', 'active', '2026-01-29 15:58:14', '2026-01-27 10:00:10', '2026-01-29 15:58:14');

SET FOREIGN_KEY_CHECKS = 1;
