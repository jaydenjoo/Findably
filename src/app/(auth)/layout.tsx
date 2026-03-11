/**
 * Auth Layout
 * Wrapper for authentication pages (signup, login, etc.)
 * Provides consistent styling and structure for auth flows
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Background dot pattern */}
      <style>{`
        html {
          background: #fafbfc;
          background-image: radial-gradient(
            circle,
            #dde0e4 0.5px,
            transparent 0.5px
          );
          background-size: 22px 22px;
        }
      `}</style>

      {/* Decorative blob - brand color at 5% opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-5 pointer-events-none"
          style={{ backgroundColor: '#2b7cff' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
