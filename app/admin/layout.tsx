import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Sidebar from "../components/shared/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/auth");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      <Sidebar role="admin" userName={profile.full_name || "Admin"} userEmail={user.email} />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
