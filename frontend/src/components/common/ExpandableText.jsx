import { useState } from 'react';

const ExpandableText = ({ text, limit = 140, className = '' }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const needsTruncate = text.length > limit;

  let preview = text.slice(0, limit);
  const lastSpace = preview.lastIndexOf(' ');
  if (lastSpace > 40) preview = preview.slice(0, lastSpace);
  preview = preview.trimEnd() + '…';

  return (
    <div className={`max-w-full ${className}`}>
      <p
        className={`whitespace-pre-line break-words text-ios-secondary text-[13px] mt-0.5 ${
          expanded ? 'max-h-[150px] overflow-y-auto pr-1 overscroll-contain' : 'line-clamp-3'
        }`}
      >
        {expanded || !needsTruncate ? text : preview}
      </p>
      {needsTruncate && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[13px] font-semibold text-ios-tint hover:text-ios-tint/80 active:opacity-60 transition-all"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;