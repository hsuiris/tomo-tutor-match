// 身份模式解析自檢：npx tsx src/lib/mode.test.ts
import assert from "node:assert";
import { parseMode } from "./mode";

assert.equal(parseMode("teacher"), "teacher");
assert.equal(parseMode("parent"), "parent");
assert.equal(parseMode(undefined), "parent"); // 沒 cookie → 預設家長
assert.equal(parseMode(null), "parent");
assert.equal(parseMode("garbage"), "parent"); // 亂值 → 安全回家長

console.log("mode.test.ts ✓");
