# Customer Service Module: Project Scoping & Integration Guide

## 1. Overview & Multi-Tenancy Architecture

All records and workflows under `/dashboard/customer-service/*` operate strictly on a **per-project scoping model** within a multi-tenant SaaS architecture.

### Multi-Tenancy Principles:
1. **Zero Organization Exposure on Frontend**:
   - `organization_id` must **NEVER** appear in frontend URLs, query parameters, request bodies, or TypeScript DTOs.
   - The backend internally extracts and validates `organization_id` from the authenticated user's JWT payload.
2. **Project Scoping**:
   - Every customer profile, booking, change request, ticket, maintenance request, and service charge record carries a `project_id`.
   - The Customer Service top layout (`/dashboard/customer-service/layout.tsx`) embeds a persistent **Workspace Project Selector** (`CSProjectSelector.tsx`).
   - The selected `projectId` (UUID) is managed centrally by `CustomerServiceProjectProvider` and persisted in `localStorage` under key `realbiz_cs_selected_project_id`.
   - Only `projectId` is persisted—never organization data.
   - On initial load, the persisted ID is validated against the fetched project list. If it does not exist, it falls back to the first available project.
3. **Super Admin Assumption**:
   - Super Admin accounts have no organization restrictions. The backend returns all projects provisioned across the platform. The UI displays whatever the project dropdown endpoint returns.

---

## 2. Consuming the Selected Project in Any Page

Every page inside `/dashboard/customer-service/*` automatically inherits the `CustomerServiceProjectProvider` from the parent layout.

### Step 1: Import the Hook

```typescript
import { useSelectedProject } from "@/hooks/useSelectedProject";
```

### Step 2: Extract Context Values

```typescript
export default function MyCustomerServicePage() {
  const {
    projectId,      // string | null: UUID of the currently selected project
    project,        // ProjectOption | null: Full metadata of selected project (name, code, etc.)
    projects,       // ProjectOption[]: All projects available to the user's organization
    setProject,     // (id: string | null) => void: Switch active project programmatically
    isLoading,      // boolean: True while project list is loading
    error,          // string | null: Error if project list failed to load
  } = useSelectedProject();
```

---

## 3. Querying / Listing Data with `projectId`

Always include `project_id` (or `projectId`) in API list calls. Whenever `projectId` changes, all data queries must automatically refetch.

```typescript
// 1. Fetch function accepting projectId
const loadItems = useCallback(async (searchQuery?: string, activeProjectId?: string | null) => {
  setIsLoading(true);
  try {
    const res = await getCustomerServiceItems({
      search: searchQuery || undefined,
      project_id: (activeProjectId || projectId) || undefined,
      limit: 50,
    });
    setItems(res.items);
  } catch (err) {
    toast.error("Failed to load records");
  } finally {
    setIsLoading(false);
  }
}, [projectId]);

// 2. Automatically refetch when the user switches projects in the top bar
useEffect(() => {
  void loadItems(debouncedSearch, projectId);
}, [debouncedSearch, projectId, loadItems]);
```

---

## 4. Creating / Updating Records with `projectId`

When creating or updating resources, bind `project_id` to the currently active project:

```typescript
const handleCreateSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!projectId) {
    toast.error("Please select an active project before submitting");
    return;
  }

  await createCustomerRecord({
    ...formValues,
    project_id: projectId, // Always include active project UUID
  });

  toast.success("Record created successfully");
  void loadItems();
};
```

---

## 5. Handling Workspace Empty States

If the user's organization has no active projects (`!isLoading && projects.length === 0`), the layout displays an organization-wide alert banner.

Individual pages can also render an empty state fallback:

```tsx
if (!isLoading && projects.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
      <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
      <h3 className="text-base font-semibold text-gray-900">No Projects Found</h3>
      <p className="text-sm text-gray-500 max-w-md mt-1">
        No active projects were found for your organization. Please ensure projects are created and assigned to your organization.
      </p>
    </div>
  );
}
```

---

## 6. API Layer Checklist

When authoring or modifying any Customer Service API service (`src/services/customer*.ts`):

- [x] **List queries**: Accept `project_id?: string; projectId?: string;` and pass to backend as `project_id`.
- [x] **Create/Update payloads**: Accept `project_id?: string; projectId?: string;` and pass as `project_id`.
- [x] **NEVER** accept or send `organization_id`, `org_id`, or `orgId`.
- [x] Use `api.get()` / `api.post()` from `@/lib/api` which automatically attaches the JWT bearer token.

---

## 7. Modules Under Review (Preserved Intact)

The following modules are preserved intact pending meeting speaker decision:
1. **Customer Entry** (`/customers`) & **Customer 360°** (`/customers/customer-360`): Post-sales resident directory, emergency contacts, KYC docs, and unit ownership history.
2. **Bookings & Property Portfolio** (`/customers/properties-bookings`): Handover lifecycle stages (`Under Construction` → `Snagging` → `DLP Active` → `Handed Over`), statutory 2-year DLP tracking, and key handover records.


