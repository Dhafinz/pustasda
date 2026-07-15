import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category') || ''
    const fieldId = searchParams.get('field') || ''
    const level = searchParams.get('level') || ''
    const type = searchParams.get('type') || ''
    const filter = searchParams.get('filter') || '' // trending, newest, national, deadline
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
      verificationStatus: 'approved',
    }

    // Search by title or organizer
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { organizer: { contains: search } },
      ]
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    // Filter by field
    if (fieldId) {
      where.fieldId = parseInt(fieldId)
    }

    // Filter by level
    if (level) {
      where.level = level
    }

    // Filter by type (solo/team)
    if (type) {
      where.type = type
    }

    // Special filters
    let orderBy: any = { createdAt: 'desc' }

    if (filter === 'trending') {
      where.isTrending = true
      orderBy = { viewCount: 'desc' }
    } else if (filter === 'newest') {
      orderBy = { createdAt: 'desc' }
    } else if (filter === 'national') {
      where.level = 'nasional'
    } else if (filter === 'deadline') {
      where.deadline = { gte: new Date() }
      orderBy = { deadline: 'asc' }
    }

    // Fetch competitions with pagination
    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        include: {
          category: true,
          field: true,
          creator: {
            select: { id: true, name: true, photo: true }
          },
          stages: {
            orderBy: { stageNumber: 'asc' }
          },
          _count: {
            select: {
              participations: true,
              teams: true,
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.competition.count({ where }),
    ])

    // Format response
    const formatted = competitions.map(comp => ({
      id: comp.id,
      title: comp.title,
      organizer: comp.organizer,
      level: comp.level,
      type: comp.type,
      maxMembers: comp.maxMembers,
      minMembers: comp.minMembers,
      description: comp.description,
      requirements: comp.requirements,
      linkRegistration: comp.linkRegistration,
      guidebookLink: comp.guidebookLink,
      poster: comp.poster,
      cover: comp.cover,
      registerDeadline: comp.registerDeadline,
      deadline: comp.deadline,
      announcementDate: comp.announcementDate,
      totalStages: comp.totalStages,
      isTrending: comp.isTrending,
      viewCount: comp.viewCount,
      verificationStatus: comp.verificationStatus,
      createdAt: comp.createdAt,
      category: {
        id: comp.category.id,
        name: comp.category.name,
        icon: comp.category.icon,
        color: comp.category.color,
      },
      field: {
        id: comp.field.id,
        name: comp.field.name,
        icon: comp.field.icon,
      },
      creator: comp.creator,
      stages: comp.stages,
      stats: {
        participations: comp._count.participations,
        teams: comp._count.teams,
      },
    }))

    return NextResponse.json({
      competitions: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/competitions error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data kompetisi' },
      { status: 500 }
    )
  }
}
