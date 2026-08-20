import { GithubIcon } from "@/components/ui/social-icons";
import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/ui/project-card";
import { Reveal } from "@/components/motion/reveal";

export function Projects() {
  return (
    <section
      className="section-band bg-[var(--surface)] border-t border-ink/15"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-inner flex flex-col gap-0 px-0 md:px-0">
        <div className="px-4 md:px-8 py-12 pb-12 flex justify-center text-center">
          <Reveal>
            <h2 className="text-ink" id="projects-title">Projects</h2>
          </Reveal>
        </div>
        {projects.map((project, index) => (
          <ProjectCard key={project.title} project={project} index={index} />
        ))}
        <div className="py-12 flex justify-center border-t border-ink/15">
          <Reveal>
            <a 
              href="https://github.com/girwandhakal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-lg font-medium text-ink/75 hover:text-ink transition-all bg-ink/5 hover:bg-ink/10 px-8 py-4 rounded-full"
            >
              <span>View more projects on GitHub</span>
              <GithubIcon aria-hidden="true" size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
