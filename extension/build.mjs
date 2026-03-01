#!/usr/bin/env node
import * as esbuild from "esbuild";

await Promise.all([
  esbuild.build({
    entryPoints: ["injected.ts"],
    bundle: true,
    outfile: "injected.js",
    platform: "browser",
    format: "iife",
  }),
  esbuild.build({
    entryPoints: ["background.ts"],
    bundle: true,
    outfile: "background.js",
    platform: "browser",
    format: "esm",
  }),
]);

console.log("Extension build done: injected.js, background.js");
