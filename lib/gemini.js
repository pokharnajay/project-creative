import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

export function getGeminiClient() {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export async function generateImage(prompt, productImageUrl, modelImageUrl = null) {
  try {
    const genAI = getGeminiClient();

    // Use Gemini Pro Vision for image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    let finalPrompt = '';
    const imageParts = [];

    if (productImageUrl && modelImageUrl) {
      finalPrompt = `Create a professional advertising photoshoot image combining this product with this model. ${prompt}`;

      // Fetch product image
      const productResponse = await fetch(productImageUrl);
      const productBuffer = await productResponse.arrayBuffer();
      imageParts.push({
        inlineData: {
          data: Buffer.from(productBuffer).toString('base64'),
          mimeType: productResponse.headers.get('content-type') || 'image/jpeg',
        },
      });

      // Fetch model image
      const modelResponse = await fetch(modelImageUrl);
      const modelBuffer = await modelResponse.arrayBuffer();
      imageParts.push({
        inlineData: {
          data: Buffer.from(modelBuffer).toString('base64'),
          mimeType: modelResponse.headers.get('content-type') || 'image/jpeg',
        },
      });
    } else if (productImageUrl) {
      finalPrompt = `Create a professional product advertising image for this product. ${prompt}`;

      // Fetch product image
      const productResponse = await fetch(productImageUrl);
      const productBuffer = await productResponse.arrayBuffer();
      imageParts.push({
        inlineData: {
          data: Buffer.from(productBuffer).toString('base64'),
          mimeType: productResponse.headers.get('content-type') || 'image/jpeg',
        },
      });
    }

    // Note: Gemini Pro Vision doesn't actually generate images, it analyzes them.
    // For actual image generation, you would need to use a different service like:
    // - Stability AI (Stable Diffusion)
    // - DALL-E
    // - Midjourney API
    // - Replicate (Banana alternative)

    // This is a placeholder that returns a description
    // You'll need to integrate with an actual image generation API
    const result = await model.generateContent([finalPrompt, ...imageParts]);
    const response = await result.response;
    const description = response.text();

    // TODO: Integrate with actual image generation service
    // For now, returning a placeholder structure
    return {
      success: false,
      error: 'Image generation API integration pending',
      description,
      note: 'Please integrate with Stability AI, Replicate, or another image generation service',
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Alternative: Using Replicate API (formerly Banana)
export async function generateImageWithReplicate(prompt, productImageUrl, modelImageUrl = null) {
  try {
    // You'll need to install: npm install replicate
    // And add REPLICATE_API_TOKEN to your .env

    const endpoint = 'https://api.replicate.com/v1/predictions';
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    if (!replicateToken) {
      throw new Error('REPLICATE_API_TOKEN is not defined');
    }

    let finalPrompt = prompt;
    const input = {
      prompt: finalPrompt,
      num_outputs: 1,
      width: 1024,
      height: 1024,
      guidance_scale: 7.5,
      num_inference_steps: 50,
    };

    // For product + model: use ControlNet or similar model
    // For product only: use SDXL or similar
    const model = modelImageUrl
      ? 'stability-ai/sdxl' // Replace with appropriate model
      : 'stability-ai/sdxl';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model,
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();

    // Poll for results
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(result.urls.get, {
        headers: {
          'Authorization': `Token ${replicateToken}`,
        },
      });

      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('Image generation failed');
    }

    return {
      success: true,
      imageUrl: result.output[0],
      prompt: finalPrompt,
    };
  } catch (error) {
    console.error('Error generating image with Replicate:', error);
    throw error;
  }
}
