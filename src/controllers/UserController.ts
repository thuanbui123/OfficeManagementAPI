import type { ListQuery, PaginateArgs, ReqQ, Res, Next } from '@app-types/common';

const UserList: { paginate: (args: PaginateArgs) => Promise<any> } =
  require('../repositories/UserRepository');

class UserController {
  async list(req: ReqQ<ListQuery>, res: Res, _next: Next) {
    try {
      const { limit, cursor, keyword, includeTotal, mode, match } = req.query;

      const result = await UserList.paginate({
        limit: limit !== undefined ? Number(limit) : undefined,
        cursor,
        keyword,
        includeTotal: includeTotal === true || String(includeTotal).toLowerCase() === 'true',
        mode,
        match,
      });

      res.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Bad Request';
      res.status(400).json({ error: message });
    }
  }
}

export default new UserController();
