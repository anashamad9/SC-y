import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CourseMarkdownPart =
  | { type: "markdown"; content: string }
  | { type: "security-alert"; alertType: string; content: string }
  | { type: "scenario-simulator"; title: string; scenarioId: string }
  | { type: "interactive-table"; columns: string[]; data: Array<Record<string, unknown> | unknown[]> }
  | { type: "interactive-quiz"; question: string; options: string[]; correctAnswer: string; explanation: string }
  | { type: "generic-mdx"; name: string; content: string; attributes: Record<string, string> };

const CUSTOM_MDX_TAG_RE =
  /<([A-Za-z][\w]*)\b([\s\S]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;

const SUPPORTED_MDX_COMPONENTS = new Set([
  "SecurityAlert",
  "ScenarioSimulator",
  "InteractiveTable",
  "InteractiveQuiz",
]);

const METADATA_KEYS = new Set([
  "title",
  "subtitle",
  "duration",
  "level",
  "category",
  "description",
  "video",
  "videoUrl",
  "markdownUrl",
]);

function splitAttributes(input = "") {
  const attributes: Record<string, string> = {};
  let index = 0;

  while (index < input.length) {
    while (/\s/.test(input[index] ?? "")) index += 1;
    const keyMatch = input.slice(index).match(/^([A-Za-z][\w-]*)/);
    if (!keyMatch) break;

    const key = keyMatch[1];
    index += key.length;
    while (/\s/.test(input[index] ?? "")) index += 1;

    if (input[index] !== "=") {
      attributes[key] = "true";
      continue;
    }

    index += 1;
    while (/\s/.test(input[index] ?? "")) index += 1;

    const quote = input[index];
    if (quote === '"' || quote === "'") {
      index += 1;
      const start = index;
      while (index < input.length && input[index] !== quote) index += 1;
      attributes[key] = input.slice(start, index);
      index += 1;
      continue;
    }

    if (input[index] === "{") {
      let depth = 0;
      let inString: string | null = null;
      const start = index;
      while (index < input.length) {
        const char = input[index];
        const prev = input[index - 1];
        if (inString) {
          if (char === inString && prev !== "\\") inString = null;
        } else if (char === '"' || char === "'") {
          inString = char;
        } else if (char === "{") {
          depth += 1;
        } else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            break;
          }
        }
        index += 1;
      }
      attributes[key] = input.slice(start, index);
      continue;
    }

    const start = index;
    while (index < input.length && !/\s/.test(input[index])) index += 1;
    attributes[key] = input.slice(start, index);
  }

  return attributes;
}

function parseAttributeValue(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  const unwrapped = trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed.slice(1, -1).trim() : trimmed;
  if (!unwrapped) return "";
  if ((unwrapped.startsWith("[") && unwrapped.endsWith("]")) || (unwrapped.startsWith("{") && unwrapped.endsWith("}"))) {
    try {
      return JSON.parse(unwrapped);
    } catch {
      return unwrapped;
    }
  }
  return unwrapped;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toTableRows(value: unknown): Array<Record<string, unknown> | unknown[]> {
  return Array.isArray(value) ? value.filter((row) => Array.isArray(row) || (row && typeof row === "object")) as Array<Record<string, unknown> | unknown[]> : [];
}

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="mb-5 mt-7 text-3xl font-bold leading-tight text-current text-balance">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-4 mt-7 text-2xl font-bold leading-tight text-current text-balance">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-3 mt-6 text-xl font-semibold leading-tight text-current text-balance">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-5 text-lg font-semibold text-current text-balance">{children}</h4>,
  p: ({ children }) => <p className="my-4 leading-8 text-current text-pretty">{children}</p>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-2 ps-6 text-current text-pretty">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 ps-6 text-current text-pretty">{children}</ol>,
  li: ({ children }) => <li className="leading-8 text-current marker:text-current/70">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-current">{children}</strong>,
  em: ({ children }) => <em className="text-current">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer" : undefined} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-s-4 border-primary/40 bg-muted/40 px-4 py-2 text-current">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-current">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-current">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm text-current">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60 text-current">{children}</thead>,
  th: ({ children }) => <th className="border-b border-border px-4 py-3 text-start font-semibold text-current">{children}</th>,
  td: ({ children }) => <td className="border-b border-border/70 px-4 py-3 text-current">{children}</td>,
};

function MarkdownText({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-none text-foreground", className)}>
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{content}</ReactMarkdown>
    </div>
  );
}

export function isLikelyRtlMarkdown(content?: string | null) {
  if (!content) return false;
  const arabicCount = content.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latinCount = content.match(/[A-Za-z]/g)?.length ?? 0;
  return arabicCount > 0 && arabicCount >= latinCount;
}

export function stripCourseMarkdownMetadata(content: string) {
  const withoutFrontmatter = content.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]*/m, "");
  const lines = withoutFrontmatter.split(/\r?\n/);
  let index = 0;
  let metadataLineCount = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z][\w-]*)\s*:/);
    if (!keyMatch || !METADATA_KEYS.has(keyMatch[1])) break;

    metadataLineCount += 1;
    index += 1;
  }

  return metadataLineCount > 0 ? lines.slice(index).join("\n").trimStart() : withoutFrontmatter.trimStart();
}

function splitCourseMarkdown(content: string): CourseMarkdownPart[] {
  const parts: CourseMarkdownPart[] = [];
  let lastIndex = 0;
  const cleanContent = stripCourseMarkdownMetadata(content);

  for (const match of cleanContent.matchAll(CUSTOM_MDX_TAG_RE)) {
    const componentName = match[1];
    if (!SUPPORTED_MDX_COMPONENTS.has(componentName) && !/^[A-Z]/.test(componentName)) continue;

    const index = match.index ?? 0;
    const markdownBefore = cleanContent.slice(lastIndex, index);
    if (markdownBefore.trim()) parts.push({ type: "markdown", content: markdownBefore });

    const attributes = splitAttributes(match[2]);
    if (componentName === "SecurityAlert") {
      parts.push({
        type: "security-alert",
        alertType: attributes.type || "info",
        content: (match[3] ?? "").trim(),
      });
    } else if (componentName === "ScenarioSimulator") {
      parts.push({
        type: "scenario-simulator",
        scenarioId: attributes.scenarioId || attributes.scenarioid || "",
        title: attributes.title || "Scenario",
      });
    } else if (componentName === "InteractiveTable") {
      parts.push({
        type: "interactive-table",
        columns: toStringArray(parseAttributeValue(attributes.columns)),
        data: toTableRows(parseAttributeValue(attributes.data)),
      });
    } else if (componentName === "InteractiveQuiz") {
      parts.push({
        type: "interactive-quiz",
        question: String(parseAttributeValue(attributes.question) ?? ""),
        options: toStringArray(parseAttributeValue(attributes.options)),
        correctAnswer: String(parseAttributeValue(attributes.correctAnswer ?? attributes.correctanswer) ?? ""),
        explanation: String(parseAttributeValue(attributes.explanation) ?? ""),
      });
    } else {
      parts.push({
        type: "generic-mdx",
        name: componentName,
        content: (match[3] ?? "").trim(),
        attributes,
      });
    }

    lastIndex = index + match[0].length;
  }

  const markdownAfter = cleanContent.slice(lastIndex);
  if (markdownAfter.trim()) parts.push({ type: "markdown", content: markdownAfter });
  return parts;
}

function GenericMdxBlock({
  name,
  content,
  attributes,
}: {
  name: string;
  content: string;
  attributes: Record<string, string>;
}) {
  const visibleAttributes = Object.entries(attributes)
    .map(([key, value]) => [key, parseAttributeValue(value)] as const)
    .filter(([, value]) => typeof value === "string" && value !== "true" && value.trim());

  if (!content && visibleAttributes.length === 0) return null;

  return (
    <div className="my-5 rounded-xl border border-border bg-card/70 p-4 not-prose">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{name}</div>
      {content ? (
        <MarkdownText content={content} className="mt-3" />
      ) : (
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {visibleAttributes.map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-foreground">{key}: </span>
              {String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InteractiveTableBlock({
  columns,
  data,
}: {
  columns: string[];
  data: Array<Record<string, unknown> | unknown[]>;
}) {
  if (columns.length === 0 || data.length === 0) return null;

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-border bg-card/70 not-prose">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-border px-4 py-3 text-start font-semibold text-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border/70 last:border-0">
                {columns.map((column, columnIndex) => {
                  const value = Array.isArray(row) ? row[columnIndex] : row[column] ?? row[columnIndex];
                  return (
                    <td key={`${rowIndex}-${column}`} className="px-4 py-3 align-top text-muted-foreground">
                      {String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InteractiveQuizBlock({
  question,
  options,
  correctAnswer,
  explanation,
}: {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctAnswer;

  if (!question || options.length === 0) return null;

  return (
    <div className="my-5 rounded-xl border border-primary/25 bg-primary/5 p-4 not-prose">
      <div className="text-sm font-semibold text-foreground">{question}</div>
      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const optionIsCorrect = answered && option === correctAnswer;
          const optionIsWrong = answered && option === selected && option !== correctAnswer;
          return (
            <Button
              key={option}
              type="button"
              variant="outline"
              onClick={() => setSelected(option)}
              className={cn(
                "h-auto min-h-10 justify-start whitespace-normal text-start",
                optionIsCorrect && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                optionIsWrong && "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
              )}
            >
              <span className="flex items-start gap-2">
                {optionIsCorrect && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                {optionIsWrong && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{option}</span>
              </span>
            </Button>
          );
        })}
      </div>
      {answered && (
        <div className={cn("mt-3 rounded-lg border p-3 text-sm", isCorrect ? "border-emerald-500/35 bg-emerald-500/10" : "border-amber-500/35 bg-amber-500/10")}>
          <div className="font-medium">{isCorrect ? "Correct" : `Correct answer: ${correctAnswer}`}</div>
          {explanation && <div className="mt-1 text-muted-foreground">{explanation}</div>}
        </div>
      )}
    </div>
  );
}

function SecurityAlertBlock({
  alertType,
  content,
}: {
  alertType: string;
  content: string;
}) {
  const normalizedType = alertType.toLowerCase();
  const isCritical = normalizedType === "critical" || normalizedType === "danger";
  const Icon = isCritical ? ShieldAlert : normalizedType === "tip" ? Lightbulb : normalizedType === "warning" ? AlertTriangle : Info;
  const title = isCritical ? "تنبيه أمني" : normalizedType === "tip" ? "نصيحة" : normalizedType === "warning" ? "تحذير" : "ملاحظة";
  const tone = isCritical
    ? {
        shell: "border-red-200 bg-red-50 text-red-950 ring-red-500/20 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-100 dark:ring-red-500/20",
        icon: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-100 dark:ring-red-500/25",
        body: "text-red-900 dark:text-red-100",
      }
    : normalizedType === "tip"
      ? {
          shell: "border-emerald-200 bg-emerald-50 text-emerald-950 ring-emerald-500/20 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/20",
          icon: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-500/25",
          body: "text-emerald-900 dark:text-emerald-100",
        }
      : normalizedType === "warning"
        ? {
            shell: "border-amber-200 bg-amber-50 text-amber-950 ring-amber-500/20 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/20",
            icon: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/25",
            body: "text-amber-900 dark:text-amber-100",
          }
        : {
            shell: "border-sky-200 bg-sky-50 text-sky-950 ring-sky-500/20 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20",
            icon: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-500/25",
            body: "text-sky-900 dark:text-sky-100",
          };

  return (
    <div
      role="note"
      className={cn(
        "my-5 flex gap-3 rounded-2xl border p-4 ring-1",
        tone.shell,
      )}
    >
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1", tone.icon)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-6 text-current">{title}</div>
        <div className={cn("text-sm leading-7", tone.body)}>
          <MarkdownText
            content={content}
            className={cn(
              tone.body,
              "[&_p:first-child]:mt-1 [&_p:last-child]:mb-0 [&_*]:!text-inherit",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ScenarioSimulatorBlock({
  title,
  scenarioId,
}: {
  title: string;
  scenarioId: string;
}) {
  return (
    <div className="my-5 rounded-xl border border-primary/25 bg-primary/10 p-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {scenarioId && <div className="mt-1 text-xs text-muted-foreground">{scenarioId}</div>}
    </div>
  );
}

export function CourseMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const isRtl = isLikelyRtlMarkdown(content);
  const parts = splitCourseMarkdown(content);

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(
        "max-w-none text-foreground",
        isRtl ? "text-right" : "text-left",
        className,
      )}
    >
      {parts.map((part, index) => {
        if (part.type === "security-alert") {
          return <SecurityAlertBlock key={index} alertType={part.alertType} content={part.content} />;
        }
        if (part.type === "scenario-simulator") {
          return <ScenarioSimulatorBlock key={index} title={part.title} scenarioId={part.scenarioId} />;
        }
        if (part.type === "interactive-table") {
          return <InteractiveTableBlock key={index} columns={part.columns} data={part.data} />;
        }
        if (part.type === "interactive-quiz") {
          return <InteractiveQuizBlock key={index} question={part.question} options={part.options} correctAnswer={part.correctAnswer} explanation={part.explanation} />;
        }
        if (part.type === "generic-mdx") {
          return <GenericMdxBlock key={index} name={part.name} content={part.content} attributes={part.attributes} />;
        }
        return <MarkdownText key={index} content={part.content} />;
      })}
    </div>
  );
}
