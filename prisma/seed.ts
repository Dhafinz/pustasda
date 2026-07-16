import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashSync } from 'bcryptjs'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(__dirname, 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as any)

function email(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '.') + '@pustasda.com'
}

const defaultPass = hashSync('password', 10)

async function main() {
  console.log('🌱 Seeding database...')

  // Check if active custom pack seeder exists
  let customPack: any = null
  const activePath = path.join(process.cwd(), 'prisma', 'seeder_active.json')
  if (fs.existsSync(activePath)) {
    try {
      customPack = JSON.parse(fs.readFileSync(activePath, 'utf-8'))
      console.log(`💡 Custom Seeder Pack Detected: ${customPack.name}`)
    } catch (e) {
      console.error('Failed to read custom active seeder pack:', e)
    }
  }

  // ============================================================
  // CLEAN: Hapus semua data kecuali admin & developer
  // ============================================================
  console.log(' 🗑️  Cleaning...')
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
  await prisma.user.deleteMany({ where: { role: { notIn: ['admin', 'developer'] } } })
  await prisma.field.deleteMany()
  await prisma.category.deleteMany()
  await prisma.appSetting.deleteMany()

  // ============================================================
  // BIDANG (Categories) & KATEGORI (Fields)
  // ============================================================
  console.log(' 📂 Creating bidang + kategori...')

  const defaultBidang = [
    {
      name: 'Teknologi Informasi', icon: 'fa-microchip', color: '#2196F3',
      fields: ['Pemrograman Web', 'Pemrograman Mobile', 'Jaringan Komputer', 'Basis Data', 'Keamanan Siber', 'Cloud Computing', 'Kecerdasan Buatan', 'Internet of Things', 'Sistem Operasi', 'DevOps'],
    },
    {
      name: 'Sains & Matematika', icon: 'fa-flask', color: '#4CAF50',
      fields: ['Fisika', 'Kimia', 'Biologi', 'Matematika', 'Statistika', 'Astronomi', 'Lingkungan Hidup', 'Klimatologi', 'Nanoteknologi', 'Genetika'],
    },
    {
      name: 'Bahasa & Komunikasi', icon: 'fa-comments', color: '#FF9800',
      fields: ['Bahasa Indonesia', 'Bahasa Inggris', 'Bahasa Jepang', 'Bahasa Mandarin', 'Bahasa Arab', 'Debat', 'Pidato', 'Jurnalistik', 'Penulisan Kreatif', 'Penerjemahan'],
    },
    {
      name: 'Seni & Budaya', icon: 'fa-palette', color: '#9C27B0',
      fields: ['Musik', 'Tari', 'Teater', 'Seni Rupa', 'Seni Lukis', 'Seni Patung', 'Fotografi', 'Sinematografi', 'Desain Grafis', 'Kriya'],
    },
    {
      name: 'Olahraga & Kesehatan', icon: 'fa-heartbeat', color: '#F44336',
      fields: ['Futsal', 'Basket', 'Voli', 'Bulu Tangkis', 'Atletik', 'Renang', 'Catur', 'Taekwondo', 'Pencak Silat', 'Kesehatan'],
    },
    {
      name: 'Bisnis & Kewirausahaan', icon: 'fa-briefcase', color: '#607D8B',
      fields: ['Business Plan', 'Marketing', 'E-Commerce', 'Keuangan', 'Manajemen', 'Kewirausahaan', 'Investasi', 'Akuntansi', 'Perpajakan', 'Logistik'],
    },
    {
      name: 'Teknik & Rekayasa', icon: 'fa-gears', color: '#795548',
      fields: ['Teknik Elektro', 'Teknik Mesin', 'Teknik Sipil', 'Robotika', 'Otomotif', 'Refrigerasi', 'PLC', 'CAD/CAM', 'Material', 'Energi Terbarukan'],
    },
    {
      name: 'Desain & Multimedia', icon: 'fa-pen-ruler', color: '#E91E63',
      fields: ['UI/UX Design', 'Video Editing', 'Animasi 3D', 'Motion Graphics', 'Game Design', 'Web Design', 'Branding', 'Photography', 'Illustration', '3D Modeling'],
    },
    {
      name: 'Sosial & Kemanusiaan', icon: 'fa-people-group', color: '#00BCD4',
      fields: ['Sosiologi', 'Psikologi', 'Hukum', 'Hubungan Internasional', 'Pemerintahan', 'Lingkungan Sosial', 'Filantropi', 'Pendidikan', 'Kesehatan Masyarakat', 'Kebencanaan'],
    },
    {
      name: 'Agama & Keagamaan', icon: 'fa-book-quran', color: '#8BC34A',
      fields: ['Tafsir Al-Quran', 'Hadits', 'Fiqih', 'Akidah', 'Dakwah', 'Kristologi', 'Teologi', 'Kitab Suci', 'Moral & Etika', 'Religi & Budaya'],
    },
  ]

  const bidangData = customPack?.bidang || defaultBidang
  const categoryIds: number[] = []
  for (const b of bidangData) {
    const cat = await prisma.category.create({ data: { name: b.name, icon: b.icon || 'fa-trophy', color: b.color || '#e31e25' } })
    categoryIds.push(cat.id)
    for (const f of b.fields) {
      await prisma.field.create({ data: { categoryId: cat.id, name: f } })
    }
  }
  console.log(`  ✓ Seeding ${categoryIds.length} bidang`)

  // ============================================================
  // SISWA (Students)
  // ============================================================
  console.log(' 🎓 Creating students...')

  const defaultSiswa = [
    'Abdan Muhammad Izzan Rasyadan', 'Acika Putri', 'Alghazaly Ibhram Santoso',
    'Amadeus Xavier Enoch', 'Andika Asyam Ishaq Nur Arrasyid', 'Antori Yusuf Satriani',
    'Atha Fakhri Arkana', 'Aura Luthfia Annisa', 'Ayska Eveline Ikbar',
    'Brahma Alfaris Reyraharjo', 'Ershon Juan Pelamonia', 'Evan Satria Mahardika',
    'Fawwaz Aryo Setiawan', 'Ghulam Nawwaf', 'Jahfal Azhar',
    'Muchammad Rizqullah Izzatul Ibad', 'Muhammad Afgan Gahzy', 'Muhammad Faishal',
    'Muhammad Fardan', 'Muhammad Pandji Ar-Rizky Munib', 'Muhammad Tezar Akbarsyah',
    'Nabil Aswangga Hugobama', 'Nathaviela Thalita Kirana', 'Qaedi Razan Imawan',
    'Radhiyya Alea Akbar', 'Raffi Setiawan Putra', 'Rahmad Haris Abdillah',
    'Sandya Hafiduddin Faristyo', 'Saqa Pandega Adha Dananjaya',
    'Syarivatun Nisa\'i Nur Aulia', 'Tyara Angel Charlisa',
    'Aisyah Gadis Safira', 'Aliezzar Wijaya', 'Atha Raditya Primaldi',
    'Aulia Dewi Maharani', 'Aurora Yulia Safa', 'Denise Wahyu Saputra',
    'Dhafin Kautsar Alif Rahmat Putra', 'Elizabeth Anggun Lejartiastuti',
    'Enrico Arianto', 'Fathizzat Abida Rasyadhani', 'Firman Dwi Nugraha',
    'Ghefarah Arkhanza Nurwanda', 'Helmy Asyraf Risqi Ariebowo',
    'Hikmawal Anugrah Dzachwan', 'Irsyad Falah Maulana Pranoto',
    'Kevin Daniswara Raditya', 'Khanza Dyas Ramadhani',
    'Mohammad Nabil Bagas Adinata', 'Mohammad Tsaqib Syams Shaqr',
    'Muhamad Bari Jauhar Falahi', 'Muhammad Daffa Ronalvianto Pratama',
    'Muhammad Ghofar Jalesa Widandy', 'Muhammad Kukuh Fauzy Prasetyadi',
    'Muhammad Naufal Rafa Al As\'ad', 'Muhammad Yusron Fauzi',
    'Naadhim Fahly Mubaarok', 'Nayla Sufiatuz Zahro', 'Putri Shafira Madya',
    'Raka Febrian Ardi Pratama', 'Razzan Brilliant Nafis', 'Rifqi Tomy Alana',
    'Vega Fadan Putra'
  ]

  const siswaList = customPack?.siswa || defaultSiswa
  const validKelas = ['X', 'XI', 'XII', 'XIII']
  const validJurusan = ['SIJA', 'TJAT']

  let nisCounter = 1
  for (const name of siswaList) {
    const user = await prisma.user.create({
      data: { name, email: email(name), password: defaultPass, role: 'student', photo: 'default-avatar.png' },
    })
    
    // Assign valid kelas and jurusan options randomly to avoid formatting issues
    const randomKelas = validKelas[Math.floor(Math.random() * validKelas.length)]
    const randomJurusan = validJurusan[Math.floor(Math.random() * validJurusan.length)]

    await prisma.studentProfile.create({
      data: { 
        userId: user.id, 
        nis: `2024${String(nisCounter++).padStart(3, '0')}`, 
        kelas: randomKelas, 
        jurusan: 'SIJA', 
        angkatan: '2024' 
      },
    })
  }
  console.log(`  ✓ Seeding ${siswaList.length} siswa`)

  // ============================================================
  // GURU (Teachers)
  // ============================================================
  console.log(' 👨‍🏫 Creating teachers...')

  const defaultGuru = [
    { name: 'Achmad Rifa\'i', jabatan: 'Wakil Kepala Sekolah Bidang Laboratorium IT dan Sarpra', bidang: 'Teknologi Informasi' },
    { name: 'Eka Prasetia Putri Iswardiani', jabatan: 'Wakil Kepala Sekolah Bidang Hubungan Industri', bidang: 'Bisnis & Kewirausahaan' },
    { name: 'Maulana Al Ghofiqi', jabatan: 'Wakil Kepala Sekolah Bidang Kesiswaan', bidang: 'Sosial & Kemanusiaan' },
    { name: 'Sigit Eka Prayoga', jabatan: 'Tata Usaha', bidang: 'Bisnis & Kewirausahaan' },
    { name: 'Amir Hamka', jabatan: 'Guru Pendidikan Agama Islam', bidang: 'Agama & Keagamaan' },
    { name: 'Arganata Dian Amrullah', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Chintia Trinanda Wijaya', jabatan: 'Guru Pendidikan Olahraga', bidang: 'Olahraga & Kesehatan' },
    { name: 'David Wahyu Pratomo', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Deyan Suprayogi', jabatan: 'Guru Bimbingan Konseling dan Karakter', bidang: 'Sosial & Kemanusiaan' },
    { name: 'Eliza Tyas Damayanti', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Ferina Kumala Dewi', jabatan: 'Guru Bahasa Inggris', bidang: 'Bahasa & Komunikasi' },
    { name: 'Galuh Rahmawati', jabatan: 'Guru Proyek IPAS dan Informatika', bidang: 'Sains & Matematika' },
    { name: 'Guruh Mayonk Firmansyah', jabatan: 'Guru Bimbingan Konseling dan Karakter', bidang: 'Sosial & Kemanusiaan' },
    { name: 'Hadi Triyono', jabatan: 'Guru Pendidikan Agama Kristen dan Budi Pekerti', bidang: 'Agama & Keagamaan' },
    { name: 'Ika Zuliana', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Ike Yuliastuti', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Ilham Okta Alpriansyah', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Indra Hadi Pranata', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Lailatun Nikmah', jabatan: 'Guru Pendidikan Agama Islam', bidang: 'Agama & Keagamaan' },
    { name: 'Lia Indriawati', jabatan: 'Guru Pendidikan Agama Islam', bidang: 'Agama & Keagamaan' },
    { name: 'Muhammad Adam Nuh Ibrahim', jabatan: 'Guru Sejarah dan Pendidikan Pancasila', bidang: 'Sosial & Kemanusiaan' },
    { name: 'Mohammad Suhud Abdillah', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Mokhammad Misbakhul Abid', jabatan: 'Guru Matematika', bidang: 'Sains & Matematika' },
    { name: 'Muhammad Adi Riswanto', jabatan: 'Guru Mata Pelajaran Produktif', bidang: 'Teknologi Informasi' },
    { name: 'Muhammad Syaiful Ulum', jabatan: 'Guru Pendidikan Olahraga', bidang: 'Olahraga & Kesehatan' },
    { name: 'Nadya Arian Kusuma Wardani', jabatan: 'Guru Sejarah dan Pendidikan Pancasila', bidang: 'Sosial & Kemanusiaan' },
    { name: 'Nafta Rahma', jabatan: 'Guru Bahasa Indonesia', bidang: 'Bahasa & Komunikasi' },
  ]

  const guruList = customPack?.guru || defaultGuru
  let nipCounter = 1
  for (const g of guruList) {
    const user = await prisma.user.create({
      data: { name: g.name, email: email(g.name), password: defaultPass, role: 'teacher', photo: 'default-avatar.png' },
    })
    await prisma.teacherProfile.create({
      data: { 
        userId: user.id, 
        nip: `1985010120100${String(nipCounter++).padStart(3, '0')}`, 
        bidangKeahlian: g.bidang || 'Teknologi Informasi', 
        jabatan: g.jabatan || 'Guru Pembimbing' 
      },
    })
  }
  console.log(`  ✓ Seeding ${guruList.length} guru`)

  // ============================================================
  // BADGES
  // ============================================================
  const badges = [
    { name: 'Peserta Pertama', description: 'Mengikuti lomba pertama', icon: 'fa-medal', color: '#CD7F32', conditionType: 'total_participation', conditionValue: 1 },
    { name: 'Peserta Aktif', description: 'Mengikuti 5 lomba', icon: 'fa-medal', color: '#C0C0C0', conditionType: 'total_participation', conditionValue: 5 },
    { name: 'Kompetitor Handal', description: 'Mengikuti 10 lomba', icon: 'fa-medal', color: '#FFD700', conditionType: 'total_participation', conditionValue: 10 },
    { name: 'Juara Pertama', description: 'Meraih juara 1', icon: 'fa-trophy', color: '#FFD700', conditionType: 'first_win', conditionValue: 1 },
    { name: 'Raja Lomba', description: 'Menang 5 kali', icon: 'fa-crown', color: '#e31e25', conditionType: 'total_win', conditionValue: 5 },
    { name: 'Tim Player', description: 'Bergabung dengan 3 tim', icon: 'fa-users', color: '#2196F3', conditionType: 'total_team', conditionValue: 3 },
  ]
  for (const badge of badges) {
    await prisma.badge.create({ data: badge })
  }
  console.log(`  ✓ Seeding ${badges.length} badges`)

  // ============================================================
  // APP SETTINGS
  // ============================================================
  const settings = [
    { key: 'app_name', value: 'PUSTASDA', group: 'general' },
    { key: 'app_tagline', value: 'Pusat Prestasi SMK Telkom Sidoarjo', group: 'general' },
    { key: 'app_logo', value: 'logo-pustasda.png', group: 'branding' },
    { key: 'app_icon', value: 'favicon.ico', group: 'branding' },
    { key: 'primary_color', value: '#e31e25', group: 'branding' },
    { key: 'secondary_color', value: '#f5a623', group: 'branding' },
    { key: 'school_name', value: 'SMK Telkom Sidoarjo', group: 'general' },
    { key: 'school_address', value: 'Jl. Raya Sidoarjo, Jawa Timur', group: 'general' },
    { key: 'ai_enabled', value: 'true', group: 'features' },
    { key: 'whatsapp_enabled', value: 'false', group: 'features' },
    { key: 'maintenance_mode', value: 'false', group: 'system' },
  ]
  for (const s of settings) {
    await prisma.appSetting.create({ data: s })
  }
  console.log(`  ✓ Seeding ${settings.length} app settings`)

  console.log('\n✅ Seeding complete!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
