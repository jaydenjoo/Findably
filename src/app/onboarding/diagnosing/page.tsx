/**
 * Diagnosing Page — Server Component
 *
 * Displays a loading page while diagnosis is in progress.
 * - Verifies user authentication
 * - Validates company_id from query params
 * - Renders DiagnosingClient with polling behavior
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceDb, companiesTable } from '@/lib/db/client';
import { eq, and } from 'drizzle-orm';
import DiagnosingClient from '@/components/onboarding/diagnosing-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '진단 중 - Findably',
  description: '마케팅 진단 진행 중입니다',
};

interface DiagnosingPageProps {
  searchParams: {
    company_id?: string;
  };
}

export default async function DiagnosingPage({
  searchParams,
}: DiagnosingPageProps) {
  // Step 1: Verify user is authenticated
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Step 2: Extract and validate company_id from query params
  const companyIdParam = searchParams.company_id;

  if (!companyIdParam) {
    // Missing company_id, redirect to onboarding
    redirect('/onboarding');
  }

  let companyId: number;
  try {
    companyId = parseInt(companyIdParam, 10);
    if (isNaN(companyId) || companyId <= 0) {
      redirect('/onboarding');
    }
  } catch {
    redirect('/onboarding');
  }

  // Step 3: Verify user owns this company (RLS check)
  const db = createServiceDb();

  const companies = await db
    .select()
    .from(companiesTable)
    .where(
      and(
        eq(companiesTable.id, companyId),
        eq(companiesTable.userId, user.id)
      )
    )
    .limit(1);

  // If user doesn't own this company, redirect to onboarding
  if (companies.length === 0) {
    redirect('/onboarding');
  }

  // Step 4: Render the client component with company_id
  return <DiagnosingClient companyId={companyId} />;
}
