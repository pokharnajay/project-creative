import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { nanoid } from 'nanoid';

// Supabase storage bucket name
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'imageai';

export async function POST(request) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${nanoid()}.${fileExtension}`;

    // Try Google Cloud Storage first if configured
    const hasGCS = process.env.GCS_PROJECT_ID &&
                   process.env.GCS_CLIENT_EMAIL &&
                   process.env.GCS_PRIVATE_KEY &&
                   process.env.GCS_BUCKET_NAME;

    if (hasGCS) {
      try {
        const { uploadToGCS } = await import('@/lib/google-cloud');
        const url = await uploadToGCS(buffer, fileName, file.type);
        return NextResponse.json({ url });
      } catch (gcsError) {
        console.error('GCS upload failed, falling back to Supabase:', gcsError.message);
        // Fall through to Supabase storage
      }
    }

    // Use Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);

      // Check for common errors
      if (uploadError.message?.includes('Bucket not found') ||
          uploadError.message?.includes('not found') ||
          uploadError.statusCode === '404') {
        return NextResponse.json(
          { error: `Storage bucket "${STORAGE_BUCKET}" not found. Please create it in Supabase.` },
          { status: 500 }
        );
      }

      if (uploadError.message?.includes('row-level security') ||
          uploadError.message?.includes('policy') ||
          uploadError.message?.includes('not authorized')) {
        return NextResponse.json(
          { error: 'Storage permissions error. Please check Supabase storage policies.' },
          { status: 500 }
        );
      }

      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file. Please check storage configuration.' },
      { status: 500 }
    );
  }
}
