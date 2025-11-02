# Nephra - Technology Innovation Platform

A production-grade, enterprise-style web platform that connects students with cutting-edge research projects, providing mentorship opportunities and hands-on experience in technology innovation.

## 🚀 Features

### Core Functionality
- **Public Organization Showcase**: Professional website showcasing Nephra's mission, team, projects, and contact information
- **Student Portal**: Project browsing, application system, and personal dashboard
- **Admin Dashboard**: Complete project management, user administration, and analytics
- **Authentication**: Google OAuth and email/password authentication with role-based access control
- **Project Application Workflow**: Multi-step approval process with admin review and student tracking

### Technical Features
- **Modern Tech Stack**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, Real-time)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth integration
- **UI/UX**: Responsive design with dark/light theme support
- **Accessibility**: WCAG AA compliant with semantic HTML and ARIA attributes
- **Performance**: Optimized with code splitting, lazy loading, and CDN-ready assets

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Layout/           # Header, Footer, Layout components
│   ├── UI/               # Reusable UI components (Button, Card, etc.)
│   └── forms/            # Form components
├── pages/
│   ├── Home.jsx          # Landing page
│   ├── About.jsx         # About page
│   ├── Projects/         # Project listing and details
│   ├── Auth/             # Authentication pages
│   ├── User/             # User dashboard and profile
│   └── Admin/            # Admin dashboard and management
├── context/
│   ├── AuthContext.jsx   # Authentication state management
│   └── ThemeContext.jsx  # Theme management
├── services/
│   └── supabaseClient.js # Supabase configuration and helpers
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
└── styles/               # Global styles and CSS
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth interactions
- **React Router** - Client-side routing
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **Zustand** - State management
- **React Hot Toast** - Toast notifications

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with Row-Level Security
  - Authentication with Google OAuth
  - Real-time subscriptions
  - File storage
  - Edge functions (optional)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** - End-to-end testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Cloud Console account (for OAuth)

### 1. Clone and Install
```bash
git clone <repository-url>
cd nephra
npm install
```

### 2. Environment Setup
Copy the environment template and fill in your values:
```bash
cp env.example .env
```

Required environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Settings
VITE_APP_NAME=Nephra
VITE_APP_URL=http://localhost:3000
```

### 3. Database Setup
Run the database schema and seed data:
```bash
# Apply database schema
# (Run the SQL in scripts/schema.sql in your Supabase SQL editor)

# Seed with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Authentication**
   - Enable Google OAuth in Authentication > Providers
   - Add your Google OAuth credentials
   - Set redirect URL: `http://localhost:3000/auth/callback`

3. **Database Setup**
   - Run the SQL schema from `scripts/schema.sql`
   - Enable Row Level Security on all tables
   - Create storage buckets for file uploads

### Google OAuth Setup

1. **Google Cloud Console**
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)

2. **Configure Supabase**
   - Add Google Client ID and Secret to Supabase Auth settings
   - Set redirect URL in Supabase dashboard

## 📊 Database Schema

### Core Tables
- **users** - User profiles and authentication data
- **projects** - Research projects and case studies
- **project_requests** - Student applications to projects
- **audit_logs** - System activity and admin actions
- **site_content** - CMS content management
- **events** - Organization events and announcements
- **notifications** - User notifications
- **file_uploads** - File metadata and storage references

### Key Features
- Row-Level Security (RLS) policies for data protection
- Audit logging for compliance and security
- Flexible user roles (user, mentor, reviewer, admin, superadmin)
- Comprehensive project management with status tracking

## 🎨 Design System

### Color Palette
- **Primary**: Professional blue tones (#0ea5e9)
- **Secondary**: Muted teal accents (#14b8a6)
- **Accent**: Neutral grays for text and backgrounds
- **Status Colors**: Success (green), Warning (yellow), Error (red)

### Typography
- **Font Family**: Inter (primary), JetBrains Mono (code)
- **Responsive**: Mobile-first design with breakpoints
- **Accessibility**: WCAG AA contrast ratios

### Components
- **Design Tokens**: Consistent spacing, colors, and typography
- **Reusable Components**: Button, Card, Input, Modal, etc.
- **Animation**: Smooth transitions with Framer Motion
- **Theme Support**: Light and dark mode with system preference detection

## 🔐 Security Features

### Authentication & Authorization
- **Multi-factor Authentication**: Email verification and password reset
- **Role-Based Access Control**: Granular permissions system
- **Session Management**: Secure token handling with automatic refresh
- **OAuth Integration**: Google SSO for enterprise compatibility

### Data Protection
- **Row-Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Type and size restrictions
- **Rate Limiting**: API endpoint protection
- **GDPR Compliance**: Data export and deletion capabilities

### Security Headers
- **HTTPS Enforcement**: Secure communication
- **Content Security Policy**: XSS protection
- **HSTS**: Strict transport security
- **Secure Cookies**: HttpOnly and SameSite attributes

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Testing Strategy
- **Component Testing**: React Testing Library for UI components
- **Integration Testing**: API and database interactions
- **E2E Testing**: Cypress for user workflows
- **Accessibility Testing**: Automated a11y checks

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables (Production)
Ensure all production environment variables are set:
- Supabase production URLs and keys
- Google OAuth production credentials
- SMTP configuration for email notifications
- Monitoring and analytics keys

### Deployment Options
- **Vercel**: Recommended for React applications
- **Netlify**: Alternative with built-in CI/CD
- **Docker**: Container deployment option
- **Traditional Hosting**: Apache/Nginx with build files

### CI/CD Pipeline
The project includes GitHub Actions workflow for:
- Automated testing
- Code quality checks
- Build verification
- Deployment automation

## 📈 Monitoring & Analytics

### Error Tracking
- **Sentry Integration**: Production error monitoring
- **Log Aggregation**: Structured logging with context
- **Performance Monitoring**: Core Web Vitals tracking

### Analytics
- **User Analytics**: Privacy-focused usage tracking
- **Performance Metrics**: Application performance monitoring
- **Business Metrics**: Project and user engagement analytics

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Code Standards
- **ESLint**: Enforced code style
- **Prettier**: Consistent formatting
- **TypeScript**: Type safety (future enhancement)
- **Commit Messages**: Conventional commit format

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Core platform setup
- ✅ Authentication system
- ✅ Public pages and branding
- ✅ Basic user and admin dashboards

### Phase 2 (Next)
- 🔄 Complete user application workflow
- 🔄 Full admin CRUD operations
- 🔄 Advanced analytics dashboard
- 🔄 Email notification system

### Phase 3 (Future)
- 📅 Advanced project matching
- 📅 Video conferencing integration
- 📅 Mobile application
- 📅 International expansion

## 🆘 Support

### Documentation
- **API Documentation**: Comprehensive endpoint documentation
- **Component Library**: Storybook for UI components
- **Deployment Guide**: Step-by-step deployment instructions

### Community
- **Discord Server**: Real-time community support
- **GitHub Issues**: Bug reports and feature requests
- **Email Support**: contact@nephra.org

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For providing an excellent backend platform
- **Tailwind CSS** - For the utility-first CSS framework
- **React Community** - For the amazing ecosystem
- **Open Source Contributors** - For the tools and libraries that make this possible

---

**Built with ❤️ by the Nephra team**

For more information, visit [nephra.org](https://nephra.org) or contact us at [contact@nephra.org](mailto:contact@nephra.org).
