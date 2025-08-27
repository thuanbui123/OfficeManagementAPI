import { listEmployees } from "@repositories/EmployeeRepository";

export type ListEmployeesQuery = {
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

export type ParsedListParams = {
  page: number;
  pageSize: number;
  baseFilter: Record<string, unknown>;
  keyword?: string;
  keywordFields?: string[];
  searchMode: 'regex' | 'text';
  sort?: Record<string, 1 | -1>;
  includeTotal: boolean;
};

class EmployeeService {
  /**
   * Chuẩn hoá/parse toàn bộ query cho API list
   */
  parseListParams(q: ListEmployeesQuery | undefined | null): ParsedListParams {
    const query = q ?? {};

    const page     = Math.max(1, toInt(query.page, 1));
    const pageSize = Math.max(1, toInt(query.pageSize ?? query.limit, 10));

    // keywordFields: CSV hoặc array
    let keywordFields: string[] | undefined;
    if (Array.isArray(query.keywordFields)) {
      keywordFields = (query.keywordFields as (string | undefined)[])
        .filter(Boolean) as string[];
    } else if (typeof query.keywordFields === 'string') {
      keywordFields = query.keywordFields
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    const searchMode: 'regex' | 'text' = query.mode === 'text' ? 'text' : 'regex';

    const baseFilter = (query.match as Record<string, unknown>) ?? {};

    const sort = (query.sort && typeof query.sort === 'object')
      ? (query.sort as Record<string, 1 | -1>)
      : undefined;

    const includeTotal =
      query.includeTotal === true ||
      String(query.includeTotal).toLowerCase() === 'true';

    return {
      page,
      pageSize,
      baseFilter,
      keyword: typeof query.keyword === 'string' ? query.keyword : undefined,
      keywordFields,
      searchMode,
      sort,
      includeTotal,
    };
  }

  /**
   * Action chính: list employees
   * - parse query
   * - gọi repository
   */
  async listEmployees(q: ListEmployeesQuery | undefined | null) {
    const params = this.parseListParams(q);
    return listEmployees(params);
  }
}

export default new EmployeeService();