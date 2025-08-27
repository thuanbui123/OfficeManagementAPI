import type { ReqQ, Res, Next } from '@app-types/common';
import authService, { RegisterRequest, LoginRequest, RefreshTokenRequest  } from '@services/AuthService';

class AuthController {
    async Register (req: ReqQ<RegisterRequest>, res: Res, _next: Next) {
        try {
            const result = await authService.register(req.body);
            return res.json(result);
        } catch (e: any) {
            console.log(e);
            const status = typeof e?.status === 'number' ? e.status : 400;
            const message = e instanceof Error ? e.message : 'Bad Request';
            return res.status(status).json({ error: message });
        }
    }
    async Login (req: ReqQ<LoginRequest>, res: Res, _next: Next) {
        try {
            const result = await authService.login(req.body);
            return res.json(result);
        } catch (e: any) {
            console.log(e);
            const status = typeof e?.status === 'number' ? e.status : 400;
            const message = e instanceof Error ? e.message : 'Bad Request';
            return res.status(status).json({ error: message });
        }
    }
    async RefreshToken (req: ReqQ<RefreshTokenRequest>, res: Res, _next: Next) {
        try {
            const result = await authService.refreshAccessToken(req.headers as any, req.body);
            return res.json(result);
        } catch (e: any) {
            console.error('Err RefreshToken', e);
            const status = typeof e?.status === 'number' ? e.status : 400;
            const message = e instanceof Error ? e.message : 'Xảy ra lỗi khi cấp access token mới';
            return res.status(status).json({ error: message });
        }
    }

    async activate(req: ReqQ<any>, res: Res, next: Next) {
        try {
            const rawToken = String(req.query.token || "");
            await authService.activateAccountByToken(rawToken);

            return res.status(200).json("Tài khoản đã được kích hoạt thành công!");
        } catch (err: any) {
            console.error('Err activate', err);
            const status = typeof err?.status === 'number' ? err.status : 400;
            const message = err instanceof Error ? err.message : 'Xảy ra lỗi khi xác nhận đăng ký tài khoản mới';
            return res.status(status).json({ error: message });
        }
    }
}

export default new AuthController();
