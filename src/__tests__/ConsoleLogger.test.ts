import { ConsoleLogger } from "../ConsoleLogger";

describe("ConsoleLogger", () => {
  let logger: ConsoleLogger;
  let originalConsole: typeof console;

  beforeEach(() => {
    originalConsole = { ...console };
    logger = new ConsoleLogger();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
    logger.disable();
  });

  test("captures console logs", () => {
    logger.enable();
    console.log("test message");

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      level: "log",
      args: ["test message"],
    });
  });

  test("respects ignore configuration", () => {
    logger = new ConsoleLogger({
      ignore: ["debug"],
    });
    logger.enable();

    console.debug("debug message");
    console.error("error message");

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe("error");
  });
});
