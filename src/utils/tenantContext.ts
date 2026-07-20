import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  tenantId?: string;
  bypassTenant?: boolean;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();
