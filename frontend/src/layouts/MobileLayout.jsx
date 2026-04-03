import React from 'react';
import BottomNavigation from './BottomNavigation';

const MobileLayout = ({ children, hideNav = false }) => {
  return (
    <div className="flex flex-col h-full">
      <main
        className={`flex-1 overflow-y-auto scrollable-content ${hideNav ? '' : 'pb-20'}`}
        style={{ overscrollBehavior: 'contain' }}
      >
        {children}
      </main>
      {!hideNav && <BottomNavigation />}
    </div>
  );
};

export default MobileLayout;
