import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const plugin = JSON.parse(readFileSync(resolve(root, 'plugin.json'), 'utf8'));
const { interface: listing, review } = plugin.extensions['com.openai'];
const readTools = [
  'list_projects', 'resolve_project_context', 'search_feedback',
  'search_feedback_across_projects', 'get_conversation', 'get_pin_thread',
  'get_page_feedback', 'prepare_feedback_evidence', 'search_pins',
  'match_pin_attribute', 'get_project_summary', 'get_quarantine_summary',
  'get_project_installation', 'get_project_installation_status',
];
const tools = Object.fromEntries(readTools.map((name) => [name, {
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  justifications: {
    read_only_justification: 'Retrieves authorized project context or bounded feedback evidence; it does not change customer feedback or send messages.',
    open_world_justification: 'Retrieval is restricted to projects in the current VoiceDot OAuth grant; it does not search arbitrary external accounts.',
    destructive_justification: 'This read operation does not delete or alter feedback, pins, conversations or settings.',
  },
}]));
for (const [name, effect, idempotent] of [
  ['set_pin_statuses', 'Closes or reopens selected page pins. The discussion and history remain intact; visibility can be changed back.', true],
  ['resolve_pin_thread', 'Marks the selected pin discussion resolved with agent attribution. The owner can reopen it in VoiceDot.', true],
  ['resolve_conversation', 'Marks discussions in the selected conversation resolved. The owner can reopen them in VoiceDot.', true],
  ['prepare_thread_reply', 'Stores a short-lived reply draft and returns the exact preview and a confirmation token. It sends no visitor message.', true],
  ['prepare_bulk_resolve', 'Stores a short-lived batch selection and returns its count, breakdown and sample. It changes no discussion status.', true],
  ['confirm_bulk_resolve', 'Consumes a single-use token to resolve only the previewed selection. The owner can reopen affected discussions.', false],
]) {
  tools[name] = {
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: idempotent, openWorldHint: false },
    justifications: {
      read_only_justification: effect,
      open_world_justification: 'The operation is confined to the current grant and its authorized VoiceDot projects; it does not post to arbitrary external services.',
      destructive_justification: 'The operation does not delete feedback or history. Drafts do not send messages, and resolved discussions or closed pins can be reopened.',
    },
  };
}
tools.create_project = {
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  justifications: {
    read_only_justification: 'Creates one project in the existing owned VoiceDot workspace, only with explicit projects:create permission and plan eligibility; grants the creating connection access to that new project.',
    open_world_justification: 'Creation is limited to the existing owned workspace. It does not fetch external URLs, edit a website, buy a plan or create an account.',
    destructive_justification: 'No existing project or feedback is deleted or changed. Durable per-grant retry keys prevent duplicate creation, and the owner can archive the new project.',
  },
};
tools.send_thread_reply = {
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  justifications: {
    read_only_justification: 'After an exact preview and separate human confirmation, it consumes the prepared token and stores a visitor-facing reply with agent attribution.',
    open_world_justification: 'The reply reaches the visitor through the conversation widget and may trigger a transactional email notification.',
    destructive_justification: 'A sent visitor-facing message or notification cannot be recalled. The single-use token is bound to the exact grant, project, thread and prepared text.',
  },
};
const output = {
  $schema: 'https://developers.openai.com/plugins/schemas/chatgpt-app-submission.v1.json',
  schema_version: 1,
  app_info: { display_name: listing.displayName, subtitle: listing.shortDescription, description: listing.longDescription, category: 'PRODUCTIVITY' },
  tools,
  test_cases: review.test_cases.positive.map(({ description, prompt, tools_triggered, expected_behavior }) => ({ description, user_prompt: prompt, tools_triggered, expected_output: expected_behavior })),
  negative_test_cases: review.test_cases.negative.map(({ description, prompt }) => ({ description, user_prompt: prompt })),
};
const target = resolve(root, 'chatgpt-app-submission.json');
const contents = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== contents) throw new Error('Submission import is stale; run npm run generate.');
} else writeFileSync(target, contents);
