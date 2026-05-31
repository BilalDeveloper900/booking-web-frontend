/**
 * Renders a JSON-LD <script> for structured data (schema.org). Server-rendered
 * so search engines and AI crawlers see it in the initial HTML.
 *
 * Usage: <JsonLd data={{ "@context": "https://schema.org", "@graph": [...] }} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, build-time content — not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
