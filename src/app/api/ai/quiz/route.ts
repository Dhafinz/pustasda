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
    const { answers } = await request.json()

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Jawaban kuis diperlukan' }, { status: 400 })
    }

    // Get detailed student context from database
    const userDetail = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        participations: {
          include: {
            competition: {
              include: {
                category: true,
                field: true
              }
            }
          }
        },
        userBadges: {
          include: {
            badge: true
          }
        }
      }
    })

    // Get all active and approved competitions
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        verificationStatus: 'approved'
      },
      include: {
        category: true,
        field: true
      }
    })

    const apiKey = process.env.GEMINI_API_KEY
    let resultJson: any = null

    if (apiKey) {
      try {
        const studentInfoText = `
Nama: ${userDetail?.name || 'Siswa'}
Jurusan: ${userDetail?.studentProfile?.jurusan || 'Umum'} (Kelas ${userDetail?.studentProfile?.kelas || '-'}, Angkatan ${userDetail?.studentProfile?.angkatan || '-'})
Riwayat Partisipasi Lomba: ${userDetail?.participations?.length ? userDetail.participations.map(p => `"${p.competition.title}" (Kategori: ${p.competition.category.name}, Hasil: ${p.result}, Status: ${p.status})`).join(', ') : 'Belum pernah mengikuti lomba.'}
Badge yang Didapat: ${userDetail?.userBadges?.length ? userDetail.userBadges.map(ub => ub.badge.name).join(', ') : 'Belum memiliki badge.'}
`

        const compsContext = activeCompetitions.map(c => 
          `- ID: ${c.id} | Judul: "${c.title}" | Penyelenggara: ${c.organizer} | Kategori: ${c.category.name} | Deskripsi: ${c.description || '-'}`
        ).join('\n')

        const promptText = `Anda adalah AI Profiler Bakat & Karir untuk platform PUSTASDA SMK Telkom Sidoarjo.
Tugas Anda adalah melakukan analisis mendalam terhadap potensi dan kepribadian siswa berdasarkan jawaban kuis minat bakat dan data riil mereka di platform.

DETAIL SISWA:
${studentInfoText}

JAWABAN KUIS MINAT BAKAT (5 Pertanyaan):
1. Aktivitas senggang paling disukai: ${answers[0] || '-'}
2. Peran dalam kelompok kelas: ${answers[1] || '-'}
3. Proyek impian: ${answers[2] || '-'}
4. Gaya belajar: ${answers[3] || '-'}
5. Aspirasi karir: ${answers[4] || '-'}

DAFTAR LOMBA AKTIF YANG DAPAT DISARANKAN (Pilihlah maksimal 3 ID yang paling cocok):
${compsContext || 'Tidak ada kompetisi aktif saat ini.'}

Aturan Penilaian:
- Hubungkan jawaban kuis secara logis dengan jurusan siswa (${userDetail?.studentProfile?.jurusan || 'Umum'}) dan riwayat lombanya.
- Output WAJIB berupa JSON murni dengan struktur persis seperti schema ini:
{
  "interestArea": "Nama klaster minat yang mendalam (misal: Rekayasa Perangkat Lunak & Kecerdasan Artifisial, Desain Media Kreatif & UI/UX, Sains Terapan & Penulisan Ilmiah, Pengembangan Bisnis & Start-up)",
  "explanation": "Penjelasan detail (2-3 paragraf) mengenai potensi kepribadian, bakat, serta kecocokan siswa tersebut berdasarkan kuis dan riwayat lombanya.",
  "bioText": "Satu kalimat bio singkat kepribadian (max 150 karakter) untuk profil mereka.",
  "personalityTraits": ["Trait 1", "Trait 2", "Trait 3"],
  "strengthAnalysis": "Analisis detail mengenai kelebihan alami siswa, dikaitkan dengan riwayat lomba dan jurusannya.",
  "growthAreas": "Area kompetensi atau soft skill yang perlu mereka latih dan kembangkan lagi.",
  "recommendedPath": "Jalur karir, skill set, sertifikasi, atau teknologi yang cocok ditekuni.",
  "suggestedCompetitionIds": [ID_1, ID_2, ID_3]
}
Pastikan suggestedCompetitionIds hanya berisi ID angka ril dari daftar kompetisi aktif di atas. Jangan mengarang ID.`

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        }

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (geminiRes.ok) {
          const resData = await geminiRes.json()
          const text = resData.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            resultJson = JSON.parse(text)
          }
        } else {
          console.error('Gemini API call failed for Quiz:', geminiRes.status, await geminiRes.text())
        }
      } catch (geminiError) {
        console.error('Gemini processing failed, using fallback:', geminiError)
      }
    }

    // Fallback logic in case Gemini is offline or failed to output JSON
    if (!resultJson) {
      let techScore = 0
      let designScore = 0
      let writingScore = 0
      let businessScore = 0

      answers.forEach((ans: string) => {
        if (!ans) return
        const lower = ans.toLowerCase()
        if (lower.includes('coding') || lower.includes('logic') || lower.includes('web') || lower.includes('teknologi') || lower.includes('praktik') || lower.includes('engineer') || lower.includes('programmer')) {
          techScore += 3
        } else if (lower.includes('desain') || lower.includes('visual') || lower.includes('gambar') || lower.includes('logo') || lower.includes('animator')) {
          designScore += 3
        } else if (lower.includes('tulis') || lower.includes('esai') || lower.includes('penelitian') || lower.includes('riset') || lower.includes('akademisi')) {
          writingScore += 3
        } else if (lower.includes('bisnis') || lower.includes('presentasi') || lower.includes('startup') || lower.includes('marketing') || lower.includes('pengusaha')) {
          businessScore += 3
        }
      })

      let interestArea = 'Rekayasa Perangkat Lunak & Sistem Digital'
      let explanation = 'Anda memiliki kekuatan analisis logis yang kuat dan ketertarikan mendalam dalam memecahkan masalah komputasional. Sangat cocok dalam pengembangan aplikasi, web, dan sistem cerdas.'
      let bioText = 'Tech enthusiast yang gemar memecahkan masalah dengan coding.'
      let personalityTraits = ['Logical Thinker', 'Analytical Solver', 'Detail Oriented']
      let strengthAnalysis = 'Kemampuan analisis logis Anda sangat baik untuk menyusun algoritma yang efisien.'
      let growthAreas = 'Tingkatkan kemampuan kolaborasi tim dan dokumentasi teknis sistem.'
      let recommendedPath = 'Tekuni Software Engineering, Web Development, Cloud Computing, dan kuasai algoritma lanjutan.'
      let categoryKeyword = 'web'

      const max = Math.max(techScore, designScore, writingScore, businessScore)
      if (max === designScore) {
        interestArea = 'Desain Media Kreatif & UI/UX'
        explanation = 'Sisi artistik dan kepekaan visual Anda sangat menonjol. Anda mampu menerjemahkan ide-ide abstrak menjadi aset visual yang memikat dan intuitif bagi pengguna.'
        bioText = 'Visual creator dengan ketertarikan tinggi pada estetika dan UI/UX.'
        personalityTraits = ['Aesthetic Eye', 'Creative Visualizer', 'User Centric']
        strengthAnalysis = 'Kepekaan tata letak, warna, dan pengalaman pengguna merupakan aset berharga Anda.'
        growthAreas = 'Perdalam aspek riset pengguna (UX research) sebelum merancang solusi visual.'
        recommendedPath = 'Kuasai alat desain modern (Figma, Adobe Creative Suite) dan pelajari interaksi manusia-komputer.'
        categoryKeyword = 'desain'
      } else if (max === writingScore) {
        interestArea = 'Sains Terapan & Penulisan Ilmiah'
        explanation = 'Daya kritis dan hasrat riset Anda sangat mendalam. Anda menikmati proses membaca referensi ilmiah, mengumpulkan bukti logis, dan menyusun laporan terstruktur.'
        bioText = 'Critical researcher yang bersemangat menyusun kajian esai ilmiah.'
        personalityTraits = ['Critical Thinker', 'Rigorous Researcher', 'Structured Writer']
        strengthAnalysis = 'Kemampuan berpikir kritis dan menyusun narasi logis berbasis data ilmiah.'
        growthAreas = 'Latihlah teknik penyampaian presentasi agar hasil riset lebih interaktif.'
        recommendedPath = 'Kuasai metode penelitian ilmiah, penulisan esai kompetitif, dan teknik debat ilmiah.'
        categoryKeyword = 'akademik'
      } else if (max === businessScore) {
        interestArea = 'Pengembangan Bisnis & Start-up'
        explanation = 'Anda adalah pemikir strategis yang pandai melihat celah pasar. Kemampuan komunikasi persuasif dan analisis kelayakan ide bisnis Anda sangat menjanjikan.'
        bioText = 'Future entrepreneur dengan hasrat merintis ide bisnis kreatif.'
        personalityTraits = ['Strategic Planner', 'Persuasive Speaker', 'Risk Taker']
        strengthAnalysis = 'Keberanian berinovasi dan kemampuan mempresentasikan rencana bisnis secara menarik.'
        growthAreas = 'Perkuat pemahaman model keuangan dan analisis kelayakan pasar riil.'
        recommendedPath = 'Pelajari business model canvas, manajemen proyek digital, teknik pitching, dan pemasaran modern.'
        categoryKeyword = 'bisnis'
      }

      // Filter matched competition IDs based on keyword
      const matchedComps = activeCompetitions.filter(c => 
        c.title.toLowerCase().includes(categoryKeyword) ||
        (c.description && c.description.toLowerCase().includes(categoryKeyword)) ||
        c.category.name.toLowerCase().includes(categoryKeyword)
      ).slice(0, 3)

      const fallbackIds = matchedComps.length > 0 
        ? matchedComps.map(c => c.id)
        : activeCompetitions.slice(0, 3).map(c => c.id)

      resultJson = {
        interestArea,
        explanation,
        bioText,
        personalityTraits,
        strengthAnalysis,
        growthAreas,
        recommendedPath,
        suggestedCompetitionIds: fallbackIds
      }
    }

    // Save final bioText result into StudentProfile DB
    const finalBio = `Minat: ${resultJson.interestArea}. ${resultJson.bioText}`
    await prisma.studentProfile.update({
      where: { userId },
      data: { bioAi: finalBio }
    })

    // Resolve actual full competition object details for suggestions
    const suggestionIds = resultJson.suggestedCompetitionIds || []
    const dbSuggestions = await prisma.competition.findMany({
      where: {
        id: { in: suggestionIds },
        isActive: true,
        verificationStatus: 'approved'
      },
      include: {
        category: true
      }
    })

    // If suggestions resolved is empty, get fallback active ones
    let suggestionsToReturn = dbSuggestions
    if (dbSuggestions.length === 0) {
      suggestionsToReturn = await prisma.competition.findMany({
        where: { isActive: true, verificationStatus: 'approved' },
        include: { category: true },
        take: 3
      })
    }

    const suggestions = suggestionsToReturn.map(c => ({
      id: c.id,
      title: c.title,
      organizer: c.organizer,
      category: c.category.name,
      color: c.category.color,
      type: c.type
    }))

    return NextResponse.json({
      interestArea: resultJson.interestArea,
      explanation: resultJson.explanation,
      bioText: resultJson.bioText,
      personalityTraits: resultJson.personalityTraits,
      strengthAnalysis: resultJson.strengthAnalysis,
      growthAreas: resultJson.growthAreas,
      recommendedPath: resultJson.recommendedPath,
      suggestions
    })

  } catch (error) {
    console.error('POST /api/ai/quiz error:', error)
    return NextResponse.json({ error: 'Gagal menganalisis minat bakat' }, { status: 500 })
  }
}
