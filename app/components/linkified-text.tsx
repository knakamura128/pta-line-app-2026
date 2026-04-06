import Link from "next/link";
import type { ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export function LinkifiedText({
  text,
  className
}: {
  text: string | null | undefined;
  className?: string;
}) {
  const normalizedText = text ?? "";
  const lines = normalizedText.split(/\r?\n/);

  return (
    <span className={className}>
      {lines.map((line, lineIndex) => (
        <LineWithLinks key={`${line}-${lineIndex}`} line={line} showBreak={lineIndex < lines.length - 1} />
      ))}
    </span>
  );
}

function LineWithLinks({ line, showBreak }: { line: string; showBreak: boolean }) {
  const segments = line.split(URL_PATTERN);
  const content: ReactNode[] = [];

  segments.forEach((segment, index) => {
    if (!segment) {
      return;
    }

    if (URL_PATTERN.test(segment)) {
      content.push(
        <Link className="auto-link" href={segment} key={`${segment}-${index}`} rel="noreferrer" target="_blank">
          {segment}
        </Link>
      );
      URL_PATTERN.lastIndex = 0;
      return;
    }

    URL_PATTERN.lastIndex = 0;
    content.push(<span key={`${segment}-${index}`}>{segment}</span>);
  });

  return (
    <>
      {content}
      {showBreak ? <br /> : null}
    </>
  );
}
