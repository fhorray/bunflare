import { getCloudflareContext } from "../runtime/context";

export interface FlagOptions {
  identifier?: string;
  context?: Record<string, any>;
}

/**
 * Feature Flags Utility for Edge-evaluated variants.
 * Backed by KV for high-performance sub-millisecond evaluation.
 */
export const flags = {
  /**
   * Evaluates a feature flag for a specific user ID or context.
   * @param flagName Name of the flag to check.
   * @param userId Unique identifier for the user (for consistency).
   */
  async evaluate(flagName: string, userId: string = "anonymous"): Promise<boolean> {
    const { env } = getCloudflareContext();
    const kv = env.FLAGS_KV;

    if (!kv) {
      console.warn(`[bunflare] Feature flags require "FLAGS_KV" binding. Evaluation defaulting to false.`);
      return false;
    }

    try {
      // 1. Get cached flag configuration from KV
      const config = await kv.get("active_flags", { type: "json" }) as Record<string, any>;
      if (!config || !(flagName in config)) return false;

      const flag = config[flagName];

      // 2. Boolean evaluation
      if (typeof flag === "boolean") return flag;

      // 3. Percentage-based evaluation (0-100)
      if (typeof flag === "number") {
        const hash = await this._hash(userId + flagName);
        const bucket = hash % 100;
        return bucket < flag;
      }
    } catch (e) {
      console.error(`[bunflare] Feature flag evaluation error for "${flagName}":`, e);
    }

    return false;
  },

  /**
   * Simple deterministic hash for stable bucket allocation.
   */
  async _hash(str: string): Promise<number> {
    // Basic hash implementation (equivalent to a simpler crypto subtile if needed)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
};
