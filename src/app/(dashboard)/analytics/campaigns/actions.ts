'use server'

import { revalidatePath } from 'next/cache'
import { createDraftCampaign, completeCampaign, type DraftCampaignInput } from '@/lib/dashboard/campaigns/complete'
import { issueCampaign } from '@/lib/dashboard/campaigns/issue'

export async function saveDraftAction(input: DraftCampaignInput) {
  const res = await createDraftCampaign(input)
  if (res.ok) revalidatePath('/analytics/campaigns')
  return res
}

export async function issueAction(campaignId: string) {
  const res = await issueCampaign(campaignId)
  if (res.ok) revalidatePath('/analytics/campaigns')
  return res
}

export async function completeAction(campaignId: string) {
  const res = await completeCampaign(campaignId)
  if (res.ok) revalidatePath('/analytics/campaigns')
  return res
}
