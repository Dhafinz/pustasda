import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { name, waNumber, kelas, jurusan, privacyProfile, allowTeamInvite, notificationPref, photo } = body

    // Update core User details
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        waNumber: waNumber !== undefined ? waNumber : undefined,
        photo: photo !== undefined ? photo : undefined
      }
    })

    // Update StudentProfile details
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId },
      data: {
        kelas: kelas !== undefined ? kelas : undefined,
        jurusan: jurusan !== undefined ? jurusan : undefined,
        privacyProfile: privacyProfile !== undefined ? privacyProfile : undefined,
        allowTeamInvite: allowTeamInvite !== undefined ? allowTeamInvite : undefined,
        notificationPref: notificationPref !== undefined ? notificationPref : undefined
      }
    })

    return NextResponse.json({
      message: 'Profil berhasil diperbarui',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('PATCH /api/student/profile error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui profil' }, { status: 500 })
  }
}
