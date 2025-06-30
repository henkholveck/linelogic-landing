"use client";

import { useEffect } from 'react';

interface MaintenanceCheckProps {
  enabled?: boolean;
}

export default function MaintenanceCheck({ enabled = false }: MaintenanceCheckProps) {
  useEffect(() => {
    // Check for maintenance mode flag from environment or prop
    const isMaintenanceMode = enabled || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    
    console.log('🚧 MaintenanceCheck:', { enabled, isMaintenanceMode });
    
    if (isMaintenanceMode) {
      console.log('🚧 Redirecting to maintenance page...');
      window.location.href = '/maintenance.html';
    }
  }, [enabled]);

  // If maintenance mode is enabled, show nothing while redirecting
  if (enabled) {
    return <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 9999 }}>Redirecting...</div>;
  }

  return null;
}

// Usage: Add to your root layout
// <MaintenanceCheck enabled={false} /> 
// When ready for maintenance, change to: <MaintenanceCheck enabled={true} />