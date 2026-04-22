// Per-segment offer recipes.
// This is the "what discount, to whom, how big" commercial playbook —
// the default starting point when a user picks a segment in the simulator.
// Editable per-campaign; these defaults never mutate.

import type { OfferType, ProductScope } from '@/lib/dashboard/semantic/types'
import type { RFMSegment } from '@/lib/dashboard/real-metrics'

export interface OfferRecipe {
  intent: string
  offer_type: OfferType
  offer_value: number
  min_order: number
  product_scope: ProductScope
  max_discount_pct: number   // hard ceiling — above this destroys segment economics
  rationale: string
  cltv_aware: boolean        // true = judge on CLTV uplift, not single-txn mROI
}

export const PLAYBOOK: Record<RFMSegment, OfferRecipe> = {
  'Champions': {
    intent: 'Reward, don\'t bribe',
    offer_type: 'bundle_percent',
    offer_value: 10,
    min_order: 0,
    product_scope: 'personalized_pair',
    max_discount_pct: 10,
    rationale: 'Inelastic — deep discounts destroy margin with no lift. Bundle upsell on their top pair reinforces frequency.',
    cltv_aware: false,
  },
  'Loyal': {
    intent: 'Deepen frequency via perceived value',
    offer_type: 'percent',
    offer_value: 0,
    min_order: 0,
    product_scope: 'all',
    max_discount_pct: 5,
    rationale: 'Early access / VIP preview outperforms cash discounts. Keep cash promo reserved for later lifecycle stages.',
    cltv_aware: false,
  },
  'Potential Loyalists': {
    intent: 'Trigger tier upgrade',
    offer_type: 'tier_unlock',
    offer_value: 15,
    min_order: 150000,
    product_scope: 'all',
    max_discount_pct: 15,
    rationale: 'Spend-threshold promo converts to LTV, not single-order margin. Pair with tier benefits.',
    cltv_aware: true,
  },
  'New Customers': {
    intent: 'Cross-category exploration — cheapest retention lever',
    offer_type: 'percent',
    offer_value: 20,
    min_order: 90000,
    product_scope: 'category',
    max_discount_pct: 20,
    rationale: 'Building basket breadth early compounds into multi-category loyalty. 20% on 2nd category.',
    cltv_aware: true,
  },
  'Promising': {
    intent: 'Frequency builder',
    offer_type: 'bogo',
    offer_value: 17,
    min_order: 100000,
    product_scope: 'all',
    max_discount_pct: 17,
    rationale: 'Volume play on already-engaged. Buy-2-get-3rd-50%-off = effective 17% with volume commitment.',
    cltv_aware: false,
  },
  'Needs Attention': {
    intent: 'Gentle lapse nudge',
    offer_type: 'bundle_percent',
    offer_value: 15,
    min_order: 80000,
    product_scope: 'personalized_pair',
    max_discount_pct: 20,
    rationale: 'Lapse prevention — don\'t over-subsidize. Personalized pair keeps discount targeted.',
    cltv_aware: true,
  },
  'At Risk': {
    intent: 'Win-back — high LTV at stake',
    offer_type: 'bundle_percent',
    offer_value: 25,
    min_order: 80000,
    product_scope: 'personalized_pair',
    max_discount_pct: 35,
    rationale: 'High historical monetary at risk of churn. Personalized top-pair offer with urgency CTA.',
    cltv_aware: true,
  },
  'Cannot Lose': {
    intent: 'Surgical VIP save',
    offer_type: 'bundle_percent',
    offer_value: 25,
    min_order: 0,
    product_scope: 'personalized_pair',
    max_discount_pct: 30,
    rationale: 'Historically high monetary, now lapsed. 1:1 treatment, hand-crafted message, personalized bundle.',
    cltv_aware: true,
  },
  'Hibernating': {
    intent: 'Reactivation test',
    offer_type: 'percent',
    offer_value: 30,
    min_order: 0,
    product_scope: 'all',
    max_discount_pct: 40,
    rationale: 'Weak signal — higher discount acceptable if lift proves real. Free delivery pairs well.',
    cltv_aware: true,
  },
  'Lost': {
    intent: 'Minimal ROI test / acquisition parity',
    offer_type: 'percent',
    offer_value: 35,
    min_order: 0,
    product_scope: 'all',
    max_discount_pct: 40,
    rationale: 'Treat as acquisition — cap trade spend. If this lifts, it lifts; if not, cut without regret.',
    cltv_aware: true,
  },
}

export function recipeFor(segment: RFMSegment): OfferRecipe {
  return PLAYBOOK[segment]
}
