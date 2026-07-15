import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

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
        botResponse = 'Gunakan menu "Bug Analysis" untuk mendeteksi kegagalan modul runtime yang disimulasikan dan melihat rekomendasi solusi fix secara otomatis dari AI.'
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
