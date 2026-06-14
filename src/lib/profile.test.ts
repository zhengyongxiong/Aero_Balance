import { describe, expect, it } from "vitest";
import { calculateEarProfile } from "./profile";
import { seedProfiles } from "./seed";

describe("calculateEarProfile", () => {
  it("produces bilateral asymmetry for User A", () => {
    const result = calculateEarProfile(seedProfiles[0].input);

    expect(result.leftRisk).toBeGreaterThan(result.rightRisk);
    expect(result.leftRisk).toBeGreaterThanOrEqual(60);
    expect(result.leftRadar).toHaveLength(5);
    expect(result.rightRadar).toHaveLength(5);
  });

  it("gives frequent adapted User B higher scores than User C", () => {
    const userB = calculateEarProfile(seedProfiles[1].input);
    const userC = calculateEarProfile(seedProfiles[2].input);

    expect(userB.toleranceScore).toBeGreaterThan(userC.toleranceScore);
    expect(userB.adaptationSpeed).toBeGreaterThan(userC.adaptationSpeed);
  });

  it("clamps invalid numeric inputs", () => {
    const result = calculateEarProfile({
      ...seedProfiles[0].input,
      age: 400,
      previousDiscomfort: 80,
      leftSensitivity: 20,
      equalizationAbility: -2,
    });

    expect(result.leftRisk).toBeGreaterThanOrEqual(0);
    expect(result.leftRisk).toBeLessThanOrEqual(100);
    expect(result.toleranceScore).toBeGreaterThanOrEqual(0);
    expect(result.toleranceScore).toBeLessThanOrEqual(100);
  });
});
