// src/libs/keyword.ts
import type { FilterQuery } from "mongoose";

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type KeywordOptions = {
  /** 'any' = chỉ cần 1 token khớp; 'all' = mọi token đều khớp */
  mode?: "any" | "all";
  /** 'prefix' = ^token (ăn index tốt); 'contains' = chứa token */
  match?: "prefix" | "contains";
  /** Tách keyword theo khoảng trắng thành tokens */
  tokenize?: boolean;
  /** Regex flag i */
  caseInsensitive?: boolean;
};

/**
 * Tạo MongoDB filter ($or/$and + $regex) cho nhiều trường.
 * @param fields  Danh sách field cần match (vd: ['title', 'body', 'authorName'])
 * @param keyword Từ khóa người dùng nhập
 */
export function buildKeywordFilter<T = any>(
  fields: Array<keyof T | string>,
  keyword: string,
  opts: KeywordOptions = {}
): FilterQuery<T> {
  const {
    mode = "any",
    match = "prefix",
    tokenize = true,
    caseInsensitive = true,
  } = opts;

  const kw = (keyword ?? "").trim();
  if (!kw || !fields?.length) return {} as FilterQuery<T>;

  const tokens = tokenize ? kw.split(/\s+/).filter(Boolean) : [kw];
  const regexFlag = caseInsensitive ? "i" : "";

  const tokenClauses = tokens.map((token) => {
    const pattern =
      match === "prefix" ? `^${escapeRegex(token)}` : escapeRegex(token);

    return {
      $or: fields.map((f) => ({
        // đảm bảo key là string khi build object động
        [String(f)]: { $regex: pattern, $options: regexFlag },
      })),
    };
  });

  if (mode === "all") {
    return { $and: tokenClauses } as unknown as FilterQuery<T>;
  }

  // 'any' — chỉ cần 1 token khớp
  return { $or: tokenClauses } as unknown as FilterQuery<T>;
}
