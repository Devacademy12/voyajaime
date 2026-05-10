import { createServerSupabaseClient } from "@/lib/supabaseServer";
import AboutAdminClient from "./AboutAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Page À propos | VoyajAime",
  robots: { index: false, follow: false },
};

export default async function AdminAboutPage() {
  const supabase = await createServerSupabaseClient();

  const { data: sections, error } = await supabase
    .from("about_content")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    console.error("[AdminAboutPage] Supabase error:", error.message);
  }

  return <AboutAdminClient initialSections={sections ?? []} />;
}