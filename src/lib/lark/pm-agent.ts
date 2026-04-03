/**
 * PM Agent — template-based, no Anthropic API needed
 */
import { AGENTS, getAgentChatId, ALL_AGENT_IDS, type Agent } from './agents'
import { sendText, sendCard, buildApprovalCard, buildApprovedCard, buildRevisedCard } from './client'

interface SprintBreakdown {
  sprint_id: string; summary: string; tasks: { agent_id: string; task: string }[]; risks: string
}
const activeSprints = new Map<string, { brief: string; breakdown: SprintBreakdown; pmChatId: string; pmMessageId?: string; agentResults: Record<string, string> }>()

function generateSprintId(): string {
  const now = new Date(); const pad = (n: number) => String(n).padStart(2, '0')
  return `sprint_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

function extractTopics(brief: string): string[] {
  const lower = brief.toLowerCase(); const topics: string[] = []
  const kw: Record<string,string> = { auth:'authentication',login:'authentication',order:'order management',cart:'shopping cart',checkout:'checkout flow',payment:'payment integration',menu:'menu listing',loyalty:'loyalty/points',notif:'notifications',push:'push notifications',admin:'admin panel',dashboard:'analytics',profile:'user profile',pwa:'PWA/offline',pos:'POS',realtime:'real-time',supabase:'Supabase',api:'API layer',ui:'UI',design:'design',test:'QA',search:'search',lark:'Lark' }
  for (const [k,v] of Object.entries(kw)) { if (lower.includes(k) && !topics.includes(v)) topics.push(v) }
  return topics.length > 0 ? topics : ['general feature development']
}

function parseBriefWithTemplate(brief: string): SprintBreakdown {
  const sprintId = generateSprintId(); const fl = extractTopics(brief).join(', ')
  const summary = brief.split(/[.!?]/).map(s=>s.trim()).filter(Boolean).slice(0,2).join('. ').substring(0,200) || brief.substring(0,150)
  const tasks = [
    {agent_id:'tech_lead', task:`Architecture & types for: ${fl}.`},
    {agent_id:'backend', task:`Supabase schema, RLS, Server Actions for: ${fl}.`},
    {agent_id:'frontend', task:`React components, data fetching for: ${fl}.`},
    {agent_id:'uiux', task:`UI/UX design, Tailwind specs for: ${fl}.`},
    {agent_id:'data_engineer', task:`Migrations, TypeScript types for: ${fl}.`},
    {agent_id:'qa', task:`Test cases, acceptance criteria for: ${fl}.`},
    {agent_id:'mobile', task:`PWA, service worker, mobile perf for: ${fl}.`},
  ]
  const lower = brief.toLowerCase(); const risks: string[] = []
  if (lower.includes('payment')) risks.push('payment complexity')
  if (lower.includes('realtime')) risks.push('real-time latency')
  if (lower.includes('auth')) risks.push('session edge cases')
  if (!risks.length) risks.push('scope creep','mobile responsiveness','RLS gaps')
  return { sprint_id:sprintId, summary, tasks, risks:risks.slice(0,3).join(', ') }
}

export async function runPMAgent(brief: string, pmChatId: string): Promise<void> {
  await sendText(pmChatId, `🤖 *PM Agent aktif!* ⏳ Dispatching ${ALL_AGENT_IDS.length} agents...`)
  let breakdown: SprintBreakdown
  try { breakdown = parseBriefWithTemplate(brief) }
  catch (err) { await sendText(pmChatId, `❌ Error: ${String(err)}`); return }
  activeSprints.set(breakdown.sprint_id, { brief, breakdown, pmChatId, agentResults: {} })
  await sendText(pmChatId, `📋 *${breakdown.sprint_id}*\n${breakdown.summary}\n🚀 Agents mulai paralel!`)
  await Promise.all(breakdown.tasks.map(({agent_id,task})=>{ const a=AGENTS[agent_id]; return a?runAgent(a,task,breakdown.sprint_id,breakdown):Promise.resolve() }))
  const sprint = activeSprints.get(breakdown.sprint_id)!
  const md = breakdown.tasks.map(t=>`**${AGENTS[t.agent_id]?.emoji} ${AGENTS[t.agent_id]?.name}**: ${t.task}`).join('\n\n')
  const card = buildApprovalCard({sprintId:breakdown.sprint_id,summary:breakdown.summary,tasksMarkdown:md,risks:breakdown.risks})
  const res = await sendCard(pmChatId,card); if (res?.data?.message_id) sprint.pmMessageId=res.data.message_id
  await sendText(pmChatId, `✅ ${Object.keys(sprint.agentResults).length}/7 agents notified! Tap APPROVE atau REVISE.`)
}

async function runAgent(agent: Agent, task: string, sprintId: string, breakdown: SprintBreakdown): Promise<void> {
  const chatId = getAgentChatId(agent); if (!chatId) return
  await sendText(chatId, `🚀 *Sprint ${sprintId}*\n📋 *Task (${agent.name}):*\n${task}\n📝 ${breakdown.summary}\n⚠️ Risks: ${breakdown.risks}\n_Post progress di sini 🙏_`)
  const sprint = activeSprints.get(sprintId); if (sprint) sprint.agentResults[agent.id]='notified'
}

export async function handleApprove(sprintId: string): Promise<void> {
  const sprint = activeSprints.get(sprintId); if (!sprint) return
  const {breakdown,pmChatId}=sprint
  await sendCard(pmChatId,buildApprovedCard(`✅ *${sprintId} APPROVED!* Proceed ke implementasi 🚀`))
  await Promise.all(breakdown.tasks.map(({agent_id})=>{ const a=AGENTS[agent_id]; const c=a&&getAgentChatId(a); return c?sendText(c,`✅ *APPROVED!* Proceed! 🚀`):Promise.resolve() }))
  activeSprints.delete(sprintId)
}

export async function handleRevise(sprintId: string, feedback: string): Promise<void> {
  const sprint = activeSprints.get(sprintId); if (!sprint) return
  const {breakdown,pmChatId}=sprint
  await sendCard(pmChatId,buildRevisedCard(feedback||'Revisi requested'))
  await Promise.all(breakdown.tasks.map(({agent_id})=>{ const a=AGENTS[agent_id]; const c=a&&getAgentChatId(a); return c?sendText(c,`✏️ *REVISI*\n${feedback||'(cek PM group)'}`):Promise.resolve() }))
  if (feedback) { activeSprints.delete(sprintId); await runPMAgent(`${sprint.brief}\n[REVISION]:${feedback}`,pmChatId) }
}

export function getActiveSprints(): string[] { return Array.from(activeSprints.keys()) }
