import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export default async function AccessibilityPage() {
  const filePath = path.join(process.cwd(), 'public', 'accessibility.md');
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const html = await marked(markdown);

  return (
    <main className="prose mx-auto p-6">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
