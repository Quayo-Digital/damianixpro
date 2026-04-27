import { DollarSign, Wallet, Calendar } from 'lucide-react';
import { StatCard } from './StatCard';

interface StatsGridProps {
  totalReceived: number;
  platformFees: number;
  agentCommissions: number;
}

export const StatsGrid = ({ totalReceived, platformFees, agentCommissions }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        title="Total Received"
        value={`₦${totalReceived.toLocaleString()}`}
        Icon={DollarSign}
      />
      <StatCard title="Platform Fees" value={`₦${platformFees.toLocaleString()}`} Icon={Wallet} />
      <StatCard
        title="Agent Commissions"
        value={`₦${agentCommissions.toLocaleString()}`}
        Icon={Calendar}
      />
    </div>
  );
};
