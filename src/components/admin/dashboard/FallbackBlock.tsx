
import React from 'react';

export const FallbackBlock = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center p-4 rounded w-full text-center bg-muted text-muted-foreground min-h-[200px]">
    {text}
  </div>
);
