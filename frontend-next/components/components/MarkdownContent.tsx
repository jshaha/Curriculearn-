import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

export const MarkdownContent = ({
  content,
  className
}: {
  content: string;
  className?: string;
}): JSX.Element => {
  return (
    <div className={cn("editorial-prose", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer" : undefined}>
              {children}
            </a>
          ),
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children }) => <code>{children}</code>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
