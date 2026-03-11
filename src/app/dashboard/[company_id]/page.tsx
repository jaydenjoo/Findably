import { createClient } from '@/lib/supabase/server';
import { createServiceDb } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { companiesTable, diagnosesTable } from '@/db/schema';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import DashboardTabs from '@/components/dashboard/dashboard-tabs';

interface DashboardPageProps {
  params: {
    company_id: string;
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect('/login');
  }

  // Get database client
  const db = createServiceDb();

  // Convert company_id from string to number
  const companyId = Number(params.company_id);
  if (isNaN(companyId)) {
    redirect('/dashboard');
  }

  // Fetch company data with RLS
  const companyData = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))
    .limit(1);

  if (!companyData || companyData.length === 0) {
    redirect('/dashboard');
  }

  const company = companyData[0];

  // Verify user owns this company
  if (company.userId !== user.id) {
    redirect('/dashboard');
  }

  // Fetch latest diagnosis
  const latestDiagnosis = await db
    .select()
    .from(diagnosesTable)
    .where(eq(diagnosesTable.companyId, companyId))
    .orderBy(diagnosesTable.diagnosedAt)
    .limit(1);

  // If no diagnosis yet, redirect to diagnosing page
  if (!latestDiagnosis || latestDiagnosis.length === 0) {
    redirect(`/onboarding/diagnosing?company_id=${params.company_id}`);
  }

  const diagnosis = latestDiagnosis[0];

  // Extract domain name from URL for display
  let displayName = company.url;
  try {
    const urlObj = new URL(company.url);
    displayName = urlObj.hostname.replace('www.', '');
  } catch {
    // If URL parsing fails, use the raw URL
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <DashboardHeader
        companyName={displayName}
        url={company.url}
        diagnosedAt={diagnosis.diagnosedAt?.toISOString() || new Date().toISOString()}
      />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <DashboardTabs
          score={Number(diagnosis.overallScore) || 0}
          grade={(diagnosis.grade as 'A' | 'B' | 'C' | 'D' | 'F') || 'F'}
        />
      </main>
    </div>
  );
}
