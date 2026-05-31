/**
 * Gemini function declarations for the four mock tools.
 * Uses @google/genai v2 — Type enum instead of SchemaType.
 */

import { Type, type Tool } from '@google/genai';

export const GEMINI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'read_file',
        description: 'Read the contents of a file at the given path.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'Absolute path to the file, e.g. /etc/config.json',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'create_file',
        description: 'Create a new file at the given path with optional content.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'Absolute path for the new file, e.g. /tmp/report.txt',
            },
            content: {
              type: Type.STRING,
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
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'Absolute path to the file to update.',
            },
            content: {
              type: Type.STRING,
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
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'Absolute path to the file to delete.',
            },
          },
          required: ['path'],
        },
      },
    ],
  },
];
