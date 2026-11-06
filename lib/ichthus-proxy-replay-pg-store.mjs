// G2 STAGED ONLY: PostgreSQL transaction adapter for replay prevention.
// No connection URL or driver dependency is loaded here. The authorized
// deployment must inject a dedicated, least-privileged pg-compatible Pool.
// No routes, Meta calls or production configuration in this module.
const ERROR="proxy_permit_store_unavailable";
export function createIchthusProxyReplayStore({ pool }) {
  if (!pool || typeof pool.connect !== "function") throw new Error(ERROR);
  return async function insertAndCommit({ sql, params }) {
    if (typeof sql !== "string" ||
        !/^insert into proxy_meta\.ichthus_exchange_permit_uses\b/i.test(sql.trim()) ||
        !/\bon conflict do nothing\b/i.test(sql) ||
        !/\breturning permit_id\b/i.test(sql) ||
        !Array.isArray(params) || params.length !== 5) throw new Error(ERROR);
    let client;
    let transactionOpened=false;
    try {
      client=await pool.connect();
      // Require a restricted runtime role. This must be checked on EACH
      // connection, not just when the pool is constructed.
      const role=await client.query(`select current_user as role, r.rolsuper as superuser,
               r.rolbypassrls as bypassrls
               from pg_roles r where r.rolname=current_user`);
      if (role.rows.length !== 1 ||
          role.rows[0].role !== "proxy_meta_ichthus_replay_login" ||
          role.rows[0].superuser !== false || role.rows[0].bypassrls !== false)
        throw new Error(ERROR);
      await client.query("BEGIN");
      transactionOpened=true;
      const inserted=await client.query(sql,params);
      if (![0,1].includes(inserted.rowCount)) throw new Error(ERROR);
      await client.query("COMMIT");
      transactionOpened=false;
      return {rowCount:inserted.rowCount};
    } catch {
      if (client && transactionOpened) {
        try { await client.query("ROLLBACK"); } catch { /* fail closed */ }
      }
      throw new Error(ERROR);
    } finally {
      client?.release?.();
    }
  };
}
