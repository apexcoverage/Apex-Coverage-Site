import type { Metadata } from 'next';
import { requireEmployeeSession } from '@/lib/internalAuth';
import { EmployeeBar } from '@/components/agent/EmployeeBar';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireEmployeeSession('/agent');
  return <><EmployeeBar name={session.user.name} role={session.user.role} />{children}</>;
}
