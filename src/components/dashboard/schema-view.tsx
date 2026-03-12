'use client';

import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Copy, ExternalLink } from 'lucide-react';
import { trackSchemaCopied } from '@/lib/analytics/posthog';

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

export interface SchemaViewProps {
  /** Array of generated schema items */
  schemas: Array<{
    type: string;
    jsonLd: Record<string, unknown>;
  }>;
  /** Complete <script> tag ready to embed in HTML */
  jsonLdScript: string;
  /** List of fields that could improve the schema */
  missingFields: string[];
  /** Optional callback to regenerate schema with field overrides */
  onRegenerateWithOverrides?: (overrides: Record<string, string>) => void;
}

/**
 * Schema Markup Code View Component
 * Displays generated JSON-LD schemas with syntax highlighting, copy functionality,
 * and optional form for missing required fields.
 */
export function SchemaView({
  schemas,
  // jsonLdScript is prepared for future use but currently only JSON-LD is displayed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jsonLdScript,
  missingFields,
  onRegenerateWithOverrides,
}: SchemaViewProps) {
  const toast = createToast;
  const [selectedSchemaIndex, setSelectedSchemaIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Get selected schema
  const selectedSchema = schemas[selectedSchemaIndex] || null;

  // Extract JSON-LD for current selection (simplified for single schema display)
  const getSelectedJsonLd = useCallback(() => {
    if (!selectedSchema) return null;
    return selectedSchema.jsonLd;
  }, [selectedSchema]);

  // Handle schema type button click
  const handleSchemaSelect = (index: number) => {
    setSelectedSchemaIndex(index);
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      // Get the script content for the selected schema
      const jsonLdContent = JSON.stringify(getSelectedJsonLd(), null, 2);
      const scriptContent = `<script type="application/ld+json">
${jsonLdContent}
</script>`;

      await navigator.clipboard.writeText(scriptContent);

      // Track schema copy event
      trackSchemaCopied(selectedSchema?.type || 'unknown');

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
  };

  // Handle missing field form input change
  const handleFormChange = (field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle regenerate with overrides
  const handleRegenerate = async () => {
    if (!onRegenerateWithOverrides) return;

    setIsRegenerating(true);
    try {
      onRegenerateWithOverrides(formValues);
      // Reset form after regeneration
      setFormValues({});
      toast({
        description: 'Schema를 다시 생성했습니다!',
        duration: 2000,
      });
    } catch (error) {
      console.error('Schema 재생성 실패:', error);
      toast({
        description: 'Schema 재생성에 실패했습니다.',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Empty state
  if (schemas.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-gray-500">
            Schema Markup를 생성할 데이터가 없습니다.
          </p>
        </div>
      </Card>
    );
  }

  const selectedJsonLd = getSelectedJsonLd();

  return (
    <div className="space-y-6">
      {/* Schema Type Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Schema 유형 선택</h3>
        <div className="flex flex-wrap gap-2">
          {schemas.map((schema, index) => (
            <Button
              key={schema.type}
              onClick={() => handleSchemaSelect(index)}
              variant="outline"
              size="sm"
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${
                  selectedSchemaIndex === index
                    ? 'bg-brand text-white border-brand'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }
              `}
            >
              {schema.type}
            </Button>
          ))}
        </div>
      </div>

      {/* Code Block with Copy Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">JSON-LD 코드</h3>
          <Button
            onClick={handleCopy}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            복사
          </Button>
        </div>

        {/* Code Block */}
        <div className="relative bg-gray-900 text-gray-50 p-6 rounded-16 overflow-auto font-mono text-sm shadow-md">
          {/* Line numbers + code */}
          <pre className="whitespace-pre-wrap break-words">
            <code>
              {selectedJsonLd
                ? JSON.stringify(selectedJsonLd, null, 2)
                : '// Schema 데이터가 없습니다'}
            </code>
          </pre>
        </div>

        {/* Length Info */}
        <p className="text-xs text-gray-500">
          전체 JSON-LD 크기: {JSON.stringify(selectedJsonLd).length} 바이트
        </p>
      </div>

      {/* Missing Fields Form */}
      {missingFields.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-100">
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-100 text-blue-900 text-sm p-3 rounded-lg">
              아래 정보를 추가하면 더 완성도 높은 Schema를 생성할 수 있습니다.
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              {missingFields.map(field => (
                <div key={field} className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {field}
                  </Label>
                  <Input
                    value={formValues[field] || ''}
                    onChange={e => handleFormChange(field, e.target.value)}
                    placeholder={`${field} 입력`}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Regenerate Button */}
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || !onRegenerateWithOverrides}
              className="w-full"
            >
              {isRegenerating ? '생성 중...' : '다시 생성'}
            </Button>
          </div>
        </Card>
      )}

      {/* HTML 추가 방법 Guide */}
      <Accordion>
        <AccordionItem value="guide" className="border-gray-200">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:text-brand">
            HTML 추가 방법
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 text-sm text-gray-700">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">위 코드를 복사합니다</p>
                  <p className="text-gray-500 text-xs mt-1">
                    &quot;복사&quot; 버튼을 클릭하여 JSON-LD 코드를 복사하세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">웹사이트의 &lt;head&gt; 태그 안에 붙여넣습니다</p>
                  <p className="text-gray-500 text-xs mt-1">
                    WordPress의 경우 테마 설정 → 추가 CSS에, 기타 CMS는 HTML 편집기에서 헤드 섹션을 찾아 붙여넣으세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">저장 후 Google의 Rich Results Test로 확인합니다</p>
                  <p className="text-gray-500 text-xs mt-1">
                    아래 링크에서 테스트하여 Schema가 올바르게 적용되었는지 확인하세요.
                  </p>
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand hover:text-brand-dark font-medium mt-2"
                  >
                    Rich Results Test
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-900 mb-2">💡 팁</p>
              <p className="text-xs text-gray-600">
                Schema Markup은 Google, Bing 등의 검색 엔진이 페이지 내용을 더 잘 이해하도록 도와줍니다.
                정확한 Schema 적용으로 검색 결과에서 더 많은 정보가 표시되어 CTR을 향상시킬 수 있습니다.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
