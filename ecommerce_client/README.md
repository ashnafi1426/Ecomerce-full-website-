# FastShop React Frontend

A complete e-commerce frontend built with React, Vite, and Tailwind CSS.

## Features

- 🛒 Full e-commerce functionality
- 🎨 Amazon-style professional design
- 🔐 JWT authentication
- 🛍️ Shopping cart with Redux
- 💳 Stripe payment integration
- 📱 Fully responsive
- ⚡ Fast with Vite
- 🎯 Role-based access (Customer, Seller, Admin, Manager)

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **Stripe** - Payment processing

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
VITE_API_URL=http://localhost:5004/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Header.jsx
│   ├── Footer.jsx
│   └── ProtectedRoute.jsx
├── layouts/          # Layout components
│   ├── CustomerLayout.jsx
│   ├── SellerLayout.jsx
│   ├── AdminLayout.jsx
│   ├── ManagerLayout.jsx
│   └── AuthLayout.jsx
├── pages/            # Page components
│   ├── auth/
│   ├── customer/
│   ├── seller/
│   ├── admin/
│   └── manager/
├── store/            # Redux store
│   ├── index.js
│   └── slices/
├── config/           # Configuration
│   └── api.js
├── hooks/            # Custom hooks
│   └── redux.js
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Available Routes

### Public Routes
- `/` - Home page
- `/product/:id` - Product details
- `/cart` - Shopping cart
- `/login` - Login page
- `/register` - Registration page

### Customer Routes (Protected)
- `/account` - Account dashboard
- `/orders` - Order history
- `/wishlist` - Wishlist
- `/checkout` - Checkout process
- `/customer/profile` - Profile settings
- `/customer/addresses` - Address management
- `/customer/payment-methods` - Payment methods
- `/customer/reviews` - User reviews
- `/customer/returns` - Return requests

### Seller Routes (Protected)
- `/seller/dashboard` - Seller dashboard
- `/seller/products` - Product management
- `/seller/orders` - Order management
- And more...

### Admin Routes (Protected)
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/products` - Product management
- And more...

### Manager Routes (Protected)
- `/manager/dashboard` - Manager dashboard
- `/manager/approvals` - Approval management
- And more...

## State Management

The app uses Redux Toolkit for state management with the following slices:

- **authSlice** - Authentication state
- **cartSlice** - Shopping cart state
- **productSlice** - Product data

## API Integration

All API calls are made through the configured Axios instance in `src/config/api.js` which includes:

- Request interceptors (adds JWT token)
- Response interceptors (handles errors)
- Base URL configuration
- Auto-logout on 401 errors

## Styling

The app uses Tailwind CSS with custom Amazon-style colors:

- `amazon-orange`: #FF9900
- `amazon-dark`: #131921
- `amazon-light`: #232F3E
- `amazon-blue`: #146EB4

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details
