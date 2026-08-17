'use client';

import Link from 'next/link';

export function CitizenPortalButton() {
  return (
    <Link 
      href="/citizen/login"
      className="inline-flex items-center justify-center rounded-md px-6 sm:px-8 py-3 text-base sm:text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full sm:w-auto"
    >
      Citizen Portal
    </Link>
  );
}
