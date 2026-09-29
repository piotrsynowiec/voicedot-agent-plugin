# OpenAI submission materials

Prepared on 2026-09-29 for version 0.2.0. This is a candidate, not a claim of
submission or publication.

## Files

- `plugin.json`: portable listing, three starter prompts, five positive and
  three negative review cases, all-country availability and no commerce.
- `chatgpt-app-submission.json`: generated import for the form currently shown
  in OpenAI Platform. Includes annotations and justifications for 19 tools.
- `dist/voicedot-agent-plugin-0.2.0.zip`: ZIP for the package upload workflow.
- `assets/icon.png`: existing VoiceDot brand icon, 512 × 512 PNG.
- `skills/review-voicedot-feedback/`: canonical workflow and references.

The publisher must be the selected verified business identity. The observed
portal spells it `Good Sheet Sp z o.o.`; both package author fields match that
displayed identity. The existing portal draft is version 0.1.1 and still
describes read-only access. Update that draft instead of creating a duplicate.

## Verification

Run `npm run generate`, `npm run generate:check`, `npm run package`, `npm test`
and `npm run package:check`. Validate the generated import against the
[official JSON schema](https://developers.openai.com/plugins/schemas/chatgpt-app-submission.v1.json).
The imported annotations must match the tools scanned from the deployed
server, including irreversible visitor-facing reply sends.

Backend tests are separate from clean-client review replays. No successful
authenticated review replay or demo recording is claimed by this repository.

## Submission hold — owner decision, 2026-09-30

Do not submit or publish this plugin until the requested MCP project-creation
and widget-installation workflow is implemented, tested and reflected in the
final package, review cases, reviewer access and public policy coverage.
Version 0.2.0 currently declares only the existing feedback tools; project
creation is not implemented or advertised by this candidate.

The owner will record the final video and complete the final private/legal
fields. Preparation continues locally. See [preparation checklist](preparation-checklist.md)
and [recording plan](recording-plan.md). No final upload, submission or publication
is authorized by this preparation request.

## Verified on 2026-09-30

- Backend PR #37 and website PR #14 are merged and deployed. The production
  server includes the corrected send annotations and supports the isolated
  reviewer's resolving and replying scopes.
- Website PR #15 is merged and deployed. The public privacy policy shows
  September 29, 2026, the date the MCP disclosure was added.
- All four public listing URLs were checked. The website describes optional
  actions, MCP data sharing and direct support contact.
- A real Codex CLI OAuth login succeeded for the dedicated reviewer with the
  six intended scopes. The configured client still needs to load its tools
  and complete all eight review replays; successful login alone is not replay
  evidence. Private credentials and runtime details remain outside this repo.
- The future `voicedot-site` replacement needs the same MCP disclosure before
  switching the public website. Its current privacy documents remain drafts;
  website replacement is not part of these completed deployments.

## Remaining publication steps

1. Replay the eight cases with a fresh authenticated client against only the
   synthetic projects. Use the English Atlas Checkout page for every case.
   Record actual tool calls and outcomes. Restore the synthetic pins afterwards
   so the cases remain reproducible. Complete production write verification.
2. Record a real video showing the submitted client, evidence review, page-pin
   closure and a preview followed by an explicitly confirmed reply. Host it
   where the review team can watch without requesting access. Set the real
   `review.demo_recording_url` in `plugin.json`, then regenerate and rebuild.
3. Freeze the final commit, annotated version tag and exact archive digests.
4. Import the JSON or upload the ZIP using the workflow presented by the
   existing portal. Check saved metadata, skills, starter prompts, all-country
   availability, no-commerce declaration and version. Upload actual icons.
   Enter reviewer credentials only in the portal's protected fields.
5. Configure the existing server with OAuth, verify domain ownership, scan all
   tools and reconcile every annotation with deployed behavior. Never select
   No Auth for the protected VoiceDot endpoint.
6. The legal owner reviews the attestations and submits the complete draft.
   Publication is a separate action after approval.

See [OpenAI submission documentation](https://developers.openai.com/plugins/deploy/submission).
The observed portal uses a JSON import form; the documentation also describes
a ZIP workflow. Use the actual interface presented by the target organization.

## Demo outline (about three minutes)

- Start with the dedicated reviewer account, with resolving and replying
  enabled. Use only the English Atlas Checkout page for every review case
  and the recording.
- Ask for an Atlas checkout evidence brief. Show citations and withheld counts.
- Inspect the pricing pin and its chronology.
- Ask to close only that page pin. Show it disappear from the synthetic page
  while its discussion remains open in VoiceDot.
- Ask for an English pricing reply to a separate Atlas Checkout pin. Show the exact preview,
  separately confirm it, then show the stored visitor-facing reply.
- Demonstrate refusal of unsupported deletion and an unconfirmed send.
- Reopen the Atlas page pin after recording. Use a fresh thread for another
  send demonstration; reply tokens are single-use and reply cooldown applies.
