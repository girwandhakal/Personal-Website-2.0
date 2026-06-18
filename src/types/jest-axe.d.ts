declare module "jest-axe" {
  import type { MatcherFunction } from "expect";

  export function axe(container: Element | Document): Promise<unknown>;
  export const toHaveNoViolations: Record<string, MatcherFunction>;
}
