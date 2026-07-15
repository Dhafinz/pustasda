import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashSync } from 'bcryptjs'
import path from 'path'

const dbPath = path.join(__dirname, 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // USERS (Admin, Developer, Guru, Siswa)
  // ============================================================
  const users = [
    {
      name: 'Administrator',
      email: 'admin@pustasda.com',
      password: hashSync('password', 10),
      role: 'admin',
      photo: 'default-avatar.png',
    },
    {
      name: 'Developer',
      email: 'dev@pustasda.com',
      password: hashSync('password', 10),
      role: 'developer',
      photo: 'default-avatar.png',
    },
    {
      name: 'Guru Pembimbing',
      email: 'guru@pustasda.com',
      password: hashSync('password', 10),
      role: 'teacher',
      photo: 'default-avatar.png',
      waNumber: '6281234567890',
    },
    {
      name: 'Siswa',
      email: 'siswa@pustasda.com',
      password: hashSync('password', 10),
      role: 'student',
      photo: 'default-avatar.png',
    },
    {
      name: 'Ahmad Rizky',
      email: 'ahmad@pustasda.com',
      password: hashSync('password', 10),
      role: 'student',
      photo: 'default-avatar.png',
    },
    {
      name: 'Siti Nurhaliza',
      email: 'siti@pustasda.com',
      password: hashSync('password', 10),
      role: 'student',
      photo: 'default-avatar.png',
    },
  ]

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
    console.log(`  ✓ User: ${created.name} (${created.role})`)

    // Create profile for students
    if (created.role === 'student') {
      await prisma.studentProfile.upsert({
        where: { userId: created.id },
        update: {},
        create: {
          userId: created.id,
          nis: `2026${String(created.id).padStart(4, '0')}`,
          kelas: 'XII SIJA/TJAT',
          jurusan: 'Rekayasa Perangkat Lunak',
          angkatan: '2024',
        },
      })
    }

    // Create profile for teachers
    if (created.role === 'teacher') {
      await prisma.teacherProfile.upsert({
        where: { userId: created.id },
        update: {},
        create: {
          userId: created.id,
          nip: '198501012010011001',
          bidangKeahlian: 'Teknologi Informasi',
          jabatan: 'Guru Produktif',
        },
      })
    }
  }

  // ============================================================
  // CATEGORIES
  // ============================================================
  const categories = [
    { name: 'Olimpiade', icon: 'fa-brain', color: '#e31e25' },
    { name: 'Hackathon', icon: 'fa-laptop-code', color: '#2196F3' },
    { name: 'Debat', icon: 'fa-comments', color: '#FF9800' },
    { name: 'Karya Tulis', icon: 'fa-pen-fancy', color: '#4CAF50' },
    { name: 'Seni & Kreativitas', icon: 'fa-palette', color: '#9C27B0' },
    { name: 'Olahraga', icon: 'fa-futbol', color: '#FF5722' },
    { name: 'Bisnis & Kewirausahaan', icon: 'fa-briefcase', color: '#607D8B' },
    { name: 'Robotik & IoT', icon: 'fa-robot', color: '#00BCD4' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(cat) + 1 },
      update: {},
      create: cat,
    })
  }
  console.log(`  ✓ ${categories.length} categories created`)

  // ============================================================
  // FIELDS
  // ============================================================
  const fields = [
    { name: 'Teknologi Informasi', icon: 'fa-microchip', categoryId: 2 },
    { name: 'Sains & Matematika', icon: 'fa-flask', categoryId: 1 },
    { name: 'Bahasa & Sastra', icon: 'fa-book', categoryId: 3 },
    { name: 'Ekonomi & Bisnis', icon: 'fa-chart-line', categoryId: 7 },
    { name: 'Seni & Budaya', icon: 'fa-masks-theater', categoryId: 5 },
    { name: 'Teknik & Rekayasa', icon: 'fa-gears', categoryId: 8 },
    { name: 'Kesehatan & Lingkungan', icon: 'fa-leaf', categoryId: 6 },
    { name: 'Desain & Multimedia', icon: 'fa-pen-ruler', categoryId: 5 },
  ]

  for (const field of fields) {
    await prisma.field.upsert({
      where: { id: fields.indexOf(field) + 1 },
      update: { categoryId: field.categoryId },
      create: field,
    })
  }
  console.log(`  ✓ ${fields.length} fields created`)

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
    await prisma.badge.upsert({
      where: { id: badges.indexOf(badge) + 1 },
      update: {},
      create: badge,
    })
  }
  console.log(`  ✓ ${badges.length} badges created`)

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

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log(`  ✓ ${settings.length} app settings created`)

  // ============================================================
  // SAMPLE COMPETITIONS
  // ============================================================
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (admin) {
    const competitions = [
      {
        categoryId: 1, fieldId: 1, createdBy: admin.id,
        title: 'Olimpiade Sains Nasional (OSN) Informatika 2026',
        organizer: 'Kemendikbudristek',
        level: 'nasional', type: 'solo',
        description: 'Kompetisi sains tingkat nasional bidang informatika untuk siswa SMA/SMK se-Indonesia. Tahun 2026 mengangkat tema "Inovasi Digital untuk Indonesia Maju".',
        requirements: 'Siswa aktif SMA/SMK, telah lolos seleksi tingkat kabupaten/kota',
        deadline: new Date('2026-09-15'),
        registerDeadline: new Date('2026-08-01'),
        announcementDate: new Date('2026-10-30'),
        isTrending: true,
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 2, fieldId: 1, createdBy: admin.id,
        title: 'Google Code Jam Junior 2026',
        organizer: 'Google',
        level: 'internasional', type: 'solo',
        description: 'Kompetisi pemrograman global untuk pelajar di bawah 18 tahun. Selesaikan tantangan algoritmik dalam batas waktu tertentu.',
        requirements: 'Usia dibawah 18 tahun, memiliki akun Google',
        linkRegistration: 'https://codejam.withgoogle.com',
        deadline: new Date('2026-08-20'),
        registerDeadline: new Date('2026-07-30'),
        isTrending: true,
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 2, fieldId: 1, createdBy: admin.id,
        title: 'Hackathon Merdeka Belajar 2026',
        organizer: 'Kemendikbudristek x Dicoding',
        level: 'nasional', type: 'team',
        maxMembers: 4, minMembers: 2,
        description: 'Hackathon nasional untuk mengembangkan solusi teknologi pendidikan. Tim terdiri dari 2-4 orang siswa SMA/SMK.',
        requirements: 'Tim 2-4 siswa, minimal 1 prototype',
        deadline: new Date('2026-10-01'),
        registerDeadline: new Date('2026-08-15'),
        isTrending: true,
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 3, fieldId: 3, createdBy: admin.id,
        title: 'Lomba Debat Bahasa Inggris Tingkat Jatim',
        organizer: 'Dinas Pendidikan Jawa Timur',
        level: 'provinsi', type: 'team',
        maxMembers: 3, minMembers: 3,
        description: 'Lomba debat bahasa Inggris antar sekolah se-Jawa Timur. Setiap tim terdiri dari 3 orang.',
        deadline: new Date('2026-08-25'),
        registerDeadline: new Date('2026-07-25'),
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 4, fieldId: 3, createdBy: admin.id,
        title: 'Lomba Karya Tulis Ilmiah Nasional',
        organizer: 'LIPI',
        level: 'nasional', type: 'team',
        maxMembers: 3, minMembers: 1,
        description: 'Kompetisi karya tulis ilmiah untuk siswa SMA/SMK se-Indonesia. Tema bebas dengan pendekatan ilmiah.',
        deadline: new Date('2026-09-30'),
        registerDeadline: new Date('2026-08-30'),
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 5, fieldId: 8, createdBy: admin.id,
        title: 'Festival Film Pendek Pelajar 2026',
        organizer: 'Kemendikbudristek',
        level: 'nasional', type: 'team',
        maxMembers: 5, minMembers: 2,
        description: 'Festival film pendek untuk pelajar SMA/SMK. Durasi film 5-15 menit dengan tema "Generasi Emas Indonesia".',
        deadline: new Date('2026-11-15'),
        registerDeadline: new Date('2026-09-15'),
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 8, fieldId: 6, createdBy: admin.id,
        title: 'Indonesia Robotic Competition 2026',
        organizer: 'BRIN',
        level: 'nasional', type: 'team',
        maxMembers: 4, minMembers: 2,
        description: 'Kompetisi robotik tingkat nasional. Kategori: Line Follower, Sumo Robot, dan Drone Racing.',
        deadline: new Date('2026-10-20'),
        registerDeadline: new Date('2026-09-01'),
        isTrending: true,
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 1, fieldId: 2, createdBy: admin.id,
        title: 'Olimpiade Matematika Kota Sidoarjo',
        organizer: 'Dinas Pendidikan Kota Sidoarjo',
        level: 'kota', type: 'solo',
        description: 'Olimpiade matematika tingkat kota untuk siswa SMA/SMK se-Kota Sidoarjo.',
        deadline: new Date('2026-08-10'),
        registerDeadline: new Date('2026-07-20'),
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 7, fieldId: 4, createdBy: admin.id,
        title: 'Business Plan Competition 2026',
        organizer: 'Universitas Airlangga',
        level: 'nasional', type: 'team',
        maxMembers: 3, minMembers: 2,
        description: 'Kompetisi rencana bisnis untuk siswa SMA/SMK. Presentasikan ide bisnis inovatif Anda.',
        deadline: new Date('2026-09-25'),
        registerDeadline: new Date('2026-08-20'),
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 2, fieldId: 8, createdBy: admin.id,
        title: 'UI/UX Design Challenge - Telkom',
        organizer: 'Telkom Indonesia',
        level: 'nasional', type: 'solo',
        description: 'Tantangan desain UI/UX untuk membuat prototype aplikasi mobile. Tema: Smart City Solutions.',
        deadline: new Date('2026-08-30'),
        registerDeadline: new Date('2026-07-30'),
        isTrending: true,
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 6, fieldId: 5, createdBy: admin.id,
        title: 'Kompetisi E-Sport Antar Sekolah Sidoarjo',
        organizer: 'OSIS SMK Telkom Sidoarjo',
        level: 'sekolah', type: 'team',
        maxMembers: 5, minMembers: 5,
        description: 'Turnamen e-sport antar kelas/sekolah. Game: Mobile Legends dan Valorant.',
        deadline: new Date('2026-08-05'),
        registerDeadline: new Date('2026-07-25'),
        isActive: true,
        verificationStatus: 'approved',
      },
      {
        categoryId: 5, fieldId: 5, createdBy: admin.id,
        title: 'Lomba Paduan Suara Nasional',
        organizer: 'Kementerian Pariwisata',
        level: 'nasional', type: 'team',
        maxMembers: 30, minMembers: 10,
        description: 'Lomba paduan suara tingkat nasional untuk kelompok pelajar SMA/SMK.',
        deadline: new Date('2026-11-01'),
        registerDeadline: new Date('2026-09-30'),
        isActive: true,
        verificationStatus: 'approved',
      },
    ]

    for (const comp of competitions) {
      await prisma.competition.create({ data: comp })
    }
    console.log(`  ✓ ${competitions.length} sample competitions created`)
  }

  console.log('\n✅ Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
