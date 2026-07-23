// Replaces the real Server Actions (campaigns/actions.ts -> issue.ts/complete.ts)
// that normally write to Supabase. There's no backend in this static bundle,
// so these mutate a small localStorage-backed override store instead — new
// drafts and status changes persist across page reloads in this browser only
// ("demo mode"), never anywhere else. Same function names/signatures as the
// production actions so the ported Simulator/Detail components need no logic changes.

import type { Campaign, CampaignStatus } from '@/lib/dashboard/semantic/types'
import { CAMPAIGNS, SEGMENT_BASELINES } from '@/fixtures/campaigns.fixture'

const STORAGE_KEY = 'hd-analytics:campaign-overrides'

interface Overrides {
  drafts: Campaign[]
  statusById: Record<string, CampaignStatus>
}

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { drafts: [], statusById: {} }
    const parsed = JSON.parse(raw) as Partial<Overrides>
    return { drafts: parsed.drafts ?? [], statusById: parsed.statusById ?? {} }
  } catch {
    return { drafts: [], statusById: {} }
  }
}

function saveOverrides(o: Overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
  } catch {
    // Demo mode — private browsing / quota errors just mean the change won't stick.
  }
}

/** Base fixture + any locally-saved drafts, with status overrides applied. Used by queries.ts. */
export function getAllCampaigns(): Campaign[] {
  const { drafts, statusById } = loadOverrides()
  const applyStatus = (c: Campaign): Campaign =>
    statusById[c.id] ? { ...c, status: statusById[c.id] } : c
  return [...drafts.map(applyStatus), ...CAMPAIGNS.map(applyStatus)]
}

export interface DraftCampaignInput {
  name: string
  segment_key: string
  offer_type: string
  offer_value: number
  min_order: number
  max_discount?: number | null
  product_scope: string
  applicable_items?: string[]
  applicable_categories?: string[]
  start_at?: string
  end_at?: string
  holdout_pct: number
  mroi_hurdle: number
  cm_floor: number
  lift_factor: number
  justification?: string
  projection: Record<string, unknown>
  trade_spend_budget?: number | null
  targeting_filters?: Record<string, unknown>
}

export async function saveDraftAction(
  input: DraftCampaignInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const overrides = loadOverrides()
  const id = `draft-${Date.now().toString(36)}`
  const now = new Date().toISOString()
  const campaign: Campaign = {
    id,
    name: input.name,
    status: 'draft',
    segment_key: input.segment_key,
    targeting_filters: input.targeting_filters ?? {},
    offer_type: input.offer_type as Campaign['offer_type'],
    offer_value: input.offer_value,
    min_order: input.min_order,
    max_discount: input.max_discount ?? null,
    product_scope: input.product_scope as Campaign['product_scope'],
    applicable_items: input.applicable_items ?? null,
    applicable_categories: input.applicable_categories ?? null,
    start_at: input.start_at ?? null,
    end_at: input.end_at ?? null,
    holdout_pct: input.holdout_pct,
    mroi_hurdle: input.mroi_hurdle,
    cm_floor: input.cm_floor,
    lift_factor: input.lift_factor,
    justification: input.justification ?? null,
    projection: input.projection as unknown as Campaign['projection'],
    trade_spend_budget: input.trade_spend_budget ?? null,
    created_by: null,
    created_at: now,
    updated_at: now,
  }
  overrides.drafts.push(campaign)
  saveOverrides(overrides)
  return { ok: true, id }
}

export interface IssueResult {
  ok: boolean
  campaignId?: string
  treatmentSize?: number
  holdoutSize?: number
  skippedUserIds?: string[]
  error?: string
}

export async function issueAction(campaignId: string): Promise<IssueResult> {
  const campaign = getAllCampaigns().find((c) => c.id === campaignId)
  if (!campaign) {
    return { ok: false, error: `Campaign ${campaignId} not found (demo mode — drafts only persist in this browser)` }
  }
  if (campaign.status !== 'draft') {
    return { ok: false, error: `Campaign is ${campaign.status}, only drafts can be issued` }
  }
  const overrides = loadOverrides()
  overrides.statusById[campaignId] = 'active'
  saveOverrides(overrides)

  const baseline = SEGMENT_BASELINES.find((b) => b.segment_key === campaign.segment_key)
  const eligible = baseline?.customer_count ?? 50
  const holdoutSize = Math.round(eligible * campaign.holdout_pct)
  return { ok: true, campaignId, treatmentSize: eligible - holdoutSize, holdoutSize, skippedUserIds: [] }
}

export async function completeAction(campaignId: string): Promise<{ ok: boolean; error?: string }> {
  const overrides = loadOverrides()
  overrides.statusById[campaignId] = 'completed'
  saveOverrides(overrides)
  return { ok: true }
}
