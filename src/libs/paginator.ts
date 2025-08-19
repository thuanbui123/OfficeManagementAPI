import type {
  Model,
  FilterQuery,
  ProjectionType,
  SortOrder,
  Types,
  FlattenMaps,
} from "mongoose";
import mongoose from "mongoose";

export type CursorObject = { createdAt: Date; _id: Types.ObjectId };

export function encodeCursor({ createdAt, _id }: CursorObject): string {
  return Buffer.from(`${createdAt.toISOString()}|${_id.toString()}`).toString(
    "base64url"
  );
}

export function decodeCursor(cursor: string): CursorObject | null {
  try {
    const [iso, id] = Buffer.from(cursor, "base64url")
      .toString("utf8")
      .split("|");
    if (!iso || !id || !mongoose.isValidObjectId(id)) return null;
    return { createdAt: new Date(iso), _id: new mongoose.Types.ObjectId(id) };
  } catch {
    return null;
  }
}

export function clampLimit(
  limit: unknown,
  min = 1,
  max = 100,
  def = 20
): number {
  const n =
    typeof limit === "number"
      ? limit
      : Number.parseInt(String(limit ?? ""), 10);
  return Math.min(Math.max(Number.isNaN(n) ? def : n, min), max);
}

export type PaginateKeysetOptions<T> = {
  limit?: number | string;
  cursor?: string;
  baseFilter?: FilterQuery<T>;
  sort?: Record<string, SortOrder>;
  select?: ProjectionType<T> | string;
  includeTotal?: boolean;
};

export type PaginateResult<I> = {
  items: I[];
  hasMore: boolean;
  nextCursor: string | null;
  total?: number;
};

/** Keyset pagination – yêu cầu tài liệu có `createdAt` và `_id`. */
export async function paginateKeyset<
  T extends { createdAt: Date; _id: Types.ObjectId }
>(
  model: Model<T>,
  {
    limit,
    cursor,
    baseFilter = {} as FilterQuery<T>,
    sort = { createdAt: -1, _id: -1 },
    select = "_id createdAt",
    includeTotal = false,
  }: PaginateKeysetOptions<T>
): Promise<
  PaginateResult<
    // kết quả từ .lean() ~ FlattenMaps<T> thêm _id/createdAt
    FlattenMaps<T> & { _id: Types.ObjectId; createdAt: Date }
  >
> {
  const _limit = clampLimit(limit);
  const filter: FilterQuery<T> = { ...(baseFilter as object) } as FilterQuery<T>;

  if (cursor) {
    const parsed = decodeCursor(cursor);
    if (!parsed) throw new Error("Invalid cursor");
    (filter as any).$or = [
      { createdAt: { $lt: parsed.createdAt } },
      { createdAt: parsed.createdAt, _id: { $lt: parsed._id } },
    ];
  }

  const needCount = !cursor && !!includeTotal;

  const [docs, total] = await Promise.all([
    model.find(filter).sort(sort).select(select).limit(_limit + 1).lean(),
    needCount ? model.countDocuments(baseFilter) : Promise.resolve(undefined),
  ]);

  let hasMore = false;
  let nextCursor: string | null = null;

  if (docs.length > _limit) {
    hasMore = true;
    const last = docs[_limit - 1] as any as CursorObject;
    nextCursor = encodeCursor({ createdAt: last.createdAt, _id: last._id });
    (docs as any).splice(_limit);
  }

  return {
    items: docs as any,
    hasMore,
    nextCursor,
    ...(typeof total === "number" ? { total } : {}),
  };
}
