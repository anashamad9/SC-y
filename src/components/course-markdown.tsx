import ReactMarkdown from "react-markdown";
import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type CourseMarkdownPart =
  | { type: "markdown"; content: string }
  | { type: "security-alert"; alertType: string; content: string }
  | { type: "scenario-simulator"; title: string; scenarioId: string };

const CUSTOM_MDX_TAG_RE =
  /<SecurityAlert\b([^>]*)>([\s\S]*?)<\/SecurityAlert>|<ScenarioSimulator\b([^>]*)\/>/gi;

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

function parseAttributes(input = "") {
  const attributes: Record<string, string> = {};
  input.replace(/([A-Za-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, (_, key, doubleQuoted, singleQuoted) => {
    attributes[key] = doubleQuoted ?? singleQuoted ?? "";
    return "";
  });
  return attributes;
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
    const index = match.index ?? 0;
    const markdownBefore = cleanContent.slice(lastIndex, index);
    if (markdownBefore.trim()) parts.push({ type: "markdown", content: markdownBefore });

    if (match[0].startsWith("<SecurityAlert")) {
      const attributes = parseAttributes(match[1]);
      parts.push({
        type: "security-alert",
        alertType: attributes.type || "info",
        content: match[2].trim(),
      });
    } else {
      const attributes = parseAttributes(match[3]);
      parts.push({
        type: "scenario-simulator",
        scenarioId: attributes.scenarioId || attributes.scenarioid || "",
        title: attributes.title || "Scenario",
      });
    }

    lastIndex = index + match[0].length;
  }

  const markdownAfter = cleanContent.slice(lastIndex);
  if (markdownAfter.trim()) parts.push({ type: "markdown", content: markdownAfter });
  return parts;
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
        return <ReactMarkdown key={index}>{part.content}</ReactMarkdown>;
      })}
    </div>
  );
}
