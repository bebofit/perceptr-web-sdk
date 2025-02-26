/**
 * @jest-environment jsdom
 */
import { Breadcrumbs } from "../Breadcrumbs";

describe("Breadcrumbs", () => {
  let breadcrumbs: Breadcrumbs;

  beforeEach(() => {
    breadcrumbs = new Breadcrumbs();
    jest.useFakeTimers();
  });

  afterEach(() => {
    breadcrumbs.disable();
    jest.useRealTimers();
  });

  test("debounces input events", () => {
    breadcrumbs.enable();

    const input = document.createElement("input");
    document.body.appendChild(input);

    // Trigger multiple input events
    for (let i = 0; i < 5; i++) {
      input.dispatchEvent(new Event("input"));
    }

    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);

    const events = breadcrumbs.getBreadcrumbs();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "input",
      category: "input",
    });

    document.body.removeChild(input);
  });

  test("captures navigation events", () => {
    breadcrumbs.enable();
    const url = "http://localhost/page";

    // Simulate pushState
    history.pushState({}, "", url);

    const events = breadcrumbs.getBreadcrumbs();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "navigation",
      data: { url: window.location.href },
    });
  });
});
