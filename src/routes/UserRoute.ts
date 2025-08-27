import { Router } from "express";
import ctrl from "@controllers/UserController";
import { enrichAuth } from "@middlewares/AuthEnrich";
import { requirePermission } from "@middlewares/Guards";
import { isAuth } from "@middlewares/AuthMiddleware";

const r = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - User
 *     summary: Lấy danh sách người dùng trong hệ thống
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi tối đa trả về
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Vị trí con trỏ để phân trang (ví dụ ID cuối cùng)
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: includeTotal
 *         schema:
 *           type: boolean
 *         description: Có trả về tổng số bản ghi hay không
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: ['all', 'any']
 *         description: Chế độ tìm kiếm (chính xác hay gần đúng)
 *       - in: query
 *         name: match
 *         schema:
 *           type: string
 *           enum: ["prefix", "contains"]
 *     responses:
 *       200:
 *         description: Trả về trạng thái "ok" và danh sách người dùng
 */
r.get("/", isAuth, enrichAuth, requirePermission("user:manage"), ctrl.list);

module.exports = r;
