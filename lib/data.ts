import {
  Activity,
  Blocks,
  Code2,
  Cpu,
  Gauge,
  Globe2,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  MonitorSmartphone,
  Palette,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { label: string; href: string };

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about/" },
  { label: "Services", href: "/services/" },
  { label: "Portfolio", href: "/portfolio/" },
  { label: "Contact", href: "/contact/" },
  { label: "Complain", href: "/complain/" },
];

export const websiteTypes: string[] = [
  "E-Commerce Website",
  "Business Website",
  "Corporate Website",
  "Portfolio Website",
  "Personal Website",
  "Blog Website",
  "Landing Page",
  "Restaurant Website",
  "Hospital Website",
  "School Website",
  "Hotel Website",
  "Travel Website",
  "Real Estate Website",
  "Car Rental Website",
  "Lawyer Website",
  "Doctor Website",
  "Educational Website",
  "News Website",
  "Agency Website",
  "Custom Website Development",
];

export const managementSystems: string[] = [
  "School Management System",
  "Hospital Management System",
  "Restaurant Management System",
  "Hotel Management System",
  "Car Rental Management System",
  "Hall Management System",
  "Inventory Management System",
  "Employee Management System",
  "Payroll Management System",
  "Student Management System",
  "Appointment Management System",
  "Booking Management System",
];

export const softwareSolutions: string[] = [
  "ERP Software",
  "CRM Software",
  "POS Software",
  "Billing Software",
  "Custom Business Software",
  "Admin Dashboards",
  "Customer Management Systems",
  "Booking & Reservation Systems",
  "Business Automation Solutions",
];

export const otherServices: string[] = [
  "E-Commerce Solutions",
  "Website Redesign",
  "Website Maintenance",
  "Website Optimization",
  "Custom Web Applications",
];

export const ecommerceSolutions: string[] = [
  "Complete Online Stores",
  "Product Management",
  "Shopping Cart Interfaces",
  "Product Catalogues",
  "Responsive Checkout UI",
  "Storefront Design",
  "E-Commerce Redesign",
];

export const maintenanceServices: string[] = [
  "Website Redesign",
  "Website Speed Optimization",
  "Responsive Design Fixes",
  "Website Security Updates",
  "CMS Updates & Management",
  "Content Updates",
  "Bug Fixes & Monitoring",
  "Performance Audits",
  "Technical SEO Optimization",
  "Backup & Recovery",
];

export type ServiceCategory = {
  id: string;
  number: string;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  items: string[];
  href: string;
};

export const serviceCategories: ServiceCategory[] = [
  {
    id: "website",
    number: "01",
    title: "Website Development",
    short: "Websites that earn attention",
    description:
      "Editorial, fast and built to convert. From a focused landing page to a multi-section corporate platform, every build starts with your audience and your goals.",
    icon: Globe2,
    items: websiteTypes,
    href: "/website-development/",
  },
  {
    id: "management",
    number: "02",
    title: "Management Systems",
    short: "Run operations with clarity",
    description:
      "Purpose-built internal systems that replace spreadsheets and scattered tools with one calm, reliable source of truth for your team.",
    icon: Settings2,
    items: managementSystems,
    href: "/software-development/",
  },
  {
    id: "software",
    number: "03",
    title: "Software Development",
    short: "Software shaped around you",
    description:
      "Custom business software, dashboards and automation that remove repetitive work and let your people focus on what matters.",
    icon: Code2,
    items: softwareSolutions,
    href: "/software-development/",
  },
  {
    id: "other",
    number: "04",
    title: "Other Services",
    short: "Improve, maintain, extend",
    description:
      "Storefronts, redesigns, care plans and custom web applications that keep your digital products useful long after launch.",
    icon: ShoppingBag,
    items: [...otherServices, ...ecommerceSolutions, ...maintenanceServices],
    href: "/services/",
  },
];

export type Project = {
  id: string;
  title: string;
  category: "Web" | "Software" | "E-Commerce" | "Automation";
  summary: string;
  tags: string[];
  variant: "browser" | "dashboard" | "store" | "mobile" | "code" | "analytics";
};

export const projects: Project[] = [
  {
    id: "business-website",
    title: "Business Website",
    category: "Web",
    summary:
      "A clear, credible company presence with considered typography, service structure and a direct path to enquiry.",
    tags: ["Art Direction", "Next.js", "CMS"],
    variant: "browser",
  },
  {
    id: "operations-dashboard",
    title: "Operations Dashboard",
    category: "Software",
    summary:
      "A role-based admin interface that brings live information, exceptions and reporting into a single working view.",
    tags: ["ERP", "Dashboard", "Automation"],
    variant: "dashboard",
  },
  {
    id: "online-store",
    title: "Online Store",
    category: "E-Commerce",
    summary:
      "A storefront built around product storytelling, simple catalogue management and a focused checkout experience.",
    tags: ["Storefront", "Checkout UI", "Design"],
    variant: "store",
  },
  {
    id: "booking-system",
    title: "Booking & Appointment System",
    category: "Automation",
    summary:
      "Scheduling, reminders and a calmer front-desk workflow designed around the way a service team actually works.",
    tags: ["Booking", "Scheduling", "CRM"],
    variant: "mobile",
  },
  {
    id: "analytics-interface",
    title: "Analytics Interface",
    category: "Software",
    summary:
      "Dense information made legible through a precise component system, considered charts and accessible colour roles.",
    tags: ["Product UI", "Data Viz", "Design System"],
    variant: "analytics",
  },
  {
    id: "editorial-platform",
    title: "Editorial Publishing Platform",
    category: "Web",
    summary:
      "A reading-first publication structure with a typographic system that holds together from phone to widescreen.",
    tags: ["Editorial", "CMS", "Performance"],
    variant: "code",
  },
];

export type Standard = { title: string; description: string; icon: LucideIcon };

export const standards: Standard[] = [
  {
    title: "Modern technology",
    description: "Current, well-supported tooling chosen for the problem rather than for novelty.",
    icon: Cpu,
  },
  {
    title: "Professional design",
    description: "Editorial compositions with clear hierarchy, deliberate space and restrained detail.",
    icon: Palette,
  },
  {
    title: "Responsive development",
    description: "Layouts composed for phone, tablet and widescreen from the very first sketch.",
    icon: Smartphone,
  },
  {
    title: "Performance optimisation",
    description: "Lean bundles, careful rendering and measured loading behaviour on every build.",
    icon: Gauge,
  },
  {
    title: "Business-focused solutions",
    description: "We begin with your objective and remove anything that does not serve it.",
    icon: Target,
  },
  {
    title: "Reliable support",
    description: "Clear handover, documentation and ongoing care that keeps your product healthy.",
    icon: LifeBuoy,
  },
];

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "What exactly does Kamora Tech do?",
    answer:
      "We design and build digital products: websites, online stores, management systems, custom business software and automation. Our work covers strategy, interface design, development, launch and ongoing care.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "A focused landing page can be delivered in one to two weeks. A multi-page business website usually takes three to six weeks, while larger systems are scoped in phases after discovery. We give you a realistic timeline before any work begins.",
  },
  {
    question: "Do you work with clients outside your local area?",
    answer:
      "Yes. We collaborate with teams worldwide through structured video check-ins, shared project boards and clear written updates. Time zones are never a barrier to a well-run project.",
  },
  {
    question: "Can you redesign an existing website or system?",
    answer:
      "Absolutely. We audit what you have, keep what works, and rebuild what is holding you back. Redesigns often include performance, accessibility and content structure improvements.",
  },
  {
    question: "Will I be able to manage the final product myself?",
    answer:
      "Yes. We build intuitive admin interfaces and provide documentation and a short handover session, so your team can update content, products and settings without relying on us.",
  },
  {
    question: "How do you handle pricing?",
    answer:
      "Every proposal is fixed-scope and tailored to the work involved. After a short discovery call we send a clear breakdown with deliverables, timeline and cost. No hidden fees.",
  },
  {
    question: "Do you provide support after launch?",
    answer:
      "We do. Our care plans cover updates, monitoring, backups, security patches and performance tuning, so your digital product stays healthy long after launch.",
  },
  {
    question: "What technologies do you build with?",
    answer:
      "Our core stack includes Next.js, React, TypeScript, Tailwind CSS, Three.js and Framer Motion. We choose tools based on the problem, always favouring maintainable, well-supported technology.",
  },
];

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    description: "We listen, ask the right questions and define what success looks like for your business.",
    detail: "Discovery call · goals · audience",
    icon: Layers3,
  },
  {
    number: "02",
    title: "Strategy",
    description: "Structure, content and technical direction come together in a clear, practical plan.",
    detail: "Sitemap · architecture · roadmap",
    icon: Target,
  },
  {
    number: "03",
    title: "Design",
    description: "We shape the visual language and the interaction details that make it feel coherent.",
    detail: "Art direction · interface · motion",
    icon: Palette,
  },
  {
    number: "04",
    title: "Development",
    description: "Design becomes working software through focused, reviewable iterations.",
    detail: "Frontend · backend · integrations",
    icon: Code2,
  },
  {
    number: "05",
    title: "Testing",
    description: "Every detail is checked across devices, browsers and accessibility needs.",
    detail: "QA · performance · accessibility",
    icon: ShieldCheck,
  },
  {
    number: "06",
    title: "Launch",
    description: "We ship carefully, hand over clearly and stay available for ongoing care.",
    detail: "Deployment · training · support",
    icon: RefreshCcw,
  },
];

export type Reason = { title: string; description: string; icon: LucideIcon };

export const whyUs: Reason[] = [
  { title: "Modern technology", description: "Current, maintainable tooling selected for the problem at hand.", icon: Cpu },
  { title: "Professional design", description: "Editorial compositions with a clear hierarchy and restrained detail.", icon: Palette },
  { title: "Responsive development", description: "Every layout is composed for phone, tablet and widescreen.", icon: MonitorSmartphone },
  { title: "Performance optimisation", description: "Speed is treated as a feature, from assets to rendering strategy.", icon: Gauge },
  { title: "Business-focused solutions", description: "We begin with the objective and remove anything that does not serve it.", icon: Target },
  { title: "Reliable support", description: "Clear handover, documentation and dependable ongoing care.", icon: LifeBuoy },
];

export const stats = [
  { value: "20", label: "Website types" },
  { value: "12", label: "Management systems" },
  { value: "09", label: "Software solutions" },
  { value: "04", label: "Core disciplines" },
];

export const techStack = [
  { name: "Next.js", note: "React framework" },
  { name: "TypeScript", note: "Type safety" },
  { name: "Tailwind CSS", note: "Design system" },
  { name: "React Three Fiber", note: "3D experiences" },
  { name: "Framer Motion", note: "Interface motion" },
  { name: "Node.js", note: "Runtime" },
];

export const engagementModels = [
  {
    title: "Project Build",
    description: "A clearly defined scope with fixed milestones. Ideal for a new website, store or system with a known outcome.",
    meta: "Fixed scope · milestone based",
  },
  {
    title: "Dedicated Partner",
    description: "Ongoing design and development capacity for teams with a continuous stream of digital work.",
    meta: "Monthly · flexible capacity",
  },
  {
    title: "Care & Optimisation",
    description: "Monitoring, updates, performance tuning and small improvements that keep an existing product at its best.",
    meta: "Ongoing · supportive",
  },
];

export const aboutValues = [
  {
    title: "Clarity over noise",
    description: "We strip away the unnecessary until the message, the interface and the next step are obvious.",
    icon: Activity,
  },
  {
    title: "Craft in every detail",
    description: "From the first sketch to the final interaction, we care about the parts most people never notice.",
    icon: Blocks,
  },
  {
    title: "Honest partnership",
    description: "Straight answers, realistic timelines and transparent progress. No theatre, no surprises.",
    icon: Workflow,
  },
];

export const disciplines = [
  { role: "Creative Direction", note: "Concept, art direction, identity" },
  { role: "Product Design", note: "Interface systems, prototypes, UX" },
  { role: "Engineering", note: "Frontend, backend, integrations" },
  { role: "3D & Motion", note: "WebGL scenes, interaction, choreography" },
  { role: "Quality & Performance", note: "Testing, accessibility, speed" },
  { role: "Project Leadership", note: "Planning, communication, delivery" },
];

export const contactEmail = "hello@kamoratech.com";
