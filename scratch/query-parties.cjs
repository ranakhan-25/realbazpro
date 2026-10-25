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
  const res = await client.query('SELECT code, name, type, phone, status FROM parties ORDER BY created_at DESC LIMIT 10');
  console.log('Parties count:', res.rows.length);
  for (const r of res.rows) {
    console.log(r);
  }
  await client.end();
})();
