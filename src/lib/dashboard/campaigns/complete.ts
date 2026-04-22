'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBuilder = any

/** Mark an active campaign as completed. Freezes outcomes by virtue of the
 *  trigger-populated orders.campaign_id; no additional snapshot needed since
 *  v_campaign_outcomes reads from live orders + frozen projection. */
export async function completeCampaign(campaignId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient() as unknown as { from: (t: string) => AnyBuilder }
  const { error } = await admin
    .from('campaigns')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('status', 'active')
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Create a draft campaign from the simulator form input. */
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

export async function createDraftCampaign(input: DraftCampaignInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = createAdminClient() as unknown as { from: (t: string) => AnyBuilder }
  const payload = {
    ...input,
    status: 'draft',
    targeting_filters: input.targeting_filters ?? {},
  }
  const { data, error } = await admin
    .from('campaigns').insert(payload).select('id').single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed' }
  return { ok: true, id: (data as { id: string }).id }
}
