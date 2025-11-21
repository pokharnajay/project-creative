import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  try {
    // Get authenticated user from Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabaseAdmin
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (folderId && folderId !== 'all') {
      query = query.eq('folder_id', folderId);
    } else if (folderId === 'all') {
      // No filter needed
    } else {
      // No folder specified, return all images
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ images: data || [] });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Get authenticated user from Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      throw deleteError;
    }

    // TODO: Delete from GCS as well
    // const fileName = image.url.split('/').pop();
    // await deleteFromGCS(fileName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // Get authenticated user from Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId, folderId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Update folder
    const { data, error: updateError } = await supabaseAdmin
      .from('images')
      .update({ folder_id: folderId })
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ image: data });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
