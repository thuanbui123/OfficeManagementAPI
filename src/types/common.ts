
export type Mode = 'any' | 'all';
export type Match = 'prefix' | 'contains';

export type ListQuery = {
  limit?: string | number;
  cursor?: string;
  keyword?: string;
  includeTotal?: string | boolean;
  mode?: Mode;
  match?: Match;
};

export type PaginateArgs = {
  limit?: number;
  cursor?: string;
  keyword?: string;
  includeTotal?: boolean;
  mode?: Mode;
  match?: Match;
};

export type PaginatedResult<T = any> = {
  items: T[];
  nextCursor?: string | null;
  total?: number;
};

// tiện alias
export type ReqQ<Q> = import('express').Request<any, any, any, Q>;
export type Res = import('express').Response;
export type Next = import('express').NextFunction;
