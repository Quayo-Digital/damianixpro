import React from 'react';

export const FallbackBlock = ({ text }: { text: string }) => (
  <div className="flex min-h-[200px] w-full items-center justify-center rounded bg-muted p-4 text-center text-muted-foreground">
    {text}
  </div>
);
