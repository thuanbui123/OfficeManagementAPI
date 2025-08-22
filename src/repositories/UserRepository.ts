import mongoose, { ObjectId } from "mongoose";
import UserModel, { User } from "@models/User";

import type { PaginateArgs, PaginatedResult } from "@app-types/common";

// các lib JS: khai báo type tối thiểu
const { createPaginatedRepo } = require("../libs/createPaginatedRepo") as {
  createPaginatedRepo: <T>(opts: {
    model: mongoose.Model<T>;
    select?: string | Record<string, 1 | 0>;
    buildBaseFilter?: (params: any) => any;
  }) => {
    paginate: (args: PaginateArgs) => Promise<PaginatedResult<T>>;
  };
};

const { buildKeywordFilter } = require("../libs/keyword") as {
  buildKeywordFilter: (
    fields: string[],
    keyword: string,
    opts?: {
      mode?: "any" | "all";
      match?: "prefix" | "contains";
      tokenize?: boolean;
      caseInsensitive?: boolean;
    }
  ) => any;
};

// Repo có paginate()
export const UserList = createPaginatedRepo<User>({
  model: UserModel,
  select: "_id username createdAt",
  buildBaseFilter: ({
    keyword,
    authorId,
    mode,
    match,
  }: PaginateArgs & { authorId?: string }) => {
    const filter: Record<string, any> = {};

    if (authorId && mongoose.isValidObjectId(authorId)) {
      filter.authorId = new mongoose.Types.ObjectId(authorId);
    }

    if (keyword && keyword.trim()) {
      const keywordFilter = buildKeywordFilter(
        ["username", "email", "fullName"],
        keyword,
        {
          mode: mode || "any",
          match: match || "prefix",
          tokenize: true,
          caseInsensitive: true,
        }
      );
      Object.assign(filter, keywordFilter);
    }

    return filter;
  },
});

export const GetUser = async (username: string, email: string) => {
  return await UserModel.findOne({
    $or: [{ username }, { email }],
  });
};

export const CreateUser = async (data: Partial<User>) => {
  try {
    const user = new UserModel(data); 
    await user.save();
    return { ok: true, user };
  } catch (e: any) {
    console.error("Error in CreateUser:", e?.message || e);
    return { ok: false, error: e };
  }
};

export const UpdateRefreshToken = async (userId: ObjectId, refreshToken: string) => {
  try {
    const result = await UserModel.updateOne(
      { _id: userId },
      { $set: { refreshToken } }
    );
    return { ok: true, result };
  } catch (e: any) {
    console.error("Error in UpdateRefreshToken:", e?.message || e);
    return { ok: false, error: e };
  }
}
