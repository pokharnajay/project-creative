import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateImageWithReplicate } from '@/lib/gemini';
import { deductCredits, getUserCredits, CREDITS_PER_GENERATION } from '@/utils/credits';
import { uploadToGCS } from '@/lib/google-cloud';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, productImageUrl, modelImageUrl, numVariations = 1 } = await request.json();

    if (!prompt || !productImageUrl) {
      return NextResponse.json(
        { error: 'Prompt and product image are required' },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const userCredits = await getUserCredits(session.user.id);
    const requiredCredits = CREDITS_PER_GENERATION * numVariations;

    if (userCredits < requiredCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: requiredCredits, available: userCredits },
        { status: 402 }
      );
    }

    // Determine generation type
    const generationType = modelImageUrl ? 'product_with_model' : 'product_only';

    // Generate images
    const generatedImages = [];

    for (let i = 0; i < numVariations; i++) {
      try {
        // Generate image using AI
        // Note: This is a placeholder. You need to implement actual image generation
        // using Replicate, Stability AI, or another service
        const result = await generateImageWithReplicate(
          prompt,
          productImageUrl,
          modelImageUrl
        );

        if (!result.success) {
          throw new Error('Image generation failed');
        }

        // Download generated image
        const imageResponse = await fetch(result.imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();

        // Upload to GCS
        const fileName = `generated/${session.user.id}/${nanoid()}.png`;
        const url = await uploadToGCS(
          Buffer.from(imageBuffer),
          fileName,
          'image/png'
        );

        generatedImages.push({
          url,
          prompt: result.prompt,
        });
      } catch (error) {
        console.error('Error generating variation:', error);
        // Continue with other variations
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images' },
        { status: 500 }
      );
    }

    // Deduct credits and save images to database
    const savedImages = [];

    for (const image of generatedImages) {
      // Save image to database
      const { data: savedImage, error: dbError } = await supabaseAdmin
        .from('images')
        .insert({
          user_id: session.user.id,
          url: image.url,
          prompt: image.prompt,
          generation_type: generationType,
          product_image_url: productImageUrl,
          model_image_url: modelImageUrl,
          credits_used: CREDITS_PER_GENERATION,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving image to database:', dbError);
        continue;
      }

      // Deduct credits
      await deductCredits(
        session.user.id,
        CREDITS_PER_GENERATION,
        'Image generation',
        savedImage.id
      );

      savedImages.push(savedImage);
    }

    return NextResponse.json({
      success: true,
      images: savedImages,
      creditsUsed: savedImages.length * CREDITS_PER_GENERATION,
    });
  } catch (error) {
    console.error('Error in generate route:', error);
    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    );
  }
}
