/**
 * Groq tool definitions for the four mock tools.
 * Groq uses the OpenAI-compatible ChatCompletionTool format.
 */

import type { ChatCompletionTool } from 'groq-sdk/resources/chat/completions.js';

export const GROQ_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file at the given path.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path to the file, e.g. /etc/config.json',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file at the given path with optional content.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path for the new file, e.g. /tmp/report.txt',
          },
          content: {
            type: 'string',
            description: 'Text content to write into the file. Defaults to empty.',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_file',
      description: 'Overwrite an existing file with new content.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path to the file to update.',
          },
          content: {
            type: 'string',
            description: 'New text content to write into the file.',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Permanently delete a file at the given path.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path to the file to delete.',
          },
        },
        required: ['path'],
      },
    },
  },
];
