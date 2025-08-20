import { Model, PipelineStage, FilterQuery } from 'mongoose';
import EmployeeModel, { type Employee } from '../models/Employee';
import { aggregateMultipleCollections } from '../libs/createPaginatedRepo';

export type EmployeeListParams = {
  page?: number;
  pageSize?: number;
  baseFilter?: FilterQuery<Employee>;
  keyword?: string;
  keywordFields?: string[];
  searchMode?: 'regex' | 'text';
  sort?: Record<string, 1 | -1>;
  select?: Record<string, 0 | 1> | string;
  includeTotal?: boolean;
};

const employeeLookups: {
  from: string; localField: string; foreignField: string; as: string; pipeline?: PipelineStage[];
}[] = [
  {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: 'user',
    pipeline: [{ $project: { _id: 1, username: 1, img: 1 } }],
  },
  {
    from: 'departments',
    localField: 'deptId',
    foreignField: '_id',
    as: 'department',
    pipeline: [{ $project: { _id: 1, name: 1 } }],
  },
];

export async function listEmployees(params: EmployeeListParams = {}) {
  const {
    page = 1,
    pageSize = 10,
    baseFilter = {},
    keyword,
    keywordFields = ['fullName', 'title'],
    searchMode = 'regex',
    sort = { createdAt: -1 },
    select = {
      empCode: 1, fullName: 1, title: 1, deptId: 1, userId: 1, hireDate: 1, salary: 1,
      'user.username': 1, 'department.name': 1,
    },
    includeTotal = true,
  } = params;

  const skip = Math.max(0, (page - 1) * pageSize);

  const { items, total } = await aggregateMultipleCollections<Employee>({
    model: EmployeeModel as unknown as Model<Employee>,
    baseFilter,
    skip,
    limit: pageSize,
    select,
    sort,
    lookupConfigs: employeeLookups,
    includeTotal, 
    keyword,
    keywordFields,
    searchMode,
  });

  return {
    items,
    total: includeTotal ? total ?? 0 : undefined,          
    page,
    pageSize,
    totalPages: includeTotal && total ? Math.ceil(total / pageSize) : undefined, 
  };
}
