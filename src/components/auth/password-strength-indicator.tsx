'use client';

import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Password strength indicator component
 * Shows visual feedback for password strength based on criteria:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const { strength, messages } = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const newMessages: string[] = [];
    if (!checks.length) newMessages.push('최소 8글자');
    if (!checks.uppercase) newMessages.push('대문자 포함');
    if (!checks.lowercase) newMessages.push('소문자 포함');
    if (!checks.number) newMessages.push('숫자 포함');
    if (!checks.special) newMessages.push('특수문자 포함');

    return { strength: passedChecks, messages: newMessages };
  }, [password]);

  const getColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getLabel = () => {
    if (strength <= 2) return '약함';
    if (strength <= 3) return '보통';
    if (strength <= 4) return '강함';
    return '매우 강함';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all duration-300`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 min-w-12">
          {getLabel()}
        </span>
      </div>
      {messages.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {messages.map((msg) => (
            <div key={msg} className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
