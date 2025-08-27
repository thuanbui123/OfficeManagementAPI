import { hashPassword, comparePassword } from "@utils/passwordHelper";
import { StringExpressionOperatorReturningNumber } from 'mongoose';
import env from "@config/env";

const { GetUser } = require("@repositories/UserRepository");
const { CreateUser } = require("@repositories/UserRepository");
const { UpdateRefreshToken } = require("@repositories/UserRepository");
const { generateToken } = require("@utils/jwt");
const { generateRefreshToken } = require("@utils/jwt");
const { decodeToken } = require("@utils/jwt");
const { getTokenFromReq } = require("@utils/authUtil");

export type RegisterRequest = {
    email: string,
    username: string,
    password: string
}

export type LoginRequest = {
    username: string,
    password: StringExpressionOperatorReturningNumber
}

export type RegisterResult = {
  username: string;
};

export type RefreshTokenRequest = {
    refreshToken: string
}

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  msg: string;
};

class ConflictError extends Error {
  status = 409 as const;
  constructor(message = 'Conflict') { super(message); }
}
class ValidationError extends Error {
  status = 400 as const;
  constructor(message = 'Bad Request') { super(message); }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') { super(message); }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeUsername = (u: string) => u.trim();

export class AuthService {
  validateRegisterInput(input: RegisterRequest) {
    const username = normalizeUsername(input.username ?? '');
    const email = normalizeEmail(input.email ?? '');
    const password = String(input.password ?? '');

    if (!username) throw new ValidationError('Username không được để trống');
    if (!email) throw new ValidationError('Email không được để trống');
    // ví dụ check rất cơ bản, tuỳ bạn siết thêm
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Email không hợp lệ');
    }
    if (password.length < 6) {
      throw new ValidationError('Mật khẩu phải có tối thiểu 6 ký tự');
    }
    return { username, email, password };
  }

  async register(reqBody: RegisterRequest): Promise<RegisterResult> {
    const { username, email, password } = this.validateRegisterInput(reqBody);

    const existed = await GetUser(username, email);
    if (existed) {
      throw new ConflictError('Tài khoản đã tồn tại');
    }

    const passwordHash = await hashPassword(password);
    const created = await CreateUser({
      username,
      email,
      password: passwordHash,
      roles: ['employee']
    });

    if (!created) {
      throw new ValidationError(
        'Có lỗi trong quá trình tạo tài khoản, vui lòng thử lại.'
      );
    }

    return { username };
  }

  validateLoginInput(input: LoginRequest) {
    const username = normalizeUsername(input?.username ?? '');
    const password = String(input?.password ?? '');
    if (!username || !password) {
      throw new UnauthorizedError('Vui lòng nhập đầy đủ thông tin username, password');
    }
    return { username, password };
  }

  async login(reqBody: LoginRequest): Promise<LoginResult> {
    const { username, password } = this.validateLoginInput(reqBody);

    const user = await GetUser(username, '');
    if (!user) throw new UnauthorizedError('Tên đăng nhập không tồn tại');
    if (!user.isActive) throw new UnauthorizedError('Tài khoản của bạn chưa được kích hoạt');
    if (user.isDeleted) throw new UnauthorizedError('Tài khoản của bạn đã bị xóa');

    const ok = await Promise.resolve(comparePassword(password, user.password));
    if (!ok) throw new UnauthorizedError('Mật khẩu không chính xác');

    const accessTokenLife = env.ACCESS_TOKEN_LIFE;
    const accessTokenSecret = env.ACCESS_TOKEN_SECRET;

    const accessToken = await generateToken(
      { username: user.username },
      accessTokenSecret,
      accessTokenLife
    );
    if (!accessToken) {
      throw new UnauthorizedError('Đăng nhập không thành công, vui lòng thử lại.');
    }

    const refreshToken = await Promise.resolve(generateRefreshToken(user._id));
    if (!refreshToken) {
      throw new UnauthorizedError('Đăng nhập không thành công, vui lòng thử lại.');
    }

    await UpdateRefreshToken(user._id, refreshToken);

    return {
      msg: 'Đăng nhập thành công.',
      accessToken,
      refreshToken,
    };
  }
  private validateRefreshInput(
    headers: Record<string, any>,
    body: RefreshTokenRequest | undefined | null
  ) {
    const accessToken = getTokenFromReq(headers);
    if (!accessToken) throw new ValidationError('Không tìm thấy access token.');

    const refreshToken = body?.refreshToken?.trim();
    if (!refreshToken) throw new ValidationError('Không tìm thấy refresh token.');

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(
    headers: Record<string, any>,
    body: RefreshTokenRequest | undefined | null
  ): Promise<RefreshResult> {
    const { accessToken, refreshToken } = this.validateRefreshInput(headers, body);

    const decoded = await decodeToken(accessToken, env.ACCESS_TOKEN_SECRET);
    if (!decoded || !decoded?.payload?.username) {
      throw new ValidationError('Access token không hợp lệ.');
    }

    const username: string = decoded.payload.username;
    const user = await GetUser(username, '');
    if (!user) throw new UnauthorizedError('User không tồn tại.');

    if (refreshToken !== user.refreshToken) {
      throw new ValidationError('Refresh token không hợp lệ.');
    }

    // Tạo token mới
    const newAccessToken = await generateToken(
      { username },
      env.ACCESS_TOKEN_SECRET,
      env.ACCESS_TOKEN_LIFE
    );
    if (!newAccessToken) {
      throw new ValidationError('Tạo access token không thành công, vui lòng thử lại.');
    }

    // Rotate refresh token
    const newRefreshToken = await Promise.resolve(generateRefreshToken(user._id));
    await UpdateRefreshToken(user._id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

export default new AuthService();