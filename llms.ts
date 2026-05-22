/**
 * Full LLM documentation content.
 * This content is served at /mcp/doc/llms.txt
 */
export const llmsText = `
# Visa Intelligent Commerce (VIC) - AI Integration Starter Kit

> Node.js/TypeScript starter code for Visa Intelligent Commerce (VIC) and Visa Developer Platform (VDP) integration. This file helps AI coding agents determine which files to use, in what order, for a given integration scenario.

**Important**: This is a client integration kit with example/starter code, not the MCP server itself or a production-ready SDK. You must obtain Visa API credentials through the Visa Intelligent Commerce and VTS onboarding processes.

- [GitHub Repository](https://github.com/visa/ai/tree/main): Complete source code and project structure
- [Main README](https://raw.githubusercontent.com/visa/ai/refs/heads/main/README.md): Project overview, build instructions, and setup guide

## Which Integration Approach to Use

**MCP-Based Integration** — Use when building an AI agent or LLM-powered application that calls VIC operations as tools. Uses StreamableHTTP transport with JWE Bearer token authentication. The MCP server handles X-Pay and MLE internally, so no encryption code is needed on the client side.
- Packages: @visa/mcp-client, @visa/token-manager
- Auth: JWE token (JWT signed with developer's RSA key, encrypted with Visa's public key from JWKS)
- [Environment Configuration (MCP)](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/.env.example)

**Direct REST API Integration** — Use when building a traditional backend service or any non-MCP application that calls VIC APIs directly. Requires X-Pay HMAC-SHA256 authentication and MLE (RSA-OAEP-256 + A128GCM) encryption/decryption on the client side.
- Package: @visa/api-client (VicApiClient)
- Auth: X-Pay token (HMAC-SHA256) + Message Level Encryption (MLE)
- [Environment Configuration (API)](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/.env.example)

**VDP Connectivity Test** — Use to verify basic Visa API connectivity before implementing VIC. Simplest path: no MLE, no VIC credentials. Supports X-Pay token or Two-Way SSL (Mutual TLS) authentication.
- Package: @visa/api-client (VdpApiClient or VdpMutualTlsClient)
- Auth: X-Pay token OR Two-Way SSL with client certificates
- [Environment Configuration (VDP)](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vdp-api-examples/.env.example)

The MCP and Direct API approaches provide the same VIC capabilities using the same underlying Visa APIs. The difference is the communication layer.

## VIC Purchase Instruction Lifecycle

Every VIC commerce workflow follows this lifecycle. Steps 1–2 are always required. Steps 3–6 depend on the use case.

1. **enroll-card** — Register a tokenized payment card. Requires: consumerId, enrollmentReferenceId (from VTS). POST /vacp/v1/cards
2. **initiate-purchase-instruction** — Create a purchase instruction with mandates. Requires: consumerId, tokenId. Returns: instructionId (used by all subsequent calls). POST /vacp/v1/instructions
3. **update-purchase-instruction** — Modify an existing instruction (e.g., change amount). Requires: instructionId. PUT /vacp/v1/instructions/{instructionId}
4. **cancel-purchase-instruction** — Cancel an instruction. Requires: instructionId. Terminal state. PUT /vacp/v1/instructions/{instructionId}/cancel
5. **retrieve-payment-credentials** — Get tokenized payment credentials for checkout. Requires: instructionId, transactionReferenceId. POST /vacp/v1/instructions/{instructionId}/credentials
6. **confirm-transaction-events** — Confirm that a transaction completed. Requires: instructionId, transactionReferenceId. Terminal state. POST /vacp/v1/instructions/{instructionId}/confirmations

Common workflow paths:
- Cancel flow: 1 → 2 → 4
- Update flow: 1 → 2 → 3
- Full purchase flow: 1 → 2 → 5 → 6

## MCP Integration (AI Agent Path)

### Setup

- [VisaMcpClient](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/mcp-client/src/mcp-client.ts): Core client class — connect(), listTools(), callTool(). Handles JWE auth and automatic token refresh.
- [TokenManager](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/token-manager/src/index.ts): JWE token generation — signs JWT with developer's RSA key, encrypts with Visa's public key from JWKS endpoint.
- [MCP Server Connection Example](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/workflows/mcp-server-connection.ts): Connect to the MCP server and discover available tools.

### Operations

Each operation pairs a tool example with its payload builder. Payload builders use [Constants](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/constants.ts) and [Payload Helpers](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-helpers.ts) for timestamps, mandates, and assurance data.

- **enroll-card**: [MCP Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/tools/enroll-card.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/enroll-card.ts)
- **initiate-purchase-instruction**: [MCP Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/tools/initiate-purchase-instruction.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/initiate-purchase-instruction.ts)
- **update-purchase-instruction**: [MCP Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/tools/update-purchase-instruction.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/update-purchase-instruction.ts)
- **cancel-purchase-instruction**: [MCP Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/tools/cancel-purchase-instruction.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/cancel-purchase-instruction.ts)
- **retrieve-payment-credentials**: [MCP Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/tools/retrieve-payment-credentials.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/retrieve-payment-credentials.ts)
- **confirm-transaction-events**: [MCP Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/tools/confirm-transaction-events.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/confirm-transaction-events.ts)

### Workflow Examples

- [Create and Cancel](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/workflows/create-and-cancel-instruction.ts): enroll-card → initiate → cancel
- [Create and Update](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/workflows/create-and-update-instruction.ts): enroll-card → initiate → update
- [Retrieve Credentials and Confirm](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/workflows/retrieve-credentials-confirmations.ts): enroll-card → initiate → retrieve-credentials → confirm

### MCP Helpers

- [MCP Workflow Helpers](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-mcp-examples/utils/workflow-helpers.ts): runWorkflow() — handles client lifecycle, signal handling, cleanup

## Direct API Integration (Backend Service Path)

### Setup

- [VicApiClient](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/api-client/src/clients/vic-client.ts): REST client with X-Pay auth and automatic MLE encryption/decryption. Methods: enrollCard(), initiatePurchaseInstruction(), updatePurchaseInstruction(), cancelPurchaseInstruction(), getTransactionCredentials(), sendConfirmations().
- [API Client Entry Point](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/api-client/src/index.ts): Package exports for VicApiClient, VdpApiClient, VtsApiClient, and utilities.
- [X-Pay Token Implementation](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/api-client/src/x-pay-token.ts): HMAC-SHA256 token generation — format: xv2:{timestamp}:{hash}.
- [MLE Implementation](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/api-client/src/mle.ts): RSA-OAEP-256 + A128GCM encryption (encryptPayload) and decryption (decryptPayload).

### Operations

Each operation pairs a tool example with its payload builder. Direct API tools additionally call buildClientObject() from [API Helpers](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/utils/api-helpers.ts) to pass a client parameter — this is not needed in MCP, where the server handles client identification.

- **enroll-card**: [API Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/tools/enroll-card.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/enroll-card.ts)
- **initiate-purchase-instruction**: [API Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/tools/initiate-purchase-instruction.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/initiate-purchase-instruction.ts)
- **update-purchase-instruction**: [API Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/tools/update-purchase-instruction.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/update-purchase-instruction.ts)
- **cancel-purchase-instruction**: [API Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/tools/cancel-purchase-instruction.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/cancel-purchase-instruction.ts)
- **retrieve-payment-credentials**: [API Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/tools/retrieve-payment-credentials.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/retrieve-payment-credentials.ts)
- **confirm-transaction-events**: [API Tool](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/tools/confirm-transaction-events.ts) | [Payload Builder](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/confirm-transaction-events.ts)

### Workflow Examples

- [Create and Cancel](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/workflows/create-and-cancel-instruction.ts): enroll-card → initiate → cancel
- [Create and Update](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/workflows/create-and-update-instruction.ts): enroll-card → initiate → update
- [Retrieve Credentials and Confirm](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/workflows/retrieve-credentials-confirmations.ts): enroll-card → initiate → retrieve-credentials → confirm

## VDP Connectivity Test

Use to verify Visa API access before implementing VIC workflows. No MLE or VIC credentials required.

- [VdpApiClient](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/api-client/src/clients/vdp-client.ts): X-Pay authenticated client for GET /vdp/helloworld.
- [Test VDP Connection (X-Pay)](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vdp-api-examples/workflows/test-vdp-connection.ts): Verify connectivity using X-Pay token auth.
- [VdpMutualTlsClient](https://raw.githubusercontent.com/visa/ai/refs/heads/main/packages/api-client/src/clients/vdp-mutual-tls-client.ts): Two-Way SSL client using native Node.js HTTPS with client certificates.
- [Test VDP Connection (Mutual TLS)](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vdp-api-examples/workflows/test-vdp-connection-mutual-tls.ts): Verify connectivity using Two-Way SSL with client certificates.

## Shared Utilities

Building blocks used by both MCP and Direct API tools. These are required, not optional.

- [Payload Builders Index](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-builders/index.ts): Re-exports all six payload builder functions
- [Payload Helpers](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/payload-helpers.ts): generateTimestamp(), generateEffectiveUntil(), generateNationalIdentifier(), buildMandate()
- [Constants](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/constants.ts): APP_INSTANCE_BASE, ASSURANCE_DATA_BASE, CONSUMER_CONFIG, ENROLLMENT_CONFIG, WorkflowContext, createWorkflowContext()
- [Shared Workflow Helpers](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/shared-utils/workflow-helpers.ts): handleWorkflowError() — error handling with correlationId extraction
- [API Helpers](https://raw.githubusercontent.com/visa/ai/refs/heads/main/apps/vic-api-examples/utils/api-helpers.ts): buildClientObject() — builds the client identification object (Direct API only)

## Visa Developer Resources

- [Visa Intelligent Commerce Capabilities](https://developer.visa.com/capabilities/visa-intelligent-commerce): VIC features and capabilities overview
- [Visa Developer Center](https://developer.visa.com): API documentation, credentials, and testing environments
- [Visa MCP Hub](https://mcp.visa.com): Model Context Protocol server information and integration
- [Visa Developer Quick Start Guide](https://developer.visa.com/pages/working-with-visa-apis/visa-developer-quick-start-guide): Getting started with Visa APIs
- [X-Pay Token Authentication](https://developer.visa.com/pages/working-with-visa-apis/x-pay-token): X-Pay token-based authentication implementation guide
- [Two-Way SSL Authentication](https://developer.visa.com/pages/working-with-visa-apis/two-way-ssl): Two-Way SSL (Mutual TLS) authentication with client certificates
- [Encryption Guide](https://developer.visa.com/pages/encryption_guide): Message Level Encryption (MLE) documentation and best practices
- [Model Context Protocol Specification](https://modelcontextprotocol.io): Official MCP specification and documentation
`;
