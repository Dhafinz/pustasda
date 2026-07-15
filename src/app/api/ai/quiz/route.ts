import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { answers } = await request.json() // answers is an array of strings/integers representing selections

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Jawaban kuis diperlukan' }, { status: 400 })
    }

    // Question categories mapping (e.g. Q1: coding -> Tech, Q2: painting -> Art, etc.)
    // Let's count student's interest vector based on mock selections:
    // Q1: coding (Tech), design (Design), writing (Writing), business (Business)
    // Q2: solving logic (Tech), visual aesthetic (Design), communicating (Business), research (Writing)
    // Q3: website (Tech), logo (Design), essay (Writing), startup pitch (Business)
    let techScore = 0
    let designScore = 0
    let writingScore = 0
    let businessScore = 0

    answers.forEach((ans: string) => {
      const lower = ans.toLowerCase()
      if (lower.includes('coding') || lower.includes('logic') || lower.includes('web') || lower.includes('teknologi')) {
        techScore += 3
      } else if (lower.includes('desain') || lower.includes('visual') || lower.includes('gambar') || lower.includes('logo')) {
        designScore += 3
      } else if (lower.includes('tulis') || lower.includes('esai') || lower.includes('penelitian') || lower.includes('riset')) {
        writingScore += 3
      } else if (lower.includes('bisnis') || lower.includes('presentasi') || lower.includes(' startup') || lower.includes('marketing')) {
        businessScore += 3
      } else {
        // Fallback random increments to simulate answers distribution
        techScore++
        designScore++
      }
    })

    // Determine highest scoring interest area
    let interestArea = 'Teknologi & Rekayasa Perangkat Lunak'
    let categorySearchTerm = 'web'
    let explanation = 'Anda memiliki kecenderungan berpikir logis, analitis, serta tertarik memecahkan masalah komputasional. Anda sangat cocok di bidang pemrograman, cyber security, dan rekayasa digital.'

    const max = Math.max(techScore, designScore, writingScore, businessScore)
    if (max === designScore) {
      interestArea = 'Seni & Desain Kreatif'
      categorySearchTerm = 'desain'
      explanation = 'Anda memiliki mata artistik yang tajam, sangat sensitif terhadap estetika visual, tata letak, dan komunikasi kreatif. Anda cocok di bidang UI/UX, animasi, logo branding, dan videografi.'
    } else if (max === writingScore) {
      interestArea = 'Sains & Penelitian Akademik'
      categorySearchTerm = 'akademik'
      explanation = 'Anda suka mengobservasi, gemar membaca, menyusun gagasan tekstual, serta memiliki daya nalar kritis yang mendalam. Anda sangat cocok untuk ajang lomba esai ilmiah, olimpiade matematika/sains, dan debat.'
    } else if (max === businessScore) {
      interestArea = 'Kewirausahaan & Bisnis Digital'
      categorySearchTerm = 'bisnis'
      explanation = 'Anda adalah pemikir strategis, komunikatif, berani mengambil risiko, serta memiliki naluri manajerial yang baik. Anda sangat cocok untuk ajang lomba business plan, pitching startup, dan poster niaga.'
    }

    // Save AI Bio result to Student Profile
    const bioText = `Minat utama: ${interestArea}. ${explanation}`
    await prisma.studentProfile.update({
      where: { userId },
      data: { bioAi: bioText }
    })

    // Query actual competitions matching the student's category interests
    const suggestedComps = await prisma.competition.findMany({
      where: {
        isActive: true,
        verificationStatus: 'approved',
        OR: [
          { title: { contains: categorySearchTerm } },
          { description: { contains: categorySearchTerm } },
          { category: { name: { contains: categorySearchTerm } } }
        ]
      },
      include: { category: true },
      take: 3
    })

    // If no specific suggestion found, fetch any trending/active comps as fallback
    let fallbackComps = suggestedComps
    if (suggestedComps.length === 0) {
      fallbackComps = await prisma.competition.findMany({
        where: { isActive: true, verificationStatus: 'approved' },
        include: { category: true },
        take: 3
      })
    }

    const suggestions = fallbackComps.map(c => ({
      id: c.id,
      title: c.title,
      organizer: c.organizer,
      category: c.category.name,
      color: c.category.color,
      type: c.type
    }))

    return NextResponse.json({
      interestArea,
      explanation,
      bioText,
      suggestions
    })
  } catch (error) {
    console.error('POST /api/ai/quiz error:', error)
    return NextResponse.json({ error: 'Gagal menganalisis minat bakat' }, { status: 500 })
  }
}
