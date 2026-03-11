import { createClient } from '@/lib/supabase/server';

/**
 * Get user's first company (if exists)
 *
 * This function queries the companies table to check if a user has
 * created any company records. Used for smart login redirect logic.
 *
 * @param userId - The authenticated user ID from Supabase Auth
 * @returns Company record if exists, null if not found or error
 *
 * @example
 * const company = await getUserCompany(userId);
 * if (company) {
 *   redirect(`/dashboard/${company.id}`);
 * } else {
 *   redirect('/onboarding');
 * }
 */
export async function getUserCompany(userId: string): Promise<{ id: number } | null> {
  try {
    const supabase = await createClient();

    // Get authenticated database client for the user
    // This automatically applies RLS policies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user company:', error);
      return null;
    }

    return companies || null;
  } catch (error) {
    console.error('Unexpected error in getUserCompany:', error);
    return null;
  }
}
