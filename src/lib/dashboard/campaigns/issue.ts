'use server'

// Server action: issue a campaign — resolve segment membership, partition
// treatment/holdout, generate vouchers (one per user for personalized bundles,
// one shared for uniform), link to user_vouchers + campaign_targets, and
// flip campaigns.status from draft → active.
//
// Never imported from client components. Called via a form action or RPC.

import { createAdminClient } from '@/lib/supabase/admin'
import {
  assignSegment,
  quintileScores,
  type RFMSegment,
} from '@/lib/dashboard/real-metrics'
import { fetchCustomersRFM, fetchCustomerTopPairs } from '@/lib/dashboard/semantic/queries'
import type { Campaign } from '@/lib/dashboard/semantic/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBuilder = any

export interface IssueResult {
  ok: boolean
  campaignId?: string
  treatmentSize?: number
  holdoutSize?: number
  skippedUserIds?: string[]
  error?: string
}

/** Resolve which customers belong to a segment by re-running TS scoring against
 *  the current v_customers_rfm snapshot (same logic as the simulator). */
async function resolveSegmentUsers(segmentKey: string): Promise<string[]> {
  const rows = await fetchCustomersRFM()
  if (rows.length === 0) return []
  const rScores = quintileScores(rows.map((r) => r.recency_days), false)
  const fScores = quintileScores(rows.map((r) => r.frequency), true)
  const mScores = quintileScores(rows.map((r) => Number(r.monetary)), true)
  const userIds: string[] = []
  rows.forEach((row, i) => {
    const seg = assignSegment(rScores[i], fScores[i], mScores[i])
    if (seg === (segmentKey as RFMSegment)) userIds.push(row.user_id)
  })
  return userIds
}

/** Deterministic seeded shuffle so holdout partition is reproducible per campaign. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  // xorshift-ish seed derived from the seed string
  let s = 0
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0
  s = Math.abs(s) || 1
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shortSlug(n: number): string {
  return Math.random().toString(36).slice(2, 2 + n).toUpperCase()
}

export async function issueCampaign(campaignId: string): Promise<IssueResult> {
  const admin = createAdminClient() as unknown as { from: (t: string) => AnyBuilder }

  // 1. Load + guard
  const { data: campaignRow, error: loadErr } = await admin
    .from('campaigns').select('*').eq('id', campaignId).maybeSingle()
  if (loadErr || !campaignRow) {
    return { ok: false, error: `Campaign ${campaignId} not found` }
  }
  const campaign = campaignRow as Campaign
  if (campaign.status !== 'draft') {
    return { ok: false, error: `Campaign is ${campaign.status}, only drafts can be issued` }
  }

  // 2. Resolve segment membership
  const userIds = await resolveSegmentUsers(campaign.segment_key)
  if (userIds.length === 0) {
    return { ok: false, error: `No customers match segment "${campaign.segment_key}"` }
  }

  // 3. Partition — deterministic shuffle seeded by campaign_id
  const shuffled = seededShuffle(userIds, campaign.id)
  const holdoutSize = Math.floor(shuffled.length * campaign.holdout_pct)
  const holdoutUsers = new Set(shuffled.slice(0, holdoutSize))
  const treatmentUsers = shuffled.slice(holdoutSize)

  // 4. Resolve personalized top pairs for treatment (if needed)
  const needsPairs = campaign.product_scope === 'personalized_pair'
  const pairsByUser = new Map<string, { a: string; b: string }>()
  const skippedUserIds: string[] = []
  if (needsPairs) {
    const pairs = await fetchCustomerTopPairs(treatmentUsers)
    for (const p of pairs) pairsByUser.set(p.user_id, { a: p.item_a, b: p.item_b })
    for (const uid of treatmentUsers) {
      if (!pairsByUser.has(uid)) skippedUserIds.push(uid)
    }
  }

  // 5. Create vouchers + user_vouchers + campaign_targets
  const shortId = campaign.id.slice(0, 6).toUpperCase()
  const validFrom = campaign.start_at ?? new Date().toISOString()
  const validUntil = campaign.end_at ?? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()

  // 5a. Shared voucher for uniform campaigns
  let sharedVoucherId: string | null = null
  if (!needsPairs) {
    const voucherPayload = {
      code: `CAMP-${shortId}-${shortSlug(4)}`,
      title: campaign.name,
      description: `Campaign: ${campaign.name}`,
      discount_type: (campaign.offer_type === 'fixed' || campaign.offer_type === 'bundle_fixed') ? 'fixed' : 'percentage',
      discount_value: campaign.offer_value,
      min_order: campaign.min_order,
      max_discount: campaign.max_discount,
      applicable_modes: ['pickup', 'delivery', 'dinein'],
      voucher_source: 'manual',
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: true,
      campaign_id: campaign.id,
      applicable_items: campaign.applicable_items,
      expected_redemption_rate: campaign.projection?.redeemers && campaign.projection
        ? (campaign.projection.redeemers / Math.max(1, treatmentUsers.length))
        : null,
    }
    const { data: voucherData, error: vErr } = await admin
      .from('vouchers').insert(voucherPayload).select('id').single()
    if (vErr || !voucherData) {
      return { ok: false, error: `Voucher creation failed: ${vErr?.message ?? 'unknown'}` }
    }
    sharedVoucherId = (voucherData as { id: string }).id
  }

  // 5b. For personalized: one voucher per user
  const targetsToInsert: Array<{
    campaign_id: string
    user_id: string
    is_holdout: boolean
    top_pair_a: string | null
    top_pair_b: string | null
    voucher_id: string | null
  }> = []

  const userVouchersToInsert: Array<{ user_id: string; voucher_id: string }> = []

  for (const uid of treatmentUsers) {
    let voucherId: string | null = sharedVoucherId
    let pairA: string | null = null
    let pairB: string | null = null

    if (needsPairs) {
      const p = pairsByUser.get(uid)
      if (!p) continue  // skipped — no co-purchase history
      pairA = p.a
      pairB = p.b

      const personalPayload = {
        code: `CAMP-${shortId}-${uid.slice(0, 6).toUpperCase()}`,
        title: `${campaign.name} — Personal Bundle`,
        description: `Personalized top-pair bundle`,
        discount_type: (campaign.offer_type === 'bundle_fixed') ? 'fixed' : 'percentage',
        discount_value: campaign.offer_value,
        min_order: campaign.min_order,
        max_discount: campaign.max_discount,
        applicable_modes: ['pickup', 'delivery', 'dinein'],
        voucher_source: 'manual',
        valid_from: validFrom,
        valid_until: validUntil,
        is_active: true,
        campaign_id: campaign.id,
        applicable_items: [p.a, p.b],
        bundle_spec: { type: 'top_pair', pair: [p.a, p.b] },
      }
      const { data: vRow, error: vErr } = await admin
        .from('vouchers').insert(personalPayload).select('id').single()
      if (vErr || !vRow) {
        return { ok: false, error: `Personalized voucher creation failed for ${uid}: ${vErr?.message ?? 'unknown'}` }
      }
      voucherId = (vRow as { id: string }).id
    }

    if (voucherId) {
      userVouchersToInsert.push({ user_id: uid, voucher_id: voucherId })
    }
    targetsToInsert.push({
      campaign_id: campaign.id,
      user_id: uid,
      is_holdout: false,
      top_pair_a: pairA,
      top_pair_b: pairB,
      voucher_id: voucherId,
    })
  }

  // Holdout — no vouchers, just mark presence
  Array.from(holdoutUsers).forEach((uid) => {
    targetsToInsert.push({
      campaign_id: campaign.id,
      user_id: uid,
      is_holdout: true,
      top_pair_a: null,
      top_pair_b: null,
      voucher_id: null,
    })
  })

  // 6. Bulk inserts
  if (targetsToInsert.length > 0) {
    const { error: tErr } = await admin
      .from('campaign_targets').upsert(targetsToInsert, { onConflict: 'campaign_id,user_id' })
    if (tErr) return { ok: false, error: `Target insert failed: ${tErr.message}` }
  }
  if (userVouchersToInsert.length > 0) {
    const { error: uvErr } = await admin
      .from('user_vouchers').insert(userVouchersToInsert)
    if (uvErr) return { ok: false, error: `user_vouchers insert failed: ${uvErr.message}` }
  }

  // 7. Flip to active — merge skipped users into projection
  const mergedProjection = {
    ...(campaign.projection ?? {}),
    skipped_user_ids: skippedUserIds,
  }
  const { error: updErr } = await admin
    .from('campaigns').update({
      status: 'active',
      projection: mergedProjection,
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id)
  if (updErr) return { ok: false, error: `Status update failed: ${updErr.message}` }

  return {
    ok: true,
    campaignId: campaign.id,
    treatmentSize: treatmentUsers.length - skippedUserIds.length,
    holdoutSize: holdoutUsers.size,
    skippedUserIds,
  }
}
