'use client';

export default function SocialProofSection() {
  const metrics = [
    {
      number: '500+',
      label: '기업이 사용 중',
      delay: '0s',
    },
    {
      number: '92%',
      label: '사용자 만족도',
      delay: '0.1s',
    },
    {
      number: '32%',
      label: '검색 노출 개선',
      delay: '0.2s',
    },
    {
      number: '3분',
      label: '진단 완료',
      delay: '0.3s',
    },
  ];

  return (
    <section className="relative w-full bg-white py-12 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex flex-col items-center sm:items-start text-center sm:text-left animate-fade-in"
              style={{ animationDelay: metric.delay }}
            >
              {/* Large Number with Brand Color */}
              <div className="text-4xl sm:text-5xl font-black text-blue-600 mb-3 leading-tight">
                {metric.number}
              </div>

              {/* Label */}
              <p className="text-sm sm:text-base text-gray-500 font-medium">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}
