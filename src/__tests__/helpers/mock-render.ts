import { vi } from "vitest";

export type MockRender<View> = (view: View) => void;

export function createMockRender<View>(): MockRender<View> {
  return vi.fn(() => "");
}
