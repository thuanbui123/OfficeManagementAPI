import type { ReqQ, Res, Next } from '@app-types/common';
import { listEmployees } from '../repositories/EmployeeRepository';

type ListEmployeesQuery = {
  page?: string | number;
  pageSize?: string | number;
  limit?: string | number;              // alias pageSize
  keyword?: string;
  keywordFields?: string | string[];
  mode?: 'regex' | 'text';
  match?: Record<string, unknown>;
  sort?: Record<string, any>;
  includeTotal?: string | boolean;
};

const toInt = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

class EmployeeController {
  async list(req: ReqQ<ListEmployeesQuery>, res: Res, _next: Next) {
    try {
      const q = req.query || {};

      const page     = Math.max(1, toInt(q.page, 1)); 
      const pageSize = Math.max(1, toInt(q.pageSize ?? q.limit, 10));

      // keywordFields: CSV hoặc array
      let keywordFields: string[] | undefined;
      if (Array.isArray(q.keywordFields)) {
        keywordFields = q.keywordFields.filter(Boolean) as string[];
      } else if (typeof q.keywordFields === 'string') {
        keywordFields = q.keywordFields.split(',').map(s => s.trim()).filter(Boolean);
      }

      const searchMode: 'regex' | 'text' = q.mode === 'text' ? 'text' : 'regex';

      const baseFilter = (q.match as Record<string, unknown>) ?? {};
      const sort = (q.sort && typeof q.sort === 'object')
        ? (q.sort as Record<string, 1 | -1>)
        : undefined;
       const wantTotal =
      q.includeTotal === true || String(q.includeTotal).toLowerCase() === 'true';
      const result = await listEmployees({
        page,
        pageSize,
        baseFilter,
        keyword: typeof q.keyword === 'string' ? q.keyword : undefined,
        keywordFields,
        searchMode,
        sort,
        includeTotal: wantTotal,
      });

      res.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad Request';
      res.status(400).json({ error: message });
    }
  }
}

export default new EmployeeController();
