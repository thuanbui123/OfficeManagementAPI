import { UserList } from '@repositories/UserRepository';

export type ListQuery = {
  limit?: string | number;
  cursor?: string;                 // tuỳ implement cursor
  keyword?: string;
  includeTotal?: string | boolean; // "true"/true
  mode?: 'regex' | 'text' | string;
  match?: Record<string, unknown>;
};

export type ParsedUserListParams = {
  limit?: number;
  cursor?: string;
  keyword?: string;
  includeTotal: boolean;
  mode?: 'regex' | 'text';
  match?: Record<string, unknown>;
};

const toInt = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
};

const toBool = (v: unknown, def = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return def;
};

class UserService {
    parseListParams(q?: ListQuery | null): ParsedUserListParams {
        const limitNum = toInt(q?.limit);
        const limit = limitNum !== undefined ? Math.max(1, limitNum) : undefined;

        const mode = q?.mode === 'text' ? 'text'
                : q?.mode === 'regex' ? 'regex'
                : undefined;

        const includeTotal = toBool(q?.includeTotal, false);

        const params: ParsedUserListParams = {
        limit,
        cursor: q?.cursor || undefined,
        keyword: typeof q?.keyword === 'string' ? q!.keyword : undefined,
        includeTotal,
        mode,
        match: (q?.match && typeof q.match === 'object') ? q.match : undefined,
        };

        return params;
    }
    async list(q: ListQuery | undefined | null) {
        const params = this.parseListParams(q);

        return UserList.paginate(params as any);
    }
}

export default new UserService();