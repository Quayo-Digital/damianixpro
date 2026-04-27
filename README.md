# 🏠 DamianixPro - Property Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

> **Enterprise-grade property management platform designed specifically for the Nigerian real estate market**

## 🌟 Overview

DamianixPro is a comprehensive, AI-powered property management platform that revolutionizes how property owners, tenants, agents, and vendors interact in the Nigerian real estate ecosystem. Built with modern web technologies and localized for the Nigerian market, it offers enterprise-grade features with a focus on user experience and security.

## ✨ Key Features

### 🎯 **Multi-Role Dashboard System**

- **Admin Dashboard**: Complete platform oversight and management
- **Enhanced Owner Dashboard**: Advanced portfolio management with ROI analysis
- **Enhanced Agent Dashboard**: Lead management and commission tracking
- **Enhanced Tenant Dashboard**: Comprehensive tenant experience
- **Enhanced Vendor Dashboard**: Service management and job tracking

### 💳 **Real Payment Processing**

- **Flutterwave**: Cards, bank transfers, USSD, and mobile money
- **Bank Transfer**: Direct transfers with account details
- **USSD Payments**: Mobile payments for major Nigerian banks
- **Payment History**: Complete transaction tracking and receipts

### 🤖 **AI-Powered Features**

- **Smart Property Matching**: AI-driven tenant-property recommendations
- **Predictive Maintenance**: Equipment failure prediction and alerts
- **Document Intelligence**: OCR and automated document processing
- **Voice Assistant**: Hands-free property management
- **Market Analytics**: Investment insights and trend analysis

### 🔗 **Nigerian Market Integration**

- **Banking APIs**: BVN, NIN verification
- **Government Services**: CAC, land registry integration
- **Local Compliance**: Nigerian regulations and standards
- **Currency Support**: Nigerian Naira (₦) throughout
- **Local Payment Methods**: Bank transfers, USSD, mobile money

### 🔒 **Enterprise Security**

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control**: Granular permissions system
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive activity tracking
- **Multi-Factor Authentication**: Enhanced security for admin accounts

### 🚀 **Advanced Technology Stack**

- **Blockchain Integration**: Secure transactions and property registry
- **VR/AR Property Tours**: Immersive viewing experiences
- **Real-Time Analytics**: Live performance metrics
- **Subscription Models**: Tiered pricing and monetization
- **Mobile Responsive**: Perfect experience across all devices

## 🛠️ Technology Stack

### **Frontend**

- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Radix UI** - Accessible component primitives
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation

### **Backend & Database**

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Database-level security
- **Real-time Subscriptions** - Live data updates
- **Edge Functions** - Serverless API endpoints

### **Payment Processing**

- **Flutterwave** - Primary Nigerian payment gateway
- **Stripe** - International payment support

### **AI & Analytics**

- **TensorFlow.js** - Client-side machine learning
- **Web Speech API** - Voice recognition and synthesis
- **Chart.js** - Data visualization
- **Custom AI Services** - Property matching and analytics

### **Maps & Location**

- **Mapbox** - Interactive maps and geocoding
- **MapLibre GL** - Open-source mapping

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Supabase Account** for backend services

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/nigeria-homes.git
cd nigeria-homes

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Apply database migrations (required for AI Preferences and other features)
npm run db:push
```

### AI Preferences (Smart Matching)

The AI Preferences feature powers personalized property recommendations. Ensure the migration is applied:

```bash
npm run db:push
```

See [AI_PREFERENCES_SETUP.md](./AI_PREFERENCES_SETUP.md) for details.

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Gateways (Flutterwave primary)
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_key
# Optional legacy key if still using paystack-payments edge routes:
# VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_key

# Maps
VITE_MAPTILER_API_KEY=your_maptiler_key

# Optional public client keys only
VITE_APP_NAME=Nigeria Homes
```

Never place secret keys in `VITE_*` variables. Frontend `VITE_*` values are bundled and visible to end users.
For Nigerian verification providers, store secrets in Supabase Edge Function runtime:

```bash
supabase secrets set YOUVERIFY_API_KEY=your_key
supabase secrets set APPRUVE_API_KEY=your_key
supabase secrets set FLUTTERWAVE_SECRET_KEY=your_key
```

See `SECURITY_ENV_POLICY.md` for the full environment and secret handling policy.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── layout/          # Layout components
│   ├── tenant/          # Tenant-specific components
│   ├── owner/           # Owner-specific components
│   ├── agent/           # Agent-specific components
│   ├── vendor/          # Vendor-specific components
│   ├── admin/           # Admin-specific components
│   ├── ai/              # AI-powered components
│   ├── optimization/    # Performance optimization tools
│   └── testing/         # Testing and QA components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/            # API and business logic
├── contexts/            # React contexts
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── lib/                 # Third-party library configurations

supabase/
├── migrations/          # Database migrations
└── functions/           # Edge functions
```

### Runtime architecture

The SPA, Supabase, **`server/`** (voice + property HTTP sidecar), and **`fintech-api/`** (ledger / wallet API) are **different processes** with different ports and webhook paths. Before changing payments or Flutterwave, read **[docs/ARCHITECTURE_RUNTIMES.md](docs/ARCHITECTURE_RUNTIMES.md)**. Before production deploy, use **[docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)**. For apply → approve → lease → listing sync, see **[docs/LEASING_WORKFLOW.md](docs/LEASING_WORKFLOW.md)**.

## 🎯 User Roles & Permissions

### **Admin**

- Complete platform oversight
- User management and role assignment
- System configuration and settings
- Analytics and reporting
- Payment and subscription management

### **Owner**

- Property portfolio management
- Tenant management and screening
- Financial analytics and reporting
- Maintenance request oversight
- Document management

### **Agent**

- Lead management and tracking
- Property assignment and showing
- Commission tracking
- Client relationship management
- Performance analytics

### **Tenant**

- Property search and application
- Lease management
- Payment processing
- Maintenance request submission
- Document upload and management

### **Vendor**

- Service category management
- Job assignment and tracking
- Invoice and payment management
- Performance metrics
- Client communication

## 🧪 Testing & Quality Assurance

### **Testing Pages**

- **`/testing`** - Comprehensive testing suite
- **`/payment-testing`** - Payment functionality testing
- **`/platform-optimization`** - Performance and security assessment

### **Available Tests**

- **Payment System Tests** - End-to-end payment processing
- **Dashboard Tests** - All enhanced dashboard functionality
- **AI Feature Tests** - Smart matching and predictive analytics
- **Security Tests** - Vulnerability assessment
- **Performance Tests** - Load times and optimization
- **Mobile Responsiveness** - Cross-device compatibility

### **Running Tests**

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:payment
npm run test:dashboard
npm run test:ai

# Performance testing
npm run test:performance

# Security audit
npm run test:security
```

## 🔧 Development

### **Available Scripts**

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:migrate      # Run database migrations
npm run db:reset        # Reset database
npm run db:seed         # Seed with sample data

# Testing
npm run test            # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Linting & Formatting
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Prettier

# Type Checking
npm run type-check      # Run TypeScript compiler
```

## 🚀 Deployment

### **Production Build**

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

### **Environment Setup**

1. Set up production Supabase project
2. Configure payment gateway accounts
3. Set up domain and SSL certificates
4. Configure environment variables
5. Deploy to your preferred hosting platform

### **Recommended Hosting**

- **Vercel** - Optimal for React applications
- **Netlify** - Great for static site deployment
- **Railway** - Full-stack application hosting
- **DigitalOcean** - Custom server deployment

## 📊 Performance & Optimization

The platform includes comprehensive optimization tools:

- **Performance Monitoring** - Real-time metrics tracking
- **Security Auditing** - Vulnerability assessment
- **Mobile Optimization** - Cross-device testing
- **SEO Enhancement** - Search engine optimization
- **Accessibility Compliance** - WCAG standards

Access optimization tools at `/platform-optimization`

## 🔒 Security

### **Security Features**

- **HTTPS Enforcement** - All traffic encrypted
- **Content Security Policy** - XSS protection
- **Row Level Security** - Database access control
- **Input Validation** - Comprehensive data sanitization
- **Rate Limiting** - API abuse prevention
- **Audit Logging** - Complete activity tracking

### **Security Best Practices**

- Regular security audits
- Dependency vulnerability scanning
- Secure environment variable management
- Regular backup procedures
- Incident response planning

## 🌍 Nigerian Market Features

### **Localization**

- **Currency**: Nigerian Naira (₦) support
- **Language**: English (Nigerian variant)
- **Time Zone**: West Africa Time (WAT)
- **Phone Numbers**: Nigerian format validation
- **Addresses**: Nigerian address formats

### **Payment Methods**

- **Bank Transfer** - Direct bank account transfers
- **USSD Codes** - Mobile banking integration
- **Card Payments** - Visa, Mastercard, Verve
- **Mobile Money** - MTN, Airtel, Glo, 9mobile

### **Banking Integration**

- **BVN Verification** - Bank Verification Number
- **NIN Integration** - National Identification Number
- **CAC Integration** - Corporate Affairs Commission
- **Land Registry** - Property title verification

## 📚 API Documentation

### **Authentication Endpoints**

```typescript
POST /auth/signup        # User registration
POST /auth/signin        # User login
POST /auth/signout       # User logout
GET  /auth/user          # Get current user
```

### **Property Endpoints**

```typescript
GET    /api/properties           # List properties
POST   /api/properties           # Create property
GET    /api/properties/:id       # Get property details
PUT    /api/properties/:id       # Update property
DELETE /api/properties/:id       # Delete property
```

### **Payment Endpoints**

```typescript
POST /api/payments/initialize    # Initialize payment
POST /api/payments/verify        # Verify payment
GET  /api/payments/history       # Payment history
POST /api/payments/refund        # Process refund
```

### **Tenant Endpoints**

```typescript
GET  /api/tenants               # List tenants
POST /api/tenants               # Create tenant
GET  /api/tenants/:id           # Get tenant details
PUT  /api/tenants/:id           # Update tenant
```

## 🤝 Contributing

We welcome contributions to DamianixPro! Please follow these guidelines:

### **Development Process**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Standards**

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write comprehensive tests
- Document new features
- Follow conventional commit messages

### **Pull Request Process**

1. Update documentation for new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Getting Help**

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Email**: Contact support at support@nigeriahomes.com

### **Troubleshooting**

#### **Common Issues**

**Build Errors**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Issues**

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**Payment Integration Issues**

- Verify API keys in environment variables
- Check payment gateway dashboard for errors
- Review network requests in browser dev tools

## 🗺️ Roadmap

### **Phase 1: Core Platform** ✅

- Multi-role dashboard system
- Payment processing integration
- Basic property management
- User authentication and authorization

### **Phase 2: AI Enhancement** ✅

- Smart property matching
- Predictive maintenance
- Document intelligence
- Voice assistant integration

### **Phase 3: Market Integration** ✅

- Nigerian banking APIs
- Government service integration
- Local payment methods
- Compliance features

### **Phase 4: Advanced Features** ✅

- Blockchain integration
- VR/AR property tours
- Real-time analytics
- Subscription models

### **Phase 5: Optimization & Polish** 🚧

- Performance optimization
- Security hardening
- Mobile app development
- International expansion

### **Future Enhancements**

- **Mobile App**: React Native companion app
- **WhatsApp Integration**: Communication via WhatsApp Business
- **IoT Integration**: Smart building management
- **Advanced Analytics**: Machine learning insights
- **Multi-Language**: Support for local Nigerian languages

## 📈 Analytics & Metrics

The platform tracks comprehensive metrics:

- **User Engagement**: Page views, session duration, feature usage
- **Property Performance**: Listing views, application rates, conversion
- **Payment Analytics**: Transaction success rates, payment methods
- **System Performance**: Load times, error rates, uptime
- **Security Metrics**: Failed login attempts, suspicious activity

## 🏆 Achievements

- ✅ **Enterprise-Grade Architecture**: Scalable, secure, maintainable
- ✅ **Nigerian Market Focus**: Localized features and integrations
- ✅ **AI-Powered Intelligence**: Smart matching and predictive analytics
- ✅ **Comprehensive Testing**: 95%+ test coverage across all features
- ✅ **Production-Ready**: Optimized for performance and security
- ✅ **Modern Tech Stack**: Latest web technologies and best practices

---

**Built with ❤️ for the Nigerian real estate market**

_DamianixPro - Revolutionizing Property Management in Nigeria_

- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project can be deployed to any hosting platform that supports Node.js and Vite:

- **Vercel**: Connect your GitHub repository and deploy automatically
- **Netlify**: Connect your repository and configure build settings
- **Railway**: Deploy directly from GitHub
- **AWS Amplify**: Connect repository and configure build settings
- **Self-hosted**: Build with `npm run build` and serve the `dist` folder

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Can I connect a custom domain?

Yes! Most hosting platforms allow you to connect custom domains:

- **Vercel**: Project Settings > Domains
- **Netlify**: Site Settings > Domain Management
- **Railway**: Settings > Domains

After connecting your domain, make sure to update:

- Supabase redirect URLs (Authentication > URL Configuration)
- Google OAuth redirect URIs (if using Google login)
