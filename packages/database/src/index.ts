/**
 * Business Accounting & Management System
 * Database Package Public Entrypoint
 */

export * from './config.js';
export * from './connection.js';

// Models
export * from './models/User.js';
export * from './models/Company.js';
export * from './models/Branch.js';
export * from './models/CompanyMembership.js';
export * from './models/CompanyInvitation.js';
export * from './models/Account.js';
export * from './models/AuditLog.js';
export * from './models/UserSession.js';

// Domain Services & Multi-Tenant Boundaries
export * from './services/tenant.context.js';
export * from './services/account.service.js';

export const DATABASE_PACKAGE_VERSION = '1.0.0';
