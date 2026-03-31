import PgBoss from "pg-boss";

export function createPgBoss(connectionString = process.env.DATABASE_URL): PgBoss {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for pg-boss.");
  }

  return new PgBoss({
    connectionString,
    schema: "pgboss"
  });
}
