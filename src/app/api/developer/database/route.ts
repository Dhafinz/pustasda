import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hashSync } from 'bcryptjs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const modelDelegates: Record<string, any> = {
  user: prisma.user,
  studentprofile: prisma.studentProfile,
  teacherprofile: prisma.teacherProfile,
  category: prisma.category,
  field: prisma.field,
  competition: prisma.competition,
  competitionstage: prisma.competitionStage,
  savefolder: prisma.saveFolder,
  competitionsave: prisma.competitionSave,
  team: prisma.team,
  teammember: prisma.teamMember,
  participation: prisma.participation,
  participationstep: prisma.participationStep,
  mentorship: prisma.mentorship,
  mentorshipactivity: prisma.mentorshipActivity,
  notification: prisma.notification,
  badge: prisma.badge,
  userbadge: prisma.userBadge,
  appsetting: prisma.appSetting,
  activitylog: prisma.activityLog,
  session: prisma.session,
  passwordresettoken: prisma.passwordResetToken
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, table, page = 1, limit = 20, search = '', recordId, data } = body

    // 1. DATABASE UTILITY ACTIONS (No Table Needed)
    if (action === 'seed') {
      try {
        await execAsync('npx prisma db seed')
        return NextResponse.json({ message: 'Database successfully seeded with mock data!' })
      } catch (err: any) {
        console.error('Seeding failed:', err)
        return NextResponse.json({ error: 'Seeding failed: ' + err.message }, { status: 500 })
      }
    }

    if (action === 'wipe') {
      try {
        // Safe Wipe: Clear all user-related data, except developer accounts
        await prisma.mentorshipActivity.deleteMany()
        await prisma.mentorship.deleteMany()
        await prisma.participationStep.deleteMany()
        await prisma.participation.deleteMany()
        await prisma.teamMember.deleteMany()
        await prisma.team.deleteMany()
        await prisma.competitionSave.deleteMany()
        await prisma.saveFolder.deleteMany()
        await prisma.competitionStage.deleteMany()
        await prisma.competition.deleteMany()
        await prisma.notification.deleteMany()
        await prisma.userBadge.deleteMany()
        await prisma.badge.deleteMany()
        await prisma.activityLog.deleteMany()
        await prisma.session.deleteMany()
        await prisma.passwordResetToken.deleteMany()
        await prisma.studentProfile.deleteMany()
        await prisma.teacherProfile.deleteMany()

        // Delete all users who are NOT developer
        await prisma.user.deleteMany({
          where: { role: { not: 'developer' } }
        })

        return NextResponse.json({ message: 'Database successfully reset. All user data wiped.' })
      } catch (err: any) {
        console.error('Wipe failed:', err)
        return NextResponse.json({ error: 'Wipe failed: ' + err.message }, { status: 500 })
      }
    }

    if (action === 'normalize') {
      try {
        // Fix and clean student profile classes and majors
        const students = await prisma.studentProfile.findMany()
        let count = 0

        for (const s of students) {
          let updated = false
          let cleanKelas = s.kelas || ''
          let cleanJurusan = s.jurusan || ''

          if (cleanKelas.includes('X') || cleanKelas.includes('x')) {
            updated = true
            if (cleanKelas.includes('XIII') || cleanKelas.includes('xiii')) cleanKelas = 'XIII'
            else if (cleanKelas.includes('XII') || cleanKelas.includes('xii')) cleanKelas = 'XII'
            else if (cleanKelas.includes('XI') || cleanKelas.includes('xi')) cleanKelas = 'XI'
            else cleanKelas = 'X'
          }

          const lowerJ = cleanJurusan.toLowerCase()
          if (lowerJ.includes('sija') || lowerJ.includes('rekayasa') || lowerJ.includes('rpl')) {
            updated = true
            cleanJurusan = 'SIJA'
          } else if (lowerJ.includes('tjat') || lowerJ.includes('jaringan') || lowerJ.includes('tkj')) {
            updated = true
            cleanJurusan = 'TJAT'
          }

          if (updated) {
            await prisma.studentProfile.update({
              where: { id: s.id },
              data: { kelas: cleanKelas, jurusan: cleanJurusan }
            })
            count++
          }
        }

        return NextResponse.json({ message: `Data cleanup complete. Normalized ${count} student profile records.` })
      } catch (err: any) {
        console.error('Normalization failed:', err)
        return NextResponse.json({ error: 'Normalization failed: ' + err.message }, { status: 500 })
      }
    }

    // 2. CRITICAL TABLE OPERATIONS
    if (!table) {
      return NextResponse.json({ error: 'Table parameter required' }, { status: 400 })
    }

    const delegate = modelDelegates[table.toLowerCase()]
    if (!delegate) {
      return NextResponse.json({ error: `Table '${table}' not found in configuration` }, { status: 404 })
    }

    if (action === 'read') {
      const skip = (page - 1) * limit

      // Dynamic Search Filter based on string matching
      let where = {}
      if (search) {
        if (table.toLowerCase() === 'user') {
          where = {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } }
            ]
          }
        } else if (table.toLowerCase() === 'competition') {
          where = {
            OR: [
              { title: { contains: search } },
              { organizer: { contains: search } }
            ]
          }
        } else if (table.toLowerCase() === 'studentprofile') {
          where = {
            OR: [
              { nis: { contains: search } },
              { kelas: { contains: search } },
              { jurusan: { contains: search } }
            ]
          }
        }
      }

      // Read records sorted by ID if available (fallback otherwise)
      const count = await delegate.count({ where })
      let records = []

      try {
        if (table.toLowerCase() === 'studentprofile') {
          records = await prisma.studentProfile.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            take: limit,
            skip,
            orderBy: { id: 'desc' }
          })
          records = records.map((r: any) => ({
            id: r.id,
            userId: r.userId,
            name: r.user?.name || '-',
            email: r.user?.email || '-',
            nis: r.nis,
            kelas: r.kelas,
            jurusan: r.jurusan,
            angkatan: r.angkatan
          }))
        } else if (table.toLowerCase() === 'teacherprofile') {
          records = await prisma.teacherProfile.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            take: limit,
            skip,
            orderBy: { id: 'desc' }
          })
          records = records.map((r: any) => ({
            id: r.id,
            userId: r.userId,
            name: r.user?.name || '-',
            email: r.user?.email || '-',
            nip: r.nip,
            bidangKeahlian: r.bidangKeahlian,
            jabatan: r.jabatan
          }))
        } else {
          records = await delegate.findMany({
            where,
            take: limit,
            skip,
            orderBy: { id: 'desc' }
          })
        }
      } catch {
        records = await delegate.findMany({
          where,
          take: limit,
          skip
        })
      }

      return NextResponse.json({ records, total: count, page, limit })
    }

    if (action === 'create') {
      // Process nested types (dates, numbers) correctly
      const parsedData = { ...data }

      // Hash password if we are creating a user and it's plaintext
      if (table.toLowerCase() === 'user' && parsedData.password && !parsedData.password.startsWith('$2a$') && !parsedData.password.startsWith('$2b$')) {
        parsedData.password = hashSync(parsedData.password, 10)
      }

      // Convert ID references, strings to integers/booleans where required
      for (const [key, val] of Object.entries(parsedData)) {
        if (val === '') {
          parsedData[key] = null
          continue
        }
        if (key.endsWith('Id') && typeof val === 'string') {
          parsedData[key] = parseInt(val)
        }
        if (typeof val === 'string' && !isNaN(val as any) && (key === 'maxMembers' || key === 'minMembers' || key === 'totalStages' || key === 'stageNumber' || key === 'stepOrder')) {
          parsedData[key] = parseInt(val)
        }
        if (val === 'true') parsedData[key] = true
        if (val === 'false') parsedData[key] = false
        if (typeof val === 'string' && (key.endsWith('At') || key === 'deadline' || key === 'registerDeadline' || key === 'announcementDate' || key === 'scheduleDate')) {
          parsedData[key] = new Date(val)
        }
      }

      const created = await delegate.create({ data: parsedData })
      return NextResponse.json({ message: 'Record created successfully', record: created })
    }

    if (action === 'update') {
      if (!recordId) {
        return NextResponse.json({ error: 'Record ID required for updates' }, { status: 400 })
      }

      const parsedData = { ...data }

      // Parse key/types and hash if new plain password
      if (table.toLowerCase() === 'user' && parsedData.password && !parsedData.password.startsWith('$2a$') && !parsedData.password.startsWith('$2b$')) {
        parsedData.password = hashSync(parsedData.password, 10)
      }

      for (const [key, val] of Object.entries(parsedData)) {
        if (val === '') {
          if (key === 'password') {
            delete parsedData[key]
          } else {
            parsedData[key] = null
          }
          continue
        }
        if (key.endsWith('Id') && typeof val === 'string') {
          parsedData[key] = parseInt(val)
        }
        if (typeof val === 'string' && !isNaN(val as any) && (key === 'maxMembers' || key === 'minMembers' || key === 'totalStages' || key === 'stageNumber' || key === 'stepOrder')) {
          parsedData[key] = parseInt(val)
        }
        if (val === 'true') parsedData[key] = true
        if (val === 'false') parsedData[key] = false
        if (typeof val === 'string' && (key.endsWith('At') || key === 'deadline' || key === 'registerDeadline' || key === 'announcementDate' || key === 'scheduleDate')) {
          parsedData[key] = new Date(val)
        }
      }

      // Check if primary key is not an integer ID
      const queryId = isNaN(parseInt(recordId)) ? recordId : parseInt(recordId)

      const updated = await delegate.update({
        where: { id: queryId },
        data: parsedData
      })

      return NextResponse.json({ message: 'Record updated successfully', record: updated })
    }

    if (action === 'delete') {
      if (!recordId) {
        return NextResponse.json({ error: 'Record ID required for deletion' }, { status: 400 })
      }

      const queryId = isNaN(parseInt(recordId)) ? recordId : parseInt(recordId)

      await delegate.delete({
        where: { id: queryId }
      })

      return NextResponse.json({ message: 'Record deleted successfully' })
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 })
  } catch (error: any) {
    console.error('Developer Database API error:', error)
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 })
  }
}
