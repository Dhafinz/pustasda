import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Limit upload to 4.5MB (Vercel serverless request body size limit)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas 4.5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert file to Base64 Data URL (fully serverless and Vercel compatible)
    const base64Data = buffer.toString('base64')
    const mimeType = file.type || 'application/octet-stream'
    const url = `data:${mimeType};base64,${base64Data}`

    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      url: url 
    })
  } catch (error: any) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file: ' + error.message }, { status: 500 })
  }
}
