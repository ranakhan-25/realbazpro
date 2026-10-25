const fs = require('fs');

// 1. Update query-grn.dto.ts
const dtoPath = 'C:\\Realbiz Main\\realbiz_pro_server\\src\\modules\\procurement\\grn\\dto\\query-grn.dto.ts';
let dtoContent = fs.readFileSync(dtoPath, 'utf8');
if (!dtoContent.includes('deleted_only')) {
  dtoContent = dtoContent.replace(
    '@IsOptional() @IsBooleanString() already_billed?: string;',
    '@IsOptional() @IsBooleanString() already_billed?: string;\n  @IsOptional() withDeleted?: boolean | string;\n  @IsOptional() deleted_only?: boolean | string;'
  );
  fs.writeFileSync(dtoPath, dtoContent, 'utf8');
  console.log('query-grn.dto.ts updated');
}

// 2. Update grn.service.ts
const servicePath = 'C:\\Realbiz Main\\realbiz_pro_server\\src\\modules\\procurement\\grn\\grn.service.ts';
let serviceContent = fs.readFileSync(servicePath, 'utf8');

const oldIncludes = `const includes = [
  { model: SysCompany, as: 'company', attributes: ['uuid', 'name'], required: false },
  { model: SupplierAccounts, as: 'supplier', attributes: ['uuid', 'supplierCode', 'supplierName'] },
  { model: ProjectType, as: 'projectType', attributes: ['uuid', 'code', 'name'], required: false },
  { model: Project, as: 'project', attributes: ['uuid', 'code', 'name'], required: false },
  { model: BillingCategory, as: 'titleOfWork', attributes: ['uuid', 'code', 'name'], required: false },
  { model: Task, as: 'task', attributes: ['uuid', 'taskName'], required: false },
  { model: Site, as: 'site', attributes: ['uuid', 'code', 'name'], required: false },
  { model: Category, as: 'category', attributes: ['uuid', 'code', 'name'], required: false },
  { model: ProcurementPurchaseOrder, as: 'purchaseOrder', attributes: ['uuid', 'code', 'reference'], required: false },
  { model: ProcurementMaterialRequisition, as: 'requisition', attributes: ['uuid', 'code'], required: false },
  { model: SysUser, as: 'addedBy', attributes: ['id', 'name'], required: false },
  { model: ProcurementGrnItem, as: 'items', include: [
    { model: ProcurementItemEntry, as: 'item', attributes: ['uuid', 'item_code', 'name'], required: false },
    { model: ProcurementUnit, as: 'unitRelation', attributes: ['uuid', 'code', 'name'], required: false },
    { model: ProcurementPurchaseOrderItem, as: 'purchaseOrderItem', attributes: ['uuid', 'item_code', 'quantity', 'rate'], required: false },
  ] },
];`;

const newIncludes = `const includes = [
  { association: 'company', attributes: ['uuid', 'name'], required: false },
  { association: 'supplier', attributes: ['uuid', 'supplierCode', 'supplierName'], required: false },
  { association: 'projectType', attributes: ['uuid', 'code', 'name'], required: false },
  { association: 'project', attributes: ['uuid', 'code', 'name'], required: false },
  { association: 'titleOfWork', attributes: ['uuid', 'code', 'name'], required: false },
  { association: 'task', attributes: ['uuid', 'taskName'], required: false },
  { association: 'site', attributes: ['uuid', 'code', 'name'], required: false },
  { association: 'category', attributes: ['uuid', 'code', 'name'], required: false },
  { association: 'purchaseOrder', attributes: ['uuid', 'code', 'reference'], required: false },
  { association: 'requisition', attributes: ['uuid', 'code'], required: false },
  { association: 'addedBy', attributes: ['id', 'name'], required: false },
  { association: 'items', include: [
    { association: 'item', attributes: ['uuid', 'item_code', 'name'], required: false },
    { association: 'unitRelation', attributes: ['uuid', 'code', 'name'], required: false },
    { association: 'purchaseOrderItem', attributes: ['uuid', 'item_code', 'quantity', 'rate'], required: false },
  ], required: false },
];`;

if (serviceContent.includes(oldIncludes)) {
  serviceContent = serviceContent.replace(oldIncludes, newIncludes);
  console.log('includes replaced with associations');
} else {
  console.log('oldIncludes not found, checking if already replaced');
}

// In dropdowns, replace { model: ProcurementUnit, as: 'unit' } with { association: 'unit' }
if (serviceContent.includes("include: [{ model: ProcurementUnit, as: 'unit'")) {
  serviceContent = serviceContent.replace(
    "include: [{ model: ProcurementUnit, as: 'unit', attributes: ['uuid', 'code', 'name'] }]",
    "include: [{ association: 'unit', attributes: ['uuid', 'code', 'name'] }]"
  );
  console.log('dropdown item unit include replaced');
}

// In findAll, update signature and query logic
const oldFindAll = `  async findAll(query: QueryGrnDto) {
    const { page = 1, limit = 10, search, date_from, date_to, already_billed, ...filters } = query;
    const where: any = {};
    for (const key of ['company_id', 'supplier_id', 'project_type_id', 'project_id', 'title_of_work_id', 'task_id', 'added_by_id', 'approval_layer', 'status']) if ((filters as any)[key] !== undefined) where[key] = (filters as any)[key];
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    else if (date_from) where.date = { [Op.gte]: date_from };
    else if (date_to) where.date = { [Op.lte]: date_to };
    if (already_billed !== undefined) where.already_billed = already_billed === 'true';
    if (search) where[Op.or] = [{ code: { [Op.like]: \`%\${search}%\` } }, { reference: { [Op.like]: \`%\${search}%\` } }];
    const { rows, count } = await this.grnModel.findAndCountAll({ where, include: includes, distinct: true, limit, offset: (page - 1) * limit, order: [['createdAt', 'DESC']] });
    return { data: rows, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) || 1 } };
  }`;

const newFindAll = `  async findAll(query: QueryGrnDto) {
    const { page = 1, limit = 10, search, date_from, date_to, already_billed, withDeleted, deleted_only, ...filters } = query as any;
    const where: any = {};
    for (const key of ['company_id', 'supplier_id', 'project_type_id', 'project_id', 'title_of_work_id', 'task_id', 'added_by_id', 'approval_layer', 'status']) if ((filters as any)[key] !== undefined) where[key] = (filters as any)[key];
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    else if (date_from) where.date = { [Op.gte]: date_from };
    else if (date_to) where.date = { [Op.lte]: date_to };
    if (already_billed !== undefined) where.already_billed = already_billed === 'true' || already_billed === true;
    if (search) where[Op.or] = [{ code: { [Op.like]: \`%\${search}%\` } }, { reference: { [Op.like]: \`%\${search}%\` } }];

    let paranoid = true;
    if (deleted_only === 'true' || deleted_only === true) {
      where.deletedAt = { [Op.ne]: null };
      paranoid = false;
    } else if (withDeleted === 'true' || withDeleted === true) {
      paranoid = false;
    }

    const { rows, count } = await this.grnModel.findAndCountAll({ where, paranoid, include: includes, distinct: true, limit, offset: (page - 1) * limit, order: [['createdAt', 'DESC']] });
    return { data: rows, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) || 1 } };
  }`;

if (serviceContent.includes(oldFindAll)) {
  serviceContent = serviceContent.replace(oldFindAll, newFindAll);
  console.log('findAll replaced');
} else {
  console.log('oldFindAll not found, checking if already replaced');
}

fs.writeFileSync(servicePath, serviceContent, 'utf8');
console.log('grn.service.ts written');
