import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/ui/project-card";
import { projects } from "@/content/projects";

export function Projects() {
  return (
    <section
      className="projects-section section-band"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-inner">
        <Reveal className="section-heading">
          <p className="eyebrow">Selected Projects</p>
          <h2 id="projects-title">Proof that the craft survives contact with real product work.</h2>
        </Reveal>

        <div className="project-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
