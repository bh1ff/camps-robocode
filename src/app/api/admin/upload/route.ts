import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.jpg';
    const safeName = `location-${Date.now()}${ext}`.replace(/[^a-z0-9._-]/gi, '');

    const dir = path.join(process.cwd(), 'public', 'camp');
    await mkdir(dir, { recursive: true });

    const filePath = path.join(dir, safeName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/camp/${safeName}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
