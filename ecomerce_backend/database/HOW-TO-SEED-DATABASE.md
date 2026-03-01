# How to Seed Database with Sample Products

## Overview

The `seed-sample-products.sql` file contains **105 sample products** organized by category to populate your database and display on the HomePage.

## What's Included

### Products by Category:
- **Electronics** (20 products): Laptops, phones, headphones, cameras, gaming consoles, monitors
- **Fashion** (20 products): Clothing, shoes, accessories, winter wear
- **Home & Kitchen** (20 products): Appliances, cookware, furniture, decor, cleaning
- **Books** (15 products): Fiction, non-fiction, business, science, children's books
- **Sports & Outdoors** (15 products): Fitness equipment, outdoor gear, cycling, water sports
- **Toys & Games** (15 products): LEGO, board games, educational toys, RC vehicles

### Additional Data:
- **3 Verified Sellers**: TechStore Pro, Fashion Hub, Home Essentials
- **6 Categories**: All major shopping categories
- **Inventory Records**: Stock levels for all products
- **Ratings & Reviews**: Realistic ratings (4.4-5.0) with review counts
- **Product Images**: Unsplash image URLs for all products
- **All Products Approved**: Ready to display immediately

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Paste SQL
1. Open `seed-sample-products.sql`
2. Copy the entire content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" button

### Step 3: Verify Data
Run these queries to verify:
```sql
-- Check total products
SELECT COUNT(*) FROM products WHERE approval_status = 'approved';
-- Should return: 105

-- Check products by category
SELECT c.name, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.name;

-- View sample products
SELECT title, price, category_id, average_rating, total_reviews
FROM products
ORDER BY created_at DESC
LIMIT 10;
```

## Method 2: Using PostgreSQL Command Line

### If using local PostgreSQL:
```bash
psql -U your_username -d your_database_name -f seed-sample-products.sql
```

### If using Supabase connection string:
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f seed-sample-products.sql
```

## Method 3: Using Node.js Script

Create a file `seed-database.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  try {
    const sql = fs.readFileSync('./seed-sample-products.sql', 'utf8');
    
    // Note: Supabase doesn't support direct SQL execution via JS client
    // You'll need to use the SQL Editor in dashboard
    console.log('Please use Supabase SQL Editor to run the seed file');
    console.log('Or use psql command line tool');
  } catch (error) {
    console.error('Error:', error);
  }
}

seedDatabase();
```

## What Happens After Seeding

### 1. HomePage Will Display:
- **Categories Section**: 6 category cards (Electronics, Fashion, Home, Books, Sports, Toys)
- **Today's Deals**: 8 featured products with high ratings
- **Recommended Products**: 8 additional products

### 2. Products Have:
- ✅ Real product titles and descriptions
- ✅ Realistic prices ($12.99 - $2,499.99)
- ✅ Product images from Unsplash
- ✅ Star ratings (4.4 - 5.0 stars)
- ✅ Review counts (167 - 9,876 reviews)
- ✅ SKU codes for inventory tracking
- ✅ Approved status (visible immediately)
- ✅ Inventory stock (50-150 units each)

### 3. Database Tables Populated:
- `users` - 3 verified sellers
- `categories` - 6 main categories
- `products` - 105 products
- `inventory` - 105 inventory records

## Testing the HomePage

### After seeding, test the HomePage:

1. **Start Backend**:
```bash
cd ecomerce_backend
npm start
```

2. **Start Frontend**:
```bash
cd ecommerce_client
npm run dev
```

3. **Open Browser**:
```
http://localhost:5173
```

4. **You Should See**:
- Category cards with product counts
- Featured products with images
- Prices and ratings
- "Add to Cart" buttons
- No loading errors

## Troubleshooting

### Issue: "Duplicate key value violates unique constraint"
**Solution**: Products already exist. Either:
- Delete existing products: `DELETE FROM products WHERE id LIKE 'prod-%';`
- Or skip the error (products won't be duplicated)

### Issue: "Foreign key violation on seller_id"
**Solution**: Sellers don't exist. Make sure the seller INSERT statements run first.

### Issue: "Column does not exist"
**Solution**: Database schema might be different. Check:
```sql
\d products  -- Shows product table structure
```

### Issue: Images not loading
**Solution**: Unsplash URLs are placeholders. You can:
- Use them as-is (they work)
- Replace with your own image URLs
- Upload images to Supabase Storage

## Customizing the Data

### To add more products:
1. Copy an existing INSERT statement
2. Change the product ID (must be unique)
3. Update title, description, price, image_url
4. Keep the same category_id for grouping
5. Run the INSERT statement

### To change prices:
```sql
UPDATE products 
SET price = price * 0.9  -- 10% discount
WHERE category_id = 'cat-electronics';
```

### To change ratings:
```sql
UPDATE products 
SET average_rating = 4.8, total_reviews = 1000
WHERE id = 'prod-elec-001';
```

## Clearing Sample Data

### To remove all sample products:
```sql
-- Delete inventory first (foreign key constraint)
DELETE FROM inventory WHERE product_id LIKE 'prod-%';

-- Delete products
DELETE FROM products WHERE id LIKE 'prod-%';

-- Delete sample sellers
DELETE FROM users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Delete categories (optional)
DELETE FROM categories WHERE id LIKE 'cat-%';
```

## Next Steps

After seeding:
1. ✅ Verify products appear on HomePage
2. ✅ Test product search and filtering
3. ✅ Test "Add to Cart" functionality
4. ✅ Test category browsing
5. ✅ Add more products as needed
6. ✅ Update product images with real photos

## Summary

- **File**: `seed-sample-products.sql`
- **Products**: 105 across 6 categories
- **Method**: Copy/paste into Supabase SQL Editor
- **Time**: ~30 seconds to run
- **Result**: Fully populated HomePage with real data

Your HomePage will now display beautiful product cards with real data instead of empty states!
