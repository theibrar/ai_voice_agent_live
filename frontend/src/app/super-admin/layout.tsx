import { SuperAdminProvider } from "@/lib/super-admin-store";

export default function RootSuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminProvider>{children}</SuperAdminProvider>;
}
