import React from 'react';

interface MainLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, children }) => {
  return (
    <div className="flex h-screen w-full bg-[#1a1a1a] text-[#dcddde] select-none">
      {sidebar}
      <main className="flex-1 flex flex-col bg-[#1e1e1e] relative">
        {children}
      </main>
    </div>
  );
};