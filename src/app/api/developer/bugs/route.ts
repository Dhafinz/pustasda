import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return list of simulated application bugs/errors
    const bugs = [
      { id: 1, title: 'Prisma Client Query Timeout in SQLite on Concurrent Writes', module: 'database', severity: 'medium', detectedAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, title: 'NextAuth Session Expiration handling on Client Components redirect loop', module: 'auth', severity: 'high', detectedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, title: 'Fonnte WhatsApp API response timeout - Request rate exceeded', module: 'notification', severity: 'low', detectedAt: new Date(Date.now() - 172800000).toISOString() }
    ]

    return NextResponse.json({ bugs })
  } catch (error) {
    console.error('GET /api/developer/bugs error:', error)
    return NextResponse.json({ error: 'Failed to retrieve bugs list' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bugId } = await request.json()

    // Simulated AI bug fixes advice
    let advice = 'Jalankan `npm update` dan periksa koneksi DB.'
    if (bugId === 1) {
      advice = 'Gunakan query pooling atau optimalkan timeout setting pada prisma/schema.prisma: connection_limit=10. Untuk SQLite, hindari write concurrency tinggi atau ubah journal mode ke WAL (Write-Ahead Logging) dengan perintah database manual.'
    } else if (bugId === 2) {
      advice = 'Periksa middleware.ts. Pastikan redirect tidak berulang (infinite redirect loop) dengan mencocokkan route path sebelum mengalihkan ke login page.'
    } else if (bugId === 3) {
      advice = 'Periksa API key Fonnte di file .env. Batasi request rate (rate limiting) pada service pemanggil agar tidak diblokir oleh gateway Fonnte.'
    }

    return NextResponse.json({ advice })
  } catch (error) {
    console.error('POST /api/developer/bugs error:', error)
    return NextResponse.json({ error: 'Failed to analyze bug' }, { status: 500 })
  }
}
