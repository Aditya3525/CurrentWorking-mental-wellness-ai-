import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  className?: string;
  enableTypewriter?: boolean;
  typewriterSpeed?: number;
  onTypewriterComplete?: () => void;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '', 
  enableTypewriter = false,
  typewriterSpeed = 30,
  onTypewriterComplete 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (!enableTypewriter) {
      setDisplayedContent(content);
      setIsTypingComplete(true);
      return;
    }

    // Reset when content changes
    setDisplayedContent('');
    setCurrentIndex(0);
    setIsTypingComplete(false);
  }, [content, enableTypewriter]);

  useEffect(() => {
    if (!enableTypewriter || isTypingComplete) return;

    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typewriterSpeed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === content.length && !isTypingComplete) {
      setIsTypingComplete(true);
      if (onTypewriterComplete) {
        onTypewriterComplete();
      }
    }
  }, [currentIndex, content, typewriterSpeed, enableTypewriter, isTypingComplete, onTypewriterComplete]);

  const contentToDisplay = enableTypewriter ? displayedContent : content;

  return (
    <div className={`markdown-content text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks with syntax highlighting
          code({ inline, className, children, ...props }: CodeProps & { [key: string]: unknown }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-2 text-xs"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code 
                className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
        
        // Paragraphs with proper spacing
        p: ({ children }) => (
          <p className="mb-3 last:mb-0">
            {children}
          </p>
        ),
        
        // Unordered lists
        ul: ({ children }) => (
          <ul className="list-disc pl-5 my-2 space-y-1">
            {children}
          </ul>
        ),
        
        // Ordered lists
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 my-2 space-y-1">
            {children}
          </ol>
        ),
        
        // List items
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">
            {children}
          </li>
        ),
        
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0">
            {children}
          </h3>
        ),
        
        // Links
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {children}
          </a>
        ),
        
        // Strong (bold)
        strong: ({ children }) => (
          <strong className="font-semibold">
            {children}
          </strong>
        ),
        
        // Emphasis (italic)
        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-2 italic text-gray-700 dark:text-gray-300">
            {children}
          </blockquote>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="my-4 border-gray-300 dark:border-gray-600" />
        ),
        
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-gray-300 dark:border-gray-600">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
            {children}
          </td>
        ),
      }}
    >
      {contentToDisplay}
    </ReactMarkdown>
    {enableTypewriter && !isTypingComplete && (
      <span className="inline-block w-1 h-4 ml-0.5 bg-current animate-pulse" />
    )}
    </div>
  );
};

export default MarkdownMessage;
