import type { ReqQ, Res, Next } from '@app-types/common';
import UserService, { ListQuery } from "@services/UserService";

class UserController {
  async list(req: ReqQ<ListQuery>, res: Res, _next: Next) {
    try {
      var rs = await UserService.list(req.query);
      res.json(rs);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Bad Request';
      res.status(400).json({ error: message });
    }
  }
}

export default new UserController();
