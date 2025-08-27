import { Router } from "express";
import ctrl from '@controllers/AccessController';
import { isAuth } from "@middlewares/AuthMiddleware";
import { enrichAuth } from "@middlewares/AuthEnrich";
import { requirePermission } from "@middlewares/Guards";

const r = Router();

/**
 * @openapi
 * /access/roles/create:
 *   post:
 *     tags:
 *       - Access
 *     summary: Tạo vai trò mới
 *     requestBody:
 *       required: true
*       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - desc
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tên vai trò mới
 *               desc:
 *                 type: string
 *                 example: Mô tả cho vai trò
 *     responses:
 *       201:
 *         description: Tạo vai trò mới thành công
 *       400:
 *         description: Lỗi validate dữ liệu
 *       409:
 *         description: Vai trò đã tồn tại
 *       500:
 *         description: Lỗi hệ thống khi tạo vai trò mới
 */
r.post("/roles/create", isAuth, enrichAuth, requirePermission('role:create'), ctrl.createRole);

/**
 * @openapi
 * /access/permissions:
 *   get:
 *     tags:
 *       - Access
 *     summary: Lấy danh sách quyền theo tên vai trò
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Tên vai trò để lấy danh sách quyền
 *     responses:
 *       200:
 *         description: Danh sách quyền của một vai trò
 *       400:
 *         description: Lỗi validate dữ liệu
 *       500:
 *         description: Lỗi hệ thống khi lấy danh sách
 */
r.get("/permissions", isAuth, enrichAuth, requirePermission('permissions:get'), ctrl.getRolePermissions);

/**
 * @openapi
 * /access/roles/{name}/permissions:
 *   put:
 *     tags:
 *       - Access
 *     summary: Cập nhật (gán) danh sách quyền cho một vai trò (replace toàn bộ)
 *     description: |
 *       Nhận danh sách RolePermissionItem, lọc các item `selected = true`, validate `code` tồn tại trong DB,
 *       và **thay thế toàn bộ** danh sách quyền của role bằng các `code` hợp lệ.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Tên vai trò (không upsert, chỉ cập nhật role đã tồn tại)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AssignRolePermissionInput'
 *           examples:
 *             default:
 *               summary: Ví dụ payload
 *               value:
 *                 permissions:
 *                   - code: "users:read"
 *                     selected: true
 *                   - code: "users:delete"
 *                     selected: false
 *                   - code: "roles:permissions:update"
 *                     selected: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về role sau khi cập nhật cùng danh sách code hợp lệ/không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateRolePermissionsResponse'
 *             examples:
 *               success:
 *                 summary: Ví dụ phản hồi thành công
 *                 value:
 *                   role:
 *                     _id: "6655f7f212f3a1b9c1e4b000"
 *                     name: "admin"
 *                     permissions: ["users:read", "roles:permissions:update"]
 *                   validCodes: ["users:read", "roles:permissions:update"]
 *                   invalidCodes: []
 *                   message: "Cập nhật thành công."
 *       400:
 *         description: Tên vai trò không hợp lệ!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               badRequest:
 *                 value:
 *                   err: "Dữ liệu không hợp lệ"
 *       404:
 *         description: Không tìm thấy vai trò để cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 value:
 *                   err: "Không tìm thấy vai trò để cập nhật!"
 *       500:
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * components:
 *   schemas:
 *     RolePermissionItem:
 *       type: object
 *       required: [_id, code, selected]
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của bản ghi permission (Mongo ObjectId dạng string)
 *         code:
 *           type: string
 *           description: Mã quyền (unique)
 *         desc:
 *           type: string
 *           nullable: true
 *           description: Mô tả quyền
 *         selected:
 *           type: boolean
 *           description: Tick=true thì được gán cho role
 *
 *     UpdateRolePermissionsResponse:
 *       type: object
 *       required: [role, validCodes, invalidCodes]
 *       properties:
 *         role:
 *           type: object
 *           description: Role sau khi cập nhật
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             permissions:
 *               type: array
 *               items:
 *                 type: string
 *           example:
 *             _id: "6655f7f212f3a1b9c1e4b000"
 *             name: "admin"
 *             permissions: ["users:read", "roles:permissions:update"]
 *         validCodes:
 *           type: array
 *           items:
 *             type: string
 *         invalidCodes:
 *           type: array
 *           items:
 *             type: string
 *         message:
 *           type: string
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         err:
 *           type: string
 */
r.put( "/roles/:name/permissions", isAuth, enrichAuth, requirePermission("roles:permissions:update"), ctrl.updateRolePermissions);

/**
 * @openapi
 * /access/users/{userId}/role:
 *   put:
 *     tags:
 *       - Access
 *     summary: Gán một vai trò (role) cho người dùng
 *     description: |
 *       Chỉ định **duy nhất một role** cho user (replace toàn bộ).  
 *       Middleware yêu cầu: `users:role:update`.  
 *       Hỗ trợ 2 dạng body để tương thích ngược:
 *       - Khuyến nghị: `{ "role": "admin" }`
 *       - Legacy: `{ "roles": ["admin"] }` (nếu gửi nhiều, hệ thống chỉ lấy phần tử đầu, phần còn lại bị bỏ qua)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID người dùng (Mongo ObjectId dạng string)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [role]
 *                 properties:
 *                   role:
 *                     type: string
 *                     description: Tên role cần gán (ví dụ 'admin')
 *               - type: object
 *                 required: [roles]
 *                 properties:
 *                   roles:
 *                     type: array
 *                     description: Tương thích ngược; chỉ phần tử đầu tiên được dùng
 *                     items:
 *                       type: string
 *           examples:
 *             recommended:
 *               summary: Dạng khuyến nghị
 *               value:
 *                 role: "admin"
 *             legacy:
 *               summary: Dạng legacy (array)
 *               value:
 *                 roles: ["admin", "editor"]
 *     responses:
 *       200:
 *         description: Gán role thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignRoleResponse'
 *             examples:
 *               success:
 *                 value:
 *                   msg: "Cập nhật vai trò thành công"
 *                   user:
 *                     _id: "6655f7f212f3a1b9c1e4b000"
 *                     username: "alice"
 *                     roles: ["admin"]
 *                   assignedRole: "admin"
 *                   note: "Đã bỏ qua các role dư: editor"
 *       400:
 *         description: Lỗi validate hoặc role không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               badRequest:
 *                 value:
 *                   err: "Vai trò không tồn tại."
 *       404:
 *         description: Không tìm thấy người dùng để gán vai trò
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 value:
 *                   err: "Không tìm thấy người dùng để gán vai trò!"
 *       500:
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * components:
 *   schemas:
 *     AssignRoleResponse:
 *       type: object
 *       required: [msg, user, assignedRole]
 *       properties:
 *         msg:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *             roles:
 *               type: array
 *               items:
 *                 type: string
 *           example:
 *             _id: "6655f7f212f3a1b9c1e4b000"
 *             username: "alice"
 *             roles: ["admin"]
 *         assignedRole:
 *           type: string
 *         note:
 *           type: string
 *           description: Ghi chú khi body legacy có nhiều role và đã bị bỏ qua bớt
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         err:
 *           type: string
 */
r.put( "/users/:userId/role", isAuth, enrichAuth, requirePermission("users:role:update"), ctrl.assignRoleToUser);

module.exports = r;