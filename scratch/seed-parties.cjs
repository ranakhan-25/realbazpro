const { Client } = require('C:\\Realbiz Main\\realbiz_pro_server\\node_modules\\pg');
const { randomUUID } = require('crypto');

const client = new Client({
  host: '157.173.111.103',
  port: 5432,
  user: 'realbizdb_usr',
  password: 'P&HeDabr$/7%sFMo',
  database: 'realbizpro_db'
});

const parties = [
  {
    code: 'P-202600046',
    name: 'Ridoy Enterprise',
    notes: 'Mollitia exercitatio',
    type: 'Contractor',
    phone: '+1 (835) 993-8208',
    trade_license_no: 'Esse officiis et li',
    nid_no: 'Ea aut at et optio',
    status: 'active',
    created_at: '2026-10-11T00:15:00.000Z'
  },
  {
    code: 'P-202600045',
    name: 'Rakib Decorator',
    notes: 'Incidunt minus dol',
    type: 'Contractor',
    phone: '+1 (563) 694-1269',
    trade_license_no: 'Beatae pariatur Nec',
    nid_no: 'Debitis possimus ex',
    status: 'active',
    created_at: '2026-10-11T00:14:00.000Z'
  },
  {
    code: 'P-202600044',
    name: 'Khan Enterprise',
    notes: 'Velit veniam ut odi',
    type: 'Contractor',
    phone: '+1 (322) 655-8975',
    trade_license_no: 'Accusamus qui earum',
    nid_no: 'Illum esse iure vo',
    status: 'active',
    created_at: '2026-10-11T00:14:00.000Z'
  },
  {
    code: 'P-202600043',
    name: 'M/S Islam Brothers',
    notes: 'Quo ut iusto debitis',
    type: 'Contractor',
    phone: '+1 (356) 419-5892',
    trade_license_no: 'Nulla quae inventore',
    nid_no: 'Quasi qui ipsum sin',
    status: 'active',
    created_at: '2026-10-11T00:14:00.000Z'
  },
  {
    code: 'P-202600042',
    name: 'M/S K N International',
    notes: 'Vel et sed quaerat q',
    type: 'Contractor',
    phone: '+1 (944) 401-6073',
    trade_license_no: 'Nobis iure sed aliqu',
    nid_no: 'Ullam maiores consec',
    status: 'active',
    created_at: '2026-10-11T00:13:00.000Z'
  },
  {
    code: 'P-202600041',
    name: 'Bangladesh Structural Engineering',
    notes: 'Quis cupidatat molli',
    type: 'Contractor',
    phone: '+1 (208) 427-5671',
    trade_license_no: 'Mollit fuga Magna e',
    nid_no: 'Est aliquip in est',
    status: 'active',
    created_at: '2026-10-11T00:13:00.000Z'
  },
  {
    code: 'P-202600040',
    name: 'R A Construction & Development',
    notes: 'Commodo esse corrupt',
    type: 'Contractor',
    phone: '+1 (789) 359-7196',
    trade_license_no: 'Corrupti sed except',
    nid_no: 'Maiores numquam occa',
    status: 'active',
    created_at: '2026-10-11T00:13:00.000Z'
  },
  {
    code: 'P-202600039',
    name: 'Khan Enterprise- SD',
    notes: 'Ducimus id iusto re',
    type: 'Contractor',
    phone: '+1 (819) 176-3831',
    trade_license_no: 'Dolores ut voluptate',
    nid_no: 'Do voluptatem minim',
    status: 'active',
    created_at: '2026-10-11T00:12:00.000Z'
  }
];

(async () => {
  await client.connect();
  for (const p of parties) {
    const q = `
      INSERT INTO parties (
        uuid, code, name, notes, type, phone, trade_license_no, nid_no, status,
        is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $10
      ) ON CONFLICT (code) DO NOTHING
    `;
    await client.query(q, [
      randomUUID(), p.code, p.name, p.notes, p.type, p.phone,
      p.trade_license_no, p.nid_no, p.status, p.created_at
    ]);
  }
  console.log('Parties seed complete');
  await client.end();
})();
