import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type PoolInstance = InstanceType<typeof Pool>;
type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let poolInstance: PoolInstance | null = null;
let dbInstance: DbInstance | null = null;

export function getPool(): PoolInstance {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL must be set. Add your Supabase Postgres connection string before using the API.",
      );
    }

    try {
      const parsed = new URL(connectionString);
      if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw new Error(
        "DATABASE_URL is not a valid Postgres connection string. Replace the placeholder in .env.local with your real Supabase Postgres URL.",
      );
    }

    poolInstance = new Pool({
      connectionString,
      ssl:
        process.env.DATABASE_SSL === "false"
          ? false
          : { rejectUnauthorized: false },
    });
  }

  return poolInstance;
}

export function getDb(): DbInstance {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }

  return dbInstance;
}

export const pool = new Proxy({} as PoolInstance, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getPool(), prop, receiver);
    return typeof value === "function" ? value.bind(getPool()) : value;
  },
});

export const db = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});

export * from "./schema";
