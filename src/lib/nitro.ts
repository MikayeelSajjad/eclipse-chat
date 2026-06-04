export type NitroTier = "none" | "basic" | "plus";

export const NITRO_BASIC_PRICE_USD = 1.99;
export const NITRO_PLUS_PRICE_USD = 4.99;

export function getFriendLimit(tier: NitroTier): number {
  switch (tier) {
    case "basic":
      return 40;
    case "plus":
      return 60;
    default:
      return 20;
  }
}

export function canCreateGroups(tier: NitroTier): boolean {
  return tier === "basic" || tier === "plus";
}

export function tierFromPlan(plan: string | undefined): NitroTier {
  if (plan === "plus") return "plus";
  if (plan === "basic") return "basic";
  return "none";
}

export function nitroLabel(tier: NitroTier): string {
  switch (tier) {
    case "basic":
      return "Nitro Basic";
    case "plus":
      return "Nitro+";
    default:
      return "Free";
  }
}
