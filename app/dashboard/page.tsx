import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRoleType } from '@/types/database'

const ROLE_REDIRECTS: Record<UserRoleType, string> = {
  super_admin: '/admin/tenants',
  owner: '/dashboard/business',
  employee: '/dashboard/employee',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleRow?.role as UserRoleType | undefined

  if (role && ROLE_REDIRECTS[role]) {
    redirect(ROLE_REDIRECTS[role])
  }

  // Fallback — no role assigned
  redirect('/login')
}
