import { Router } from "express";
import ctrl from "@controllers/AuthController";

const r = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Đăng kí tài khoản
 *     requestBody:
 *       required: true
*       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: johndoe@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Lỗi validate dữ liệu
 *       409:
 *         description: Tài khoản đã tồn tại
 */
r.post("/register", ctrl.Register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     requestBody:
 *       required: true
*       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập hệ thống thành công
 *       401:
 *         description: Đăng nhập hệ thống thất bại
 */
r.post("/login", ctrl.Login)

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Cấp lại access token từ access token hết hạn và refresh token
 *     description: |
 *       - Lấy access token cũ từ header `x_authorization` (có thể đã hết hạn, chỉ để đọc username).
 *       - Lấy `refreshToken` từ body và xác thực với DB.
 *       - Trả về access token mới.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: header
 *         name: x_authorization
 *         required: true
 *         description: Access token cũ (JWT). Có thể đã hết hạn; chỉ dùng để decode lấy `username`.
 *         schema:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           examples:
 *             default:
 *               value:
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tạo access token mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *             examples:
 *               success:
 *                 value:
 *                   accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Thiếu tham số hoặc access/refresh token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAccess:
 *                 value: { error: "Không tìm thấy access token." }
 *               missingRefresh:
 *                 value: { error: "Không tìm thấy refresh token." }
 *               invalidAccess:
 *                 value: { error: "Access token không hợp lệ." }
 *               invalidRefresh:
 *                 value: { error: "Refresh token không hợp lệ." }
 *       401:
 *         description: User không tồn tại hoặc không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * @openapi
 * components:
 *   schemas:
 *     RefreshTokenRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token hợp lệ ứng với user
 *     RefreshTokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: Access token mới (JWT)
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */
r.post("/refresh-token", ctrl.RefreshToken);

module.exports = r;
