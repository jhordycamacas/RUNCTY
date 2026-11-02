import { AdminShell } from '@/features/auth/presentation/AdminShell';

export default function PanelLayout({ children }: LayoutProps<'/'>) {
  return <AdminShell>{children}</AdminShell>;
}
