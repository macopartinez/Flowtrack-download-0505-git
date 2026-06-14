/**
 * Module d'encryption pour les DMs
 * Utilise Web Crypto API pour l'encryption AES-GCM
 */

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  /**
   * Génère une clé de chiffrement unique pour l'utilisateur
   */
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Exporte une clé en format stockable
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  /**
   * Importe une clé depuis le format stocké
   */
  static async importKey(keyData: string): Promise<CryptoKey> {
    const jwk = JSON.parse(keyData);
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Chiffre un message
   */
  static async encrypt(text: string, key: CryptoKey): Promise<string> {
    try {
      // Générer un IV aléatoire
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Encoder le texte
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      // Chiffrer
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        data
      );

      // Combiner IV + données chiffrées
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convertir en base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Déchiffre un message
   */
  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      // Décoder depuis base64
      const combined = this.base64ToArrayBuffer(encryptedData);

      // Extraire IV et données
      const iv = combined.slice(0, this.IV_LENGTH);
      const data = combined.slice(this.IV_LENGTH);

      // Déchiffrer
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        data
      );

      // Décoder le texte
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Chiffre un objet JSON
   */
  static async encryptObject(obj: any, key: CryptoKey): Promise<string> {
    const json = JSON.stringify(obj);
    return await this.encrypt(json, key);
  }

  /**
   * Déchiffre un objet JSON
   */
  static async decryptObject<T>(encryptedData: string, key: CryptoKey): Promise<T> {
    const json = await this.decrypt(encryptedData, key);
    return JSON.parse(json);
  }

  /**
   * Hash un texte (pour vérification d'intégrité)
   */
  static async hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * Convertit ArrayBuffer en base64
   */
  private static arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Convertit base64 en ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Génère un salt aléatoire
   */
  static generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return this.arrayBufferToBase64(salt);
  }

  /**
   * Dérive une clé depuis un mot de passe
   */
  static async deriveKeyFromPassword(
    password: string,
    salt: string
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const saltBuffer = this.base64ToArrayBuffer(salt);

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
}

/**
 * Gestionnaire de clés d'encryption
 */
export class KeyManager {
  private static readonly STORAGE_KEY = 'encryption_key';
  private static readonly SALT_KEY = 'encryption_salt';
  private static cachedKey: CryptoKey | null = null;

  /**
   * Initialise ou récupère la clé d'encryption
   */
  static async getOrCreateKey(): Promise<CryptoKey> {
    // Vérifier le cache
    if (this.cachedKey) {
      return this.cachedKey;
    }

    // Vérifier le storage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      // Importer la clé existante
      this.cachedKey = await EncryptionService.importKey(stored);
      return this.cachedKey;
    }

    // Générer une nouvelle clé
    const key = await EncryptionService.generateKey();
    const exported = await EncryptionService.exportKey(key);
    
    // Stocker
    localStorage.setItem(this.STORAGE_KEY, exported);
    
    this.cachedKey = key;
    return key;
  }

  /**
   * Supprime la clé (pour déconnexion/suppression de compte)
   */
  static clearKey(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SALT_KEY);
    this.cachedKey = null;
  }

  /**
   * Vérifie si une clé existe
   */
  static hasKey(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}

/**
 * Service de stockage sécurisé pour les DMs
 */
export class SecureStorage {
  /**
   * Stocke un DM de manière sécurisée
   */
  static async storeDM(messageId: string, message: any): Promise<void> {
    const key = await KeyManager.getOrCreateKey();
    const encrypted = await EncryptionService.encryptObject(message, key);
    
    localStorage.setItem(`dm_${messageId}`, encrypted);
  }

  /**
   * Récupère un DM déchiffré
   */
  static async getDM(messageId: string): Promise<any | null> {
    const encrypted = localStorage.getItem(`dm_${messageId}`);
    
    if (!encrypted) {
      return null;
    }

    try {
      const key = await KeyManager.getOrCreateKey();
      return await EncryptionService.decryptObject(encrypted, key);
    } catch (error) {
      console.error('Failed to decrypt DM:', error);
      return null;
    }
  }

  /**
   * Supprime un DM
   */
  static deleteDM(messageId: string): void {
    localStorage.removeItem(`dm_${messageId}`);
  }

  /**
   * Supprime tous les DMs
   */
  static clearAllDMs(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('dm_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Compte le nombre de DMs stockés
   */
  static countDMs(): number {
    const keys = Object.keys(localStorage);
    return keys.filter(key => key.startsWith('dm_')).length;
  }
}


