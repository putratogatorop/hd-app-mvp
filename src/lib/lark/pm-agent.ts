/**
 * PM Agent — Brain of the orchestration system
 *
 * Flow:
 *   1. Putra posts sprint brief in Lark PM group
 *   2. Webhook triggers runPMAgent()
 *   3. PM Agent calls Claude → structured task breakdown JSON
 *   4. ALL 7 agents dispatched IN PARALLEL (Promise.all)
 *   5. Each agent posts progress updates to their own Lark group
 *   6. PM compiles results → sends approval card to Putra's PM group
 *   7. Putra taps APPROVE or REVISE in Lark
 *   8. On APPROVE → agents receive final "proceed to code" signal
 */

import Anthropic from '@anthropic-ai/sdk'
import { AGENTS, getAgentChatId, ALL_AGENT_IDS, type Agent } from './agents'
import {
  sendText,
  sendCard,
  buildApprovalCard,
  buildApprovedCard,
  buildRevisedCard,
} from './client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Shape PM Agent expects from Claude's structured breakdown */
interface SprintBreakdown {
  sprint_id: string
  summary: string
  tasks: {
    agent_id: string
    task: string
  }[]
  risks: string
}

/** Stored sprint state (in-memory, good enough for MVP) */
const activeSprints = new Map<string, {
  brief: string
  breakdown: SprintBreakdown
  pmChatId: string
  pmMessageId?: string
  agentResults: Record<string, string>
}>()

/**
 * Step 1 — PM Agent: parse brief → dispatch agents → send approval card
 */
export async function runPMAgent(brief: string, pmChatId: string): Promise<void> {
  // Notify PM group that we're processing
  await sendText(pmChatId, `🤖 *PM Agent aktif!*\n\nMemproses sprint brief kamu...\n⏳ Mendispatch ${ALL_AGENT_IDS.length} agents secara paralel, tunggu sebentar ya!`)

  // ── Step 1: Ask Claude to structure the brief into per-agent tasks ──
  let breakdown: SprintBreakdown

  try {
    const pmResponse = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: brief }],
      system: `You are the Project Manager AI for the Häagen-Dazs Super App MVP (Next.js 14 + Supabase + Vercel).
Your job: Parse the sprint brief and produce a structured JSON breakdown for the engineering team.

Return ONLY valid JSON, no markdown, no explanation. Format:
{
  "sprint_id": "sprint_<YYYYMMDD_HHMM>",
  "summary": "2-3 sentence summary of what this sprint delivers",
  "tasks": [
    { "agent_id": "tech_lead", "task": "specific task for tech lead" },
    { "agent_id": "backend", "task": "specific task for backend" },
    { "agent_id": "frontend", "task": "specific task for frontend" },
    { "agent_id": "uiux", "task": "specific task for ui/ux" },
    { "agent_id": "data_engineer", "task": "specific task for data engineer" },
    { "agent_id": "qa", "task": "specific task for qa" },
    { "agent_id": "mobile", "task": "specific task for mobile/pwa engineer" }
  ],
  "risks": "comma-separated list of top 3 risks or blockers, or empty string if none"
}

Agent IDs must be exactly: tech_lead, backend, frontend, uiux, data_engineer, qa, mobile`,
    })

    const raw = (pmResponse.content[0] as { type: string; text: string }).text.trim()
    breakdown = JSON.parse(raw) as SprintBreakdown
  } catch (err) {
    await sendText(pmChatId, `❌ PM Agent error saat parse brief:\n${String(err)}\n\nCoba kirim ulang brief dengan format yang lebih jelas ya!`)
    return
  }

  // Store sprint state
  activeSprints.set(breakdown.sprint_id, {
    brief,
    breakdown,
    pmChatId,
    agentResults: {},
  })

  // Notify PM group: agents dispatching
  const taskList = breakdown.tasks
    .map(t => `• *${AGENTS[t.agent_id]?.emoji ?? '🤖'} ${AGENTS[t.agent_id]?.name ?? t.agent_id}*: ${t.task}`)
    .join('\n')

  await sendText(
    pmChatId,
    `📋 *Sprint ${breakdown.sprint_id}*\n\n${breakdown.summary}\n\n*Tasks yang di-dispatch:*\n${taskList}\n\n🚀 Semua agents mulai kerja paralel sekarang...`
  )

  // ── Step 2: Dispatch ALL agents in PARALLEL ──
  await Promise.all(
    breakdown.tasks.map(({ agent_id, task }) => {
      const agent = AGENTS[agent_id]
      if (!agent) return Promise.resolve()
      return runAgent(agent, task, breakdown.sprint_id, breakdown)
    })
  )

  // ── Step 3: Compile results and send approval card to Putra ──
  const sprint = activeSprints.get(breakdown.sprint_id)!
  const completedCount = Object.keys(sprint.agentResults).length

  const tasksMarkdown = breakdown.tasks
    .map(t => {
      const agent = AGENTS[t.agent_id]
      const result = sprint.agentResults[t.agent_id]
      return `**${agent?.emoji} ${agent?.name}**\n${t.task}\n${result ? `_✅ Done — lihat di grup ${agent?.name}_` : '_⏳ Processing..._'}`
    })
    .join('\n\n')

  const card = buildApprovalCard({
    sprintId: breakdown.sprint_id,
    summary: breakdown.summary,
    tasksMarkdown,
    risks: breakdown.risks,
  })

  const cardResult = await sendCard(pmChatId, card)
  if (cardResult?.data?.message_id) {
    sprint.pmMessageId = cardResult.data.message_id
  }

  await sendText(
    pmChatId,
    `✅ Semua ${completedCount}/${breakdown.tasks.length} agents sudah selesai!\n\nTap tombol di atas untuk APPROVE atau REVISE sprint ini.`
  )
}

/**
 * Step 2 helper — Run a single agent: Claude call → post to agent's Lark group
 */
async function runAgent(
  agent: Agent,
  task: string,
  sprintId: string,
  breakdown: SprintBreakdown
): Promise<void> {
  const chatId = getAgentChatId(agent)
  if (!chatId) {
    console.warn(`No chat ID for agent ${agent.id} (env var: ${agent.chatIdEnvVar})`)
    return
  }

  // 1. Post "starting" notification to agent's group
  await sendText(chatId, `🚀 *Sprint ${sprintId} dimulai!*\n\n📋 *Task kamu:*\n${task}\n\n⏳ Sedang menganalisis...`)

  // 2. Call Claude with agent's system prompt
  let result: string
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Sprint: ${breakdown.summary}\n\nYour specific task: ${task}`,
        },
      ],
      system: agent.systemPrompt,
    })
    result = (response.content[0] as { type: string; text: string }).text
  } catch (err) {
    result = `⚠️ Error: ${String(err)}`
  }

  // 3. Post result to agent's Lark group
  await sendText(
    chatId,
    `${agent.emoji} *${agent.name} — Sprint ${sprintId}*\n\n${result}\n\n---\n_Menunggu approval dari Putra..._`
  )

  // 4. Store result in sprint state
  const sprint = activeSprints.get(sprintId)
  if (sprint) {
    sprint.agentResults[agent.id] = result
  }
}

/**
 * Step 3a — Handle APPROVE action from Lark card
 */
export async function handleApprove(sprintId: string): Promise<void> {
  const sprint = activeSprints.get(sprintId)
  if (!sprint) return

  const { breakdown, pmChatId } = sprint

  // Update PM group card to approved state
  const approvedCard = buildApprovedCard(
    `✅ Sprint *${sprintId}* diapprove!\n\n${breakdown.summary}\n\nSemua agents sekarang proceed ke implementasi. Pantau progress di masing-masing grup ya!`
  )
  await sendCard(pmChatId, approvedCard)

  // Notify all agent groups: APPROVED, proceed to code
  await Promise.all(
    breakdown.tasks.map(({ agent_id }) => {
      const agent = AGENTS[agent_id]
      if (!agent) return Promise.resolve()
      const chatId = getAgentChatId(agent)
      if (!chatId) return Promise.resolve()
      return sendText(
        chatId,
        `✅ *Sprint ${sprintId} APPROVED oleh Putra!*\n\nProceed ke implementasi sesuai plan di atas.\n\nPost update progress di sini ya! 🚀`
      )
    })
  )

  // Clean up
  activeSprints.delete(sprintId)
}

/**
 * Step 3b — Handle REVISE action from Lark card
 */
export async function handleRevise(sprintId: string, feedback: string): Promise<void> {
  const sprint = activeSprints.get(sprintId)
  if (!sprint) return

  const { breakdown, pmChatId } = sprint

  // Update PM group card to revised state
  const revisedCard = buildRevisedCard(feedback || 'Putra minta revisi — cek feedback di grup PM')
  await sendCard(pmChatId, revisedCard)

  // Notify all agent groups: REVISE requested
  await Promise.all(
    breakdown.tasks.map(({ agent_id }) => {
      const agent = AGENTS[agent_id]
      if (!agent) return Promise.resolve()
      const chatId = getAgentChatId(agent)
      if (!chatId) return Promise.resolve()
      return sendText(
        chatId,
        `✏️ *Sprint ${sprintId} dikembalikan untuk revisi*\n\n*Feedback dari Putra:*\n${feedback || '(Cek grup PM untuk detail feedback)'}\n\nTunggu sprint brief yang direvisi ya.`
      )
    })
  )

  // Re-run PM agent with revised brief incorporating feedback
  if (feedback) {
    const revisedBrief = `${sprint.brief}\n\n[REVISION FEEDBACK FROM PUTRA]: ${feedback}`
    activeSprints.delete(sprintId)
    await runPMAgent(revisedBrief, pmChatId)
  }
}

/** Get active sprint IDs (for debugging) */
export function getActiveSprints(): string[] {
  return Array.from(activeSprints.keys())
}
