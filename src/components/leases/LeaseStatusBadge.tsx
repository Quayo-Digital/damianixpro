import { Check, Clock, X } from 'lucide-react';

export const LeaseStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return (
        <div className="flex items-center">
          <Check className="mr-1 h-4 w-4 text-green-500" />
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-600">Active</span>
        </div>
      );
    case 'pending':
    case 'draft':
      return (
        <div className="flex items-center">
          <Clock className="mr-1 h-4 w-4 text-yellow-500" />
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-600">
            {status === 'pending' ? 'Pending' : 'Draft'}
          </span>
        </div>
      );
    case 'sent':
      return (
        <div className="flex items-center">
          <Clock className="mr-1 h-4 w-4 text-blue-500" />
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">Sent</span>
        </div>
      );
    case 'signed':
      return (
        <div className="flex items-center">
          <Check className="mr-1 h-4 w-4 text-green-500" />
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-600">Signed</span>
        </div>
      );
    case 'expired':
      return (
        <div className="flex items-center">
          <X className="mr-1 h-4 w-4 text-red-500" />
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">Expired</span>
        </div>
      );
    case 'approved':
      return (
        <div className="flex items-center">
          <Check className="mr-1 h-4 w-4 text-green-500" />
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-600">
            Approved
          </span>
        </div>
      );
    case 'rejected':
      return (
        <div className="flex items-center">
          <X className="mr-1 h-4 w-4 text-red-500" />
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">Rejected</span>
        </div>
      );
    case 'more_info':
      return (
        <div className="flex items-center">
          <Clock className="mr-1 h-4 w-4 text-amber-500" />
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-600">
            More Info
          </span>
        </div>
      );
    default:
      return <span>{status}</span>;
  }
};
