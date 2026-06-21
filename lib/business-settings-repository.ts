import { getSupabaseClient } from "@/lib/supabase"

export async function upsertBusinessSettings(
  userId: string,
  data: { business_name: string; webhook_url: string }
) {
  const supabase = getSupabaseClient()
  return supabase
    .from("business_settings")
    .upsert(
      { user_id: userId, business_name: data.business_name, webhook_url: data.webhook_url },
      { onConflict: "user_id" }
    )
    .select()
    .single()
}

export async function fetchBusinessSettings(userId: string) {
  const supabase = getSupabaseClient()
  return supabase.from("business_settings").select("business_name, webhook_url").eq("user_id", userId).single()
}
