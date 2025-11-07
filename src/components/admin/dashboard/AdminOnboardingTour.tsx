
import React from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface AdminOnboardingTourProps {
  run: boolean;
  onTourEnd: () => void;
}

export const AdminOnboardingTour: React.FC<AdminOnboardingTourProps> = ({ run, onTourEnd }) => {
  const steps: Step[] = [
    {
      target: '.platform-monitoring-center',
      content: 'Access comprehensive platform monitoring, security audits, performance optimization, CDN deployment, and intelligent analytics all in one centralized location.',
      title: 'Platform Monitoring & Security Center',
      placement: 'bottom'
    },
    {
      target: '#tour-step-1',
      content: 'Welcome to your dashboard! Here are your key platform statistics at a glance, with trends from the last 30 days.',
      placement: 'bottom',
      title: 'Platform Stats',
    },
    {
      target: '#tour-step-2',
      content: 'This chart shows how your users are distributed across different roles.',
      placement: 'right',
      title: 'User Distribution',
    },
    {
      target: '#tour-step-3',
      content: "Track your platform's revenue over the last 6 months here.",
      placement: 'left',
      title: 'Platform Revenue',
    },
    {
      target: '#tour-step-4',
      content: 'Quickly manage user registrations and role assignments from this card.',
      placement: 'right',
      title: 'User Management',
    },
    {
      target: '#tour-step-5',
      content: 'And here you can view and manage all support tickets, including technical issues, billing inquiries, and feature requests.',
      placement: 'left',
      title: 'Support Tickets',
    },
    {
      target: '#tour-step-6',
      content: 'This is your comprehensive Platform Monitoring & Security Center! Monitor real-time platform health, run security audits, handle performance emergencies, optimize images/CDN, and track live user metrics across Nigerian networks. All monitoring and testing capabilities are now integrated directly into your admin dashboard.',
      placement: 'top',
      title: 'Platform Monitoring & Security Center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onTourEnd();
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#8884d8',
        },
        tooltip: {
          borderRadius: '0.5rem',
        },
        buttonNext: {
          borderRadius: '0.25rem',
        },
        buttonBack: {
          marginRight: 'auto'
        }
      }}
    />
  );
};
