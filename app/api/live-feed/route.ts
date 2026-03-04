import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET() {
  const { data } = await supabase
    .from("user_rankings")
    .select("item_id,title,artist,artwork_url,rating,ranked_at")
    .gt("rating", 0)
    .order("ranked_at", { ascending: false })
    .limit(10);
  return NextResponse.json(data ?? []);
}
