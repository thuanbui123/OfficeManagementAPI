import type {
  Model,
  FilterQuery,
  ProjectionType,
  SortOrder,
  Types,
  FlattenMaps,
  PipelineStage 
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

export type LookupConfig = {
  from: string; // Name of the collection to lookup
  localField: string; // Field in the current collection (ObjectId reference)
  foreignField: string; // Field in the "from" collection to match
  as: string; // Alias for the joined data
  pipeline?: object[]; // Optional: Aggregation pipeline for additional processing
};

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

type Select =
  | string                   // ví dụ: "name email"
  | Record<string, 0 | 1>;   // ví dụ: { name: 1, email: 1 }

export async function aggregateMultipleCollections<TDoc>({
  model,
  baseFilter,
  skip,   
  limit,
  select,
  sort,
  lookupConfigs,
  includeTotal = false,
  keyword,
  keywordFields,
  searchMode = 'regex',
}: {
  model: Model<TDoc>;
  baseFilter?: FilterQuery<TDoc>;
  skip?: number; 
  limit: number | string;
  select?: Select;
  sort?: Record<string, 1 | -1>;
  lookupConfigs?: LookupConfig[];
  includeTotal?: boolean;
  keyword?: string;
  keywordFields?: string[];
  searchMode?: 'regex' | 'text';
}) {

  const andConds: FilterQuery<TDoc>[] = [];

  if (baseFilter && Object.keys(baseFilter).length) {
    andConds.push(baseFilter);
  }

  if (keyword && keyword.trim()) {
    if (searchMode === 'text') {
      andConds.push({ $text: { $search: keyword.trim() } } as any);
    } else if (keywordFields?.length) {
      const k = keyword.trim();
      andConds.push({
        $or: keywordFields.map((f) => ({
          [f]: { $regex: k, $options: 'i' },
        })) as any[],
      } as any);
    }
  }

  // --- stage đầu tiên: $match (nếu có) ---
  const matchStage =
    andConds.length > 0
      ? ({
          $match: andConds.length === 1 ? andConds[0] : ({ $and: andConds } as any),
        } as PipelineStage.Match)
      : undefined;

  // --- các stage sau $match theo đúng thứ tự bạn đang có ---
  const afterMatchStages: PipelineStage[] = [];

  afterMatchStages.push(
    { $sort: sort ?? { createdAt: -1 as -1, _id: -1 as -1 } } as PipelineStage.Sort
  );

  if (lookupConfigs?.length) {
    for (const lk of lookupConfigs) {
      afterMatchStages.push({ $lookup: lk } as PipelineStage.Lookup);
    }
  }
  if (typeof skip === 'number' && skip > 0) {
    afterMatchStages.push({ $skip: skip } as PipelineStage.Skip);
  }
  if (limit != null) {
    afterMatchStages.push({ $limit: Number(limit) } as PipelineStage.Limit);
  }

  const project: Record<string, 0 | 1> = { _id: 1, createdAt: 1 };
  if (select) {
    if (typeof select === 'string') {
      for (const f of select.split(/\s+/).filter(Boolean)) project[f] = 1;
    } else {
      Object.assign(project, select);
    }
  }
  afterMatchStages.push({ $project: project } as PipelineStage.Project);

  // --- Không cần total: chạy như cũ ---
  if (!includeTotal) {
    const pipeline: PipelineStage[] = [];
    if (matchStage) pipeline.push(matchStage);
    pipeline.push(...afterMatchStages);

    const items = await model.aggregate(pipeline).exec();
    return { items, total: undefined as number | undefined };
  }

  // --- Cần total: dùng $facet ---
  const facetStage: PipelineStage.Facet = {
    $facet: {
      data: afterMatchStages as PipelineStage.FacetPipelineStage[],
      total: [{ $count: 'value' }],  // đếm KHÔNG bị $limit
    },
  };

  const facetPipeline: PipelineStage[] = [];
  if (matchStage) facetPipeline.push(matchStage);
  facetPipeline.push(facetStage);

  const facetResult = await model.aggregate(facetPipeline).exec();
  const first = (facetResult && facetResult[0]) || {};
  const total =
    Array.isArray(first.total) && first.total[0]?.value
      ? Number(first.total[0].value)
      : 0;
  const items = (first.data as any[]) ?? [];

  return { items, total };
}
