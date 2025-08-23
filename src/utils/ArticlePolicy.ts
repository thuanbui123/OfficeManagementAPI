type UserAuth = { userId: string; roles: string[]; perms: string[] };
type Article = { authorId: string | number };

export function canUpdateArticle(user: UserAuth, article: Article) {
  if (user.roles.includes("admin") || user.roles.includes("superadmin")) return true;
  if (!user.perms.includes("article:update")) return false;
  return String(article.authorId) === String(user.userId);
}