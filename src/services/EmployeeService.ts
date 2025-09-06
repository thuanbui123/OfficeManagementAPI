import { listEmployees } from "@repositories/EmployeeRepository";
import { Types } from "mongoose";

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

type Emp = { 
    id: Types.ObjectId;
    empCode: string;
    email: string;
    fullName: string;
    deptId?: Types.ObjectId;
    userId?: Types.ObjectId;
    title?: string;
    hireDate: Date;
    salary: Number;
};
const db = new Map<string, Emp>();

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

  async create(data: Omit<Emp, 'id'> & { id?: Types.ObjectId }) {
    const id = data.id ?? new Types.ObjectId();
    if (db.has(id.toString())) throw new Error('Employee exists');
    const emp: Emp = { 
      id, 
      empCode: data.empCode,
      hireDate: data.hireDate,
      salary: data.salary,
      email: data.email, 
      fullName: data.fullName, 
      deptId: data?.deptId, 
      userId: data?.userId,
      title: data.title 
    };
    db.set(id.toHexString(), emp);
    return emp;
  }

  async update(id: string, changes: Partial<Emp>) {
    const cur = db.get(id);
    if (!cur) throw new Error('Not found');
    const after = { ...cur, ...changes, id: cur.id };
    db.set(id, after);
    return { before: cur, after };
  }
}

export default new EmployeeService();