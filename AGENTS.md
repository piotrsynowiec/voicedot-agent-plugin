# VoiceDot Agent Plugin repository

This public repository owns portable Agent Plugins metadata, the canonical review skill, generated compatibility artifacts, public documentation, and release metadata. The sibling private runtime repository owns production MCP transport, OAuth, grants, entitlements, dashboard distribution state, telemetry, and operations.

On Piotr's workstation the private sibling is `/Users/piotr/Development/voicedot`. Validate a cross-repository contract change in both repositories; never copy runtime behavior, OAuth details, customer data, or secrets here. Root `plugin.json`, root `mcp.json`, and the canonical skill tree are hand-edited sources. OpenAI/Codex compatibility files and `adapters/claude-code/` must be regenerated, never hand-maintained. The adapter is a local compatibility projection, not a marketplace claim or an authenticated client smoke.
