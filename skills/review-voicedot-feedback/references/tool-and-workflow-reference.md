# VoiceDot tool and workflow reference

Read tools are limited to the active OAuth grant. Resolve and reply tools require separate write scopes, remain project-scoped, and must follow the confirmation steps in the canonical skill.

| Need | Tool sequence |
|---|---|
| Add a project in an existing owned workspace | `create_project` with explicit `projects:create` permission, eligible plan and stable retry key |
| Install a widget | Use the creation result or `get_project_installation`, edit the website with the agent’s own tools, open its exact HTTPS address, then `get_project_installation_status`; only `readyForFeedback=true` proves fresh backend receipt |
| Choose a project | `list_projects` then `resolve_project_context` |
| Recent filtered feedback | `resolve_project_context` then `prepare_feedback_evidence` |
| One page | `resolve_project_context` then `get_page_feedback` |
| One conversation | `resolve_project_context` then `get_conversation` |
| One pin thread | `resolve_project_context` then `get_pin_thread` |
| Withheld coverage | `resolve_project_context` then `get_quarantine_summary` |
| Close or reopen page pins | Find exact thread IDs with `search_pins`, then `set_pin_statuses` after the founder requests the visibility change |
| Resolve one pin discussion | Find the exact target, then `resolve_pin_thread` after the founder asks to resolve it |
| Resolve one conversation | Find the exact target, then `resolve_conversation` after the founder asks to resolve it |
| Resolve several pins | `prepare_bulk_resolve`, show the preview, wait for confirmation, then `confirm_bulk_resolve` |
| Reply to a pin thread | `prepare_thread_reply`, show the exact preview, wait for confirmation, then `send_thread_reply` |

Follow cursors only within the founder's explicit scope. An optional `.voicedot.json` is a selector, not authorization: validate it against the current grant and never fall back silently. A read grant never implies `projects:create`, `feedback:resolve` or `feedback:reply`.
