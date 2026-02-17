'use server'

import { prisma } from "@/lib/prisma"
import { analyzeProject, AIAgentAnalysisResult } from "./analyze"

// Map AI analysis type to Maiat category
function mapTypeToCategory(type: string): string {
  const typeMap: Record<string, string> = {
    'AI Agent': 'm/ai-agents',
    'DeFi': 'm/defi',
    'Other': 'm/ai-agents', // Default to AI agents
  }
  return typeMap[type] || 'm/ai-agents'
}

// Generate a unique address from project name
function generateProjectAddress(name: string): string {
  const hash = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const suffix = hash.slice(0, 38).padEnd(38, '0')
  return `0x${suffix}`
}

export interface CreateProjectResult {
  success: boolean
  project?: {
    id: string
    address: string
    name: string
    category: string
    avgRating: number
    description?: string
  }
  analysis?: AIAgentAnalysisResult
  error?: string
  isNew: boolean
}

/**
 * Search for project, analyze with Gemini, and create in DB if not exists
 */
export async function findOrCreateProject(query: string): Promise<CreateProjectResult> {
  const searchTerm = query.toLowerCase().trim()
  
  try {
    // 1. Check if project already exists (by name or address)
    const existingProject = await prisma.project.findFirst({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { address: { contains: searchTerm } },
        ]
      }
    })
    
    if (existingProject) {
      return {
        success: true,
        project: {
          id: existingProject.id,
          address: existingProject.address,
          name: existingProject.name,
          category: existingProject.category,
          avgRating: existingProject.avgRating,
          description: existingProject.description || undefined,
        },
        isNew: false,
      }
    }
    
    // 2. Project doesn't exist - analyze with Gemini
    console.log(`[Maiat] Project "${query}" not found, running AI analysis...`)
    const analysis = await analyzeProject(query)
    
    // 3. Create project in database
    const address = generateProjectAddress(analysis.name || query)
    const category = mapTypeToCategory(analysis.type)
    console.log(`[Maiat] Analysis type: "${analysis.type}" -> Category: "${category}"`)
    
    const newProject = await prisma.project.create({
      data: {
        address,
        name: analysis.name || query,
        description: analysis.summary,
        category,
        website: analysis.website,
        avgRating: analysis.score,
        reviewCount: 0,
      }
    })
    
    console.log(`[Maiat] Created new project: ${newProject.name} (${newProject.id})`)
    
    return {
      success: true,
      project: {
        id: newProject.id,
        address: newProject.address,
        name: newProject.name,
        category: newProject.category,
        avgRating: newProject.avgRating,
        description: newProject.description || undefined,
      },
      analysis,
      isNew: true,
    }
    
  } catch (error) {
    console.error('[Maiat] findOrCreateProject error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isNew: false,
    }
  }
}
