# Sellers Information

## Current Sellers in Database

### Seller 1: TechStore Pro
- **ID**: `11111111-1111-1111-1111-111111111111`
- **Email**: seller1@fastshop.com
- **Password**: password123 (hashed)
- **Business**: TechStore Pro LLC
- **Status**: Verified & Active
- **Sells**:
  - ✅ Electronics (all 20 products)
  - ✅ Books (all 8 products)
  - ✅ Sports & Outdoors (all 8 products)
  - ✅ Toys & Games (all 8 products)

### Seller 2: Fashion Hub
- **ID**: `22222222-2222-2222-2222-222222222222`
- **Email**: seller2@fastshop.com
- **Password**: password123 (hashed)
- **Business**: Fashion Hub Inc
- **Status**: Verified & Active
- **Sells**:
  - ✅ Fashion (all 20 products)

### Seller 3: Home Essentials
- **ID**: `33333333-3333-3333-3333-333333333333`
- **Email**: seller3@fastshop.com
- **Password**: password123 (hashed)
- **Business**: Home Essentials Co
- **Status**: Verified & Active
- **Sells**:
  - ✅ Home & Kitchen (all 20 products)

---

## Product Distribution by Seller

| Seller | Categories | Total Products |
|--------|-----------|----------------|
| TechStore Pro | Electronics, Books, Sports, Toys | 44 products |
| Fashion Hub | Fashion | 20 products |
| Home Essentials | Home & Kitchen | 20 products |

**TOTAL: 84 products across 3 sellers**

---

## Login Credentials for Testing

You can login as any seller to test the seller dashboard:

### Seller 1 (TechStore Pro)
```
Email: seller1@fastshop.com
Password: password123
```

### Seller 2 (Fashion Hub)
```
Email: seller2@fastshop.com
Password: password123
```

### Seller 3 (Home Essentials)
```
Email: seller3@fastshop.com
Password: password123
```

---

## How to Verify Sellers in Database

After running the seed files, check sellers with this query:

```sql
SELECT 
  display_name,
  business_name,
  email,
  seller_verification_status,
  status,
  (SELECT COUNT(*) FROM products WHERE seller_id = users.id) as product_count
FROM users
WHERE role = 'seller'
ORDER BY display_name;
```

Expected result:
```
display_name      | business_name          | email                    | product_count
------------------|------------------------|--------------------------|---------------
Fashion Hub       | Fashion Hub Inc        | seller2@fastshop.com     | 20
Home Essentials   | Home Essentials Co     | seller3@fastshop.com     | 20
TechStore Pro     | TechStore Pro LLC      | seller1@fastshop.com     | 44
```

---

## Products by Seller Query

To see which products each seller has:

```sql
-- TechStore Pro products
SELECT title, price, c.name as category
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE seller_id = '11111111-1111-1111-1111-111111111111'
ORDER BY c.name, title;

-- Fashion Hub products
SELECT title, price, c.name as category
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE seller_id = '22222222-2222-2222-2222-222222222222'
ORDER BY title;

-- Home Essentials products
SELECT title, price, c.name as category
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE seller_id = '33333333-3333-3333-3333-333333333333'
ORDER BY title;
```

---

## Notes

- All sellers are **verified** and **active**
- All products are **approved** and ready to sell
- Password hash is for "password123" (bcrypt)
- You can login to seller dashboard with any of these accounts
- Each seller can manage only their own products
