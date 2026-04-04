-- ============================================================
-- Migration 003: Sprint & Task tracking for Lark AI agents
-- Run AFTER migrations 001 and 002.
-- Paste into: https://supabase.com/dashboard/project/hxxiiwlvkatcdzlhxyqq/sql/new
-- ============================================================

-- ── Table: sprints ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sprints (
  id            TEXT PRIMARY KEY,              -- e.g. 'sprint_20260403_1430'
  brief         TEXT NOT NULL,                  -- original sprint brief from Putra
  summary       TEXT NOT NULL,                  -- PM Agent's 2-3 sentence summary
  risks         TEXT DEFAULT '',               -- identified risks/blockers
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'revised', 'completed')),
  pm_message_id TEXT,                           -- Lark card message ID for updates
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table: sprint_tasks ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id          BIGSERIAL PRIMARY KEY,
  sprint_id   TEXT NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  agent_id    TEXT NOT NULL,                    -- 'tech_lead', 'backend', etc.
  task        TEXT NOT NULL,                    -- task description dispatched to agent
  result      TEXT,                             -- agent's response from Claude
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'done', 'error')),
  lark_msg_id TEXT,                             -- Lark message ID in agent's group
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint_id ON public.sprint_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_agent_id  ON public.sprint_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status          ON public.sprints(status);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sprints_updated_at ON public.sprints;
CREATE TRIGGER sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS sprint_tasks_updated_at ON public.sprint_tasks;
CREATE TRIGGER sprint_tasks_updated_at
  BEFORE UPDATE ON public.sprint_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.sprints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write sprints and sprint_tasks (internal PM tool)
CREATE POLICY "admin_all_sprints" ON public.sprints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_all_sprint_tasks" ON public.sprint_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can always access (for server-side agent writes)
-- (Service role bypasses RLS by default — no policy needed)

-- ── Verification query ────────────────────────────────────────
-- After running, verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sprints', 'sprint_tasks');
