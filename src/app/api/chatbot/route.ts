import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const messages = body.messages
    const message = body.message || (messages && Array.isArray(messages) ? messages[messages.length - 1]?.content : '')

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const role = session.user.role
    const name = session.user.name
    const msgLower = message.toLowerCase()

    // Query active and approved competitions from the database to ground the AI's recommendations
    const activeCompetitions = await prisma.competition.findMany({
      where: { isActive: true, verificationStatus: 'approved' },
      select: {
        id: true,
        title: true,
        organizer: true,
        level: true,
        type: true,
        minMembers: true,
        maxMembers: true,
        deadline: true,
        category: { select: { name: true } },
        field: { select: { name: true } }
      }
    })

    const compsContext = activeCompetitions.map(c => 
      `- [ID: ${c.id}] Lomba "${c.title}" oleh ${c.organizer} (${c.category.name} - ${c.field.name}), tingkat ${c.level}, jenis ${c.type} (min: ${c.minMembers}, max: ${c.maxMembers} orang). Deadline Pendaftaran: ${new Date(c.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
    ).join('\n')

    const apiKey = process.env.GEMINI_API_KEY

    const systemInstructionText = `Anda adalah PUSTASDA-AI, asisten pintar untuk platform Pusat Prestasi SMK Telkom Sidoarjo (PUSTASDA).
Tugas utama Anda adalah:
1. Membantu pengguna (siswa, guru, admin, developer) dalam memahami dan menggunakan seluruh fitur website PUSTASDA (Leaderboard, Monitoring Bimbingan, Eksplor Lomba, Kuis Karakter AI, dsb.).
2. Memberikan panduan, saran, bimbingan, ide kreatif, tips, materi belajar, dan inspirasi untuk berbagai bidang kompetisi/lomba (misalnya: pemrograman/coding, desain grafis, UI/UX, jaringan/TJAT, business plan, seni, e-sports, olahraga, karya ilmiah, dsb.).
3. Membimbing siswa dalam memecahkan masalah terkait persiapan lomba, pembuatan tim, pencarian ide proyek, pemecahan masalah coding/desain dalam konteks lomba mereka, serta tips bimbingan dengan guru.

GAYA KOMUNIKASI:
- Berbicaralah dalam Bahasa Indonesia yang sangat ramah, santun, antusias, memotivasi, dan profesional.
- Berikan penjelasan yang mendalam, terstruktur (gunakan bullet points jika membantu), taktis, dan mudah dipahami.
- Hindari jawaban yang kaku, pendek, atau template statis. Bersikaplah seperti mentor/pembimbing yang suportif.
- Fokuskan tanggapan Anda untuk membantu pengembangan diri siswa, prestasi akademik, dan non-akademik di SMK Telkom Sidoarjo.

DATA KOMPETISI AKTIF SAAT INI (DATABASE PUSTASDA):
${compsContext || 'Saat ini tidak ada kompetisi aktif yang terdaftar di database.'}

ATURAN REKOMENDASI LOMBA:
- Ketika pengguna menanyakan tentang saran lomba, rekomendasi lomba, atau bidang minat tertentu, Anda WAJIB menyarankan lomba dari daftar "DATA KOMPETISI AKTIF SAAT INI" di atas. Jangan mengarang atau merekomendasikan lomba fiktif yang tidak terdaftar di daftar di atas.
- Berikan alasan mengapa lomba tersebut cocok untuk mereka (misalnya berdasarkan kategori atau bidangnya).
- Informasikan juga kepada mereka bahwa mereka dapat mencari lomba tersebut di menu "Eksplor Lomba" di platform PUSTASDA.`

    // Try calling the Gemini API first
    try {
      let contents = []
      if (messages && Array.isArray(messages)) {
        // Map messages to Gemini contents (roles: user / model)
        contents = messages.map(msg => ({
          role: (msg.role === 'assistant' || msg.role === 'model' || msg.role === 'bot') ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      } else {
        contents = [
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ]
      }

      const payload = {
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7
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
        const data = await geminiRes.json()
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (botResponse) {
          return NextResponse.json({ response: botResponse, reply: botResponse })
        }
      } else {
        console.error('Gemini API call failed with status:', geminiRes.status, await geminiRes.text())
      }
    } catch (apiError) {
      console.error('Failed to request Gemini API, falling back to local handler:', apiError)
    }

    // Fallback: Local chatbot rule engine in case Gemini API is offline/fails
    let botResponse = `Halo ${name}, ada yang bisa saya bantu terkait PUSTASDA?`

    if (role === 'student') {
      if (msgLower.includes('poin') || msgLower.includes('point') || msgLower.includes('skor')) {
        botResponse = 'Siswa PUSTASDA bisa mendapatkan poin prestasi dengan mendaftar kompetisi (0.2 pts), submit karya (0.5 pts), juara 3 (1.0 pts), juara 2 (2.0 pts), dan juara 1 (3.0 pts). Poin ini akan diakumulasikan ke dalam Leaderboard utama sekolah!'
      } else if (msgLower.includes('tim') || msgLower.includes('kelompok') || msgLower.includes('kode')) {
        botResponse = 'Untuk kompetisi tim, Anda dapat membuat tim di menu "Eksplor Lomba" yang akan menghasilkan Kode Undangan. Bagikan kode tersebut kepada teman Anda agar mereka dapat memasukkan kode tersebut untuk bergabung.'
      } else if (msgLower.includes('pembimbing') || msgLower.includes('guru') || msgLower.includes('mentor')) {
        botResponse = 'Anda dapat mengajukan guru pembimbing melalui menu "Lomba Saya" setelah terdaftar di kompetisi. Pilih nama guru di dropdown dan klik Ajukan. Setelah guru menyetujui, Anda dapat mencatatkan aktivitas bimbingan di timeline progres.'
      } else if (msgLower.includes('kuis') || msgLower.includes('karakter') || msgLower.includes('minat')) {
        botResponse = 'Kuis Karakter AI berada di menu Pengaturan -> Kuis Karakter. Kuis akan menganalisis preferensi minat bakat Anda dan menyarankan rekomendasi kompetisi yang cocok di database PUSTASDA.'
      } else {
        botResponse = `Halo ${name} (Siswa), saya asisten AI PUSTASDA. Anda bisa bertanya tentang: Cara mendaftar lomba, membuat tim kelompok, mengajukan guru pembimbing, klaim poin juara, atau Kuis Karakter AI.`
      }
    } else if (role === 'teacher') {
      if (msgLower.includes('bimbingan') || msgLower.includes('acc') || msgLower.includes('setuju')) {
        botResponse = 'Guru dapat menyetujui atau menolak pengajuan bimbingan siswa di menu "Bimbingan" atau "Kotak Masuk". Setelah disetujui, Anda dapat memantau garis waktu progres siswa serta memverifikasi dan memberi catatan evaluasi.'
      } else if (msgLower.includes('cari') || msgLower.includes('siswa') || msgLower.includes('profil')) {
        botResponse = 'Gunakan fitur "Cari Siswa" untuk melacak profil lengkap siswa aktif, melihat klaster minat bakat hasil Kuis AI mereka, serta memantau daftar kompetisi yang sedang mereka ikuti.'
      } else if (msgLower.includes('share') || msgLower.includes('bagikan') || msgLower.includes('link')) {
        botResponse = 'Di menu "Eksplor Lomba", Anda dapat melihat spesifikasi lomba dan menekan tombol "Bagikan Link" untuk menyalin tautan registrasi siswa secara instan untuk Anda share di WhatsApp group kelas.'
      } else {
        botResponse = `Halo Guru ${name}, saya asisten AI PUSTASDA. Anda bisa bertanya tentang: Cara menyetujui pengajuan bimbingan siswa, memverifikasi progres aktivitas timeline siswa, melacak profil siswa aktif, atau membagikan link lomba.`
      }
    } else if (role === 'admin') {
      if (msgLower.includes('akun') || msgLower.includes('tambah') || msgLower.includes('user') || msgLower.includes('bulk')) {
        botResponse = 'Administrator dapat membuat akun siswa/guru secara manual atau bulk import (copy-paste semicolon data) di menu "Manajemen User". Siswa dan guru tidak dapat register mandiri di web demi menjaga validitas data.'
      } else if (msgLower.includes('posting') || msgLower.includes('tambah lomba') || msgLower.includes('buat lomba')) {
        botResponse = 'Posting kompetisi baru dapat dilakukan di menu "Manajemen Lomba". Masukkan data kategori, bidang, tingkat cakupan, tipe partisipan, deadline, serta link guidebook kompetisi.'
      } else if (msgLower.includes('kategori') || msgLower.includes('bidang') || msgLower.includes('tag')) {
        botResponse = 'Kategori (misal: Seni, Bisnis) dan Bidang Lomba (misal: UI/UX, Programming) dapat dikelola secara penuh di menu "Kategori & Bidang".'
      } else {
        botResponse = `Halo Admin ${name}, saya asisten AI PUSTASDA. Anda bisa bertanya tentang: Cara menambah akun user (single/bulk), memposting lomba baru, mengedit kategori/bidang kompetisi, serta monitoring bimbingan sekolah.`
      }
    } else if (role === 'developer') {
      if (msgLower.includes('warna') || msgLower.includes('icon') || msgLower.includes('tampilan')) {
        botResponse = 'Developer dapat memodifikasi warna utama website dan nama file logo aplikasi pada database melalui menu "Pengaturan App". Perubahan ini disimpan secara persisten di tabel app_settings.'
      } else if (msgLower.includes('bug') || msgLower.includes('fix') || msgLower.includes('error')) {
        botResponse = 'Gunakan menu "Bug Analysis" untuk dekteksi kegagalan modul runtime yang disimulasikan dan melihat rekomendasi solusi fix secara otomatis dari AI.'
      } else {
        botResponse = `Halo Developer ${name}, saya asisten AI PUSTASDA. Anda bisa bertanya tentang: Mengganti warna utama web, mengganti icon aplikasi pada database, atau analisis bug runtime.`
      }
    }

    return NextResponse.json({ response: botResponse, reply: botResponse })
  } catch (error) {
    console.error('POST /api/chatbot error:', error)
    return NextResponse.json({ error: 'Gagal memproses pesan chatbot' }, { status: 500 })
  }
}
