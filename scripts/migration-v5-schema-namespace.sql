-- migration-v5-schema-namespace.sql
-- Move every HD App object out of `public` into a dedicated `haagen_dazs` schema.
--
-- Run AFTER you have:
--   1. Stopped writes (or accepted brief downtime) on the live app
--   2. Backed up the database (Dashboard > Database > Backups)
--
-- Run BEFORE you:
--   1. Deploy the matching app code change (clients now point at haagen_dazs)
--   2. Add `haagen_dazs` to Dashboard > Project Settings > API > Exposed schemas
--
-- Safe to re-run: every statement is idempotent (uses IF EXISTS / CREATE IF NOT EXISTS).

BEGIN;

-- 1. Schema + grants ---------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS haagen_dazs;

GRANT USAGE ON SCHEMA haagen_dazs TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA haagen_dazs
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA haagen_dazs
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA haagen_dazs
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA haagen_dazs
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;


-- 2. Drop triggers that pin functions to the old schema ---------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_attribute_order_to_campaign ON public.orders;


-- 3. Move functions ---------------------------------------------------------
-- ALTER FUNCTION ... SET SCHEMA fails if the function does not exist, so guard
-- with DO blocks.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET SCHEMA haagen_dazs';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'is_staff_or_admin') THEN
    EXECUTE 'ALTER FUNCTION public.is_staff_or_admin() SET SCHEMA haagen_dazs';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'attribute_order_to_campaign') THEN
    EXECUTE 'ALTER FUNCTION public.attribute_order_to_campaign() SET SCHEMA haagen_dazs';
  END IF;
END $$;


-- 4. Move tables (owned sequences + RLS policies travel with the table) -----

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles',
    'menu_items',
    'orders',
    'order_items',
    'stores',
    'vouchers',
    'user_vouchers',
    'loyalty_transactions',
    'referrals',
    'campaigns',
    'campaign_targets',
    'trade_spend_budgets'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA haagen_dazs', t);
    END IF;
  END LOOP;
END $$;


-- 5. Move views (their stored definitions use OIDs, so base-table refs
--    automatically resolve to the new schema after the table move) ---------

DO $$
DECLARE
  v text;
  views text[] := ARRAY[
    'v_campaign_incrementality',
    'v_campaign_outcomes',
    'v_customer_category_mix',
    'v_customer_redemption_propensity',
    'v_customer_top_pairs',
    'v_customers_rfm',
    'v_menu_item_margins',
    'v_order_item_cogs',
    'v_order_items_enriched',
    'v_orders_enriched',
    'v_segment_baselines',
    'v_segment_elasticity',
    'v_trade_spend_pacing'
  ];
BEGIN
  FOREACH v IN ARRAY views LOOP
    IF EXISTS (
      SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = v
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET SCHEMA haagen_dazs', v);
    END IF;
  END LOOP;
END $$;


-- 6. Re-create the auth trigger pointing at the new function location -------

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION haagen_dazs.handle_new_user();


-- 7. Re-create the order-campaign attribution trigger -----------------------

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'haagen_dazs' AND tablename = 'orders'
  ) THEN
    EXECUTE $sql$
      CREATE TRIGGER trg_attribute_order_to_campaign
        BEFORE INSERT OR UPDATE OF voucher_id ON haagen_dazs.orders
        FOR EACH ROW EXECUTE FUNCTION haagen_dazs.attribute_order_to_campaign()
    $sql$;
  END IF;
END $$;


-- 8. Reset realtime publication to the new schema ---------------------------
-- Realtime broadcasts come from `supabase_realtime` publication. Re-add the
-- moved tables so subscribers see changes under their new schema-qualified
-- identity.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['orders','order_items','user_vouchers'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE haagen_dazs.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;


COMMIT;


-- 9. Sanity check (run separately and inspect) ------------------------------
-- Anything still in public that you recognise as HD App-owned must be moved
-- by hand before deleting this script.
--
--   SELECT 'table' AS kind, tablename AS name FROM pg_tables WHERE schemaname='public'
--   UNION ALL
--   SELECT 'view',  viewname  FROM pg_views  WHERE schemaname='public'
--   UNION ALL
--   SELECT 'function', proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--     WHERE n.nspname='public'
--   ORDER BY 1,2;
