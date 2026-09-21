'use client';

import { useEffect } from 'react';

// Bootstrap's interactive bundle is deferred so it cannot delay the public
// landing page's first render. CSS remains available from the server layout.
export default function BootstrapClient() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return null;
}
