export type MockRender<View> = (view: View) => void;

export function createMockRender<View>(): MockRender<View> {
  return jest.fn(() => "");
}
