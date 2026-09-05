import { Database, FileText, MessageSquare, ScanLine, Network, AudioLines } from "lucide-react";

/** Abstract project illustrations, not product screenshots or measured data. */
export function ProjectArt({ kind }: { kind: string }) {
  if (kind === "ai-persona-chatbot") {
    return <span className="project-art art-persona" aria-hidden="true">
      <span className="art-rail"><MessageSquare /><span /><span /><span /></span>
      <span className="art-persona-body"><span className="art-node-row"><FileText /><i /><Database /><i /><MessageSquare /></span><span className="art-message"><b /><b /></span><span className="art-message art-message-reply"><b /><b /><b /></span></span>
    </span>;
  }
  if (kind === "clearpath") {
    return <span className="project-art art-clearpath" aria-hidden="true">
      <span className="art-document"><FileText /><span /><span /><span /><span /><strong /></span>
      <span className="art-document art-document-front"><ScanLine /><span /><span /><span /><span /><strong /></span>
      <span className="art-match"><span /><span /><span /></span>
    </span>;
  }
  if (kind.includes("speech") || kind.includes("language")) {
    return <span className="project-art art-speech" aria-hidden="true"><AudioLines className="art-speech-icon" /><span className="art-wave">{Array.from({ length: 53 }, (_, i) => <i key={i} style={{ height: `${(12 + Math.abs(Math.sin(i * 1.9) * Math.cos(i * .23)) * 76).toFixed(4)}%`, "--bar": String(i) } as React.CSSProperties} />)}</span><span className="art-wave-line" /></span>;
  }
  return <span className="project-art art-network" aria-hidden="true"><Network className="network-core" />{Array.from({ length: 8 }, (_, i) => <span className="network-spoke" key={i} style={{ "--angle": `${i * 45}deg`, "--index": String(i) } as React.CSSProperties}><i /></span>)}</span>;
}
