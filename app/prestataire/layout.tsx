import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Sidebar from "../components/shared/Sidebar";
import ValidationPending from "./ValidationPending";

export default async function PrestataireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).single();

  if (!profile || profile.role !== "prestataire") redirect("/auth");
  if (!profile.is_validated) return <ValidationPending />;

  return (
    <>
      <style>{`
        .layout-wrap { display: flex; min-height: 100vh; background: #F9FAFB; }
        .layout-main  { flex: 1; margin-left: 240px; padding: 32px; min-height: 100vh; }
        @media (max-width: 767px) {
          .layout-main { margin-left: 0; padding: 72px 16px 24px; }
        }
      `}</style>
      <div className="layout-wrap">
        <Sidebar
          role="prestataire"
          userName={profile.agency_name || profile.full_name}
          userEmail={user.email}
        />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </>
  );
}