<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Directives & Media Upload Rules

## File & Media Upload Protocol
- **Endpoint**: ALWAYS use `POST /realbizpro/api/v1/files/upload` (`multipart/form-data`) with Bearer token authentication.
- **Client Helper**: Use `fileUploadService` from `@/services/fileUploadService`.
- **Target Folder (`pathFolder`)**: Always specify a `pathFolder` in the upload payload to categorize content cleanly into dedicated directories (e.g. `crm/leads`, `projects/agreements`, `inventory/products`, `hrm/employees`, `organizations/logos`, `avatars`, `cms/media`).
- **Custom Filename (`fileName`)**: Optionally pass `fileName` for clean semantic file naming.
- **Retrieval & Content Streaming**: Use `GET /realbizpro/api/v1/files/content/{key}` where `{key}` is the `filePath` returned by the upload endpoint.
- **Deletion**: Use `DELETE /realbizpro/api/v1/files/{key}`.
