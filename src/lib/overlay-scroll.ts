/**
 * The project detail sheet and the AI chat panel each lock background scroll
 * while open by swallowing wheel/touchmove events outside their own scrollable
 * area — and either can be open on top of the other (the sheet's "try it here"
 * link opens the chat without closing the sheet). Without a shared notion of
 * "an overlay's own scroll region," each one's lock would swallow scroll
 * events meant for the other. This is that shared notion.
 */
const OVERLAY_SCROLL_SELECTOR = ".chat-panel, .project-modal-scroll";

export function isInsideOverlayScrollRegion(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  return !!el?.closest(OVERLAY_SCROLL_SELECTOR);
}
