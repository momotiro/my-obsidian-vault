import { z } from "zod";

/**
 * Monitoring record schema for nested creation/update
 */
export const monitoringRecordSchema = z.object({
  serverId: z.number().int().positive("Server ID must be a positive integer"),
  monitoringContent: z.string().min(1, "Monitoring content is required"),
});

/**
 * Monitoring record with optional ID for updates
 */
export const monitoringRecordWithIdSchema = monitoringRecordSchema.extend({
  recordId: z.number().int().positive().optional(),
});

/**
 * Create daily report request schema
 */
export const createReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Report date must be in YYYY-MM-DD format"),
  problem: z.string().optional(),
  plan: z.string().optional(),
  monitoringRecords: z
    .array(monitoringRecordSchema)
    .min(1, "At least one monitoring record is required"),
});

/**
 * Update daily report request schema
 */
export const updateReportSchema = z.object({
  problem: z.string().optional(),
  plan: z.string().optional(),
  monitoringRecords: z
    .array(monitoringRecordWithIdSchema)
    .min(1, "At least one monitoring record is required"),
});

/**
 * Query parameters for listing reports
 */
export const listReportsQuerySchema = z.object({
  userId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)),
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10)),
});

/**
 * Type exports for TypeScript
 */
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type MonitoringRecordInput = z.infer<typeof monitoringRecordSchema>;
export type MonitoringRecordWithIdInput = z.infer<typeof monitoringRecordWithIdSchema>;
