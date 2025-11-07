
import { Check, Clock, X } from "lucide-react";

export const LeaseStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Active</span>
          </div>
        );
      case 'pending':
      case 'draft':
        return (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1 text-yellow-500" />
            <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs">
              {status === 'pending' ? 'Pending' : 'Draft'}
            </span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1 text-blue-500" />
            <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs">Sent</span>
          </div>
        );
      case 'signed':
        return (
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Signed</span>
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center">
            <X className="w-4 h-4 mr-1 text-red-500" />
            <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">Expired</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Approved</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center">
            <X className="w-4 h-4 mr-1 text-red-500" />
            <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">Rejected</span>
          </div>
        );
      case 'more_info':
        return (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1 text-amber-500" />
            <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-xs">More Info</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
};
