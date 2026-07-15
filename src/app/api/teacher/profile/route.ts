import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { name, waNumber, bidangKeahlian } = await request.json()

    // Update core User details
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        waNumber: waNumber !== undefined ? waNumber : undefined
      }
    })

    // Update TeacherProfile details
    const updatedProfile = await prisma.teacherProfile.update({
      where: { userId },
      data: {
        bidangKeahlian: bidangKeahlian !== undefined ? bidangKeahlian : undefined
      }
    })

    return NextResponse.json({
      message: 'Profil guru berhasil diperbarui',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('PATCH /api/teacher/profile error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui profil guru' }, { status: 500 })
  }
}
