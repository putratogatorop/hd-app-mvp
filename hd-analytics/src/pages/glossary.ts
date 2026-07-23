// Plain-language definitions for every campaign-dashboard jargon term.
// Rendered via <InfoTip> next to each KPI / label.

export const GLOSSARY: Record<string, string> = {
  mroi:
    'Marketing ROI. For every Rp 1 we spent on discount, how much extra contribution margin came back? 1.5× means we earned Rp 1.50 for every Rp 1 spent on discount. Below 1× = the promo lost money on a transaction basis (check the CLTV view before judging).',

  mroi_hurdle:
    'Minimum mROI this campaign must project to auto-pass. Default 1.5×. Override is allowed if the CLTV or strategic case is strong — the override is logged.',

  cm:
    'Contribution margin. Revenue minus item cost (COGS), voucher discount, and delivery subsidy. It\'s what the order "contributed" toward fixed costs + profit. Not net profit, but the honest per-order number.',

  cm_floor:
    'Minimum contribution margin per order the campaign must project. Safety gate — prevents campaigns with economics that are technically mROI-positive but produce per-order margins too thin to bother with.',

  holdout:
    'A random slice of eligible customers who get NO offer. They\'re the control group. We compare their behavior to customers who got the voucher — that\'s how we know if the campaign actually caused extra sales, instead of just paying for sales that would have happened anyway.',

  incrementality:
    'The true lift from the campaign: treatment group\'s behavior minus holdout group\'s. "We earned Rp 10M from the campaign" is meaningless without this — most of that Rp 10M might have happened anyway.',

  incremental_revenue:
    'Revenue that happened because of the campaign — NOT because it would have happened anyway. Calculated as: (treatment order rate − holdout order rate) × treatment size × AOV.',

  incremental_cm:
    'Contribution margin that came from incremental orders. This is the numerator in mROI.',

  cannibalization:
    'The percentage of campaign revenue that would have happened anyway, without the offer. High cannibalization (>60%) means we gave a discount on sales that were already coming. Below 30% = genuinely incremental, scale the playbook.',

  lift_factor:
    'How many extra orders each redeemer is expected to place vs. their baseline. 1.0× = one full incremental order per redeemer. Manual slider because our dataset is too small to estimate it reliably — snapshotted into the projection so actual-vs-projected stays honest.',

  cltv_uplift:
    'Expected 90-day forward revenue uplift from keeping this customer around — retention value, not this transaction. Win-back campaigns often look bad on single-transaction mROI but are great on CLTV. Payback weeks = how long before the forward gross margin pays back today\'s trade spend.',

  trade_spend:
    'Total discount cost across all redeemers. Your cash outlay on the promo. What the campaign "spent".',

  trade_spend_budget:
    'Monthly envelope per segment. The dashboard warns (but does not block) if a new campaign would push spend above the remaining budget for that segment this month.',

  redemption_rate:
    'Of everyone who received the voucher, what % actually used it. Higher isn\'t always better — a very high rate plus high cannibalization means we discounted loyalists who would have bought anyway.',

  redemption_liability:
    'Total face value of vouchers issued but not yet redeemed. Technically a balance-sheet liability — money we\'d owe in discount if everyone redeemed. Falls as vouchers expire or are used.',

  break_even_value:
    'The discount level at which projected mROI equals the hurdle. Set the offer above this line = projection fails the gate. Below = passes. Shown as a red number on the offer slider.',

  aov:
    'Average order value for this segment (historical). Used as the baseline revenue-per-order in projections.',

  segment:
    'Customer lifecycle bucket from RFM (Recency × Frequency × Monetary) scoring. Champions (best & most recent) and Lost (long gone) sit at opposite ends; the other 8 are in between. Different segments need different plays — deep discounting Champions destroys margin, while thin offers to Lost are wasted.',

  personalized_pair:
    'Each targeted customer gets a voucher tied to THEIR own top co-purchase pair — the two SKUs they buy together most. Much higher relevance than a generic "25% off everything" and narrower cannibalization risk.',

  scope_all:
    'Voucher applies to any order meeting the min-order threshold. Broadest cannibalization risk but simplest to redeem.',

  status_draft:
    'Campaign saved but not yet issued. No vouchers created, no customers targeted. Safe to edit or delete.',

  status_active:
    'Campaign has been issued — vouchers exist, customers have been targeted, orders are being attributed.',

  status_completed:
    'Campaign window has ended. Outcomes are stable. This is where the "lessons learned" matter most.',

  approval_gates:
    'Three checks before a campaign can auto-pass issuance: (1) mROI at or above hurdle, (2) contribution margin per order at or above floor, (3) total trade spend within remaining segment budget. Any failure requires a written justification — always logged.',
}

export type GlossaryKey = keyof typeof GLOSSARY
