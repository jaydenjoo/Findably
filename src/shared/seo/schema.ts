export function generateOrganizationSchema(name: string, url: string) {
  return { '@context': 'https://schema.org', '@type': 'Organization', name, url }
}

export function generateFAQSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}
