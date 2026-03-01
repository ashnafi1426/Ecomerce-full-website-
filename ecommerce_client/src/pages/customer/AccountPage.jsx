import { Link } from 'react-router-dom'
import { useAppSelector } from '../../hooks/redux'

const AccountPage = () => {
  const { user } = useAppSelector((state) => state.auth)

  const accountCards = [
    {
      icon: '📦',
      title: 'Your Orders',
      description: 'Track, return, or buy things again',
      link: '/orders'
    },
    {
      icon: '🔒',
      title: 'Login & security',
      description: 'Edit login, name, and mobile number',
      link: '/customer/profile'
    },
    {
      icon: '🎁',
      title: 'Prime',
      description: 'View benefits and payment settings',
      link: '#'
    },
    {
      icon: '📍',
      title: 'Your Addresses',
      description: 'Edit addresses for orders and gifts',
      link: '/customer/addresses'
    },
    {
      icon: '💳',
      title: 'Payment options',
      description: 'Edit or add payment methods',
      link: '/customer/payment-methods'
    },
    {
      icon: '💬',
      title: 'Contact Us',
      description: 'Contact our customer service via phone or chat',
      link: '#'
    }
  ]

  const digitalContent = [
    {
      icon: '📱',
      title: 'Your apps and devices',
      description: 'Manage your apps, devices, and digital content',
      link: '#'
    },
    {
      icon: '📚',
      title: 'Content Library',
      description: 'Browse your content in FastShop Drive',
      link: '#'
    },
    {
      icon: '🎵',
      title: 'Digital Services and Device Support',
      description: 'Find device help & support',
      link: '#'
    }
  ]

  const emailAlerts = [
    {
      icon: '📧',
      title: 'Advertising preferences',
      description: 'Manage your advertising preferences',
      link: '#'
    },
    {
      icon: '🔔',
      title: 'Communication preferences',
      description: 'Manage email and mobile notifications',
      link: '#'
    },
    {
      icon: '📬',
      title: 'SMS alert preferences',
      description: 'Manage text message notifications',
      link: '#'
    }
  ]

  const paymentOptions = [
    {
      icon: '💰',
      title: 'FastShop Pay balance',
      description: 'Add money to your balance',
      link: '#'
    },
    {
      icon: '🎁',
      title: 'Gift cards',
      description: 'View balance or redeem a card',
      link: '#'
    },
    {
      icon: '🏦',
      title: 'FastShop Wallet',
      description: 'Manage your wallet and transactions',
      link: '#'
    }
  ]

  const shoppingPreferences = [
    {
      icon: '❤️',
      title: 'Your Lists',
      description: 'View, modify, and share your lists',
      link: '/wishlist'
    },
    {
      icon: '🔄',
      title: 'Subscribe & Save',
      description: 'Manage your Subscribe & Save items',
      link: '#'
    },
    {
      icon: '👤',
      title: 'Your Profile',
      description: 'Manage, add, or remove user profiles',
      link: '/customer/profile'
    },
    {
      icon: '⭐',
      title: 'Your Reviews',
      description: 'View and manage your reviews',
      link: '/customer/reviews'
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: 'FastShop Household',
      description: 'Add family members to share benefits',
      link: '#'
    },
    {
      icon: '🌍',
      title: 'Language settings',
      description: 'Change your language or region',
      link: '#'
    }
  ]

  const otherPrograms = [
    {
      icon: '🏪',
      title: 'Sell on FastShop',
      description: 'Start selling your products today',
      link: '/seller/register'
    },
    {
      icon: '🤝',
      title: 'FastShop Associates',
      description: 'Earn money by promoting products',
      link: '#'
    },
    {
      icon: '💼',
      title: 'Business Account',
      description: 'Register for a business account',
      link: '#'
    }
  ]

  const shoppingPrograms = [
    {
      icon: '🎓',
      title: 'FastShop Student',
      description: 'Exclusive deals for students',
      link: '#'
    },
    {
      icon: '📦',
      title: 'Trade-In Program',
      description: 'Trade in your items for credit',
      link: '#'
    },
    {
      icon: '♻️',
      title: 'Recycling Program',
      description: 'Recycle your old electronics',
      link: '#'
    }
  ]

  const dataPrivacy = [
    {
      icon: '🔐',
      title: 'Request your data',
      description: 'Submit a request for your personal data',
      link: '#'
    },
    {
      icon: '🗑️',
      title: 'Close Your Account',
      description: 'Submit a request to close your account',
      link: '#'
    },
    {
      icon: '🛡️',
      title: 'Privacy Notice',
      description: 'Read our privacy notice',
      link: '#'
    }
  ]

  const recommendations = [
    {
      icon: '📦',
      title: 'Track your recent order',
      description: 'Your order #FS-2024-001235 is out for delivery',
      link: '/tracking'
    },
    {
      icon: '⭐',
      title: 'Review your recent purchase',
      description: 'Share your experience with Wireless Bluetooth Headphones',
      link: '/customer/reviews'
    },
    {
      icon: '🔒',
      title: 'Enable two-factor authentication',
      description: 'Add an extra layer of security to your account',
      link: '/customer/profile'
    },
    {
      icon: '💳',
      title: 'Add a payment method',
      description: 'Save time at checkout by adding a card',
      link: '/customer/payment-methods'
    }
  ]

  const AccountCard = ({ icon, title, description, link }) => (
    <Link
      to={link}
      className="bg-white border border-gray-300 rounded-lg p-5 hover:shadow-lg transition-all duration-200 hover:border-gray-400 block min-h-[120px]"
    >
      <div className="w-20 h-20 mb-4 bg-gray-100 rounded flex items-center justify-center text-4xl">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-snug">{description}</p>
    </Link>
  )

  return (
    <div className="bg-[#EAEDED] min-h-screen">
      <div className="max-w-[1500px] mx-auto px-5 py-5">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-gray-900 mb-1">Your Account</h1>
        </div>

        {/* Main Account Cards */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accountCards.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Digital Content Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Digital content and devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {digitalContent.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Email Alerts Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Email alerts, messages, and ads</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {emailAlerts.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Payment Options Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">More ways to pay</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paymentOptions.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Shopping Preferences Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Ordering and shopping preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shoppingPreferences.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Other Programs Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Other programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherPrograms.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Shopping Programs Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Shopping programs and rentals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shoppingPrograms.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Data Privacy Section */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">Data and privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dataPrivacy.map((card, index) => (
              <AccountCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white border border-gray-300 rounded-lg p-5">
          <h2 className="text-lg font-bold mb-4">Recommended for you</h2>
          
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-center py-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="text-2xl mr-4 w-10 text-center">{rec.icon}</div>
              <div className="flex-1">
                <h4 className="text-sm font-bold mb-1">{rec.title}</h4>
                <p className="text-xs text-gray-600">{rec.description}</p>
              </div>
              <Link
                to={rec.link}
                className="text-[#007185] text-xs font-semibold hover:text-[#C7511F] hover:underline ml-4"
              >
                {rec.title.includes('Track') ? 'Track package' : 
                 rec.title.includes('Review') ? 'Write a review' :
                 rec.title.includes('Enable') ? 'Set up now' : 'Add payment'} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AccountPage
