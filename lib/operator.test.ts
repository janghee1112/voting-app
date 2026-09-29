import { test } from "node:test";
import assert from "node:assert/strict";
import { isOperatorPassword } from "./operator.ts";

test("설정된 비밀번호와 같으면 운영자다", () => {
  assert.equal(isOperatorPassword("club-2026!", "club-2026!"), true);
});

test("틀리거나 길이가 다른 비밀번호는 거부한다", () => {
  assert.equal(isOperatorPassword("club-2026", "club-2026!"), false);
  assert.equal(isOperatorPassword("club-2026?", "club-2026!"), false);
  assert.equal(isOperatorPassword("", "club-2026!"), false);
});

test("서버에 비밀번호가 설정되지 않았으면 무엇을 넣어도 거부한다", () => {
  assert.equal(isOperatorPassword("", undefined), false);
  assert.equal(isOperatorPassword("", ""), false);
  assert.equal(isOperatorPassword("anything", undefined), false);
});

test("문자열이 아닌 입력은 거부한다", () => {
  assert.equal(isOperatorPassword(undefined, "club-2026!"), false);
  assert.equal(isOperatorPassword(1234, "1234"), false);
});
