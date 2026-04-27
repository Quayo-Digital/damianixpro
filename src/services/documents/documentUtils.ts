import { Document } from './documentTypes';
import { FileText, Receipt, IdCard, List } from 'lucide-react';

/**
 * Formats a file size in bytes to a human-readable string
 */
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};

/**
 * Groups documents by their category
 */
export const groupDocumentsByCategory = (documents: Document[]): Record<string, Document[]> => {
  const grouped: Record<string, Document[]> = {};

  documents.forEach((doc) => {
    const category = doc.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(doc);
  });

  return grouped;
};

/**
 * Filters documents by document type
 */
export const filterDocumentsByType = (documents: Document[], types: string[]): Document[] => {
  if (!types.length) return documents;

  return documents.filter((doc) =>
    types.some((type) => doc.category?.toLowerCase().includes(type.toLowerCase()))
  );
};

/**
 * Gets the appropriate icon for document types
 */
export const getDocumentTypeIcon = (docType: string): string => {
  const type = docType.toLowerCase();

  if (type.includes('lease') || type.includes('contract')) {
    return 'file-text';
  } else if (type.includes('receipt') || type.includes('payment')) {
    return 'receipt';
  } else if (type.includes('identity') || type.includes('verification')) {
    return 'id-card';
  } else if (type.includes('maintenance') || type.includes('log')) {
    return 'list';
  } else {
    return 'file';
  }
};

/**
 * Gets appropriate badge color for document types
 */
export const getDocumentTypeBadgeColor = (docType?: string): string => {
  if (!docType) return 'bg-gray-200 text-gray-700';

  const type = docType.toLowerCase();

  if (type.includes('lease') || type.includes('contract')) {
    return 'bg-blue-100 text-blue-800';
  } else if (type.includes('receipt') || type.includes('payment')) {
    return 'bg-green-100 text-green-800';
  } else if (type.includes('identity') || type.includes('verification')) {
    return 'bg-purple-100 text-purple-800';
  } else if (type.includes('maintenance') || type.includes('log') || type.includes('inspection')) {
    return 'bg-amber-100 text-amber-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Gets document icon component based on type
 */
export const getDocumentIcon = (
  docType?: 'lease' | 'receipt' | 'identity' | 'maintenance' | string
) => {
  if (!docType) return FileText;

  const type = typeof docType === 'string' ? docType.toLowerCase() : docType;

  switch (type) {
    case 'receipt':
      return Receipt;
    case 'identity':
      return IdCard;
    case 'maintenance':
      return List;
    case 'lease':
    default:
      return FileText;
  }
};
