import jwt, { SignOptions } from "jsonwebtoken";
import "dotenv/config";

export type JwtPayload = {
  id: string;
  email: string;
  role: string;
};

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};
