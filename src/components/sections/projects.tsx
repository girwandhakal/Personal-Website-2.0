import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/ui/project-card";
import { Reveal } from "@/components/motion/reveal";

export function Projects() {
  return (
    <section
      className="section-band bg-[var(--black)]"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-inner flex flex-col gap-0 border-t border-[var(--grey)]/20 px-0 md:px-0">
        <div className="px-4 md:px-8 py-12 pb-12 flex justify-center text-center">
          <Reveal>
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[var(--white)]" id="projects-title">Projects</h2>
          </Reveal>
        </div>
        {projects.map((project, index) => (
          <ProjectCard key={project.title} project={project} index={index} />
        ))}
        <div className="py-12 flex justify-center border-t border-[var(--grey)]/20">
          <Reveal>
            <a 
              href="https://github.com/girwandhakal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-lg font-medium text-[var(--white)]/70 hover:text-[var(--white)] transition-all bg-white/5 hover:bg-white/10 px-8 py-4 rounded-full"
            >
              <span>View more projects on GitHub</span>
              <img aria-hidden="true" src="/assets/icons/github.svg" alt="" width="20" height="20" className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
