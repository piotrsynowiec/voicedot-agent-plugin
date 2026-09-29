# Synthetic reviewer catalog

`review-catalog-v1.json` is a public, synthetic-only projection of the
P1–P5 and N1–N3 reviewer cases. P4 and P5 require optional write scopes and
separate synthetic targets. It is intentionally not a workflow specification:
the sole canonical workflow is
[`skills/review-voicedot-feedback/SKILL.md`](../skills/review-voicedot-feedback/SKILL.md).

The catalog maps the cases to their observable outcomes only. It has
no login instructions, credentials, customer data, private paths, or runtime
endpoint; use it to check a local synthetic reviewer, never as a production
runbook.
