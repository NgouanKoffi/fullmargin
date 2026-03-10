import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export default function SEO({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonical,
}: SEOProps) {
  const siteName = "FullMargin";
  const defaultDescription = "L'écosystème ultime pour les traders d'élite. Journaling intelligent, analyse prédictive et communauté exclusive.";
  const defaultKeywords = "trading, journal de trading, crypto, forex, analyse technique, fullmargin, fullmetrix";

  useEffect(() => {
    // 1. Update Title
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    document.title = fullTitle;

    // 2. Update Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description || defaultDescription);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description || defaultDescription;
      document.head.appendChild(meta);
    }

    // 3. Update Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", keywords || defaultKeywords);
    } else {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      meta.content = keywords || defaultKeywords;
      document.head.appendChild(meta);
    }

    // 4. OpenGraph Tags
    const ogTags = [
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description || defaultDescription },
      { property: "og:type", content: ogType },
      { property: "og:site_name", content: siteName },
    ];

    if (ogImage) {
      ogTags.push({ property: "og:image", content: ogImage });
    }

    ogTags.forEach((tag) => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", tag.content);
    });

    // 5. Canonical Link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    // Twitter Card optimization (fallback to OG)
    const twitterTags = [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description || defaultDescription },
    ];
    if (ogImage) twitterTags.push({ name: "twitter:image", content: ogImage });

    twitterTags.forEach((tag) => {
      let el = document.querySelector(`meta[name="${tag.name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", tag.name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", tag.content);
    });

  }, [title, description, keywords, ogImage, ogType, canonical]);

  return null; // This component doesn't render anything
}
