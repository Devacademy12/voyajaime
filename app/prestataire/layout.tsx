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

  // USER
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // PROFILE
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "prestataire") {
    redirect("/auth");
  }

  // ACCOUNT NOT VALIDATED
  if (!profile.is_validated) {
    return <ValidationPending />;
  }

  // NORMAL DASHBOARD
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F9FAFB",
      }}
    >
      <Sidebar
        role="prestataire"
        userName={profile.agency_name || profile.full_name}
        userEmail={user.email}
      />

      <main
        style={{
          marginLeft: "240px",
          flex: 1,
          padding: "32px",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
