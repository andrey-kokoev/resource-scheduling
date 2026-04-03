import fs from 'node:fs/promises';
import path from 'node:path';

const packageDirArg = process.argv[2] ?? '.';
const packageDir = path.resolve(process.cwd(), packageDirArg);
const docsDir = path.join(packageDir, 'docs');
const outDir = path.join(packageDir, 'dist-docs');

const css = `
:root {
  color-scheme: light;
  --bg: #f7f2eb;
  --panel: #fffaf4;
  --ink: #201a17;
  --muted: #655b54;
  --accent: #8a4b2f;
  --border: #daccc0;
  --code-bg: #f1e7dc;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fbf7f1 0%, var(--bg) 100%);
  color: var(--ink);
}
main {
  max-width: 980px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
}
.page {
  background: rgba(255, 250, 244, 0.94);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(69, 47, 33, 0.08);
  padding: 1.25rem 1.4rem;
}
.breadcrumb {
  margin: 0 0 1rem;
  color: var(--muted);
  font-size: 0.92rem;
}
.breadcrumb a {
  color: inherit;
  text-decoration: none;
}
h1, h2, h3, h4 {
  line-height: 1.2;
}
h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  margin: 0 0 1rem;
}
h2 {
  margin: 1.8rem 0 0.6rem;
  color: var(--accent);
  font-size: 1.2rem;
}
h3 {
  margin: 1.2rem 0 0.5rem;
  font-size: 1rem;
}
p, li, td, th {
  line-height: 1.6;
}
pre {
  margin: 0.9rem 0;
  padding: 0.9rem;
  background: #0f1720;
  color: #e7f1ff;
  border-radius: 14px;
  overflow: auto;
  font-size: 0.92rem;
}
code {
  background: var(--code-bg);
  padding: 0.08rem 0.35rem;
  border-radius: 6px;
}
pre code {
  background: transparent;
  padding: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8rem 0;
}
th, td {
  text-align: left;
  vertical-align: top;
  padding: 0.6rem 0.45rem;
  border-bottom: 1px solid #eadfd5;
}
th {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
hr {
  border: 0;
  border-top: 1px solid #eadfd5;
  margin: 1.2rem 0;
}
a {
  color: var(--accent);
}
ul, ol {
  padding-left: 1.3rem;
}
`;

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function slugToTitle(filename) {
  return filename
    .replace(/\.md$/, '')
    .replace(/^\d+-/, '')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderInline(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const mapped = href.endsWith('.md') ? href.replace(/README\.md$/, 'index.html').replace(/\.md$/, '.html') : href;
      return `<a href="${mapped}">${label}</a>`;
    });
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

function isDividerRow(line) {
  return /^\|?[\s:-|]+\|?$/.test(line.trim()) && line.includes('-');
}

function renderMarkdown(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const html = [];
  let i = 0;
  let inCode = false;
  let codeLines = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
      }
      i += 1;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      i += 1;
      continue;
    }

    if (trimmed === '') {
      i += 1;
      continue;
    }

    if (trimmed === '---') {
      html.push('<hr />');
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      html.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
      i += 1;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
      i += 1;
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && isDividerRow(lines[i + 1])) {
      const headers = splitTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      html.push(
        '<table><thead><tr>' +
          headers.map(cell => `<th>${renderInline(cell)}</th>`).join('') +
        '</tr></thead><tbody>' +
          rows.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell)}</td>`).join('')}</tr>`).join('') +
        '</tbody></table>',
      );
      continue;
    }

    if (/^[-*] /.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      html.push(`<ul>${items.map(item => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ''));
        i += 1;
      }
      html.push(`<ol>${items.map(item => `<li>${renderInline(item)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraph = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        next === '' ||
        next === '---' ||
        next.startsWith('#') ||
        /^[-*] /.test(next) ||
        /^\d+\. /.test(next) ||
        (lines[i].includes('|') && i + 1 < lines.length && isDividerRow(lines[i + 1])) ||
        next.startsWith('```')
      ) {
        break;
      }
      paragraph.push(next);
      i += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

async function main() {
  try {
    const entries = (await fs.readdir(docsDir))
      .filter(name => name.endsWith('.md'))
      .sort();

    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });

    for (const entry of entries) {
      const sourcePath = path.join(docsDir, entry);
      const markdown = await fs.readFile(sourcePath, 'utf8');
      const title = entry === 'README.md' ? 'Docs' : slugToTitle(entry);
      const body = renderMarkdown(markdown);
      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
  </head>
  <body>
    <main>
      <article class="page">
        <p class="breadcrumb"><a href="./index.html">Docs</a></p>
        ${body}
      </article>
    </main>
  </body>
</html>`;

      const outName = entry === 'README.md' ? 'index.html' : entry.replace(/\.md$/, '.html');
      await fs.writeFile(path.join(outDir, outName), html, 'utf8');
    }

    console.log(`Built ${entries.length} docs pages for ${path.basename(packageDir)}.`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log(`No docs directory for ${path.basename(packageDir)}.`);
      return;
    }
    throw error;
  }
}

await main();
