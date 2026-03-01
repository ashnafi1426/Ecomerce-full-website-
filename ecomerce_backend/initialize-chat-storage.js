/**
 * INITIALIZE CHAT STORAGE
 * 
 * Creates the Supabase storage bucket for chat files
 * Run this once before using file upload feature
 */

const fileUploadService = require('./services/chatServices/file-upload.service');

async function initializeStorage() {
  console.log('🚀 Initializing chat file storage...\n');

  try {
    const success = await fileUploadService.initializeBucket();

    if (success) {
      console.log('\n✅ Chat storage initialized successfully!');
      console.log('📁 Bucket name: chat-files');
      console.log('🔒 Access: Private (requires authentication)');
      console.log('📏 Max file size: 10MB');
      console.log('\n✨ You can now upload files in chat!');
    } else {
      console.log('\n❌ Failed to initialize chat storage');
      console.log('💡 Please check your Supabase configuration');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  process.exit(0);
}

initializeStorage();
