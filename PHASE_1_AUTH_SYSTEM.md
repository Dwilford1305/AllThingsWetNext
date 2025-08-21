# Phase 1: User Authentication & Account Management System

## 🎯 Overview

Phase 1 establishes the foundation for user and business account management in All Things Wetaskiwin. This phase introduces a robust authentication system with role-based access control, replacing the simple admin password system with a comprehensive user management framework.

## ✅ What's Been Implemented

### 1. **User Authentication System**
- **JWT-based authentication** with access and refresh tokens
- **Password hashing** using bcryptjs with salt rounds
- **Session management** with database-stored sessions
- **Account security** features (login attempts, account locking)
- **Role-based access control** (user, business_owner, admin, super_admin)

### 2. **User Management Models**
- **User model** with comprehensive fields and security features
- **Business claim request** system for ownership verification
- **User session tracking** with device information
- **Activity logging** for security and audit purposes

### 3. **Authentication API Endpoints**
- `POST /api/auth/login` - User login with credentials
- `POST /api/auth/signup` - New user registration
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/refresh` - Token refresh mechanism
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/claim-business` - Submit business claim requests
- `GET /api/auth/claim-business` - Get user's claim requests

### 4. **Authentication Middleware**
- **Request authentication** with token verification
- **Role-based authorization** for different user types
- **Permission checking** for specific admin functions
- **Business ownership verification** for business-related operations

### 5. **Frontend Components**
- **AuthForm component** - Combined login/signup form
- **Auth test page** - Comprehensive testing interface
- **User profile display** with role-specific features

### 6. **Database Schema**
```typescript
User {
  id: string (unique)
  email: string (unique, lowercase)
  passwordHash: string
  firstName, lastName: string
  role: 'user' | 'business_owner' | 'admin' | 'super_admin'
  isEmailVerified: boolean
  isActive, isSuspended: boolean
  twoFactorEnabled: boolean
  preferences: UserPreferences
  businessIds: string[] (for business owners)
  permissions: AdminPermission[] (for admins)
  // ... security and tracking fields
}

BusinessClaimRequest {
  id: string
  businessId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  verificationDocuments: string[]
  // ... claim details
}

UserSession {
  id: string
  userId: string
  accessToken, refreshToken: string
  deviceInfo: object
  expiresAt: Date
  isActive: boolean
}

UserActivityLog {
  userId: string
  action: string
  details: object
  ip, userAgent: string
  success: boolean
  createdAt: Date
}
```

## 🚀 Getting Started

### 1. **Environment Setup**
Copy `.env.example` to `.env.local` and configure:
```bash
# Required for authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Optional email configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2. **Database Initialization**
The new models will be automatically created when you start the application and make your first API call.

### 3. **Testing the System**
1. Start the development server: `npm run dev`
2. Navigate to `/auth-test` to test the authentication system
3. Create a new account or login with existing credentials
4. Test different user roles and permissions

## 📋 User Roles & Permissions

### **User (Regular)**
- Basic account access
- Profile management
- Content viewing
- No special permissions

### **Business Owner**
- All user permissions
- Can claim business listings
- Manage owned businesses
- Access business analytics
- Upgrade business subscriptions

### **Admin**
- User management
- Business approval/rejection
- Content moderation
- Scraper management
- View analytics
- Configurable permissions

### **Super Admin**
- All admin permissions
- System configuration
- Admin user management
- Database access
- Full system control

## 🔐 Security Features

### **Password Security**
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- bcryptjs hashing with 12 salt rounds
- Password change tracking

### **Account Protection**
- Account locking after 5 failed login attempts
- 2-hour lockout period
- Email verification for new accounts
- Session management with device tracking

### **API Security**
- JWT tokens with expiration
- Refresh token rotation
- Request rate limiting ready
- CORS protection
- SQL injection prevention (MongoDB)

## 🧪 Testing

### **Manual Testing**
1. **User Registration**
   - Try different account types (user, business_owner)
   - Test password validation
   - Verify email requirement

2. **User Login**
   - Test valid/invalid credentials
   - Test account locking mechanism
   - Test "remember me" functionality

3. **API Endpoints**
   - Use the auth test page
   - Test with/without authentication
   - Test different user roles

### **API Testing Examples**
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "business_owner",
    "agreeToTerms": true
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Get user profile (requires token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔄 Integration with Existing System

### **Business Claiming Migration**
The new system enhances the existing business claim process:
- **Before**: Simple email-based claiming with `claimedBy` field
- **After**: Full user account with business ownership tracking

### **Admin System Enhancement**
- **Before**: Single admin password authentication
- **After**: Multiple admin users with specific permissions

### **Database Migration**
- New auth models work alongside existing business models
- Existing claimed businesses can be migrated to new user system
- No breaking changes to current business operations

## 🔮 Next Steps (Phase 2 Preview)

1. **Email Verification System**
   - Automated verification emails
   - Password reset functionality
   - Business claim notifications

2. **Enhanced Business Management**
   - Business owner dashboard improvements
   - Multi-business management
   - Business verification workflow

3. **Admin Enhancements**
   - Admin user creation workflow
   - Permission management UI
   - User management dashboard

4. **Security Improvements**
   - Two-factor authentication
   - Advanced rate limiting
   - Security audit logging

## 🐛 Known Issues & Limitations

1. **Email Verification**: Currently logged to console, needs SMTP setup
2. **Password Reset**: API ready, frontend UI not implemented  
3. **Admin Creation**: No automated admin user creation process
4. **Business Migration**: Existing claimed businesses need manual migration

## ✅ **SYSTEM STATUS: FULLY OPERATIONAL**

✅ **Build Status**: All TypeScript/ESLint errors resolved  
✅ **Database Warnings**: Mongoose duplicate index warnings fixed  
✅ **Development Server**: Running at http://localhost:3000  
✅ **Testing Interface**: Available at http://localhost:3000/auth-test  

The authentication system is now fully functional and ready for production testing!

## 📞 Support

For questions or issues with the authentication system:
1. Check the auth test page (`/auth-test`) for debugging
2. Review browser console for error messages
3. Check server logs for authentication errors
4. Verify environment variables are properly set

## 📝 Migration Guide

### **For Existing Claimed Businesses**
```javascript
// Example migration script (to be run manually)
const existingBusiness = await Business.findOne({ isClaimed: true, claimedBy: 'email@example.com' })
const user = await User.findOne({ email: 'email@example.com' })

if (user && existingBusiness) {
  // Add business to user's businessIds
  await User.updateOne(
    { _id: user._id },
    { $addToSet: { businessIds: existingBusiness.id } }
  )
  
  // Update business with proper owner reference
  await Business.updateOne(
    { _id: existingBusiness._id },
    { ownerId: user.id }
  )
}
```

This completes Phase 1 of the user and business account system implementation!
