/**
 * Gemini function declarations for the four mock tools.
 *
 * These are passed to the Gemini API as `tools` so it knows which
 * functions it can call. The schemas tell Gemini what arguments each
 * tool accepts — perso then decides whether to actually allow execution.
 */

import { SchemaType, type Tool } from '@google/generative-ai';

export const GEMINI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'read_file',
        description: 'Read the contents of a file at the given path.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: 'Absolute path to the file to read, e.g. /etc/config.json',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'create_file',
        description: 'Create a new file at the given path with optional content.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: 'Absolute path for the new file, e.g. /tmp/report.txt',
            },
            content: {
              type: SchemaType.STRING,
              description: 'Text content to write into the file. Defaults to empty.',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'update_file',
        description: 'Overwrite an existing file with new content.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: 'Absolute path to the file to update.',
            },
            content: {
              type: SchemaType.STRING,
              description: 'New text content to write into the file.',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'delete_file',
        description: 'Permanently delete a file at the given path.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: 'Absolute path to the file to delete.',
            },
          },
          required: ['path'],
        },
      },
    ],
  },
];
