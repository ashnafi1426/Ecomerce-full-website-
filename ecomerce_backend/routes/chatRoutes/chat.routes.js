
const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../../controllers/chatControllers/chat.controller');
const userSearchController = require('../../controllers/chatControllers/user-search.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
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

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Test endpoint (for debugging) - NO AUTH REQUIRED
router.get('/test', (req, res) => {
  res.json({ message: 'Chat routes are working', timestamp: new Date().toISOString() });
});

// All chat routes require authentication
router.use(authenticate);

// =====================================================
// USER SEARCH FOR CHAT
// =====================================================

// Search users to start chat
router.get('/users/search', userSearchController.searchUsers);

// Get all available users grouped by role
router.get('/users/available', userSearchController.getAvailableUsers);

// Get support user for starting support chat
router.get('/support-user', chatController.getSupportUser);

// File upload
router.post('/upload', upload.array('files', 10), chatController.uploadFiles);

// Conversations
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getConversations);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markAsRead);

// Unread count
router.get('/unread-count', chatController.getUnreadCount);

// User status
router.get('/users/:userId/status', chatController.getUserStatus);

// =====================================================
// TELEGRAM FEATURES - PHASE 2.1
// =====================================================

// Message editing
router.put('/messages/:messageId', chatController.editMessage);

// Message deletion
router.delete('/messages/:messageId', chatController.deleteMessage);

// Message reactions
router.post('/messages/:messageId/reactions', chatController.addReaction);
router.delete('/messages/:messageId/reactions/:reaction', chatController.removeReaction);
router.get('/messages/:messageId/reactions', chatController.getReactions);

// Message edit history
router.get('/messages/:messageId/history', chatController.getEditHistory);

// Reply to message (threading)
router.post('/conversations/:conversationId/messages/reply', chatController.sendReply);

// Message details (with reactions, replies, etc.)
router.get('/messages/:messageId/details', chatController.getMessageDetails);

module.exports = router;
