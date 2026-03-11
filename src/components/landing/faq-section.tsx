"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "Findably는 어떤 서비스인가요?",
    answer:
      "Findably는 AI 기반 마케팅 진단 서비스입니다. 웹사이트 URL을 입력하면 SEO, 콘텐츠, Schema Markup, 검색 노출 상태를 종합 분석하고, 즉시 실행 가능한 개선안을 제공합니다.",
  },
  {
    id: "faq-2",
    question: "무료로 사용할 수 있나요?",
    answer:
      "네, 기본 진단은 완전 무료입니다. URL 입력 후 종합 점수와 핵심 개선 사항을 무료로 확인하실 수 있습니다. 더 상세한 분석과 자동화 기능은 유료 플랜에서 제공됩니다.",
  },
  {
    id: "faq-3",
    question: "진단에 얼마나 걸리나요?",
    answer:
      "대부분의 웹사이트는 3-5분 이내에 진단이 완료됩니다. AI가 웹사이트를 크롤링하고, SEO 요소를 분석하며, 개선안을 생성하는 전 과정이 자동으로 진행됩니다.",
  },
  {
    id: "faq-4",
    question: "어떤 항목을 진단하나요?",
    answer:
      "메타 태그, 헤딩 구조, Schema Markup, robots.txt, 사이트맵, 페이지 속도, 모바일 최적화, 콘텐츠 품질 등 SEO의 핵심 요소를 종합적으로 분석합니다.",
  },
  {
    id: "faq-5",
    question: "Schema Markup이 뭔가요?",
    answer:
      "Schema Markup은 검색엔진이 웹페이지 내용을 더 잘 이해할 수 있도록 도와주는 구조화된 데이터입니다. Findably는 웹사이트에 맞는 Schema Markup을 자동으로 생성해 드립니다.",
  },
  {
    id: "faq-6",
    question: "개인정보는 안전한가요?",
    answer:
      "네, 수집된 데이터는 진단 목적으로만 사용되며, 엄격한 보안 정책에 따라 관리됩니다. 제3자와 공유되지 않으며, 원하시면 언제든 데이터 삭제를 요청하실 수 있습니다.",
  },
];

export default function FAQSection() {
  return (
    <section className="relative w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Section Header */}
        <div
          className="text-center mb-12 animate-fade-in"
          style={{ animationDelay: "0s" }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-base sm:text-lg text-gray-500">
            궁금한 점이 있으신가요?
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="animate-fade-in space-y-3" style={{ animationDelay: "0.1s" }}>
          <Accordion className="w-full">
            {faqItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <AccordionItem
                  value={item.id}
                  className="border border-gray-200 rounded-lg px-3 sm:px-4 hover:border-gray-300 transition-colors duration-200"
                >
                  <AccordionTrigger className="py-3 sm:py-4 text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-3 sm:pb-4 pt-0">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
