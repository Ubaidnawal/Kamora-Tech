import {
  ecommerceSolutions,
  managementSystems,
  projects,
  serviceCategories,
  softwareSolutions,
} from "@/lib/data";

export type ProductVisualVariant =
  | "store"
  | "hospital"
  | "school"
  | "restaurant"
  | "business"
  | "portfolio"
  | "erp"
  | "crm"
  | "custom-web"
  | "custom-software";

export type Product = {
  slug: string;
  name: string;
  image: string;
  category: string;
  categoryHref: string;
  summary: string;
  description: string;
  features: string[];
  scope: string[];
  benefits: string[];
  tags: string[];
  visual: ProductVisualVariant;
};

const website = serviceCategories.find((category) => category.id === "website")!;
const management = serviceCategories.find((category) => category.id === "management")!;
const software = serviceCategories.find((category) => category.id === "software")!;
const other = serviceCategories.find((category) => category.id === "other")!;

const storeProject = projects.find((project) => project.id === "online-store")!;
const businessProject = projects.find((project) => project.id === "business-website")!;
const dashboardProject = projects.find((project) => project.id === "operations-dashboard")!;
const bookingProject = projects.find((project) => project.id === "booking-system")!;

export const products: Product[] = [
  {
    slug: "e-commerce-website",
    name: "E-Commerce Website",
    image: "/products/e-commerce-website.svg",
    category: "Website Development",
    categoryHref: website.href,
    summary: "A storefront built around product storytelling, simple catalogue management and a focused checkout experience.",
    description: `${website.description} ${storeProject.summary}`,
    features: ecommerceSolutions,
    scope: ["Storefront Design", "Product Catalogues", "Shopping Cart Interfaces", "Responsive Checkout UI"],
    benefits: ["Clear path from discovery to purchase", "Catalogue and product management", "Responsive layouts across devices"],
    tags: storeProject.tags,
    visual: "store",
  },
  {
    slug: "hospital-management-system",
    name: "Hospital Management System",
    image: "/products/hospital-management-system.svg",
    category: "Management Systems",
    categoryHref: management.href,
    summary: "A purpose-built internal system that replaces scattered tools with one calm working view.",
    description: management.description,
    features: [
      "Purpose-built internal systems",
      "One reliable source of truth for your team",
      "Designed around the way your team works",
    ],
    scope: ["Appointment Management System", "Employee Management System", "Inventory Management System"],
    benefits: ["Clearer daily operations", "Less reliance on spreadsheets", "Role-based working views"],
    tags: ["Management Systems", "Operations", "Internal Tools"],
    visual: "hospital",
  },
  {
    slug: "school-management-system",
    name: "School Management System",
    image: "/products/school-management-system.svg",
    category: "Management Systems",
    categoryHref: management.href,
    summary: "A structured system for student, staff and scheduling information in one place.",
    description: management.description,
    features: [
      "Purpose-built internal systems",
      "One reliable source of truth for your team",
      "Designed around the way your team works",
    ],
    scope: ["Student Management System", "Employee Management System", "Appointment Management System"],
    benefits: ["Clearer information structure", "Simpler internal coordination", "Room to extend as needs change"],
    tags: ["Management Systems", "Education", "Internal Tools"],
    visual: "school",
  },
  {
    slug: "restaurant-website",
    name: "Restaurant Website",
    image: "/products/restaurant-website.svg",
    category: "Website Development",
    categoryHref: website.href,
    summary: "A focused restaurant presence with clear information and a direct path to enquiry or booking.",
    description: website.description,
    features: [
      "Editorial, fast and built to convert",
      "Audience-first structure and content",
      "Responsive layouts from phone to widescreen",
    ],
    scope: ["Restaurant Website", "Restaurant Management System", "Booking & Reservation Systems"],
    benefits: ["Clearer first impression", "Easier customer enquiry", "Foundation for online ordering or booking"],
    tags: ["Restaurant", "Website", "Responsive"],
    visual: "restaurant",
  },
  {
    slug: "business-website",
    name: "Business Website",
    image: "/products/business-website.svg",
    category: "Website Development",
    categoryHref: website.href,
    summary: businessProject.summary,
    description: `${website.description} ${businessProject.summary}`,
    features: businessProject.tags,
    scope: ["Business Website", "Corporate Website", "Landing Page"],
    benefits: ["Credible company presence", "Clear service structure", "Direct path to enquiry"],
    tags: businessProject.tags,
    visual: "business",
  },
  {
    slug: "portfolio-website",
    name: "Portfolio Website",
    image: "/products/portfolio-website.svg",
    category: "Website Development",
    categoryHref: website.href,
    summary: "A curated, typographic home for selected work and professional identity.",
    description: website.description,
    features: [
      "Editorial compositions with clear hierarchy",
      "Deliberate space and restrained detail",
      "Responsive from the first sketch",
    ],
    scope: ["Portfolio Website", "Personal Website", "Editorial Publishing Platform"],
    benefits: ["Work presented with clarity", "Strong first impression", "Easy to extend over time"],
    tags: ["Portfolio", "Editorial", "Responsive"],
    visual: "portfolio",
  },
  {
    slug: "erp-software",
    name: "ERP Software",
    image: "/products/erp-software.svg",
    category: "Software Development",
    categoryHref: software.href,
    summary: dashboardProject.summary,
    description: `${software.description} ${dashboardProject.summary}`,
    features: dashboardProject.tags,
    scope: ["ERP Software", "Admin Dashboards", "Business Automation Solutions"],
    benefits: ["Connected operational views", "Clearer reporting", "Less repetitive work"],
    tags: dashboardProject.tags,
    visual: "erp",
  },
  {
    slug: "crm-software",
    name: "CRM Software",
    image: "/products/crm-software.svg",
    category: "Software Development",
    categoryHref: software.href,
    summary: bookingProject.summary,
    description: `${software.description} ${bookingProject.summary}`,
    features: bookingProject.tags,
    scope: ["CRM Software", "Customer Management Systems", "Booking & Reservation Systems"],
    benefits: ["Calmer customer workflows", "Clear scheduling and follow-up", "Information kept in one place"],
    tags: bookingProject.tags,
    visual: "crm",
  },
  {
    slug: "custom-website-development",
    name: "Custom Website Development",
    image: "/products/custom-website-development.svg",
    category: "Website Development",
    categoryHref: website.href,
    summary: "A website shaped around your audience, content and business objective rather than a fixed template.",
    description: `${website.description} ${other.description}`,
    features: serviceCategories[0].items.slice(0, 6),
    scope: ["Custom Website Development", "Custom Web Applications", "Website Redesign"],
    benefits: ["Built around your goal", "Scalable content structure", "Clear handover and ongoing care"],
    tags: ["Custom", "Website", "Strategy"],
    visual: "custom-web",
  },
  {
    slug: "custom-software-development",
    name: "Custom Software Development",
    image: "/products/custom-software-development.svg",
    category: "Software Development",
    categoryHref: software.href,
    summary: "Business software shaped around real workflows, dashboards and the work your team actually does.",
    description: `${software.description} Scope is defined during discovery and confirmed in a fixed-scope proposal.`,
    features: softwareSolutions.slice(0, 6),
    scope: ["Custom Business Software", "Admin Dashboards", "Business Automation Solutions"],
    benefits: ["Fit to real workflows", "Room for integrations", "Clear handover and support"],
    tags: ["Custom", "Software", "Automation"],
    visual: "custom-software",
  },
];

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const getRelatedProducts = (product: Product) =>
  products
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 3);

export const productInquiryHref = (product: Product) => {
  const subject = encodeURIComponent(`Enquiry — ${product.name}`);
  const body = encodeURIComponent(
    [
      `Hello Kamora Tech,`,
      "",
      `I would like to discuss ${product.name}.`,
      `Category: ${product.category}`,
      "",
      "A little about the project:",
      "",
    ].join("\n"),
  );
  return `mailto:hello@kamoratech.com?subject=${subject}&body=${body}`;
};

export const managementSystemNames = managementSystems;
export const websiteTypeNames = serviceCategories[0].items;
