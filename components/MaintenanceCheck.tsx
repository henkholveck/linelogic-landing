"use client";

import { useEffect } from 'react';

interface MaintenanceCheckProps {
  enabled?: boolean;
}

export default function MaintenanceCheck({ enabled = false }: MaintenanceCheckProps) {
  useEffect(() => {
    // Check for maintenance mode flag from environment or prop
    const isMaintenanceMode = enabled || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    
    if (isMaintenanceMode) {
      window.location.href = '/maintenance.html';
    }
  }, [enabled]);

  return null;
}

// Usage: Add to your root layout
// <MaintenanceCheck enabled={false} /> 
// When ready for maintenance, change to: <MaintenanceCheck enabled={true} />