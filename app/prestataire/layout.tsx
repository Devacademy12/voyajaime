import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Sidebar from "../components/shared/Sidebar";
import ValidationPending from "./ValidationPending";

export const dynamic = "force-dynamic";

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
    <div style={{ minHeight: "100vh", background: "#F5F7FA", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .prestataire-main {
          min-height: 100vh;
        }
        @media (min-width: 768px) {
          .prestataire-main {
            margin-left: 250px;
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
