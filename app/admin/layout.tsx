import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Sidebar from "../components/shared/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/auth");

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <style>{`
        .admin-main {
          padding: 72px 16px 40px 16px;
          min-height: 100vh;
        }
        @media (min-width: 768px) {
          .admin-main {
            margin-left: 240px;
            padding: 36px 36px 48px 36px;
          }
        }
      `}</style>
      <Sidebar role="admin" userName={profile.full_name || "Admin"} userEmail={user.email} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}