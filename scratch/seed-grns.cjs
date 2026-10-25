const { Client } = require('C:\\Realbiz Main\\realbiz_pro_server\\node_modules\\pg');
const { randomUUID: uuidv4 } = require('crypto');

const client = new Client({
  host: '157.173.111.103',
  port: 5432,
  user: 'realbizdb_usr',
  password: 'P&HeDabr$/7%sFMo',
  database: 'realbizpro_db'
});

(async () => {
  await client.connect();
  
  // Fetch existing foreign keys
  const supRes = await client.query('SELECT uuid, "supplierName" FROM supplier_accounts LIMIT 5');
  const prjRes = await client.query('SELECT uuid, name, "projectType" FROM project LIMIT 5');
  const typeRes = await client.query('SELECT uuid, name FROM project_types LIMIT 5');
  const workRes = await client.query('SELECT uuid, name FROM categories LIMIT 5');
  const taskRes = await client.query('SELECT uuid, "taskName" FROM pr_task LIMIT 5');
  const userRes = await client.query('SELECT id, name FROM sys_users LIMIT 5');

  console.log('Suppliers in DB:', supRes.rows);
  console.log('Projects in DB:', prjRes.rows);

  if (supRes.rows.length === 0 || prjRes.rows.length === 0) {
    console.log('Not enough related data to seed.');
    await client.end();
    return;
  }

  const s1 = supRes.rows[0].uuid;
  const s2 = supRes.rows[1] ? supRes.rows[1].uuid : s1;
  const s3 = supRes.rows[2] ? supRes.rows[2].uuid : s1;

  const p1 = prjRes.rows[0].uuid;
  const pt1 = typeRes.rows[0] ? typeRes.rows[0].uuid : null;
  const w1 = workRes.rows[0] ? workRes.rows[0].uuid : null;
  const t1 = taskRes.rows[0] ? taskRes.rows[0].uuid : null;
  const u1 = userRes.rows[0] ? userRes.rows[0].id : null;

  const grns = [
    {
      uuid: uuidv4(),
      code: 'PO00005',
      reference: 'REC00105',
      date: '2026-10-24',
      supplier_id: s1,
      project_id: p1,
      project_type_id: pt1,
      title_of_work_id: w1,
      task_id: t1,
      added_by_id: u1,
      already_billed: true,
      approval_layer: 'all_approvals_completed',
      status: 'completed',
      subtotal: 15400,
      discount: 0,
      grand_total: 15400,
      paid: 15400,
      due: 0,
      note: null,
      attachment: null,
      deleted_at: null
    },
    {
      uuid: uuidv4(),
      code: 'PO00004',
      reference: 'REC00102',
      date: '2026-10-19',
      supplier_id: s2,
      project_id: p1,
      project_type_id: pt1,
      title_of_work_id: w1,
      task_id: t1,
      added_by_id: u1,
      already_billed: true,
      approval_layer: 'all_approvals_completed',
      status: 'completed',
      subtotal: 8250,
      discount: 0,
      grand_total: 8250,
      paid: 8250,
      due: 0,
      note: null,
      attachment: null,
      deleted_at: null
    },
    {
      uuid: uuidv4(),
      code: 'PO00003',
      reference: 'REC00100',
      date: '2026-10-18',
      supplier_id: s1,
      project_id: p1,
      project_type_id: pt1,
      title_of_work_id: w1,
      task_id: t1,
      added_by_id: u1,
      already_billed: true,
      approval_layer: 'all_approvals_completed',
      status: 'completed',
      subtotal: 24000,
      discount: 0,
      grand_total: 24000,
      paid: 24000,
      due: 0,
      note: null,
      attachment: null,
      deleted_at: null
    },
    {
      uuid: uuidv4(),
      code: 'PO00002',
      reference: 'REC00101',
      date: '2026-10-18',
      supplier_id: s3,
      project_id: p1,
      project_type_id: pt1,
      title_of_work_id: w1,
      task_id: t1,
      added_by_id: u1,
      already_billed: false,
      approval_layer: 'all_approvals_completed',
      status: 'approved',
      subtotal: 12500,
      discount: 500,
      grand_total: 12000,
      paid: 5000,
      due: 7000,
      note: 'rrrrrr',
      attachment: null,
      deleted_at: null
    },
    {
      uuid: uuidv4(),
      code: 'PO00001',
      reference: 'REC00099',
      date: '2026-10-17',
      supplier_id: s2,
      project_id: p1,
      project_type_id: pt1,
      title_of_work_id: w1,
      task_id: t1,
      added_by_id: u1,
      already_billed: false,
      approval_layer: 'all_approvals_completed',
      status: 'approved',
      subtotal: 9800,
      discount: 0,
      grand_total: 9800,
      paid: 0,
      due: 9800,
      note: null,
      attachment: null,
      deleted_at: null
    },
    {
      uuid: uuidv4(),
      code: 'PO00000',
      reference: 'REC00090',
      date: '2026-10-15',
      supplier_id: s1,
      project_id: p1,
      project_type_id: pt1,
      title_of_work_id: w1,
      task_id: t1,
      added_by_id: u1,
      already_billed: false,
      approval_layer: 'pending',
      status: 'pending',
      subtotal: 5000,
      discount: 0,
      grand_total: 5000,
      paid: 0,
      due: 5000,
      note: 'Archived test GRN',
      attachment: null,
      deleted_at: new Date().toISOString()
    }
  ];

  for (const g of grns) {
    const q = `
      INSERT INTO pr_grn (
        uuid, code, reference, date, supplier_id, project_id, project_type_id,
        title_of_work_id, task_id, added_by_id, already_billed, approval_layer,
        status, subtotal, discount, grand_total, paid, due, note, attachment,
        deleted_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
      ) ON CONFLICT (code) DO NOTHING
    `;
    await client.query(q, [
      g.uuid, g.code, g.reference, g.date, g.supplier_id, g.project_id, g.project_type_id,
      g.title_of_work_id, g.task_id, g.added_by_id, g.already_billed, g.approval_layer,
      g.status, g.subtotal, g.discount, g.grand_total, g.paid, g.due, g.note, g.attachment,
      g.deleted_at
    ]);
  }

  console.log('GRN seed complete');
  await client.end();
})();
