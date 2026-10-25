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
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'parties'");
  console.log(res.rows.map(r => r.column_name));
  await client.end();
})();
