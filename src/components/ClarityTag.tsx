'use client';

import Script from 'next/script';

const CLARITY_PROJECT_ID = 'z959gr6k9f';

// Clarity records the page address and screen, so it runs on the public marketing pages only.
// Couple (/admin/…) and guest (/g/…) links are private tokens and must never reach it.
export const isMarketingPage = (path: string) => path === '/' || path === '/templates' || path.startsWith('/templates/');

/** Rendered by CookieConsent once the visitor has accepted analytics cookies. */
export default function ClarityTag() {
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });`}
    </Script>
  );
}
