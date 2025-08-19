import type {
  Model,
  FilterQuery,
  ProjectionType,
  SortOrder,
  Types,
  FlattenMaps,
} from "mongoose";
import {
  paginateKeyset,
  type PaginateKeysetOptions,
  type PaginateResult,
} from "./paginator";

export type BasePaginateParams = {
  limit?: number | string; // paginator chấp nhận number | string
  cursor?: string;
  includeTotal?: boolean;
} & Record<string, unknown>;

export type KeysetOptions<T> = PaginateKeysetOptions<T>;

export type CreateRepoConfig<
  TDoc extends { createdAt: Date; _id: Types.ObjectId },
  TParams extends BasePaginateParams
> = {
  model: Model<TDoc>;
  buildBaseFilter?: (params: TParams) => FilterQuery<TDoc>;
  select?: ProjectionType<TDoc> | string;
  sort?: Record<string, SortOrder>;
};

export function createPaginatedRepo<
  TDoc extends { createdAt: Date; _id: Types.ObjectId },
  TParams extends BasePaginateParams
>({
  model,
  buildBaseFilter,
  select,
  sort,
}: CreateRepoConfig<TDoc, TParams>) {
  return {
    async paginate(
      params: TParams
    ): Promise<
      PaginateResult<FlattenMaps<TDoc> & { _id: Types.ObjectId; createdAt: Date }>
    > {
      const { limit, cursor, includeTotal } = params;

      const baseFilter: FilterQuery<TDoc> = buildBaseFilter
        ? buildBaseFilter(params)
        : ({} as FilterQuery<TDoc>);

      return paginateKeyset<TDoc>(model, {
        limit,
        cursor,
        baseFilter,
        select: select ?? "_id createdAt",
        sort: sort ?? { createdAt: -1, _id: -1 },
        includeTotal,
      });
    },
  };
}
