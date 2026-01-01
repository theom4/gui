


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_wasender_tokens_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_wasender_tokens_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_whatsapp_sessions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_whatsapp_sessions_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."call_metrics" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_apeluri" integer DEFAULT 0 NOT NULL,
    "apeluri_initiate" integer DEFAULT 0 NOT NULL,
    "apeluri_primite" integer DEFAULT 0 NOT NULL,
    "rata_conversie" numeric(5,2) DEFAULT 0 NOT NULL,
    "minute_consumate" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."call_metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."call_metrics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."call_metrics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."call_metrics_id_seq" OWNED BY "public"."call_metrics"."id";



CREATE TABLE IF NOT EXISTS "public"."call_recordings" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_seconds" integer,
    "recording_url" "text" NOT NULL,
    "direction" "text",
    "phone_number" "text",
    "whatsapp_session_id" bigint,
    "recording_transcript" "text",
    "transfer" boolean
);


ALTER TABLE "public"."call_recordings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."call_recordings"."transfer" IS 'whether the call was transfered or not';



ALTER TABLE "public"."call_recordings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."call_recordings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'user'::"text",
    "avatar_url" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_wasender_tokens" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wasender_token" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_wasender_tokens" OWNER TO "postgres";


ALTER TABLE "public"."user_wasender_tokens" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_wasender_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."whatsapp_sessions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "session_name" "text",
    "status" "text" DEFAULT 'disconnected'::"text" NOT NULL,
    "qr_code" "text",
    "phone_number" "text",
    "messages_sent" integer DEFAULT 0,
    "last_connected_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "whatsapp_sessions_status_check" CHECK (("status" = ANY (ARRAY['connected'::"text", 'disconnected'::"text", 'connecting'::"text", 'qr_ready'::"text"])))
);


ALTER TABLE "public"."whatsapp_sessions" OWNER TO "postgres";


ALTER TABLE "public"."whatsapp_sessions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."whatsapp_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."call_metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."call_metrics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."call_metrics"
    ADD CONSTRAINT "call_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_recordings"
    ADD CONSTRAINT "call_recordings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_wasender_tokens"
    ADD CONSTRAINT "user_wasender_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_wasender_tokens"
    ADD CONSTRAINT "user_wasender_tokens_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."whatsapp_sessions"
    ADD CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_sessions"
    ADD CONSTRAINT "whatsapp_sessions_user_id_session_id_key" UNIQUE ("user_id", "session_id");



CREATE INDEX "call_metrics_created_idx" ON "public"."call_metrics" USING "btree" ("created_at" DESC);



CREATE INDEX "call_metrics_user_created_idx" ON "public"."call_metrics" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "call_recordings_created_idx" ON "public"."call_recordings" USING "btree" ("created_at" DESC);



CREATE INDEX "call_recordings_user_idx" ON "public"."call_recordings" USING "btree" ("user_id");



CREATE INDEX "idx_user_wasender_tokens_active" ON "public"."user_wasender_tokens" USING "btree" ("is_active");



CREATE INDEX "idx_user_wasender_tokens_user_id" ON "public"."user_wasender_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_whatsapp_sessions_session_id" ON "public"."whatsapp_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_whatsapp_sessions_status" ON "public"."whatsapp_sessions" USING "btree" ("status");



CREATE INDEX "idx_whatsapp_sessions_user_id" ON "public"."whatsapp_sessions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_update_user_wasender_tokens_updated_at" BEFORE UPDATE ON "public"."user_wasender_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_wasender_tokens_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_whatsapp_sessions_updated_at" BEFORE UPDATE ON "public"."whatsapp_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_whatsapp_sessions_updated_at"();



ALTER TABLE ONLY "public"."call_metrics"
    ADD CONSTRAINT "call_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_recordings"
    ADD CONSTRAINT "call_recordings_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "id" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_wasender_tokens"
    ADD CONSTRAINT "user_wasender_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_sessions"
    ADD CONSTRAINT "whatsapp_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY " Allow users     to read their own profile." ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Admins can manage all sessions" ON "public"."whatsapp_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all tokens" ON "public"."user_wasender_tokens" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all sessions" ON "public"."whatsapp_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all tokens" ON "public"."user_wasender_tokens" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own sessions" ON "public"."whatsapp_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own sessions" ON "public"."whatsapp_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own tokens" ON "public"."user_wasender_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own sessions" ON "public"."whatsapp_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own tokens" ON "public"."user_wasender_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own sessions" ON "public"."whatsapp_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own tokens" ON "public"."user_wasender_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_read_all_metrics" ON "public"."call_metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



ALTER TABLE "public"."call_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_recordings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete own recordings" ON "public"."call_recordings" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_own_metrics" ON "public"."call_metrics" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "insert own recordings" ON "public"."call_recordings" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_own_metrics" ON "public"."call_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_own_metrics" ON "public"."call_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select own recordings" ON "public"."call_recordings" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "update own recordings" ON "public"."call_recordings" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "update_own_metrics" ON "public"."call_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_wasender_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_wasender_tokens_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_wasender_tokens_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_wasender_tokens_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_whatsapp_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_whatsapp_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_whatsapp_sessions_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."call_metrics" TO "anon";
GRANT ALL ON TABLE "public"."call_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."call_metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."call_metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."call_metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."call_metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."call_recordings" TO "anon";
GRANT ALL ON TABLE "public"."call_recordings" TO "authenticated";
GRANT ALL ON TABLE "public"."call_recordings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."call_recordings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."call_recordings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."call_recordings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_wasender_tokens" TO "anon";
GRANT ALL ON TABLE "public"."user_wasender_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wasender_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_wasender_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_wasender_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_wasender_tokens_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_sessions" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."whatsapp_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."whatsapp_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."whatsapp_sessions_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "Public read for avatar"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatar'::text));



  create policy "Public read for avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "User can delete own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatar'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));



  create policy "User can insert own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatar'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));



  create policy "User can update own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatar'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
with check (((bucket_id = 'avatar'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));



