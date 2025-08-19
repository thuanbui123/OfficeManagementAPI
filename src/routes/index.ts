const { Router } = require('express')
const userRoute = require('./UserRoute');

const api = Router();

/**
 * @openapi
 * /users:
 *   get:
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
api.use('/users', userRoute);

export default api;