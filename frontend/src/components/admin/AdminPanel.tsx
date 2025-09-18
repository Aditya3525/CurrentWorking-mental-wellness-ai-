import React from 'react';

import { AdminRouter, useAdminNavigation } from './AdminRouter';

export const AdminPanel: React.FC = () => {
  const { currentPage, navigateTo } = useAdminNavigation();

  return (
    <AdminRouter
      currentPage={currentPage}
      onNavigate={navigateTo}
    />
  );
};