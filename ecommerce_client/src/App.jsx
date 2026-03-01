import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Contexts
import { SocketProvider } from './contexts/SocketContext'
import { ChatProvider } from './contexts/ChatContext'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import AuthLayout from './layouts/AuthLayout'
import SellerLayout from './layouts/SellerLayout'
import AdminLayout from './layouts/AdminLayout'
import ManagerLayout from './layouts/ManagerLayout'

// Auth Pages
import LoginPageMinimal from './pages/auth/LoginPageMinimal'
import RegisterPage from './pages/auth/RegisterPage'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import AccountPage from './pages/customer/AccountPage'
import ProductPageSimple from './pages/customer/ProductPageSimple'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import WishlistPage from './pages/customer/WishlistPage'
import TrackingPage from './pages/customer/TrackingPage'
import CustomerProfilePage from './pages/customer/CustomerProfilePage'
import CustomerAddressesPage from './pages/customer/CustomerAddressesPage'
import CustomerPaymentMethodsPage from './pages/customer/CustomerPaymentMethodsPage'
import CustomerReviewsPage from './pages/customer/CustomerReviewsPage'
import CustomerReturnsPage from './pages/customer/CustomerReturnsPage'
import CategoryPage from './pages/customer/CategoryPage'
import SearchPage from './pages/customer/SearchPage'
import GuestCheckoutPage from './pages/customer/GuestCheckoutPage'
import OrderTrackingPage from './pages/customer/OrderTrackingPage'
import SellersListPage from './pages/customer/SellersListPage'
import CustomerViewSellerProfilePage from './pages/customer/SellerProfilePage'
import CategoriesPage from './pages/customer/CategoriesPage'
import DealsPage from './pages/customer/DealsPage'
import CustomerServicePage from './pages/customer/CustomerServicePage'
import RecommendationsPage from './pages/customer/RecommendationsPage'
import BrowsingHistoryPage from './pages/customer/BrowsingHistoryPage'
import RegistryPage from './pages/customer/RegistryPage'
import GiftCardsPage from './pages/customer/GiftCardsPage'
import PrimePage from './pages/customer/PrimePage'

// Seller Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage'
import SellerProductsPage from './pages/seller/SellerProductsPage'
import SellerAddProductPage from './pages/seller/SellerAddProductPage'
import SellerEditProductPage from './pages/seller/SellerEditProductPage'
import SellerInventoryPage from './pages/seller/SellerInventoryPage'
import SellerBulkUploadPage from './pages/seller/SellerBulkUploadPage'
import SellerOrdersPageEnhanced from './pages/seller/SellerOrdersPageEnhanced'
import SellerShippingPage from './pages/seller/SellerShippingPage'
import SellerReturnsPage from './pages/seller/SellerReturnsPage'
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage'
import SellerPerformancePage from './pages/seller/SellerPerformancePage'
import SellerReviewsPage from './pages/seller/SellerReviewsPage'
import SellerPayoutsPage from './pages/seller/SellerPayoutsPage'
import SellerPaymentsPage from './pages/seller/SellerPaymentsPage'
import SellerCommissionsPage from './pages/seller/SellerCommissionsPage'
import SellerInvoicesPage from './pages/seller/SellerInvoicesPage'
import SellerDisputesPage from './pages/seller/SellerDisputesPage'
import SellerMessagesPage from './pages/seller/SellerMessagesPage'
import SellerProfilePage from './pages/seller/SellerProfilePage'
import SellerSettingsPage from './pages/seller/SellerSettingsPage'
import SellerRegisterPage from './pages/seller/SellerRegisterPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSellersPage from './pages/admin/AdminSellersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminCommissionSettingsPage from './pages/admin/AdminCommissionSettingsPage'
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage'
import AdminLogsPage from './pages/admin/AdminLogsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminManagersPage from './pages/admin/AdminManagersPage'
import AdminRolesPageProfessional from './pages/admin/AdminRolesPageProfessional'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminBrandsPage from './pages/admin/AdminBrandsPage'
import AdminProductApprovalsPage from './pages/admin/AdminProductApprovalsPage'
import AdminRefundsPage from './pages/admin/AdminRefundsPage'
import AdminSellerEarningsPage from './pages/admin/AdminSellerEarningsPage'

// Manager Pages
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage'
import ManagerProductApprovalsPage from './pages/manager/ManagerProductApprovalsPage'
import ManagerSellerApprovalsPage from './pages/manager/ManagerSellerApprovalsPage'
import ManagerOrdersPage from './pages/manager/ManagerOrdersPage'
import ManagerReturnsPage from './pages/manager/ManagerReturnsPage'
import ManagerDisputesPage from './pages/manager/ManagerDisputesPage'
import ManagerRefundsPage from './pages/manager/ManagerRefundsPage'
import ManagerSupportTicketsPage from './pages/manager/ManagerSupportTicketsPage'
import ManagerEscalationsPage from './pages/manager/ManagerEscalationsPage'
import ManagerPerformancePage from './pages/manager/ManagerPerformancePage'
import ManagerSellerPerformancePage from './pages/manager/ManagerSellerPerformancePage'
import ManagerReviewModerationPage from './pages/manager/ManagerReviewModerationPage'
import ManagerCustomerFeedbackPage from './pages/manager/ManagerCustomerFeedbackPage'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SocketProvider>
        <ChatProvider>
          <Toaster position="top-right" />
          <Routes>
        {/* Auth Routes - Standalone */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPageMinimal />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/seller-register" element={<SellerRegisterPage />} />
        <Route path="/seller/register" element={<SellerRegisterPage />} />

        {/* Customer Routes - All use CustomerLayout */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="product/:id" element={<ProductPageSimple />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="customer-service" element={<CustomerServicePage />} />
          <Route path="registry" element={<RegistryPage />} />
          <Route path="gift-cards" element={<GiftCardsPage />} />
          <Route path="prime" element={<PrimePage />} />
          <Route path="sellers" element={<SellersListPage />} />
          <Route path="seller/:sellerId/profile" element={<CustomerViewSellerProfilePage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          
          {/* Guest Routes */}
          <Route path="guest-checkout" element={<GuestCheckoutPage />} />
          <Route path="track-order" element={<OrderTrackingPage />} />
          
          {/* Protected Customer Routes */}
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="tracking/:orderId" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
          <Route path="browsing-history" element={<ProtectedRoute><BrowsingHistoryPage /></ProtectedRoute>} />
          <Route path="returns" element={<ProtectedRoute><CustomerReturnsPage /></ProtectedRoute>} />
          <Route path="customer/returns" element={<ProtectedRoute><CustomerReturnsPage /></ProtectedRoute>} />
          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="account/profile" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="account/addresses" element={<ProtectedRoute><CustomerAddressesPage /></ProtectedRoute>} />
          <Route path="account/payment-methods" element={<ProtectedRoute><CustomerPaymentMethodsPage /></ProtectedRoute>} />
          <Route path="account/reviews" element={<ProtectedRoute><CustomerReviewsPage /></ProtectedRoute>} />
          <Route path="account/returns" element={<ProtectedRoute><CustomerReturnsPage /></ProtectedRoute>} />
        </Route>

        {/* Seller Routes */}
        <Route path="/seller" element={<ProtectedRoute roles={['seller']}><SellerLayout /></ProtectedRoute>}>
          <Route index element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="products/add" element={<SellerAddProductPage />} />
          <Route path="products/edit/:id" element={<SellerEditProductPage />} />
          <Route path="inventory" element={<SellerInventoryPage />} />
          <Route path="bulk-upload" element={<SellerBulkUploadPage />} />
          <Route path="orders" element={<SellerOrdersPageEnhanced />} />
          <Route path="shipping" element={<SellerShippingPage />} />
          <Route path="returns" element={<SellerReturnsPage />} />
          <Route path="analytics" element={<SellerAnalyticsPage />} />
          <Route path="performance" element={<SellerPerformancePage />} />
          <Route path="reviews" element={<SellerReviewsPage />} />
          <Route path="payments" element={<SellerPaymentsPage />} />
          <Route path="payouts" element={<SellerPayoutsPage />} />
          <Route path="commissions" element={<SellerCommissionsPage />} />
          <Route path="invoices" element={<SellerInvoicesPage />} />
          <Route path="disputes" element={<SellerDisputesPage />} />
          <Route path="messages" element={<SellerMessagesPage />} />
          <Route path="profile" element={<SellerProfilePage />} />
          <Route path="settings" element={<SellerSettingsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="sellers" element={<AdminSellersPage />} />
          <Route path="managers" element={<AdminManagersPage />} />
          <Route path="roles" element={<AdminRolesPageProfessional />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="product-approvals" element={<AdminProductApprovalsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="seller-earnings" element={<AdminSellerEarningsPage />} />
          <Route path="commission-settings" element={<AdminCommissionSettingsPage />} />
          <Route path="payouts" element={<AdminPayoutsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ProtectedRoute roles={['manager']}><ManagerLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="product-approvals" element={<ManagerProductApprovalsPage />} />
          <Route path="seller-approvals" element={<ManagerSellerApprovalsPage />} />
          <Route path="orders" element={<ManagerOrdersPage />} />
          <Route path="returns" element={<ManagerReturnsPage />} />
          <Route path="disputes" element={<ManagerDisputesPage />} />
          <Route path="refunds" element={<ManagerRefundsPage />} />
          <Route path="support-tickets" element={<ManagerSupportTicketsPage />} />
          <Route path="escalations" element={<ManagerEscalationsPage />} />
          <Route path="performance" element={<ManagerPerformancePage />} />
          <Route path="seller-performance" element={<ManagerSellerPerformancePage />} />
          <Route path="review-moderation" element={<ManagerReviewModerationPage />} />
          <Route path="customer-feedback" element={<ManagerCustomerFeedbackPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
              <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
              <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Go Home
              </a>
            </div>
          </div>
        } />
      </Routes>
        </ChatProvider>
      </SocketProvider>
    </Router>
  )
}

export default App
