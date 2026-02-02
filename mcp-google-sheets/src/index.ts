#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import { readFile } from "fs/promises";
import { join } from "path";

// Google Sheets client setup
let sheets: any = null;

async function initializeGoogleSheets() {
  try {
    const credentialsPath = join(process.cwd(), "credentials.json");
    const credentialsContent = await readFile(credentialsPath, "utf-8");
    const credentials = JSON.parse(credentialsContent);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();
    sheets = google.sheets({ version: "v4", auth: authClient as any });

    console.error("✓ Google Sheets API initialized successfully");
  } catch (error) {
    console.error("✗ Failed to initialize Google Sheets API:", error);
    throw error;
  }
}

// MCP Server setup
const server = new Server(
  {
    name: "mcp-google-sheets",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sheets_read",
        description:
          "Read data from a Google Sheets range. Returns cell values as a 2D array.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: "The ID of the Google Spreadsheet (from the URL)",
            },
            range: {
              type: "string",
              description:
                "The A1 notation range to read (e.g., 'Sheet1!A1:B10' or 'A1:B10')",
            },
          },
          required: ["spreadsheetId", "range"],
        },
      },
      {
        name: "sheets_write",
        description:
          "Write data to a Google Sheets range. Accepts a 2D array of values.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: "The ID of the Google Spreadsheet (from the URL)",
            },
            range: {
              type: "string",
              description:
                "The A1 notation range to write (e.g., 'Sheet1!A1:B10' or 'A1:B10')",
            },
            values: {
              type: "array",
              description:
                "2D array of values to write (e.g., [['A1', 'B1'], ['A2', 'B2']])",
              items: {
                type: "array",
                items: {
                  type: ["string", "number", "boolean", "null"],
                },
              },
            },
          },
          required: ["spreadsheetId", "range", "values"],
        },
      },
      {
        name: "sheets_append",
        description:
          "Append data to the end of a Google Sheets range. Useful for adding new rows.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: "The ID of the Google Spreadsheet (from the URL)",
            },
            range: {
              type: "string",
              description:
                "The A1 notation range to append to (e.g., 'Sheet1!A:B')",
            },
            values: {
              type: "array",
              description:
                "2D array of values to append (e.g., [['A1', 'B1'], ['A2', 'B2']])",
              items: {
                type: "array",
                items: {
                  type: ["string", "number", "boolean", "null"],
                },
              },
            },
          },
          required: ["spreadsheetId", "range", "values"],
        },
      },
      {
        name: "sheets_clear",
        description: "Clear data from a Google Sheets range.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: "The ID of the Google Spreadsheet (from the URL)",
            },
            range: {
              type: "string",
              description:
                "The A1 notation range to clear (e.g., 'Sheet1!A1:B10')",
            },
          },
          required: ["spreadsheetId", "range"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!sheets) {
      throw new Error("Google Sheets API not initialized");
    }

    switch (name) {
      case "sheets_read": {
        const { spreadsheetId, range } = args as {
          spreadsheetId: string;
          range: string;
        };

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data.values || [], null, 2),
            },
          ],
        };
      }

      case "sheets_write": {
        const { spreadsheetId, range, values } = args as {
          spreadsheetId: string;
          range: string;
          values: any[][];
        };

        const response = await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully wrote ${response.data.updatedCells} cells to ${range}`,
            },
          ],
        };
      }

      case "sheets_append": {
        const { spreadsheetId, range, values } = args as {
          spreadsheetId: string;
          range: string;
          values: any[][];
        };

        const response = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully appended ${response.data.updates.updatedRows} rows to ${range}`,
            },
          ],
        };
      }

      case "sheets_clear": {
        const { spreadsheetId, range } = args as {
          spreadsheetId: string;
          range: string;
        };

        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range,
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully cleared range ${range}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  await initializeGoogleSheets();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP Google Sheets server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
