const Footer = () => {
  return (
    <footer className="bg-amazon-950 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm">
              <li>Careers</li>
              <li>Press</li>
              <li>About Us</li>
            </ul>
          </div>

          {/* Make Money */}
          <div>
            <h3 className="text-lg font-bold mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-sm">
              <li>Sell on ProShop</li>
              <li>Become a Partner</li>
            </ul>
          </div>

          {/* ProShop Help */}
          <div>
            <h3 className="text-lg font-bold mb-4">ProShop Help</h3>
            <ul className="space-y-2 text-sm">
              <li>Your Account</li>
              <li>Returns Centre</li>
              <li>Track Order</li>
            </ul>
          </div>

          {/* Let Us Help You */}
          <div>
            <h3 className="text-lg font-bold mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-sm">
              <li>Help Centre</li>
              <li>Payment Methods</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amazon-50 mt-12 pt-8 text-sm text-center">
          <p>&copy; 2024 ProShop AI. All rights reserved. Inspired by Amazon/Flipkart.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

