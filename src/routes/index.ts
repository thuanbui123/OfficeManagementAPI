const { Router } = require('express')
const userRoute = require('./UserRoute');
const employeeRoute = require('./EmployeeRoute');

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

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: Lấy danh sách nhân viên (có join user & department)
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
api.use('/employees', employeeRoute)

export default api;