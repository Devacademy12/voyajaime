import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import TouristeNav from "@/components/touriste/TouristeNav";

export default async function TouristeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("user_id", user.id).single();

  if (!profile || profile.role !== "touriste") redirect("/auth");

  const { count: favCount } = await supabase
    .from("favoris").select("*", { count: "exact", head: true }).eq("touriste_id", user.id);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9" }}>
      <TouristeNav
        userName={profile.full_name || user.email || "Touriste"}
        favCount={favCount || 0}
      />
      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "44px 48px 80px" }}>
        {children}
      </main>
    </div>
  );
}