import mongoose from 'mongoose';
import type { PaginateArgs, PaginatedResult } from '@app-types/common';

// Model User đang là JS nên require + gắn type Model<any>
const User = require('../models/User').default;

// createPaginatedRepo từ JS: khai báo type tối thiểu cho hàm trả về
const { createPaginatedRepo } = require('../libs/createPaginatedRepo') as {
  createPaginatedRepo: <T>(opts: {
    model: mongoose.Model<T>;
    select?: string | Record<string, 1 | 0>;
    buildBaseFilter?: (params: any) => any;
  }) => {
    paginate: (args: PaginateArgs) => Promise<PaginatedResult<T>>;
  };
};

// buildKeywordFilter từ JS: type tối thiểu
const { buildKeywordFilter } = require('../libs/keyword') as {
  buildKeywordFilter: (
    fields: string[],
    keyword: string,
    opts?: {
      mode?: 'any' | 'all';
      match?: 'prefix' | 'contains';
      tokenize?: boolean;
      caseInsensitive?: boolean;
    }
  ) => any;
};

// Tạo repo có paginate()
const UserList = createPaginatedRepo<any>({
  model: User,
  select: '_id username createdAt',
  buildBaseFilter: ({ keyword, authorId, mode, match }: PaginateArgs & { authorId?: string }) => {
    const filter: Record<string, any> = {};

    if (authorId && mongoose.isValidObjectId(authorId)) {
      filter.authorId = new mongoose.Types.ObjectId(authorId);
    }

    if (keyword && keyword.trim()) {
      // TODO: nếu đây là repo User, bạn nên đổi các field cho đúng schema User
      // ví dụ: ['username', 'email', 'fullName'] thay vì ['title','body','authorName']
      const keywordFilter = buildKeywordFilter(
        ["username", "email", "fullName"],
        keyword,
        {
          mode: mode || 'any',        // 'any' (mặc định) hoặc 'all'
          match: match || 'prefix',   // 'prefix' (ăn index) hoặc 'contains'
          tokenize: true,             // tách keyword thành token
          caseInsensitive: true,
        }
      );
      Object.assign(filter, keywordFilter);
    }

    return filter;
  },
});

// Giữ CommonJS export để code cũ không cần sửa
module.exports = UserList;
