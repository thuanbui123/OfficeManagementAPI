import { Router } from "express";
import ctrl from "@controllers/EmployeeController";

import { isAuth } from "@middlewares/AuthMiddleware";
import { enrichAuth } from "@middlewares/AuthEnrich";
import { requirePermission } from "@middlewares/Guards";
const isAuthed = isAuth;
const r = Router();

/**
 * @openapi
 * /employees:
 *   get:
 *     tags:
 *       - Employee
 *     summary: Lấy danh sách nhân viên (có join user & department)
 *     components:
 *     securitySchemes:
 *          bearerAuth: # arbitrary name for the security scheme
 *          type: http
 *          scheme: bearer
 *          bearerFormat: JWT
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang (bắt đầu từ 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "Nguyễn"
 *         description: Từ khóa tìm kiếm (áp dụng cho các trường được cấu hình)
 *       - in: query
 *         name: keywordFields
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           example: ["fullName", "title"]
 *         style: form
 *         explode: true
 *         description: Danh sách trường để tìm theo regex (bỏ qua nếu mode=text)
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [regex, text]
 *           default: regex
 *         description: Cách tìm kiếm keyword (regex gần đúng, hoặc text sử dụng text index)
 *       - in: query
 *         name: includeTotal
 *         schema:
 *           type: boolean
 *         description: Có trả về tổng số bản ghi hay không
 *     responses:
 *       200:
 *         description: Danh sách nhân viên phân trang
 */
r.get("/", isAuthed, enrichAuth, requirePermission("employee:manage"), ctrl.list);

module.exports = r;
