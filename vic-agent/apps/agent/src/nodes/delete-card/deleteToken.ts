import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { GraphState } from "../../utils/state.js";
import type { ExecutionContext } from "../../utils/execution-context/index.js";

/**
 * Delete token node that calls delete-token MCP tool.
 *
 * On success: Increments cardDeletionSignal counter to trigger UI localStorage clearing.
 * Flow continues to SIGNAL_UI_CARD_DELETED (checkpoint) then CLEAR_DELETE_CARD_ACTION.
 * On error: Keeps all data intact, shows error, action will be cleared by next node
 *
 * @param state - Current graph state
 * @param config - RunnableConfig containing tool registry
 * @returns Partial state update with cardDeletionSignal incremented or error message
 */
export async function deleteToken(
  state: typeof GraphState.State,
  config: RunnableConfig
): Promise<Partial<typeof GraphState.State>> {
  // Idempotency guard: skip if deletion already performed in this flow
  if (state.private_tokenDeleted === true) {
    console.log(
      "DELETE_TOKEN: Token already deleted (private_tokenDeleted is true), skipping"
    );
    return {};
  }
  const context = config.configurable?.executionContext as ExecutionContext;

  if (!context) {
    console.error("ExecutionContext not found in config.configurable");
    return {
      messages: [
        new AIMessage(
          "We encountered a configuration issue. Please try again later."
        ),
      ],
    };
  }

  if (!state.private_tokenId) {
    console.error("No token ID found in state, cannot delete");
    return {
      messages: [
        new AIMessage("No card found to delete. Please add a card first."),
      ],
    };
  }

  try {
    // Ownership/existence check before deletion: confirm the token is known and
    // resolvable for this wallet via get-token-status. This prevents deleting an
    // arbitrary token id that was not provisioned through this application.
    // NOTE: the reference graph has no per-user identity, so this verifies the
    // token belongs to the app's wallet (combined with the agent-backend API-key
    // auth and per-session isolation that gate who can invoke this flow); true
    // per-user object-level ownership would require an authenticated user model.
    try {
      await context.getTokenStatus(state.private_tokenId);
    } catch (statusError) {
      console.error("Refusing delete: token status could not be verified");
      return {
        messages: [
          new AIMessage(
            "We could not verify this card before removing it, so no changes were made."
          ),
        ],
      };
    }

    const payload = {
      vProvisionedTokenID: state.private_tokenId,
      updateReason: {
        reasonCode: "CUSTOMER_CONFIRMED",
      },
    };

    // Do not log the token id.
    console.log("Calling delete-token");

    const { messages: toolMessages } = await context.deleteToken(
      state.private_tokenId,
      payload
    );

    // Do not log the raw delete result (may contain token data).
    console.log("Delete token successful");

    // SUCCESS: Signal UI to clear localStorage and show success message
    // Increment cardDeletionSignal counter to trigger UI clearing
    // Flow continues to SIGNAL_UI_CARD_DELETED (checkpoint) then CLEAR_DELETE_CARD_ACTION
    return {
      // Mark deletion as completed (idempotency flag)
      private_tokenDeleted: true,

      // Increment deletion counter to signal UI (streams reliably)
      cardDeletionSignal: (state.cardDeletionSignal || 0) + 1,

      // Send success message
      messages: [
        ...toolMessages,
        new AIMessage(
          "Your card has been successfully removed. All associated data has been cleared."
        ),
      ],
      // Note: private_tokenId and other state will be cleared in CLEAR_DELETE_CARD_ACTION
    };
  } catch (error) {
    console.error("Error in deleteToken:", error);

    // ERROR: Keep all data, just show error message
    // Action will be cleared by next node to exit subgraph
    return {
      messages: [
        new AIMessage(
          "We encountered an issue while removing your card. Please try again later. Your card data has been preserved."
        ),
      ],
    };
  }
}
