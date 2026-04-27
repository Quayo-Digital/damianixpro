import React from 'react';
import { Card } from '@/components/ui/card';
import { getDocPreviewContent } from '@/services/documentation/docContent';
import { Skeleton } from '@/components/ui/skeleton';

interface DocPreviewProps {
  role: string;
  guide: string;
  type: 'overview' | 'sections' | 'toc';
}

// Define types for different content structures
interface OverviewContent {
  title: string;
  description: string;
  topics: string[];
}

interface SectionsContent {
  sections: {
    title: string;
    description: string;
  }[];
}

interface TocContent {
  toc: {
    title: string;
    subItems: string[];
  }[];
}

export function DocPreview({ role, guide, type }: DocPreviewProps) {
  const content = getDocPreviewContent(role, guide, type);

  if (!content) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (type === 'overview') {
    // Type assertion to access overview content properties safely
    const overviewContent = content as OverviewContent;
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{overviewContent.title}</h3>
        <p className="text-muted-foreground">{overviewContent.description}</p>

        <div className="rounded-md border bg-muted/30 p-3">
          <h4 className="mb-2 font-medium">This guide covers:</h4>
          <ul className="list-disc space-y-1 pl-5">
            {overviewContent.topics.map((topic, index) => (
              <li key={index} className="text-sm">
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (type === 'sections') {
    // Type assertion to access sections content properties safely
    const sectionsContent = content as SectionsContent;
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Document Sections</h3>
        <div className="grid gap-3">
          {sectionsContent.sections.map((section, index) => (
            <Card key={index} className="p-3">
              <h4 className="font-medium">{section.title}</h4>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'toc') {
    // Type assertion to access toc content properties safely
    const tocContent = content as TocContent;
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Table of Contents</h3>
        <ol className="list-decimal space-y-2 pl-5">
          {tocContent.toc.map((item, index) => (
            <li key={index}>
              <span className="font-medium">{item.title}</span>
              {item.subItems && item.subItems.length > 0 && (
                <ol className="mt-1 list-[lower-alpha] space-y-1 pl-5">
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex} className="text-sm">
                      {subItem}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return null;
}
