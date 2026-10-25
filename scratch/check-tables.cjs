const { Client } = require('C:\\Realbiz Main\\realbiz_pro_server\\node_modules\\pg');
const client = new Client({
  host: '157.173.111.103',
  port: 5432,
  user: 'realbizdb_usr',
  password: 'P&HeDabr$/7%sFMo',
  database: 'realbizpro_db'
});
(async () => {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%user%' OR table_name LIKE '%grn%')");
  console.log(res.rows.map(r => r.table_name));
  await client.end();
})();
