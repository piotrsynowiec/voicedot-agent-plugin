# VoiceDot tool and workflow reference

All tools are read-only, closed-world, and limited to the active OAuth grant.

| Need | Tool sequence |
|---|---|
| Choose a project | `list_projects` then `resolve_project_context` |
| Recent filtered feedback | `resolve_project_context` then `prepare_feedback_evidence` |
| One page | `resolve_project_context` then `get_page_feedback` |
| One conversation | `resolve_project_context` then `get_conversation` |
| One pin thread | `resolve_project_context` then `get_pin_thread` |
| Withheld coverage | `resolve_project_context` then `get_quarantine_summary` |

Follow cursors only within the founder's explicit scope. An optional `.voicedot.json` is a selector, not authorization: validate it against the current grant and never fall back silently.
