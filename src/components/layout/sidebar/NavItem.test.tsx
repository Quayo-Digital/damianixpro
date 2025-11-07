
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { Home } from 'lucide-react';

import { NavItem } from './NavItem';
import type { NavItem as NavItemType } from './nav-config';

describe('NavItem component', () => {
  const mockItem: NavItemType = {
    title: 'Dashboard',
    href: '/dashboard',
    icon: React.createElement(Home, { className: 'h-4 w-4' }),
    isVisible: true,
  };

  it('renders the nav item title', () => {
    render(
      <MemoryRouter>
        <NavItem item={mockItem} isCollapsed={false} />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders as a link with the correct href', () => {
    render(
      <MemoryRouter>
        <NavItem item={mockItem} isCollapsed={false} />
      </MemoryRouter>
    );
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/dashboard');
  });

  it('does not render children when collapsed', () => {
    const itemWithChildren: NavItemType = {
      ...mockItem,
      children: [
        { title: 'Sub Item', href: '/dashboard/sub', icon: <div />, isVisible: true },
      ],
    };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <NavItem item={itemWithChildren} isCollapsed={true} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Sub Item')).not.toBeInTheDocument();
  });

  it('renders children when not collapsed and active', () => {
    const itemWithChildren: NavItemType = {
      ...mockItem,
      href: '/dashboard',
      children: [
        { title: 'Sub Item', href: '/dashboard/sub', icon: <div />, isVisible: true },
      ],
    };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <NavItem item={itemWithChildren} isCollapsed={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Sub Item')).toBeInTheDocument();
  });
});
