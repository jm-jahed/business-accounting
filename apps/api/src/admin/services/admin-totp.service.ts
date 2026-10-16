import { Injectable, BadRequestException } from '@nestjs/common';
import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { loadAdminConfig } from '../config/admin.config.js';

export interface EncryptedSecret {
  encrypted: string; // base64
  iv: string; // hex
  authTag: string; // hex
}

@Injectable()
export class AdminTotpService {
  private readonly encryptionKey: Buffer;

  constructor() {
    this.encryptionKey = loadAdminConfig().totpEncryptionKey;
  }

  /**
   * Encrypts a plaintext TOTP secret using AES-256-GCM.
   */
  public encryptSecret(plainSecret: string): EncryptedSecret {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(plainSecret, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypts an AES-256-GCM encrypted TOTP secret.
   */
  public decryptSecret(encryptedData: EncryptedSecret): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generates a new 32-character base32 secret and otpauth URI for QR codes.
   */
  public generateTotpSetup(email: string): {
    secret: string;
    otpauthUri: string;
    encrypted: EncryptedSecret;
    recoveryCodes: string[];
    recoveryCodeHashes: string[];
  } {
    const secret = generateSecret();
    const otpauthUri = generateURI({
      issuer: 'Global ERP Super Admin',
      label: email,
      secret,
    });

    const encrypted = this.encryptSecret(secret);

    // Generate 8 single-use recovery codes
    const recoveryCodes: string[] = [];
    const recoveryCodeHashes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. A1B2C3D4
      recoveryCodes.push(code);
      recoveryCodeHashes.push(crypto.createHash('sha256').update(code).digest('hex'));
    }

    return {
      secret,
      otpauthUri,
      encrypted,
      recoveryCodes,
      recoveryCodeHashes,
    };
  }

  /**
   * Verifies a 6-digit TOTP token against encrypted secret with window ±1 and replay attack prevention.
   */
  public verifyTotpToken(
    token: string,
    encryptedSecret: EncryptedSecret,
    lastUsedTimeStep: number = 0
  ): { valid: boolean; timeStep: number } {
    let secret: string;
    try {
      secret = this.decryptSecret(encryptedSecret);
    } catch {
      throw new BadRequestException('Failed to decrypt TOTP secret.');
    }

    const result = verifySync({
      token,
      secret,
      epochTolerance: 30, // Window ±1 step (30s) as required
    });

    if (!result.valid) {
      return { valid: false, timeStep: 0 };
    }

    // Replay attack prevention: timeStep must strictly be greater than last used timeStep
    const timeStep = (result as any).timeStep || 0;
    if (timeStep > 0 && timeStep <= lastUsedTimeStep) {
      return { valid: false, timeStep }; // Replayed token rejected
    }

    return { valid: true, timeStep };
  }

  /**
   * Verifies and burns a single-use recovery code.
   */
  public verifyAndConsumeRecoveryCode(
    providedCode: string,
    existingHashes: string[]
  ): { valid: boolean; remainingHashes: string[] } {
    const codeHash = crypto.createHash('sha256').update(providedCode.trim().toUpperCase()).digest('hex');
    const index = existingHashes.indexOf(codeHash);
    if (index === -1) {
      return { valid: false, remainingHashes: existingHashes };
    }

    // Burn code
    const remaining = [...existingHashes];
    remaining.splice(index, 1);
    return { valid: true, remainingHashes: remaining };
  }
}
