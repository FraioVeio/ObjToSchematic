import { AABB } from "../src/aabb";
import { Vector3 } from "../src/vector";

test('basic', () => {
  const centre = new Vector3(1, 2, 3);
  const size = new Vector3(6, 4, 7);
  const aabb = new AABB(centre, size);

  const expectedA = new Vector3(-2, 0, -0.5);
  const expectedB = new Vector3(4, 4, 6.5);

  expect(aabb.a.equals(expectedA)).toBe(true);
  expect(aabb.b.equals(expectedB)).toBe(true);
});