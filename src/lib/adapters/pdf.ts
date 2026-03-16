import type { DocumentProps } from '@react-pdf/renderer'
import { renderToBuffer } from '@react-pdf/renderer'

/**
 * @react-pdf/renderer 의존성 격리 어댑터
 * 추후 다른 PDF 라이브러리로 교체 가능
 */
export async function generatePdfBuffer(
  document: React.ReactElement<DocumentProps>
): Promise<Uint8Array> {
  return renderToBuffer(document)
}
