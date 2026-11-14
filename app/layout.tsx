import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { CookieConsent } from "../components/cookie-consent";

export const metadata: Metadata = {
  title: "ToolModeOn — Everyday Tools. One Platform.",
  description: "Fast, private online tools for PDFs, images, calculations, text and AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://toolmodeon.online"),
  alternates: { canonical: "/" },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "ToolModeOn",
    title: "ToolModeOn — Everyday Tools. One Platform.",
    description: "Fast online tools for PDFs, images, calculations, text and AI.",
    url: "/",
    images: [{ url: "/logo-full.jpg", width: 1024, height: 341, alt: "ToolModeOn — Everyday Tools. One Platform." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolModeOn — Everyday Tools. One Platform.",
    description: "Fast online tools for everyday work.",
    images: ["/logo-full.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
