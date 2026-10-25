const fs = require('fs');

// 1. Update party.dto.ts
const dtoPath = 'C:\\Realbiz Main\\realbiz_pro_server\\src\\modules\\procurement\\parties\\dto\\party.dto.ts';
let dto = fs.readFileSync(dtoPath, 'utf8');
if (!dto.includes('deleted_only')) {
  dto = dto.replace(
    "@ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' }) @IsOptional() @IsEnum(['ASC', 'DESC']) sortOrder?: 'ASC' | 'DESC';",
    "@ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' }) @IsOptional() @IsEnum(['ASC', 'DESC']) sortOrder?: 'ASC' | 'DESC';\n  @ApiPropertyOptional() @IsOptional() withDeleted?: boolean | string;\n  @ApiPropertyOptional() @IsOptional() deleted_only?: boolean | string;"
  );
  fs.writeFileSync(dtoPath, dto, 'utf8');
  console.log('party.dto.ts updated');
}

// 2. Update party.service.ts
const servicePath = 'C:\\Realbiz Main\\realbiz_pro_server\\src\\modules\\procurement\\parties\\party.service.ts';
let service = fs.readFileSync(servicePath, 'utf8');

service = service.replace(
  "include: [{ model: PartyDocument, as: 'documents', required: false }]",
  "include: [{ association: 'documents', required: false }]"
);
service = service.replace(
  "include: [{ model: PartyDocument, as: 'documents', required: false, paranoid: !includeDeleted }]",
  "include: [{ association: 'documents', required: false }]"
);

const oldFindAll = `    const result = await this.parties.findAndCountAll({ where, include: [{ association: 'documents', required: false }], limit, offset: (page - 1) * limit, order: [['createdAt', query.sortOrder ?? 'DESC']], distinct: true });`;

const newFindAll = `    let paranoid = true;
    if (query.deleted_only === 'true' || (query as any).deleted_only === true) {
      where.deletedAt = { [Op.ne]: null };
      paranoid = false;
    } else if (query.withDeleted === 'true' || (query as any).withDeleted === true) {
      paranoid = false;
    }
    const result = await this.parties.findAndCountAll({ where, paranoid, include: [{ association: 'documents', required: false }], limit, offset: (page - 1) * limit, order: [['createdAt', query.sortOrder ?? 'DESC']], distinct: true });`;

if (service.includes(oldFindAll)) {
  service = service.replace(oldFindAll, newFindAll);
  console.log('party.service.ts findAll updated');
}

fs.writeFileSync(servicePath, service, 'utf8');
console.log('party.service.ts updated');
