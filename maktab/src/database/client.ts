import { Env } from '../types';

export const getDB = (env: Env): D1Database => {
  return env.DB;
};

export const getR2 = (env: Env): R2Bucket => {
  return env.FILES;
};
