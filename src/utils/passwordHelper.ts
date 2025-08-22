import bcrypt from "bcrypt";

const saltRounds = 10; // độ mạnh của salt

// Hash mật khẩu
export async function hashPassword(password: string) {
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// Kiểm tra mật khẩu
export async function comparePassword(password: string, hash: string) {
  const match = await bcrypt.compare(password, hash);
  return match;
}

