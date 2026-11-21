import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/data";
import { ProjectVisual } from "./ProjectVisual";
import { TiltCard } from "./TiltCard";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article id={project.id} className="scroll-mt-32">
      <TiltCard>
        <Link
          href={`/portfolio/#${project.id}`}
          className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/80 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          aria-label={`Explore ${project.title} work type`}
        >
          <div className="relative overflow-hidden border border-paper/10 bg-surface transition-colors duration-300 group-hover:border-brass/50">
            <div className="transition-transform duration-700 ease-editorial group-hover:scale-[1.05]">
              <ProjectVisual variant={project.variant} />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="pointer-events-none absolute left-4 top-4 border border-paper/20 bg-background/80 px-3 py-1.5 text-[11px] font-medium tracking-[0.04em] text-paper-pure/80 backdrop-blur">
              {project.category} / Work type
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 flex h-11 w-11 translate-y-1 items-center justify-center border border-brass/60 bg-background/85 text-brass opacity-0 backdrop-blur transition-all duration-300 ease-editorial group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              <ArrowUpRight size={19} strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 border-t border-paper/10 pt-5">
            <h3 className="font-title text-xl font-medium leading-snug text-paper-pure transition-colors duration-200 group-hover:text-brass group-focus-visible:text-brass sm:text-2xl">
              {project.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-paper-dim/75">{project.summary}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li key={tag} className="border border-paper/10 px-2.5 py-1 text-[11px] tracking-[0.04em] text-paper-faint/70">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </Link>
      </TiltCard>
    </article>
  );
}
