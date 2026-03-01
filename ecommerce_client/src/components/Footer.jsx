const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto" style={{ width: '100%', margin: 0, padding: 0 }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '40px 16px' }}>
        <div className="responsive-grid">
          <div>
            <h3 className="responsive-heading-sm mb-4">Get to Know Us</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">About Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Press Releases</a></li>
            </ul>
          </div>
          <div>
            <h3 className="responsive-heading-sm mb-4">Make Money with Us</h3>
            <ul className="space-y-2">
              <li><a href="/seller-register" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Sell on FastShop</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Become an Affiliate</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Advertise Your Products</a></li>
            </ul>
          </div>
          <div>
            <h3 className="responsive-heading-sm mb-4">Let Us Help You</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Your Account</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Your Orders</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Help</a></li>
            </ul>
          </div>
          <div>
            <h3 className="responsive-heading-sm mb-4">FastShop</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Customer Service</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Returns</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors responsive-body-sm">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center">
          <p className="text-gray-300 responsive-body-sm">&copy; 2024 FastShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer