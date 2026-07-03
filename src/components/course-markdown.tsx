import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, ShieldAlert, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
        <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
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

  return (
    <Alert
      variant={isCritical ? "destructive" : "default"}
      className={cn(
        "my-5 border bg-card/80",
        isCritical && "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100",
        normalizedType === "tip" && "border-emerald-500/35 bg-emerald-500/10",
        normalizedType === "warning" && "border-amber-500/35 bg-amber-500/10",
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </AlertDescription>
    </Alert>
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
        "prose prose-zinc prose-sm max-w-none text-zinc-900 dark:prose-invert dark:text-zinc-100 prose-headings:text-zinc-950 prose-p:text-zinc-800 prose-li:text-zinc-800 prose-strong:text-zinc-950 dark:prose-headings:text-zinc-50 dark:prose-p:text-zinc-200 dark:prose-li:text-zinc-200 dark:prose-strong:text-zinc-50",
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
        return <ReactMarkdown key={index}>{part.content}</ReactMarkdown>;
      })}
    </div>
  );
}
