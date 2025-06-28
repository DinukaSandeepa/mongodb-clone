import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-gcm';

// Ensure the key is exactly 32 bytes
const getKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
  if (key.length !== 32) {
    // If key is not 32 bytes, hash it to get a consistent 32-byte key
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  }
  return key;
};

export function encryptConnectionString(connectionString) {
  try {
    if (!connectionString) return connectionString;
    
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('connection-string', 'utf8'));
    
    let encrypted = cipher.update(connectionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    
    return 'encrypted:' + Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return connectionString; // Return original if encryption fails
  }
}

export function decryptConnectionString(encryptedString) {
  try {
    if (!encryptedString || !encryptedString.startsWith('encrypted:')) {
      return encryptedString; // Return as-is if not encrypted
    }
    
    const key = getKey();
    const combined = Buffer.from(encryptedString.replace('encrypted:', ''), 'base64').toString('utf8');
    const [ivHex, authTagHex, encrypted] = combined.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('connection-string', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedString; // Return original if decryption fails
  }
}

export function isEncrypted(connectionString) {
  return connectionString && connectionString.startsWith('encrypted:');
}

export function maskConnectionString(connectionString) {
  if (!connectionString) return '';
  
  try {
    // If encrypted, show that it's encrypted
    if (isEncrypted(connectionString)) {
      return '🔒 [Encrypted Connection String]';
    }
    
    // For regular connection strings, mask credentials
    const url = new URL(connectionString);
    if (url.username || url.password) {
      return connectionString.replace(/\/\/.*@/, '//***:***@');
    }
    
    return connectionString;
  } catch (error) {
    // If URL parsing fails, do basic masking
    return connectionString.replace(/\/\/.*@/, '//***:***@');
  }
}