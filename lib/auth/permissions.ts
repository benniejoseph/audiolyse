/**
 * Role-Based Permissions System
 * 
 * Manages user permissions based on their role in the organization.
 */

import { createClient } from '@/lib/supabase/client';

// Permission definitions matching database
export const PERMISSIONS = {
  // Call permissions
  CALLS_VIEW_OWN: 'calls.view_own',
  CALLS_VIEW_TEAM: 'calls.view_team',
  CALLS_VIEW_ALL: 'calls.view_all',
  CALLS_ANALYZE: 'calls.analyze',
  CALLS_DELETE: 'calls.delete',
  CALLS_EXPORT: 'calls.export',
  CALLS_ASSIGN: 'calls.assign',
  
  // Team permissions
  TEAM_VIEW: 'team.view',
  TEAM_INVITE: 'team.invite',
  TEAM_MANAGE: 'team.manage',
  TEAM_REMOVE: 'team.remove',
  
  // Customer permissions
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_AI: 'settings.ai',
  
  // Billing permissions
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',
  
  // Admin permissions
  ADMIN_DASHBOARD: 'admin.dashboard',
  ADMIN_AUDIT: 'admin.audit',
  ADMIN_SECURITY: 'admin.security',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role hierarchy
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role permissions mapping (client-side cache)
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.ADMIN_DASHBOARD),
  manager: [
    PERMISSIONS.CALLS_VIEW_OWN,
    PERMISSIONS.CALLS_VIEW_TEAM,
    PERMISSIONS.CALLS_ANALYZE,
    PERMISSIONS.CALLS_EXPORT,
    PERMISSIONS.CALLS_ASSIGN,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_AI,
  ],
  member: [
    PERMISSIONS.CALLS_VIEW_OWN,
    PERMISSIONS.CALLS_ANALYZE,
    PERMISSIONS.CALLS_EXPORT,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  viewer: [
    PERMISSIONS.CALLS_VIEW_OWN,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if current user has a permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Get user's role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!membership?.role) return false;
    
    return roleHasPermission(membership.role as Role, permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get current user's role and permissions
 */
export async function getCurrentUserPermissions(): Promise<{
  role: Role | null;
  permissions: Permission[];
  isAdmin: boolean;
  isManager: boolean;
}> {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { role: null, permissions: [], isAdmin: false, isManager: false };
    }
    
    // Get profile and membership in parallel
    const [profileResult, membershipResult] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
      supabase.from('organization_members').select('role').eq('user_id', user.id).single(),
    ]);
    
    const role = membershipResult.data?.role as Role | null;
    const permissions = role ? getRolePermissions(role) : [];
    const isAdmin = profileResult.data?.is_admin ?? false;
    const isManager = role ? ['owner', 'admin', 'manager'].includes(role) : false;
    
    return { role, permissions, isAdmin, isManager };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { role: null, permissions: [], isAdmin: false, isManager: false };
  }
}

/**
 * Higher-order component helper to check permissions
 */
export function requirePermission(permission: Permission) {
  return async function withPermission<T>(
    handler: (context: T) => Promise<Response>
  ): Promise<(context: T) => Promise<Response>> {
    return async (context: T) => {
      const hasPermission = await checkPermission(permission);
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return handler(context);
    };
  };
}

/**
 * Check if user can view specific calls (based on ownership or role)
 */
export async function canViewCall(callId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { role, isAdmin } = await getCurrentUserPermissions();
    
    // Super admin can see everything
    if (isAdmin) return true;
    
    // Owner/Admin can see all org calls
    if (role && ['owner', 'admin'].includes(role)) {
      return roleHasPermission(role, PERMISSIONS.CALLS_VIEW_ALL);
    }
    
    // Manager can see team calls
    if (role === 'manager') {
      // Check if call belongs to someone in their team
      // For now, managers can see all org calls
      return roleHasPermission(role, PERMISSIONS.CALLS_VIEW_TEAM);
    }
    
    // Members can only see their own calls
    const { data: call } = await supabase
      .from('call_analyses')
      .select('uploaded_by, assigned_to')
      .eq('id', callId)
      .single();
    
    if (!call) return false;
    
    return call.uploaded_by === userId || call.assigned_to === userId;
  } catch (error) {
    console.error('Error checking call access:', error);
    return false;
  }
}

/**
 * Get direct reports for a manager
 */
export async function getDirectReports(userId: string): Promise<string[]> {
  const supabase = createClient();
  
  try {
    // First get the manager's member id
    const { data: manager } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!manager) return [];
    
    // Get users who report to this manager
    const { data: reports } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('reports_to', manager.id);
    
    return reports?.map(r => r.user_id) ?? [];
  } catch (error) {
    console.error('Error getting direct reports:', error);
    return [];
  }
}

/**
 * Check if user is manager of another user
 */
export async function isManagerOf(managerId: string, userId: string): Promise<boolean> {
  const reports = await getDirectReports(managerId);
  return reports.includes(userId);
}
