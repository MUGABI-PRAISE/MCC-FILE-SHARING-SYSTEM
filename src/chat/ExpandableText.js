// src/components/ExpandableText.js
import React, { useState } from 'react';

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return null;
  if (text.length <= 300) return <span>{text}</span>;
  
  return (
    <span>
      {expanded ? text : text.slice(0, 300) + '... '}
      <button className="read-more" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </span>
  );
}

export default ExpandableText;