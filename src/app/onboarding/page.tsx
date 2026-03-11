/**
 * Onboarding Page — Server Component
 *
 * Handles authentication checks and company existence validation.
 * Redirects to dashboard if user already completed onboarding,
 * or to login if not authenticated.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompany } from "@/lib/auth/user-company";
import OnboardingForm from "@/components/onboarding/onboarding-form";

// This page requires user authentication, so it must be dynamic
export const dynamic = "force-dynamic";

export const metadata = {
  title: "온보딩 - Findably",
  description: "마케팅 진단을 위한 온보딩 프로세스",
};

export default async function OnboardingPage() {
  // Check authentication
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (authError || !user) {
    redirect("/login");
  }

  // Check if user already has a company (completed onboarding)
  const existingCompany = await getUserCompany(user.id);

  // If user already has a company, redirect to their dashboard
  if (existingCompany) {
    redirect(`/dashboard/${existingCompany.id}`);
  }

  // Render onboarding form for new users
  return (
    <>
      <OnboardingForm />
    </>
  );
}
