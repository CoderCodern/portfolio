#!/usr/bin/env node
/**
 * Shared AI helpers for the convert-notion-blog skill.
 * Used by both write.js (before pushing to Notion) and smooth.js (post-migration polish).
 *
 * Requires: OPENAI_API_KEY in environment.
 */

import OpenAI from 'openai';

const LANG_DETECT_PROMPT =
  'What programming language is this code snippet? ' +
  'Reply with only the lowercase Shiki language identifier ' +
  '(e.g. csharp, javascript, typescript, python, go, rust, java, kotlin, swift, cpp, ' +
  'php, ruby, sql, json, yaml, bash, html, css, xml, text). ' +
  'If it is plain prose or config with no clear language, reply "text".';

const REFINE_SYSTEM_PROMPT =
  'You are a technical writing editor. Improve the article below: ' +
  'fix grammar, improve clarity and professional tone, and make it more engaging. ' +
  'Rephrase any sections that closely mirror the original source to reduce plagiarism risk. ' +
  'IMPORTANT: preserve all code blocks exactly — do not change any text inside triple-backtick fences. ' +
  'Preserve all markdown formatting (headings, bold, links, lists, blockquotes). ' +
  'Return only the improved article body with no commentary or preamble.';

/**
 * Parses markdown body into an array of segments:
 *   { type: 'text', content: string }
 *   { type: 'fence', lang: string, code: string, raw: string }
 */
function parseSegments(body) {
  const lines = body.split('\n');
  const segments = [];
  let i = 0;

  while (i < lines.length) {
    const fenceMatch = lines[i].match(/^(```)(.*)/);
    if (fenceMatch) {
      const lang = fenceMatch[2].trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const raw = '```' + lang + '\n' + codeLines.join('\n') + '\n```';
      segments.push({ type: 'fence', lang, code: codeLines.join('\n'), raw });
      i++; // skip closing ```
    } else {
      // Collect consecutive non-fence lines as one text segment
      const textLines = [];
      while (i < lines.length && !lines[i].match(/^```/)) {
        textLines.push(lines[i]);
        i++;
      }
      segments.push({ type: 'text', content: textLines.join('\n') });
    }
  }

  return segments;
}

/**
 * Rebuilds markdown body from segments.
 */
function segmentsToMarkdown(segments) {
  return segments
    .map((seg) => {
      if (seg.type === 'fence') return '```' + seg.lang + '\n' + seg.code + '\n```';
      return seg.content;
    })
    .join('\n');
}

/**
 * Pass 1: Detects programming languages for untagged code fences.
 * All detections run in parallel.
 * Returns { markdown: string, changes: Array<{index, detected}> }
 */
export async function detectCodeLanguages(markdown, openai) {
  const segments = parseSegments(markdown);
  const changes = [];

  const untagged = segments
    .map((seg, i) => ({ seg, i }))
    .filter(({ seg }) => seg.type === 'fence' && seg.lang === '' && seg.code.trim().length > 0);

  if (untagged.length === 0) return { markdown, changes };

  const detections = await Promise.all(
    untagged.map(async ({ seg, i }) => {
      const snippet = seg.code.slice(0, 1500); // cap to keep tokens low
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `${LANG_DETECT_PROMPT}\n\n${snippet}` }],
        max_tokens: 20,
        temperature: 0,
      });
      const detected = response.choices[0].message.content.trim().toLowerCase().replace(/[^a-z0-9+#]/g, '');
      return { i, detected: detected || 'text' };
    }),
  );

  for (const { i, detected } of detections) {
    segments[i].lang = detected;
    changes.push({ index: i, detected });
  }

  return { markdown: segmentsToMarkdown(segments), changes };
}

/**
 * Pass 2: Refines article body using GPT-4o-mini.
 * Code fences are preserved exactly by the model prompt.
 * Returns refined markdown string.
 */
export async function refineContent(markdown, openai) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: REFINE_SYSTEM_PROMPT },
      { role: 'user', content: markdown },
    ],
    temperature: 0.4,
  });
  return response.choices[0].message.content.trim();
}

const DESCRIPTION_SYSTEM_PROMPT =
  'Write a concise one-sentence description (under 160 characters) for a technical blog post. ' +
  'It should be informative and enticing, suitable as a meta description. ' +
  'Reply with ONLY the description text — no quotes, no trailing punctuation.';

/**
 * Generates a one-line description for an article using GPT-4o-mini.
 */
export async function generateDescription(title, body, openai) {
  const preview = `Title: ${title}\n\nContent preview:\n${body.slice(0, 2000)}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
      { role: 'user', content: preview },
    ],
    max_tokens: 80,
    temperature: 0.3,
  });
  return response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
}

/**
 * Runs both passes (language detection then content refinement).
 * Returns { markdown: string, langChanges: Array }
 */
export async function smoothMarkdown(markdown, openai) {
  const { markdown: langTagged, changes: langChanges } = await detectCodeLanguages(markdown, openai);
  const refined = await refineContent(langTagged, openai);
  return { markdown: refined, langChanges };
}

const KNOWN_CATEGORIES = ['Frontend', 'Backend', 'System Design', 'Career', 'AI'];

const CATEGORY_SYSTEM_PROMPT =
  'You are a technical blog post categorizer. Classify the article into exactly ONE of:\n' +
  '- Frontend: React, Next.js, SvelteKit, Vue, CSS, JavaScript/TypeScript, UI components, state management, web APIs\n' +
  '- Backend: .NET, C#, Java, Node.js server-side, databases, microservices, DI patterns, ORMs\n' +
  '- System Design: Architecture patterns, distributed systems, messaging, CQRS, event sourcing, scalability, API design strategy\n' +
  '- Career: Career growth, engineering leadership, soft skills, personal development, team culture\n' +
  '- AI: AI tools, LLMs, Claude, Claude Code, GitHub Copilot, prompt engineering, AI-assisted development, AI workflows\n' +
  'Reply with ONLY the category name, no explanation.';

/**
 * Detects which category an article belongs to using GPT-4o-mini.
 * Returns one of: Frontend | Backend | System Design | Career | AI
 */
export async function detectCategory(title, description, markdown, openai) {
  const preview = [
    `Title: ${title}`,
    description ? `Description: ${description}` : '',
    `Content preview:\n${markdown.slice(0, 2000)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: CATEGORY_SYSTEM_PROMPT },
      { role: 'user', content: preview },
    ],
    max_tokens: 10,
    temperature: 0,
  });

  const raw = response.choices[0].message.content.trim();
  const matched = KNOWN_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  return matched ?? raw;
}

/**
 * Creates an OpenAI client from environment. Returns null if key is missing.
 */
export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
