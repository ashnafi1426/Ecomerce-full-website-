/**
 * FILE UPLOAD SERVICE
 * 
 * Handles file uploads to Supabase Storage for chat messages
 */

const supabase = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');

class FileUploadService {
  constructor() {
    this.bucketName = 'chat-files';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
  }

  /**
   * Initialize storage bucket (call once on app startup)
   */
  async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('[FileUpload] Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(this.bucketName, {
          public: false, // Private bucket - requires authentication
          fileSizeLimit: this.maxFileSize
        });

        if (error) {
          console.error('[FileUpload] Error creating bucket:', error);
          return false;
        }

        console.log('✅ Chat files bucket created successfully');
      } else {
        console.log('✅ Chat files bucket already exists');
      }

      return true;
    } catch (error) {
      console.error('[FileUpload] Error initializing bucket:', error);
      return false;
    }
  }

  /**
   * Validate file
   */
  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Unsupported file type. Allowed: Images (JPG, PNG, GIF, WebP) and Documents (PDF, DOC, DOCX, TXT)'
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(file, userId) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('[FileUpload] Upload error:', error);
        throw new Error('Failed to upload file');
      }

      // Get public URL (signed URL for private bucket)
      const { data: urlData } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry

      return {
        success: true,
        data: {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: data.path,
          fileUrl: urlData.signedUrl,
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[FileUpload] Error uploading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files, userId) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, userId));
      const results = await Promise.all(uploadPromises);

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: failed.length === 0,
        data: {
          uploaded: successful.map(r => r.data),
          failed: failed.map(r => r.error)
        }
      };
    } catch (error) {
      console.error('[FileUpload] Error uploading multiple files:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('[FileUpload] Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[FileUpload] Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get signed URL for file (for accessing private files)
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('[FileUpload] Error creating signed URL:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: { signedUrl: data.signedUrl }
      };
    } catch (error) {
      console.error('[FileUpload] Error getting signed URL:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FileUploadService();
