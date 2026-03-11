'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignUpSchema, LoginSchema } from '@/lib/validations/auth';
import { getUserCompany } from '@/lib/auth/user-company';

/**
 * Server Action for user signup
 * Validates input with Zod schema and creates account in Supabase Auth
 */
export async function signUpAction(input: unknown) {
  // Validate input
  const validationResult = SignUpSchema.safeParse(input);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map((issue) => issue.message)
      .join(', ');
    return {
      success: false,
      error: errorMessages,
    };
  }

  const { email, password } = validationResult.data;

  try {
    const supabase = await createClient();

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      // Handle specific Supabase error messages
      if (error.message.includes('already registered')) {
        return {
          success: false,
          error: '이미 등록된 이메일입니다',
        };
      }

      return {
        success: false,
        error: error.message || '회원가입에 실패했습니다',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: '회원가입에 실패했습니다',
      };
    }

    return {
      success: true,
      message: '회원가입 완료! 이메일을 확인해주세요',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server Action for user login
 * Validates input and authenticates user
 */
export async function signInAction(input: unknown) {
  // Validate input
  const validationResult = LoginSchema.safeParse(input);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map((issue) => issue.message)
      .join(', ');
    return {
      success: false,
      error: errorMessages,
    };
  }

  const { email, password } = validationResult.data;

  try {
    const supabase = await createClient();

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle specific error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: '이메일 또는 비밀번호가 일치하지 않습니다',
        };
      }

      return {
        success: false,
        error: error.message || '로그인에 실패했습니다',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: '로그인에 실패했습니다',
      };
    }

    // Smart redirect: check if user has completed onboarding (has a company)
    const company = await getUserCompany(data.user.id);

    if (company) {
      // User has completed onboarding, redirect to dashboard
      redirect(`/dashboard/${company.id}`);
    } else {
      // User is new or hasn't completed onboarding yet
      redirect('/onboarding');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server Action for OAuth sign-in with Google
 */
export async function signInWithGoogleAction() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Google 로그인에 실패했습니다',
      };
    }

    if (data.url) {
      redirect(data.url);
    }

    return {
      success: false,
      error: 'Google 로그인 URL을 생성할 수 없습니다',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server Action for user logout
 */
export async function signOutAction() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message || '로그아웃에 실패했습니다',
      };
    }

    redirect('/');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
