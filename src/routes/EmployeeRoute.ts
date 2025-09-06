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

/**
 * @openapi
 * /employees:
 *   post:
 *     tags:
 *       - Employee
 *     summary: Tạo mới nhân viên
 *     description: Tạo mới một nhân viên và phát sự kiện EmployeeCreated vào Kafka
 *     components:
 *       securitySchemes:
 *         bearerAuth:
 *           type: http
 *           scheme: bearer
 *           bearerFormat: JWT
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empCode
 *               - email
 *               - fullName
 *               - deptId
 *             properties:
 *               empCode:
 *                 type: string
 *                 description: Mã nhân viên duy nhất
 *                 example: "E0001"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *               fullName:
 *                 type: string
 *                 example: "Alice Nguyễn"
 *               deptId:
 *                 type: string
 *                 description: ID phòng ban
 *                 example: "DEPT01"
 *               title:
 *                 type: string
 *                 description: Chức danh
 *                 example: "HR Specialist"
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày vào làm
 *                 example: "2025-09-04"
 *               salary:
 *                 type: number
 *                 format: float
 *                 example: 1500.5
 *     responses:
 *       201:
 *         description: Tạo nhân viên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "EMP001"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       409:
 *         description: Nhân viên đã tồn tại
 */
r.post("/", ctrl.createEmployee);

module.exports = r;
