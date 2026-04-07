# creativepotterystudio - Modern eCommerce Platform

A comprehensive eCommerce website built with Next.js, featuring both user and admin roles with a modern, responsive design optimized for mobile devices.

## 🚀 Features

### 👤 User Features
- **Authentication**: Sign up, login, logout, and password recovery
- **Product Browsing**: Browse products by categories with advanced filtering and search
- **Product Details**: Detailed product pages with images, specifications, and reviews
- **Shopping Cart**: Add, remove, and update items in cart
- **Wishlist**: Save favorite products for later
- **Checkout**: Multi-step checkout process with shipping and payment
- **Order Management**: View order history and track order status
- **Profile Management**: Edit profile, manage addresses, and account settings
- **Mobile-First Design**: Bottom navigation bar for easy mobile navigation

### 👨‍💼 Admin Features
- **Dashboard**: Sales summary, recent orders, and user statistics
- **Product Management**: Add, edit, and delete products
- **Order Management**: View and update order status
- **User Management**: View and manage user accounts
- **Analytics**: Sales reports and performance metrics

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── cart/              # Shopping cart
│   ├── categories/        # Product categories
│   ├── checkout/          # Checkout process
│   ├── login/             # Authentication
│   ├── orders/            # Order management
│   ├── products/          # Product pages
│   ├── profile/           # User profile
│   └── search/            # Product search
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── forms/            # Form components
├── contexts/             # React contexts
├── data/                 # Dummy data
├── hooks/                # Custom hooks
├── lib/                  # Utilities and types
│   ├── api/             # API functions
│   ├── types/           # TypeScript types
│   └── utils/           # Helper functions
└── styles/              # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd creative-ecom/fe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Demo Accounts

### Admin Account
- **Email**: admin@example.com
- **Password**: password
- **Access**: Full admin dashboard and management features

### User Account
- **Email**: john@example.com
- **Password**: password
- **Access**: Standard user features

## 📱 Mobile Experience

The application is designed with a mobile-first approach featuring:
- **Bottom Navigation Bar**: Easy access to main sections (Home, Categories, Cart, Profile, More)
- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly Interface**: Large buttons and intuitive gestures
- **Fast Loading**: Optimized performance for mobile devices

## 🎨 Design Features

- **Modern UI**: Clean, professional design with consistent spacing
- **Dark/Light Theme**: Adaptive color schemes
- **Smooth Animations**: Subtle transitions and hover effects
- **Accessibility**: WCAG compliant with proper contrast and keyboard navigation
- **Loading States**: Skeleton screens and loading indicators

## 🛒 E-commerce Features

### Product Management
- Product catalog with categories and subcategories
- Advanced search and filtering
- Product images with zoom functionality
- Customer reviews and ratings
- Stock management and availability

### Shopping Experience
- Shopping cart with persistent storage
- Wishlist functionality
- Multi-step checkout process
- Multiple payment methods (Credit Card, PayPal, Stripe)
- Order tracking and history

### Admin Dashboard
- Real-time sales analytics
- Order management system
- Product inventory management
- User account management
- Sales reports and insights

## 🔧 Customization

### Adding New Features
1. Create new pages in the `app/` directory
2. Add components in the `components/` directory
3. Update types in `lib/types/index.ts`
4. Add API functions in `lib/api/index.ts`

### Styling
- Uses Tailwind CSS for styling
- Custom components in `components/ui/`
- Responsive breakpoints: sm, md, lg, xl

### Data Management
- Uses the API client in `lib/api/index.ts` for frontend data fetching
- Easy to integrate with real APIs
- Context providers for state management

## 📈 Performance

- **Next.js Optimization**: Automatic code splitting and optimization
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Size**: Optimized bundle with tree shaking
- **Caching**: Efficient caching strategies
- **SEO**: Meta tags and structured data

## 🧪 Testing

The application includes:
- TypeScript for type safety
- ESLint for code quality
- Responsive design testing
- Cross-browser compatibility

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**creativepotterystudio** - Modern eCommerce made simple and beautiful.