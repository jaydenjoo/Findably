import { z } from 'zod';

/**
 * Password strength validation
 * Requirements: ≥8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8글자 이상이어야 합니다')
  .regex(/[A-Z]/, '비밀번호는 최소 1개의 대문자를 포함해야 합니다')
  .regex(/[a-z]/, '비밀번호는 최소 1개의 소문자를 포함해야 합니다')
  .regex(/[0-9]/, '비밀번호는 최소 1개의 숫자를 포함해야 합니다')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    '비밀번호는 최소 1개의 특수문자를 포함해야 합니다'
  );

/**
 * Sign-up form validation schema
 * Validates: email, password, confirm password, terms acceptance
 */
export const SignUpSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요')
      .trim()
      .toLowerCase()
      .email('올바른 이메일 형식이 아닙니다'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, '약관에 동의해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * Login form validation schema
 * Validates: email, password
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .trim()
    .toLowerCase()
    .email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
