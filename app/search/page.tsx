"use client";

import { ArrowUpRight, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { apiFetch } from "@/lib/api";
import type { ApiProduct } from "@/lib/commerce";
import { getProduct, products } from "@/lib/products";

type SearchResult = {
  id: string;
  title: string;
  kind: "Product" | "Page";
  description: string;
  href: string;
  meta: string;
};

type SearchEntry = SearchResult & { searchText: string };

type SitePage = {
  title: string;
  href: string;
  description: string;
  keywords: string;
};

const sitePages: SitePage[] = [
  {
    title: "Home",
    href: "/",
    description: "Overview of Kamora Tech websites, software and digital solutions.",
    keywords: "home landing studio agency",
  },
  {
    title: "About",
    href: "/about/",
    description: "Learn about the studio, our approach and the standard behind our work.",
    keywords: "about team studio approach",
  },
  {
    title: "Services",
    href: "/services/",
    description: "The full range of website, software and management system services.",
    keywords: "services offering capabilities",
  },
  {
    title: "Website Development",
    href: "/website-development/",
    description: "Custom websites, e-commerce stores and editorial web experiences.",
    keywords: "web design site frontend development",
  },
  {
    title: "Software Development",
    href: "/software-development/",
    description: "Custom business software, ERP, CRM and automation systems.",
    keywords: "software systems automation backend",
  },
  {
    title: "Portfolio",
    href: "/portfolio/",
    description: "Representative work types across web, dashboard and system projects.",
    keywords: "work projects case studies examples",
  },
  {
    title: "Contact",
    href: "/contact/",
    description: "Start a project enquiry or get in touch with the team.",
    keywords: "contact enquiry email message talk",
  },
  {
    title: "Complain",
    href: "/complain/",
    description: "Send a complaint or feedback about a project, order or service.",
    keywords: "complaint feedback issue support",
  },
  {
    title: "Orders",
    href: "/orders/",
    description: "Review your orders and enquiry history.",
    keywords: "orders purchases history account",
  },
  {
    title: "Track",
    href: "/track/",
    description: "Track the progress of an existing order.",
    keywords: "track tracking status delivery order",
  },
];

const searchEntries: SearchEntry[] = [
  ...products.map((product) => ({
    id: `product-${product.slug}`,
    title: product.name,
    kind: "Product" as const,
    description: product.summary,
    href: `/products/${product.slug}/`,
    meta: product.category,
    searchText: [
      product.name,
      product.summary,
      product.description,
      product.category,
      ...product.tags,
      ...product.features,
    ]
      .join(" ")
      .toLowerCase(),
  })),
  ...sitePages.map((page) => ({
    id: `page-${page.href}`,
    title: page.title,
    kind: "Page" as const,
    description: page.description,
    href: page.href,
    meta: "Site page",
    searchText: `${page.title} ${page.description} ${page.keywords} ${page.href}`.toLowerCase(),
  })),
];

function searchCatalog(query: string): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return searchEntries
    .map((entry) => {
      let score = 0;
      for (const term of terms) {
        if (!entry.searchText.includes(term)) return null;
        if (entry.title.toLowerCase().includes(term)) score += 3;
        if (entry.meta.toLowerCase().includes(term)) score += 2;
        score += 1;
      }
      return { entry, score };
    })
    .filter((match): match is { entry: SearchEntry; score: number } => match !== null)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => ({
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      description: entry.description,
      href: entry.href,
      meta: entry.meta,
    }));
}

function isApiProduct(value: unknown): value is ApiProduct {
  return typeof value === "object" && value !== null && typeof (value as ApiProduct).slug === "string";
}

function extractApiProducts(data: unknown): ApiProduct[] {
  if (Array.isArray(data)) return data.filter(isApiProduct);
  if (data && typeof data === "object") {
    const candidate = data as { items?: unknown; results?: unknown };
    const list = Array.isArray(candidate.items) ? candidate.items : candidate.results;
    if (Array.isArray(list)) return list.filter(isApiProduct);
  }
  return [];
}

function mapApiProducts(data: unknown): SearchResult[] {
  return extractApiProducts(data).flatMap((item) => {
    const product = getProduct(item.slug);
    if (!product) return [];
    return [
      {
        id: `live-${product.slug}`,
        title: item.name?.trim() || product.name,
        kind: "Product" as const,
        description: item.short_description?.trim() || item.description?.trim() || product.summary,
        href: `/products/${product.slug}/`,
        meta: item.category?.name?.trim() || product.category,
      },
    ];
  });
}

function SearchContentFallback() {
  return (
    <section className="bg-background py-16 md:py-20 lg:py-24">
      <div className="site-container">
        <p className="font-sans text-xs text-paper-dim">Preparing search...</p>
      </div>
    </section>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [inputValue, setInputValue] = useState(query);
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setApiResults([]);
      setApiLoading(false);
      setApiError("");
      return;
    }

    const controller = new AbortController();
    setApiResults([]);
    setApiLoading(true);
    setApiError("");

    apiFetch<unknown>(`/api/v1/products?search=${encodeURIComponent(query)}&page_size=20`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setApiResults(mapApiProducts(data));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setApiError("The live product catalog is unavailable right now. Site results are still shown.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setApiLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const localResults = useMemo(() => searchCatalog(query), [query]);
  const results = useMemo(() => {
    const merged = new Map<string, SearchResult>();
    for (const result of localResults) merged.set(result.href, result);
    for (const result of apiResults) merged.set(result.href, result);
    return Array.from(merged.values());
  }, [apiResults, localResults]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = inputValue.trim();
    router.push(next ? `/search/?q=${encodeURIComponent(next)}` : "/search/");
  };

  const productResults = results.filter((result) => result.kind === "Product");
  const pageResults = results.filter((result) => result.kind === "Page");

  return (
    <section className="bg-background py-16 md:py-20 lg:py-24">
      <div className="site-container">
        <form role="search" aria-label="Search products and pages" onSubmit={handleSubmit}>
          <label htmlFor="site-search" className="sr-only">Search products and pages</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brass" />
              <input
                id="site-search"
                name="q"
                type="search"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Search products, services and pages"
                autoComplete="off"
                className="min-h-14 w-full border border-white/15 bg-surface pl-12 pr-4 font-sans text-sm text-paper-pure placeholder:text-paper-faint focus:border-brass focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-primary !min-h-14 sm:min-w-36">Search</button>
          </div>
        </form>

        <div aria-live="polite" className="mt-6 space-y-3">
          {apiLoading && (
            <p className="inline-flex items-center gap-3 font-sans text-xs text-paper-dim">
              <LoaderCircle size={16} aria-hidden="true" className="animate-spin text-brass" />
              Checking the live product catalog...
            </p>
          )}
          {apiError && (
            <p className="border border-brass/40 bg-brass/[0.06] px-4 py-3 font-sans text-xs leading-relaxed text-paper-pure">
              {apiError}
            </p>
          )}
        </div>

        {!query && (
          <div className="content-card mt-10">
            <p className="eyebrow">Site search</p>
            <h2 className="card-title mt-4 text-paper-pure">Start with a keyword.</h2>
            <p className="body-copy mt-3">
              Search for a product such as ERP, CRM or e-commerce, or a page such as contact, portfolio or track. Results appear here after you search.
            </p>
          </div>
        )}

        {query && !results.length && !apiLoading && (
          <div className="content-card mt-10" role="status">
            <p className="eyebrow">No matches</p>
            <h2 className="card-title mt-4 text-paper-pure">Nothing found for “{query}”.</h2>
            <p className="body-copy mt-3">Try a shorter term, or explore the site directly.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/services/" className="btn-outline">Browse services</Link>
              <Link href="/portfolio/" className="btn-outline">View portfolio</Link>
            </div>
          </div>
        )}

        {query && results.length > 0 && (
          <>
            <div className="mt-12 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <p className="eyebrow">Search results</p>
                <h2 className="section-title mt-4 text-paper-pure">
                  {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
                </h2>
              </div>
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">
                {apiLoading ? "Checking live catalog" : apiError ? "Site catalog only" : "Site and live catalog"}
              </p>
            </div>

            {[
              { label: "Products", items: productResults, action: "View product" },
              { label: "Pages", items: pageResults, action: "Open page" },
            ].map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.label} className="mt-12">
                  <h3 className="font-title text-sm font-semibold uppercase tracking-[0.16em] text-brass">{group.label}</h3>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((result, index) => (
                      <Reveal key={result.href} delay={index * 0.04} className="h-full">
                        <Link
                          href={result.href}
                          className="group flex h-full flex-col border border-white/10 bg-surface p-6 transition-all duration-200 ease-editorial hover:-translate-y-0.5 hover:border-brass"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">{result.meta}</span>
                            <ArrowUpRight size={16} strokeWidth={1.4} aria-hidden="true" className="text-brass" />
                          </div>
                          <h4 className="card-title mt-5 text-paper-pure">{result.title}</h4>
                          <p className="mt-3 text-[13px] leading-relaxed text-paper-dim">{result.description}</p>
                          <span className="mt-auto pt-6 font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">{group.action}</span>
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                </div>
              ),
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <>
      <PageHero
        number="08"
        label="Site search"
        pageName="Search"
        lines={[
          { text: "Find what", className: "text-paper-pure" },
          { text: "you need.", className: "text-outline-brass" },
        ]}
        description="Search the site catalog and the live product catalog for products, services and pages."
        meta={[
          { value: String(sitePages.length).padStart(2, "0"), label: "Pages indexed" },
          { value: String(products.length).padStart(2, "0"), label: "Products indexed" },
          { value: "20", label: "Live results" },
          { value: "01", label: "Search" },
        ]}
      />
      <Suspense fallback={<SearchContentFallback />}>
        <SearchContent />
      </Suspense>
    </>
  );
}
