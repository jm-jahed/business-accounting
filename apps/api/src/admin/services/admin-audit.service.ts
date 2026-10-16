import { Injectable, Logger } from '@nestjs/common';
import {
  AdminAuditLog,
  IAdminAuditLog,
  computeAdminAuditHash,
  sanitizeAuditState,
  verifyAdminAuditChain,
} from '@accounting/database';
import { AdminRole } from '@accounting/contracts';

export interface RecordAdminAuditInput {
  actorId: string;
  actorEmail: string;
  adminRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  /**
   * Appends an immutable, cryptographically chained audit log entry.
   * Concurrency-safe: retries with next sequence if duplicate key collision occurs.
   */
  public async logAction(input: RecordAdminAuditInput): Promise<IAdminAuditLog> {
    const sanitizedBefore = sanitizeAuditState(input.beforeState);
    const sanitizedAfter = sanitizeAuditState(input.afterState);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const lastEntry = await AdminAuditLog.findOne().sort({ sequenceNumber: -1 }).lean();
        const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 1;
        const prevHash = lastEntry ? lastEntry.hash : 'GENESIS_HASH';
        const now = new Date();

        const hash = computeAdminAuditHash({
          sequenceNumber,
          prevHash,
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          afterState: sanitizedAfter,
          timestamp: now,
        });

        const entry = new AdminAuditLog({
          sequenceNumber,
          actorId: input.actorId,
          actorEmail: input.actorEmail,
          adminRole: input.adminRole,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          beforeState: sanitizedBefore,
          afterState: sanitizedAfter,
          ipAddress: input.ipAddress || '',
          userAgent: input.userAgent || '',
          prevHash,
          hash,
          createdAt: now,
        });

        return await entry.save();
      } catch (err: any) {
        if (err.code === 11000 && attempts < maxAttempts) {
          // Concurrent sequence collision, retry
          continue;
        }
        this.logger.error(`Failed to record admin audit log: ${err.message}`, err.stack);
        throw err;
      }
    }

    throw new Error('Failed to acquire unique sequence number for audit log.');
  }

  /**
   * Verifies the cryptographic integrity of the entire admin audit trail.
   */
  public async verifyEntireChain(): Promise<{
    isValid: boolean;
    totalEntries: number;
    error?: string;
    brokenSequence?: number;
  }> {
    const logs = await AdminAuditLog.find().sort({ sequenceNumber: 1 }).lean();
    const result = verifyAdminAuditChain(logs as any[]);
    return {
      isValid: result.isValid,
      totalEntries: logs.length,
      error: result.error,
      brokenSequence: result.brokenSequence,
    };
  }

  /**
   * Retrieves paginated audit logs with search/filters.
   */
  public async queryLogs(params: {
    actorId?: string;
    action?: string;
    targetType?: string;
    limit?: number;
    offset?: number;
  }) {
    const filter: any = {};
    if (params.actorId) filter.actorId = params.actorId;
    if (params.action) filter.action = params.action;
    if (params.targetType) filter.targetType = params.targetType;

    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    const [items, total] = await Promise.all([
      AdminAuditLog.find(filter).sort({ sequenceNumber: -1 }).skip(offset).limit(limit).lean(),
      AdminAuditLog.countDocuments(filter),
    ]);

    return {
      items: items.map((l) => ({
        id: l._id.toString(),
        sequenceNumber: l.sequenceNumber,
        actorId: l.actorId,
        actorEmail: l.actorEmail,
        adminRole: l.adminRole,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        beforeState: l.beforeState,
        afterState: l.afterState,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        prevHash: l.prevHash,
        hash: l.hash,
        timestamp: l.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    };
  }
}
