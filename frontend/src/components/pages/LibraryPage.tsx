import React from 'react';

import UnifiedLibrary from '../features/library/UnifiedLibrary';

interface LibraryPageProps {
  onNavigate?: (route: string) => void;
}

const LibraryPage: React.FC<LibraryPageProps> = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <UnifiedLibrary />
    </div>
  );
};

export default LibraryPage;