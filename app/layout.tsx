import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { CookieConsent } from "../components/cookie-consent";
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_META_TITLE,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "../lib/seo-constants";

export const metadata: Metadata = {
  title: {
    default: DEFAULT_META_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_META_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: DEFAULT_META_TITLE,
    description: DEFAULT_META_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/logo-full.jpg",
        width: 1024,
        height: 341,
        alt: `${SITE_NAME} — Everyday Tools. One Platform.`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_META_TITLE,
    description: DEFAULT_META_DESCRIPTION,
    images: ["/logo-full.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_META_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/tools?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  sameAs: [
    "https://twitter.com/toolmodeon",
    "https://github.com/toolmodeon",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense Verification Code */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9061183031295584"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if(typeof window==='undefined')return;
  // Intercept future setAttribute calls from extensions (Bitdefender etc.)
  var origSet=Element.prototype.setAttribute;
  function isBadAttr(n){return n==='bis_skin_checked'||n==='bis_register'||n==='bis_all_links_checked'||(typeof n==='string'&&(n.indexOf('__processed_')===0||n.indexOf('bis_')===0));}
  Element.prototype.setAttribute=function(n,v){if(isBadAttr(n))return;return origSet.apply(this,arguments);};
  // Strip any already-injected extension attributes from the DOM immediately
  function stripBadAttrs(root){
    var all=root.querySelectorAll('*');
    for(var i=0;i<all.length;i++){
      var el=all[i],attrs=Array.prototype.slice.call(el.attributes||[]);
      for(var j=0;j<attrs.length;j++){if(isBadAttr(attrs[j].name))el.removeAttribute(attrs[j].name);}
    }
  }
  if(document.body)stripBadAttrs(document);
  // Also watch for future mutations
  if(typeof MutationObserver!=='undefined'){
    var mo=new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m=muts[i];
        if(m.type==='attributes'&&isBadAttr(m.attributeName)){m.target.removeAttribute(m.attributeName);}
        else if(m.type==='childList'){for(var j=0;j<m.addedNodes.length;j++){if(m.addedNodes[j].nodeType===1)stripBadAttrs(m.addedNodes[j]);}}
      }
    });
    mo.observe(document.documentElement,{attributes:true,subtree:true,childList:true,attributeFilter:['bis_skin_checked','bis_register','bis_all_links_checked']});
  }
})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body suppressHydrationWarning>
        <SiteHeader />
        {children}
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
