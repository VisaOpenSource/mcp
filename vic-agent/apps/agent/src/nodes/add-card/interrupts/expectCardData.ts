import { interrupt } from "@langchain/langgraph";
import { GraphState } from "../../../utils/state.js";

/**
 * Card data check node that conditionally pauses execution.
 *
 * This node:
 * 1. Checks if card data is present in state
 * 2. If missing: calls interrupt() to pause and wait for user to add card
 * 3. If complete: returns empty state and allows graph to continue
 *
 * @param state - Current graph state with card data
 * @returns Empty state object (no changes needed)
 */
export async function expectCardData(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // If card data is missing (neither raw nor encrypted), interrupt
  if (!state.private_cardData && !state.private_encryptedCardData) {
    interrupt("awaiting_card_data");
  }
  console.log("received card data");
  // Card data exists, return empty (no state changes)
  return {};
}
