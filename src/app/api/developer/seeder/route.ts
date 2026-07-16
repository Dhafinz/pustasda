import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const templatesPath = path.join(process.cwd(), 'prisma', 'seeder_templates.json')
const activePath = path.join(process.cwd(), 'prisma', 'seeder_active.json')

function getTemplates() {
  const defaults = [
    {
      id: 'default',
      name: 'Pack Bawaan PUSTASDA',
      description: 'Template default dengan 10 bidang utama, 63 siswa SIJA 1 & 2, dan 27 guru dengan format kelas & jurusan yang valid.',
      siswa: [
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
      ],
      guru: [
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
        { name: 'Hadi Triyono', jabatan: 'Guru Pendidikan Agama Kristen dan Budi Pemerti', bidang: 'Agama & Keagamaan' },
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
        { name: 'Nafta Rahma', jabatan: 'Guru Bahasa Indonesia', bidang: 'Bahasa & Komunikasi' }
      ],
      bidang: [
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
        }
      ]
    }
  ]

  if (!fs.existsSync(templatesPath)) {
    fs.writeFileSync(templatesPath, JSON.stringify(defaults, null, 2), 'utf-8')
    return defaults
  }

  try {
    const list = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'))
    // Ensure default system pack always has the updated defaults (with all students and teachers)
    const defaultIdx = list.findIndex((t: any) => t.id === 'default')
    if (defaultIdx === -1) {
      list.unshift(defaults[0])
      fs.writeFileSync(templatesPath, JSON.stringify(list, null, 2), 'utf-8')
    } else if (list[defaultIdx].siswa.length < 50 || list[defaultIdx].guru.length < 20) {
      // Overwrite if it is the old outdated defaults config
      list[defaultIdx] = defaults[0]
      fs.writeFileSync(templatesPath, JSON.stringify(list, null, 2), 'utf-8')
    }
    return list
  } catch (err) {
    return defaults
  }
}

function saveTemplates(templates: any[]) {
  fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2), 'utf-8')
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const templates = getTemplates()
    return NextResponse.json({ templates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, id, name, description, siswa, guru, bidang } = body

    const templates = getTemplates()

    if (action === 'create') {
      // Check if pack with same name already exists
      const exists = templates.some((t: any) => t.name.toLowerCase() === name.trim().toLowerCase())
      if (exists) {
        return NextResponse.json({ error: `Template pack dengan nama "${name}" sudah terdaftar!` }, { status: 400 })
      }

      const newPack = {
        id: 'pack_' + Date.now(),
        name: name.trim(),
        description,
        siswa: Array.isArray(siswa) ? siswa : [],
        guru: Array.isArray(guru) ? guru : [],
        bidang: Array.isArray(bidang) ? bidang : []
      }
      templates.push(newPack)
      saveTemplates(templates)
      return NextResponse.json({ message: 'Template pack successfully created!', template: newPack })
    }

    if (action === 'update') {
      // Check if pack with same name already exists under another ID
      const exists = templates.some((t: any) => t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== id)
      if (exists) {
        return NextResponse.json({ error: `Template pack dengan nama "${name}" sudah terdaftar!` }, { status: 400 })
      }

      const idx = templates.findIndex((t: any) => t.id === id)
      if (idx === -1) {
        return NextResponse.json({ error: 'Template pack not found' }, { status: 404 })
      }
      templates[idx] = {
        ...templates[idx],
        name: name.trim(),
        description,
        siswa: Array.isArray(siswa) ? siswa : [],
        guru: Array.isArray(guru) ? guru : [],
        bidang: Array.isArray(bidang) ? bidang : []
      }
      saveTemplates(templates)
      return NextResponse.json({ message: 'Template pack successfully updated!', template: templates[idx] })
    }

    if (action === 'delete') {
      const idx = templates.findIndex((t: any) => t.id === id)
      if (idx === -1) {
        return NextResponse.json({ error: 'Template pack not found' }, { status: 404 })
      }
      if (id === 'default') {
        return NextResponse.json({ error: 'Cannot delete default template pack' }, { status: 400 })
      }
      templates.splice(idx, 1)
      saveTemplates(templates)
      return NextResponse.json({ message: 'Template pack successfully deleted!' })
    }

    if (action === 'run_seed') {
      const pack = templates.find((t: any) => t.id === id)
      if (!pack) {
        return NextResponse.json({ error: 'Template pack not found' }, { status: 404 })
      }

      // Write pack to prisma/seeder_active.json
      fs.writeFileSync(activePath, JSON.stringify(pack, null, 2), 'utf-8')

      try {
        await execAsync('npx prisma db seed')
        
        // Clean up active file
        if (fs.existsSync(activePath)) {
          fs.unlinkSync(activePath)
        }
        
        return NextResponse.json({ message: `Database successfully seeded using template pack: ${pack.name}` })
      } catch (err: any) {
        console.error('Seeding failed:', err)
        // Clean up active file
        if (fs.existsSync(activePath)) {
          fs.unlinkSync(activePath)
        }
        return NextResponse.json({ error: 'Seeding failed: ' + err.message }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
