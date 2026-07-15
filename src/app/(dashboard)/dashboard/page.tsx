import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardRedirect() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = session.user.role
  if (role === 'student') redirect('/student')
  if (role === 'teacher') redirect('/teacher')
  if (role === 'admin') redirect('/admin')
  if (role === 'developer') redirect('/developer')

  redirect('/login')
}
