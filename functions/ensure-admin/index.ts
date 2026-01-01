import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Try to find the user by scanning pages (works for small user bases)
    let foundUser: any = null;
    let page = 1;
    while (!foundUser) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const users = data?.users ?? [];
      foundUser = users.find((u: any) => (u.email || "").toLowerCase() === String(email).toLowerCase());
      if (users.length < 1000) break;
      page += 1;
    }

    if (!foundUser) {
      // Create and confirm immediately
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ status: "created", id: data.user?.id }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Ensure password and mark as confirmed (email_confirm allowed in update)
    const { data: updated, error: updErr } = await admin.auth.admin.updateUserById(foundUser.id, {
      password,
      email_confirm: true,
    } as any);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ status: "updated", id: updated.user?.id }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e: any) {
    console.error("ensure-admin error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
