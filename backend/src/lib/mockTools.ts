/**
 * Mock tool implementations.
 * No real filesystem access — these return plausible fake responses
 * so the demo can show end-to-end flow without any side effects.
 */

import type {
  ToolName,
  ReadFileArgs,
  CreateFileArgs,
  UpdateFileArgs,
  DeleteFileArgs,
} from './types.js';

// ── Fake in-memory filesystem ─────────────────────────────────────────────────

const MOCK_FS: Record<string, string> = {
  '/etc/config.json':  JSON.stringify({ env: 'production', debug: false }, null, 2),
  '/var/log/app.log':  '[2024-01-15 10:23:01] INFO  server started on :3001\n[2024-01-15 10:23:45] INFO  request GET /health 200',
  '/home/user/notes.txt': 'TODO: review Q1 budget\nMeeting at 3pm with design team',
  '/app/secrets.env':  'DATABASE_URL=postgres://...\nSECRET_KEY=••••••••',
};

// ── Tool implementations ──────────────────────────────────────────────────────

function readFile(args: ReadFileArgs): string {
  const content = MOCK_FS[args.path];
  if (content !== undefined) {
    return `Contents of ${args.path}:\n\n${content}`;
  }
  return `File not found: ${args.path}`;
}

function createFile(args: CreateFileArgs): string {
  const content = args.content ?? '(empty)';
  MOCK_FS[args.path] = content;
  return `Created ${args.path} (${content.length} bytes)`;
}

function updateFile(args: UpdateFileArgs): string {
  const existed = args.path in MOCK_FS;
  MOCK_FS[args.path] = args.content;
  return existed
    ? `Updated ${args.path} (${args.content.length} bytes)`
    : `Created (upsert) ${args.path} (${args.content.length} bytes)`;
}

function deleteFile(args: DeleteFileArgs): string {
  const existed = args.path in MOCK_FS;
  delete MOCK_FS[args.path];
  return existed
    ? `Deleted ${args.path}`
    : `File not found (nothing deleted): ${args.path}`;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function executeMockTool(
  toolName: ToolName,
  args: Record<string, unknown>,
): string {
  switch (toolName) {
    case 'read_file':
      return readFile(args as unknown as ReadFileArgs);
    case 'create_file':
      return createFile(args as unknown as CreateFileArgs);
    case 'update_file':
      return updateFile(args as unknown as UpdateFileArgs);
    case 'delete_file':
      return deleteFile(args as unknown as DeleteFileArgs);
    default:
      throw new Error(`Unknown tool: ${toolName as string}`);
  }
}
