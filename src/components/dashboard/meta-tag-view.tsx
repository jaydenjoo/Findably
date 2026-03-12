'use client';

import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Copy } from 'lucide-react';
import { trackMetaTagCopied } from '@/lib/analytics/posthog';

/**
 * Simple toast notification using a callback
 */
interface Toast {
  description: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

const createToast = (toast: Toast) => {
  console.log('Toast:', toast.description);
  // In a real app, this would use a toast library
  // For now, we'll just log to console for testing
};

export interface MetaTagViewProps {
  /** Current meta tags from crawl result */
  currentMeta: {
    title: string;
    description: string;
    titleLength: number;
    descriptionLength: number;
  };
  /** Recommended meta tags from Claude API */
  recommendations: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string | null;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string | null;
  };
  /** Reasons for each recommendation */
  reasons: {
    title: string;
    description: string;
    ogTags: string;
  };
  /** Improvement indicators */
  improvements: {
    titleImproved: boolean;
    descriptionImproved: boolean;
    titleLengthOptimal: boolean;
    descriptionLengthOptimal: boolean;
  };
}

interface MetaTagComparisonProps {
  currentValue: string;
  recommendedValue: string;
  currentLength?: number;
  recommendedLength?: number;
  guidanceText?: string;
  reason: string;
  tagType: string;
  onCopy: () => void;
  getTitleOptimalColor: (length: number) => string;
  getDescriptionOptimalColor: (length: number) => string;
}

/**
 * Inner component for displaying before/after meta tag comparison
 */
const MetaTagComparison = ({
  currentValue,
  recommendedValue,
  currentLength,
  recommendedLength,
  guidanceText,
  reason,
  tagType,
  onCopy,
  getTitleOptimalColor,
  getDescriptionOptimalColor,
}: MetaTagComparisonProps) => (
  <div className="space-y-4">
    {/* Character length guidance */}
    {guidanceText && (
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        {guidanceText}
      </div>
    )}

    {/* Comparison container */}
    <div className="grid grid-cols-2 gap-4">
      {/* Current (좌측) */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900">현재 {tagType}</h4>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 break-words">{currentValue}</p>
          {currentLength !== undefined && (
            <p className="text-xs text-gray-500 mt-2">{currentLength}자</p>
          )}
        </div>
      </div>

      {/* Recommended (우측) */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900">추천 {tagType}</h4>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-900 font-medium break-words">
            {recommendedValue}
          </p>
          {recommendedLength !== undefined && (
            <p
              className={`text-xs font-semibold mt-2 ${
                tagType === 'Title'
                  ? getTitleOptimalColor(recommendedLength)
                  : getDescriptionOptimalColor(recommendedLength)
              }`}
            >
              {recommendedLength}자
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Reason */}
    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
      <p className="text-sm text-blue-900">
        <span className="font-semibold">개선 이유: </span>
        {reason}
      </p>
    </div>

    {/* Copy button */}
    <div className="flex justify-end">
      <Button
        onClick={onCopy}
        size="sm"
        variant="outline"
        className="flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
        복사
      </Button>
    </div>
  </div>
);

/**
 * Meta Tag Optimization Comparison View Component
 * Displays current vs. recommended meta tags with improvement reasons
 * and copy-to-clipboard functionality
 */
export function MetaTagView({
  currentMeta,
  recommendations,
  reasons,
}: MetaTagViewProps) {
  const toast = createToast;
  const [activeTab, setActiveTab] = useState('title');

  // Handle copy to clipboard for single tag
  const handleCopyTag = useCallback(
    async (tagName: string, content: string) => {
      try {
        const htmlContent = `<meta name="${tagName}" content="${content}" />`;
        await navigator.clipboard.writeText(htmlContent);

        // Track meta tag copy event
        trackMetaTagCopied(tagName as 'title' | 'description' | 'og' | 'twitter' | 'all');

        toast({
          description: '복사되었습니다!',
          duration: 2000,
        });
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
        toast({
          description: '복사 실패. 다시 시도해주세요.',
          variant: 'destructive',
          duration: 2000,
        });
      }
    },
    [toast]
  );

  // Handle copy all meta tags
  const handleCopyAll = useCallback(async () => {
    try {
      const htmlContent =
        `<!-- Meta Tags -->\n<title>${recommendations.title}</title>\n<meta name="description" content="${recommendations.description}" />\n\n<!-- Open Graph Tags -->\n<meta property="og:title" content="${recommendations.ogTitle}" />\n<meta property="og:description" content="${recommendations.ogDescription}" />\n` +
        (recommendations.ogImage
          ? `<meta property="og:image" content="${recommendations.ogImage}" />\n`
          : '') +
        `<meta property="og:type" content="website" />\n\n<!-- Twitter Card Tags -->\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${recommendations.twitterTitle}" />\n<meta name="twitter:description" content="${recommendations.twitterDescription}" />\n` +
        (recommendations.twitterImage
          ? `<meta name="twitter:image" content="${recommendations.twitterImage}" />`
          : '');

      await navigator.clipboard.writeText(htmlContent);

      // Track all meta tags copy event
      trackMetaTagCopied('all');

      toast({
        description: '전체 메타 태그가 복사되었습니다!',
        duration: 2000,
      });
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      toast({
        description: '복사 실패. 다시 시도해주세요.',
        variant: 'destructive',
        duration: 2000,
      });
    }
  }, [recommendations, toast]);

  const getTitleOptimalColor = (length: number) => {
    if (length >= 50 && length <= 60) return 'text-green-600';
    if (length < 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDescriptionOptimalColor = (length: number) => {
    if (length >= 120 && length <= 160) return 'text-green-600';
    if (length < 120) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">
          메타 태그 최적화
        </h2>
        <p className="text-sm text-gray-600">
          검색 엔진과 소셜 미디어에서 더 잘 노출되도록 메타 태그를 최적화했습니다.
        </p>
      </div>

      {/* Tabs for different meta tag categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 border-b border-gray-200 bg-transparent">
          <TabsTrigger
            value="title"
            className="border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand rounded-none"
          >
            Title
          </TabsTrigger>
          <TabsTrigger
            value="description"
            className="border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand rounded-none"
          >
            Description
          </TabsTrigger>
          <TabsTrigger
            value="og"
            className="border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand rounded-none"
          >
            OG Tags
          </TabsTrigger>
          <TabsTrigger
            value="twitter"
            className="border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand rounded-none"
          >
            Twitter
          </TabsTrigger>
        </TabsList>

        {/* Title Tab */}
        <TabsContent value="title" className="mt-6">
          <MetaTagComparison
            currentValue={currentMeta.title}
            recommendedValue={recommendations.title}
            currentLength={currentMeta.titleLength}
            recommendedLength={recommendations.title.length}
            guidanceText="Title: 50-60자 권장 (검색 결과에 전체 노출)"
            reason={reasons.title}
            tagType="Title"
            onCopy={() =>
              handleCopyTag('title', recommendations.title)
            }
            getTitleOptimalColor={getTitleOptimalColor}
            getDescriptionOptimalColor={getDescriptionOptimalColor}
          />
        </TabsContent>

        {/* Description Tab */}
        <TabsContent value="description" className="mt-6">
          <MetaTagComparison
            currentValue={currentMeta.description}
            recommendedValue={recommendations.description}
            currentLength={currentMeta.descriptionLength}
            recommendedLength={recommendations.description.length}
            guidanceText="Description: 120-160자 권장 (검색 결과의 설명 부분)"
            reason={reasons.description}
            tagType="Description"
            onCopy={() =>
              handleCopyTag('description', recommendations.description)
            }
            getTitleOptimalColor={getTitleOptimalColor}
            getDescriptionOptimalColor={getDescriptionOptimalColor}
          />
        </TabsContent>

        {/* OG Tags Tab */}
        <TabsContent value="og" className="mt-6 space-y-6">
          {/* og:title */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">og:title</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 break-words">
                  {currentMeta.title}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-900 font-medium break-words">
                  {recommendations.ogTitle}
                </p>
              </div>
            </div>
          </div>

          {/* og:description */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">
              og:description
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 break-words">
                  {currentMeta.description}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-900 font-medium break-words">
                  {recommendations.ogDescription}
                </p>
              </div>
            </div>
          </div>

          {/* og:image */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">og:image</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">없음</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                {recommendations.ogImage ? (
                  <a
                    href={recommendations.ogImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 break-words underline"
                  >
                    {recommendations.ogImage}
                  </a>
                ) : (
                  <p className="text-xs text-gray-500">없음</p>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">개선 이유: </span>
              {reasons.ogTags}
            </p>
          </div>
        </TabsContent>

        {/* Twitter Tags Tab */}
        <TabsContent value="twitter" className="mt-6 space-y-6">
          {/* twitter:title */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">
              twitter:title
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 break-words">
                  {currentMeta.title}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-900 font-medium break-words">
                  {recommendations.twitterTitle}
                </p>
              </div>
            </div>
          </div>

          {/* twitter:description */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">
              twitter:description
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 break-words">
                  {currentMeta.description}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-900 font-medium break-words">
                  {recommendations.twitterDescription}
                </p>
              </div>
            </div>
          </div>

          {/* twitter:image */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">
              twitter:image
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">없음</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                {recommendations.twitterImage ? (
                  <a
                    href={recommendations.twitterImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 break-words underline"
                  >
                    {recommendations.twitterImage}
                  </a>
                ) : (
                  <p className="text-xs text-gray-500">없음</p>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">개선 이유: </span>
              {reasons.ogTags}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Copy All Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleCopyAll}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark"
        >
          <Copy className="w-4 h-4" />
          전체 복사
        </Button>
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <p className="text-xs font-semibold text-gray-900 mb-2">💡 팁</p>
        <p className="text-xs text-gray-600">
          위에서 생성된 메타 태그를 웹사이트의 &lt;head&gt; 섹션에 추가하면,
          검색 결과와 소셜 미디어 공유 시 더 잘 표시됩니다. WordPress인 경우
          테마 설정에서, 기타 CMS는 HTML 편집기에서 추가하세요.
        </p>
      </Card>
    </div>
  );
}
