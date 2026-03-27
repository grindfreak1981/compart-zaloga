export type Role = 'admin' | 'vodja' | 'delavec'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  permissions: Record<string, boolean>
}

export const PERMISSIONS = {
  VIEW_STOCK: 'view_stock',
  EDIT_STOCK: 'edit_stock',
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  VIEW_WORK_ORDERS: 'view_work_orders',
  EDIT_WORK_ORDERS: 'edit_work_orders',
  VIEW_CUSTOMERS: 'view_customers',
  EDIT_CUSTOMERS: 'edit_customers',
  VIEW_SUPPLIERS: 'view_suppliers',
  EDIT_SUPPLIERS: 'edit_suppliers',
  VIEW_REPORTS: 'view_reports',
} as const

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export function hasPermission(profile: Profile | null, permission: PermissionKey): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'vodja') return true
  return profile.permissions[permission] === true
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}
