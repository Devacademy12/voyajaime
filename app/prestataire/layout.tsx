import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Sidebar from "../components/shared/Sidebar";
import ValidationPending from "./ValidationPending";

export default async function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, agency_name, is_validated, profil_complete")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "prestataire") redirect("/auth");
  if (!profile.is_validated) return <ValidationPending userId={user.id} profilComplete={!!profile.profil_complete} />;

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <style>{`
        .prestataire-main {
          padding: 72px 16px 40px 16px;
          min-height: 100vh;
        }
        @media (min-width: 768px) {
          .prestataire-main {
            margin-left: 240px;
            padding: 36px 36px 48px 36px;
          }
        }
      `}</style>
      <Sidebar
        role="prestataire"
        userName={profile.agency_name || profile.full_name || "Prestataire"}
        userEmail={user.email}
      />
      <main className="prestataire-main">
        {children}
      </main>
    </div>
  );
}