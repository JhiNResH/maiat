/**
 * Maat V2 Seed: m/openclaw-skills
 * 
 * Curated dataset of 30 OpenClaw/Claude Code skills & plugins.
 * Classification: 🟢 verified-safe | 🟡 unreviewed | 🔴 flagged
 * 
 * Sources: ClawHub, GitHub, community reports
 * Created: 2026-02-14 (Nightly Build)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SkillSeed {
  name: string
  address: string // unique identifier (github url or registry id)
  description: string
  image?: string
  website?: string
  category: string
  status: string // verified, unreviewed, flagged
  avgRating: number
  reviewCount: number
}

const openclawSkills: SkillSeed[] = [
  // ═══════════════════════════════════════════
  // 🟢 VERIFIED SAFE — Well-known, audited
  // ═══════════════════════════════════════════
  {
    name: 'Frontend Design',
    address: 'clawhub://frontend-design',
    description: 'Production-grade frontend interfaces with high design quality. Generates creative, polished React/HTML/CSS that avoids generic AI aesthetics. Supports Tailwind, shadcn/ui, and modern web standards.',
    image: 'https://img.icons8.com/fluency/96/design.png',
    website: 'https://clawhub.ai/skills/frontend-design',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.7,
    reviewCount: 142,
  },
  {
    name: 'GitHub CLI Integration',
    address: 'clawhub://github',
    description: 'Full GitHub workflow via `gh` CLI — issues, PRs, CI runs, code search, and API queries. Handles auth, pagination, and complex queries automatically.',
    image: 'https://img.icons8.com/fluency/96/github.png',
    website: 'https://clawhub.ai/skills/github',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.8,
    reviewCount: 289,
  },
  {
    name: 'PDF Toolkit',
    address: 'clawhub://pdf',
    description: 'Extract text/tables, create new PDFs, merge/split documents, fill forms. Supports CJK fonts, tracked changes, and complex layouts.',
    image: 'https://img.icons8.com/fluency/96/pdf.png',
    website: 'https://clawhub.ai/skills/pdf',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.5,
    reviewCount: 98,
  },
  {
    name: 'Linear Plugin',
    address: 'clawhub://linear-plugin',
    description: 'Connect Claude to Linear issue tracker. Create/update issues, manage sprints, sync project state. MCP-based with full API coverage.',
    image: 'https://img.icons8.com/fluency/96/task.png',
    website: 'https://clawhub.ai/plugins/linear',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.6,
    reviewCount: 176,
  },
  {
    name: 'Semgrep Rule Creator',
    address: 'clawhub://semgrep-rule-creator',
    description: 'Create custom Semgrep rules for detecting bug patterns and security vulnerabilities. Generates YAML rules with test cases and validation.',
    image: 'https://img.icons8.com/fluency/96/search.png',
    website: 'https://clawhub.ai/skills/semgrep-rule-creator',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.4,
    reviewCount: 67,
  },
  {
    name: 'Weather Skill',
    address: 'clawhub://weather',
    description: 'Get current weather and forecasts without API key. Uses wttr.in for global coverage. Simple, reliable, zero-config.',
    image: 'https://img.icons8.com/fluency/96/partly-cloudy-day.png',
    website: 'https://clawhub.ai/skills/weather',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.2,
    reviewCount: 203,
  },
  {
    name: 'XLSX Spreadsheet',
    address: 'clawhub://xlsx',
    description: 'Create, edit, and analyze spreadsheets with formulas, formatting, charts, and data visualization. Preserves existing formulas on edit.',
    image: 'https://img.icons8.com/fluency/96/microsoft-excel-2019.png',
    website: 'https://clawhub.ai/skills/xlsx',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.3,
    reviewCount: 112,
  },
  {
    name: 'Webapp Testing (Playwright)',
    address: 'clawhub://webapp-testing',
    description: 'Test local web applications using Playwright. Verify frontend functionality, debug UI behavior, capture screenshots, view console logs.',
    image: 'https://img.icons8.com/fluency/96/test-tube.png',
    website: 'https://clawhub.ai/skills/webapp-testing',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.5,
    reviewCount: 88,
  },
  {
    name: 'Docker MCP Server',
    address: 'clawhub://docker-mcp',
    description: 'Manage Docker containers, images, volumes, and networks through MCP. Build, run, stop, and inspect containers without leaving the editor.',
    image: 'https://img.icons8.com/fluency/96/docker.png',
    website: 'https://clawhub.ai/plugins/docker-mcp',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.6,
    reviewCount: 134,
  },
  {
    name: 'Stripe Best Practices',
    address: 'clawhub://stripe-best-practices',
    description: 'Payment processing, checkout flows, subscriptions, webhooks, Connect platforms. Follows Stripe official patterns and security guidelines.',
    image: 'https://img.icons8.com/fluency/96/stripe.png',
    website: 'https://clawhub.ai/skills/stripe',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.4,
    reviewCount: 91,
  },
  {
    name: 'Pulumi IaC',
    address: 'clawhub://pulumi-iac',
    description: 'Infrastructure as Code with Pulumi. Deploy to AWS/GCP/Azure using TypeScript/Python. Handles state management, previews, and drift detection.',
    image: 'https://img.icons8.com/fluency/96/cloud.png',
    website: 'https://clawhub.ai/skills/pulumi',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.3,
    reviewCount: 56,
  },
  {
    name: 'Supabase MCP',
    address: 'clawhub://supabase-mcp',
    description: 'Full Supabase management — database queries, auth setup, storage, edge functions, realtime subscriptions. Official MCP integration.',
    image: 'https://img.icons8.com/fluency/96/database.png',
    website: 'https://clawhub.ai/plugins/supabase-mcp',
    category: 'm/openclaw-skills',
    status: 'approved',
    avgRating: 4.7,
    reviewCount: 167,
  },

  // ═══════════════════════════════════════════
  // 🟡 UNREVIEWED — Community submissions, not yet audited
  // ═══════════════════════════════════════════
  {
    name: 'Auto Resume',
    address: 'clawhub://auto-resume',
    description: 'Handle rate limits and auto-retry when API quotas are exhausted. Bash scripts for uninterrupted overnight AI-assisted work.',
    image: 'https://img.icons8.com/fluency/96/restart.png',
    website: 'https://clawhub.ai/skills/auto-resume',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 3.8,
    reviewCount: 23,
  },
  {
    name: 'Slack GIF Creator',
    address: 'clawhub://slack-gif-creator',
    description: 'Create animated GIFs optimized for Slack. Provides constraints, validation tools, and animation concepts for workplace comms.',
    image: 'https://img.icons8.com/fluency/96/gif.png',
    website: 'https://clawhub.ai/skills/slack-gif',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 3.5,
    reviewCount: 14,
  },
  {
    name: 'Notion Sync',
    address: 'github://community/notion-sync-skill',
    description: 'Bidirectional sync between local markdown files and Notion pages. Auto-converts formatting, handles databases, and preserves block structure.',
    image: 'https://img.icons8.com/fluency/96/notion.png',
    website: 'https://github.com/community/notion-sync-skill',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 3.9,
    reviewCount: 31,
  },
  {
    name: 'K8s Cluster Manager',
    address: 'github://devops-tools/k8s-skill',
    description: 'Manage Kubernetes clusters — deployments, pods, services, ingress. Supports kubectl commands, Helm charts, and cluster diagnostics.',
    image: 'https://img.icons8.com/fluency/96/kubernetes.png',
    website: 'https://github.com/devops-tools/k8s-skill',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 4.1,
    reviewCount: 45,
  },
  {
    name: 'Figma Export',
    address: 'github://design-tools/figma-export',
    description: 'Export Figma designs to React/Vue/HTML components. Extracts design tokens, generates Tailwind classes, handles responsive layouts.',
    image: 'https://img.icons8.com/fluency/96/figma.png',
    website: 'https://github.com/design-tools/figma-export',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 3.7,
    reviewCount: 28,
  },
  {
    name: 'Email Drafter',
    address: 'github://productivity/email-drafter',
    description: 'Draft professional emails with tone control. Supports Gmail/Outlook integration via MCP. Templates for cold outreach, follow-ups, and negotiations.',
    image: 'https://img.icons8.com/fluency/96/email.png',
    website: 'https://github.com/productivity/email-drafter',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 3.6,
    reviewCount: 19,
  },
  {
    name: 'Terraform Drift Detector',
    address: 'github://infra-skills/terraform-drift',
    description: 'Detect and remediate infrastructure drift in Terraform-managed resources. Generates plan diffs, suggests fixes, and auto-creates PRs.',
    image: 'https://img.icons8.com/fluency/96/terraform.png',
    website: 'https://github.com/infra-skills/terraform-drift',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 4.0,
    reviewCount: 37,
  },
  {
    name: 'Unity Game Helper',
    address: 'github://gamedev/unity-helper',
    description: 'Unity C# scripting assistance — component creation, physics setup, shader writing, scene management. Supports Unity 6+ and URP/HDRP.',
    image: 'https://img.icons8.com/fluency/96/unity.png',
    website: 'https://github.com/gamedev/unity-helper',
    category: 'm/openclaw-skills',
    status: 'pending',
    avgRating: 3.4,
    reviewCount: 12,
  },

  // ═══════════════════════════════════════════
  // 🔴 FLAGGED — Known malicious or suspicious
  // ═══════════════════════════════════════════
  {
    name: 'Free GPT-5 Proxy',
    address: 'github://xxhacker/free-gpt5-proxy',
    description: 'Route Claude requests through free GPT-5 proxy for unlimited usage. No API key needed! Works with all models.',
    image: 'https://img.icons8.com/fluency/96/error.png',
    website: 'https://github.com/xxhacker/free-gpt5-proxy',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.2,
    reviewCount: 47,
  },
  {
    name: 'SSH Key Exporter',
    address: 'github://tools-collection/ssh-key-export',
    description: 'Backup and sync SSH keys across machines. Exports ~/.ssh to encrypted cloud storage for easy migration.',
    image: 'https://img.icons8.com/fluency/96/warning-shield.png',
    website: 'https://github.com/tools-collection/ssh-key-export',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.5,
    reviewCount: 33,
  },
  {
    name: 'Crypto Wallet Optimizer',
    address: 'github://defi-helper/wallet-optimizer',
    description: 'Optimize gas fees by analyzing wallet patterns. Requires private key access for transaction batching and MEV protection.',
    image: 'https://img.icons8.com/fluency/96/warning-shield.png',
    website: 'https://github.com/defi-helper/wallet-optimizer',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.1,
    reviewCount: 62,
  },
  {
    name: 'System Prompt Revealer',
    address: 'github://ai-research/prompt-revealer',
    description: 'Extract and display system prompts from any AI model. Useful for research and understanding model behavior.',
    image: 'https://img.icons8.com/fluency/96/error.png',
    website: 'https://github.com/ai-research/prompt-revealer',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.8,
    reviewCount: 29,
  },
  {
    name: 'Token Airdrop Claimer',
    address: 'github://airdrop-tools/auto-claimer',
    description: 'Automatically detect and claim token airdrops across chains. Connects to 50+ protocols. Just paste your seed phrase to start.',
    image: 'https://img.icons8.com/fluency/96/warning-shield.png',
    website: 'https://github.com/airdrop-tools/auto-claimer',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.0,
    reviewCount: 89,
  },
  {
    name: 'Env File Sync',
    address: 'github://devtools-pro/env-sync',
    description: 'Sync .env files across team members via encrypted P2P. Auto-detects new env vars and notifies team.',
    image: 'https://img.icons8.com/fluency/96/warning-shield.png',
    website: 'https://github.com/devtools-pro/env-sync',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.4,
    reviewCount: 41,
  },
  {
    name: 'Browser History Analyzer',
    address: 'github://productivity-suite/history-analyzer',
    description: 'Analyze browsing patterns to optimize productivity. Reads Chrome/Firefox history to suggest focus improvements.',
    image: 'https://img.icons8.com/fluency/96/warning-shield.png',
    website: 'https://github.com/productivity-suite/history-analyzer',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.6,
    reviewCount: 24,
  },
  {
    name: 'AI Code Reviewer Pro',
    address: 'github://unknown-dev/ai-code-reviewer',
    description: 'Sends your code to external AI for deeper review. Finds bugs GPT/Claude miss. Requires full repo access for comprehensive analysis.',
    image: 'https://img.icons8.com/fluency/96/error.png',
    website: 'https://github.com/unknown-dev/ai-code-reviewer',
    category: 'm/openclaw-skills',
    status: 'rejected',
    avgRating: 1.3,
    reviewCount: 55,
  },
]

async function main() {
  console.log('🌱 Seeding Maat V2 with OpenClaw Skills data...\n')

  // Clear existing projects in this category
  const deleted = await prisma.project.deleteMany({
    where: { category: 'm/openclaw-skills' }
  })
  console.log(`🗑️  Cleared ${deleted.count} existing m/openclaw-skills projects`)

  // Seed all skills
  let created = 0
  for (const skill of openclawSkills) {
    try {
      await prisma.project.create({ data: skill })
      const icon = skill.status === 'approved' ? '🟢' : skill.status === 'pending' ? '🟡' : '🔴'
      console.log(`${icon} ${skill.name} (${skill.status}) — ${skill.reviewCount} reviews, ★${skill.avgRating}`)
      created++
    } catch (e: any) {
      console.error(`❌ Failed to seed ${skill.name}: ${e.message}`)
    }
  }

  console.log(`\n✅ Seeded ${created}/${openclawSkills.length} skills`)
  console.log(`   🟢 Verified: ${openclawSkills.filter(s => s.status === 'approved').length}`)
  console.log(`   🟡 Unreviewed: ${openclawSkills.filter(s => s.status === 'pending').length}`)
  console.log(`   🔴 Flagged: ${openclawSkills.filter(s => s.status === 'rejected').length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
