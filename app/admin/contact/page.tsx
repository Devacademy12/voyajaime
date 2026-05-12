import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ContactAdminClient from "./ContactAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Page Contact | VoyajAime",
  robots: { index: false, follow: false },
};

export default async function AdminContactPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: content }, { data: messages }] = await Promise.all([
    supabase.from("contact_content").select("*").order("key"),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <ContactAdminClient
      initialContent={content  ?? []}
      initialMessages={messages ?? []}
    />
  );
}