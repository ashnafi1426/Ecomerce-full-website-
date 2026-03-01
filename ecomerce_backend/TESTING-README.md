# FastShop Testing - Quick Start

## 🚀 Quick Test Commands

### Run All Tests
```bash
npm test
```
This runs all phase tests sequentially and provides a comprehensive report.

### Run Individual Phase Tests

**Phase 1: Database Schema**
```bash
npm run test:phase1
```

**Phase 2: Authentication & Authorization**
```bash
npm run test:phase2
```

**Phase 3: Product Management**
```bash
npm run test:phase3
```

---

## ✅ Prerequisites

1. **Start the backend server** (in a separate terminal):
   ```bash
   npm start
   ```

2. **Ensure admin account exists**:
   ```bash
   node create-admin-account.js
   ```

3. **Verify database connection**:
   ```bash
   node test-connection.js
   ```

---

## 📊 What Gets Tested

### Phase 1: Database Schema ✅
- Database connection
- All 13 new tables exist
- User roles column
- Product approval fields
- Commission system
- Data integrity

### Phase 2: Authentication & Authorization 🧪
- Admin login
- Seller registration with business info
- Seller login and status check
- Manager creation (Admin only)
- Manager login
- Seller approval workflow
- Role-based access control
- Permission enforcement

### Phase 3: Product Management 🧪
- Seller creates product (pending status)
- Seller views own products
- Customer cannot see pending products
- Manager views approval queue
- Manager approves product
- Customer sees approved products
- Seller updates product (re-approval)
- Manager rejects product with reason
- Seller cannot view other sellers' products
- Seller deletes own product
- Product search with role filtering

---

## 📈 Expected Results

### All Tests Passing
```
╔════════════════════════════════════════════════════════════╗
║                   COMPREHENSIVE TEST REPORT                ║
╚════════════════════════════════════════════════════════════╝

📊 Overall Statistics:
   Total Phases Tested: 3
   ✅ Passed: 3
   ❌ Failed: 0
   📈 Success Rate: 100.0%
   ⏱️  Total Duration: 25.3s

🎉 All Tests Passed!

   ✅ Phase 1-3 implementation verified
   ✅ Database schema is correct
   ✅ Authentication & authorization working
   ✅ Product management & approval functional
   ✅ Ready to proceed to Phase 4
```

---

## 🔧 Troubleshooting

### Server Not Running
```bash
# Error: ECONNREFUSED
# Solution: Start the server
npm start
```

### Admin Login Fails
```bash
# Error: Invalid credentials
# Solution: Create admin account
node create-admin-account.js
```

### Database Connection Error
```bash
# Error: Connection timeout
# Solution: Check .env file
cat .env | grep SUPABASE
```

### Port Already in Use
```bash
# Error: Port 5000 already in use
# Solution: Kill process or use different port
lsof -ti:5000 | xargs kill -9
# OR
PORT=5001 npm start
```

---

## 🧹 Test Data Cleanup

All test scripts automatically clean up test data after completion. If tests fail and cleanup doesn't run, you can manually clean up:

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com';

-- Delete test products
DELETE FROM products WHERE title LIKE 'Test%';
```

---

## 📚 Detailed Documentation

For comprehensive testing documentation, see:
- **TESTING-GUIDE.md** - Complete testing guide with troubleshooting
- **PHASE2-COMPLETE.md** - Phase 2 implementation details
- **PHASE3-COMPLETE.md** - Phase 3 implementation details

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. ✅ **Update Postman Collection**
   - Add Phase 2 endpoints (9 new)
   - Add Phase 3 endpoints (7 new)
   - Test manually in Postman

2. ✅ **Create API Documentation**
   - Document all new endpoints
   - Add request/response examples
   - Update README with API reference

3. ✅ **Proceed to Phase 4**
   - Comprehensive Payment System
   - Commission calculation engine
   - Seller payout system
   - Refund management

---

## 💡 Tips

- Run tests after each code change
- Tests create and clean up their own data
- Tests run sequentially to avoid conflicts
- Each test is independent and can run alone
- Test output is color-coded for easy reading

---

**Last Updated:** February 8, 2026  
**Version:** 1.0  
**Status:** Ready for Testing
