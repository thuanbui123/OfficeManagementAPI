import type { ReqQ, Res, Next } from '@app-types/common';
import { hashPassword, comparePassword } from "@utils/passwordHelper";
import { StringExpressionOperatorReturningNumber } from 'mongoose';
import env from "@config/env";

const { GetUser } = require("@repositories/UserRepository");
const { CreateUser } = require("@repositories/UserRepository");
const { UpdateRefreshToken } = require("@repositories/UserRepository");
const { generateToken } = require("@utils/jwt");
const { generateRefreshToken } = require("@utils/jwt");
const { decodeToken } = require("@utils/jwt");

type RegisterRequest = {
    email: string,
    username: string,
    password: string
}

type LoginRequest = {
    username: string,
    password: StringExpressionOperatorReturningNumber
}

type RefreshTokenRequest = {
    refreshToken: string
}

class AuthController {
    async Register (req: ReqQ<RegisterRequest>, res: Res, _next: Next) {
        try {
            const username = req.body.username;
            const email = req.body.email.toLowerCase();
            var user = await GetUser(username, email);
            if(user) res.status(409).send('Tài khoản đã tồn tại');
            else {
                const password = req.body.password;
                const hashPass = await hashPassword(password);
                const newUser = {
                    email: email,
                    username: username,
                    password: hashPass
                }
                const createUser = await CreateUser(newUser);
                if (!createUser) {
                    return res
                        .status(400)
                        .send('Có lỗi trong quá trình tạo tài khoản, vui lòng thử lại.');
                }
                return res.send({
                    username,
                });
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Bad Request';
            res.status(400).json({ error: message });
        }
    }
    async Login (req: ReqQ<LoginRequest>, res: Res, _next: Next) {
        try {
            const username = req.body.username;
            const password = req.body.password;
            if(!username || !password) {
                return res.status(401).json({
                    err: "Vui lòng nhập đầy đủ thông tin username, password"
                })
            }
            const user = await GetUser(username, "");
            if(!user) {
                return res.status(401).json({
                    err: "Tên đăng nhập không tồn tại"
                })
            }
            if(!user.isActive) {
                return res.status(401).json({
                    err: "Tài khoản của bạn chưa được kích hoạt"
                });
            }
            if(user.isDeleted) {
                return res.status(401).json({
                    err: "Tài khoản của bạn đã bị xóa"
                });
            }
            const isPasswordValid = comparePassword(password, user.password);
            if(!isPasswordValid) {
                return res.status(401).json({
                    err: "Mật khẩu không chính xác"
                })
            }

            const accessTokenLife = env.ACCESS_TOKEN_LIFE;
            const accessTokenSecret = env.ACCESS_TOKEN_SECRET;
            const dataForAccessToken = {
                username: user.username,
            };
            const accessToken = await generateToken(
                dataForAccessToken,
                accessTokenSecret,
                accessTokenLife,
            );
            
            if (!accessToken) {
                return res
                    .status(401)
                    .json({
                        err: 'Đăng nhập không thành công, vui lòng thử lại.'
                    });
            }
            
            let refreshToken = generateRefreshToken(user._id);
            if(!refreshToken) {
                return res
                    .status(401)
                    .json({
                        err: 'Đăng nhập không thành công, vui lòng thử lại.'
                    });
            }
            const refresh = await UpdateRefreshToken(user._id, refreshToken);
            
            return res.json({
                msg: 'Đăng nhập thành công.',
                accessToken,
                refreshToken,
            });
        }catch (e) {
            const message = e instanceof Error ? e.message : 'Bad Request';
            res.status(400).json({ error: message });
        }
    }
    async RefreshToken (req: ReqQ<RefreshTokenRequest>, res: Res, _next: Next) {
        try {
            const accessTokenFromHeader = req.headers.x_authorization;
            if (!accessTokenFromHeader) {
                return res.status(400).send('Không tìm thấy access token.');
            }
            const refreshTokenFromBody = req.body.refreshToken;
            if (!refreshTokenFromBody) {
                return res.status(400).send('Không tìm thấy refresh token.');
            }
            const accessTokenSecret = env.ACCESS_TOKEN_SECRET;
            const accessTokenLife = env.ACCESS_TOKEN_LIFE;

            const decoded = await decodeToken(
                accessTokenFromHeader,
                accessTokenSecret,
            );

            if (!decoded) {
                return res.status(400).send('Access token không hợp lệ.');
            }

            const username = decoded.payload.username;

            const user = await GetUser(username, "");
            if (!user) {
                return res.status(401).send('User không tồn tại.');
            }

            if (refreshTokenFromBody !== user.refreshToken) {
                return res.status(400).send('Refresh token không hợp lệ.');
            }

            const dataForAccessToken = {
                username,
            };

            let refreshToken = generateRefreshToken(user._id);

            await UpdateRefreshToken(user._id, refreshToken);

            const accessToken = await generateToken(
                dataForAccessToken,
                accessTokenSecret,
                accessTokenLife,
            );

            if (!accessToken) {
                return res
                    .status(400)
                    .send('Tạo access token không thành công, vui lòng thử lại.');
            }
            return res.json({
                accessToken,
                refreshToken
            });
        } catch (e) {
            console.log("Err RefreshToken " + e);
            return res.json("Xảy ra lỗi khi cấp access token mới")
        }
    }
}

export default new AuthController();
