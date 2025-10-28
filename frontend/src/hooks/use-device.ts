import { useEffect, useState } from 'react';

/**
 * Breakpoint definitions matching the dashboard specifications
 */
export const BREAKPOINTS = {
  SMALL_PHONE: 576,
  LARGE_PHONE: 768,
  TABLET_PORTRAIT: 992,
  TABLET_LANDSCAPE: 1200,
  DESKTOP: 1200,
} as const;

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallPhone: boolean;
  isLargePhone: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
}

/**
 * Hook to detect device type and screen dimensions
 * Based on dashboard breakpoint specifications
 */
export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => 
    getDeviceInfo()
  );

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Based on dashboard specifications:
  // Small phones: <576px
  // Large phones: 576-767px
  // Tablet portrait: 768-991px
  // Tablet landscape: 992-1199px
  // Desktop: ≥1200px
  
  const isSmallPhone = width < BREAKPOINTS.SMALL_PHONE;
  const isLargePhone = width >= BREAKPOINTS.SMALL_PHONE && width < BREAKPOINTS.LARGE_PHONE;
  const isTabletPortrait = width >= BREAKPOINTS.LARGE_PHONE && width < BREAKPOINTS.TABLET_PORTRAIT;
  const isTabletLandscape = width >= BREAKPOINTS.TABLET_PORTRAIT && width < BREAKPOINTS.TABLET_LANDSCAPE;
  
  const isMobile = isSmallPhone || isLargePhone;
  const isTablet = isTabletPortrait || isTabletLandscape;
  const isDesktop = width >= BREAKPOINTS.DESKTOP;
  
  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallPhone,
    isLargePhone,
    isTabletPortrait,
    isTabletLandscape,
    isTouchDevice,
    orientation,
    width,
    height,
  };
}

/**
 * Individual hooks for simpler use cases
 */
export function useIsMobile(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useDevice();
  return isDesktop;
}

export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useDevice();
  return isTouchDevice;
}

export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const { isMobile, isTablet } = useDevice();
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}
