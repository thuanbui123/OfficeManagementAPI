import jwt, { SignOptions, Jwt } from "jsonwebtoken";
const promisify = require('util').promisify;
import env from "@config/env";
const verify = promisify(jwt.verify).bind(jwt);

export const generateToken = (
  payload: object,
  secretSignature: string,
  tokenLife: string | number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      secretSignature,
      { algorithm: "HS256", expiresIn: tokenLife } as SignOptions,
      (err, token) => {
        if (err || !token) return reject(err);
        resolve(token);
      }
    );
  });
};

export const decodeToken = async (token: string, secretKey: string) => {
  // luôn return Promise
  return new Promise<Jwt | string>((resolve, reject) => {
    jwt.verify(
      token,
      secretKey,
      { ignoreExpiration: true, complete: true }, // <- luôn có .payload
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded!); // decoded: { header, payload, signature }
      }
    );
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    env.JWT_REFRESH_SECRET,
    { algorithm: "HS256", expiresIn: "7d" }
  );
};