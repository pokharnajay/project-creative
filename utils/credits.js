import { supabaseAdmin } from '@/lib/supabase';

export const CREDITS_PER_GENERATION = parseInt(process.env.CREDITS_PER_GENERATION || '5', 10);
export const DEFAULT_CREDITS = parseInt(process.env.DEFAULT_CREDITS || '100', 10);

export async function getUserCredits(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data.credits || 0;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
}

export async function deductCredits(userId, amount, description = 'Image generation', imageId = null) {
  try {
    // Get current credits
    const currentCredits = await getUserCredits(userId);

    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ credits: currentCredits - amount })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description,
        image_id: imageId,
      });

    if (transactionError) throw transactionError;

    return currentCredits - amount;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

export async function addCredits(userId, amount, type = 'purchase', description = '') {
  try {
    const currentCredits = await getUserCredits(userId);

    // Add credits
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ credits: currentCredits + amount })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount,
        type,
        description,
      });

    if (transactionError) throw transactionError;

    return currentCredits + amount;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

export async function getCreditHistory(userId, limit = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }
}
