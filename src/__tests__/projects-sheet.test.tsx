import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { Projects } from "@/components/sections/projects";
import { projects } from "@/content/projects";

/**
 * Guards on the project detail sheet's open/close behaviour.
 *
 * Scope note: jsdom cannot model the close *timing* — it never resolves the
 * sheet's exit at all, on this code or on the code before it, so "does the
 * sheet linger for 280ms after close" is not answerable here and is not
 * asserted below. What is asserted is the structure that timing depends on.
 */

beforeAll(() => {
  // jsdom has no matchMedia and `useCompact` needs one. `matches: false` puts
  // the component on the desktop path — the one that uses the shared-layout
  // morph, which is what these tests are about.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })
  });
});

const openSheet = () => {
  render(<Projects />);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(projects[0].title, "i") }));
};

describe("project detail sheet", () => {
  it("opens on tile click and stays open", () => {
    openSheet();
    // The sheet's zoom is measured in a layout effect and started from
    // animation controls; if that path throws or the open handler stops
    // passing the tile's box through, this is what notices.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the scrim out of the sheet's presence subtree", () => {
    openSheet();

    const layer = document.querySelector(".project-modal-layer");
    const scrim = document.querySelector(".project-modal-backdrop");
    expect(layer).not.toBeNull();
    expect(scrim).not.toBeNull();

    // While the scrim lived inside the layer it also lived inside the
    // sheet's AnimatePresence, and its exit fade held the dismissed sheet on
    // screen for the fade's whole duration. It has to stay a sibling.
    expect(layer!.contains(scrim!)).toBe(false);
    expect(screen.getByRole("dialog").closest(".project-modal-layer")).toBe(layer);
  });

  it("still closes on a scrim click now that the layer no longer covers it", () => {
    openSheet();
    // `.project-modal-layer` is `pointer-events: none` precisely so this
    // click reaches the scrim underneath it rather than being swallowed.
    fireEvent.click(document.querySelector(".project-modal-backdrop")!);

    // jsdom won't run the exits to completion, but the scrim starting its
    // own fade is observable proof the close handler received the click.
    const scrim = document.querySelector<HTMLElement>(".project-modal-backdrop");
    expect(scrim?.style.opacity).toBe("0");
  });
});
