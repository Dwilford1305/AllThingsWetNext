# Super Admin Test Business Feature

## Overview
This feature ensures that super admin users always have access to a test business with a platinum subscription tier to fully test all subscription-related features.

## Implementation Details

### Key Components

#### 1. Test Business Auto-Provisioning
- **Location**: `/src/app/api/seed/route.ts`
- **Function**: `ensureSuperAdminTestBusiness()`
- **Purpose**: Automatically creates or updates a test business for the super admin with platinum subscription

#### 2. Dedicated Setup Endpoint
- **Location**: `/src/app/api/admin/setup-test-business/route.ts`
- **Methods**: `GET`, `POST`
- **Purpose**: Manual endpoint to provision test business with setup key authentication

#### 3. Business Subscription Protection
- **Location**: `/src/app/api/businesses/subscription/route.ts`
- **Purpose**: Prevents accidental downgrade of the test business from platinum subscription

### Test Business Details

#### Business Information
- **ID**: `test-platinum-business-admin`
- **Name**: `Test Platinum Business`
- **Category**: `professional`
- **Address**: `123 Test Street, Wetaskiwin, AB T9A 0A1`
- **Phone**: `(780) 555-0123`
- **Email**: `test@testbusiness.example.com`
- **Website**: `https://testbusiness.example.com`

#### Platinum Features Enabled
- **Subscription Tier**: `platinum`
- **Subscription Status**: `active`
- **Featured Placement**: `true`
- **Verified Status**: `true`
- **Job Posting Quota**: `9999` (unlimited)
- **Business Hours**: Complete schedule
- **Social Media Links**: All platforms
- **Special Offers**: Sample offer included
- **Analytics Tracking**: Enabled

## Usage

### Automatic Provisioning
The test business is automatically provisioned when:
1. Database seeding is performed (`/api/seed`)
2. A super admin user exists in the system
3. The test business doesn't exist or needs updating

### Manual Provisioning
Use the dedicated endpoint:
```bash
POST /api/admin/setup-test-business
```

Required body:
```json
{
  "setupPassword": "your_super_admin_setup_key"
}
```

### Check Status
Get current status:
```bash
GET /api/admin/setup-test-business
```

## Environment Variables
- `SUPER_ADMIN_SETUP_KEY`: Required for manual test business provisioning

## Security Features

### Protection Against Downgrades
The test business is protected from accidental downgrades:
- Any attempt to change subscription tier from platinum is blocked
- Error message explains the business is reserved for testing
- Protection is implemented at the API level

### Authentication Requirements
- Super admin role required for access
- Setup key authentication for manual provisioning
- Business is automatically claimed by the super admin user

## Testing
Tests are included in `/tests/super-admin-test-business.test.ts` covering:
- Business subscription protection logic
- Test business configuration validation
- API response structure verification
- Feature availability checks

## Integration Points

### Database Models
- Uses existing `Business` model from `/src/models/index.ts`
- Uses existing `User` model from `/src/models/auth.ts`
- Maintains consistency with existing subscription system

### Business Dashboard
Super admin can access the test business through:
- Business listings (`/businesses`)
- Business management (`/businesses/manage`)
- Admin dashboard (`/admin`)

## Platinum Features Available for Testing

### Business Listing Features
- Featured placement in search results
- Premium business profile display
- Enhanced visibility in directory

### Business Management Features
- Logo upload capability
- Photo gallery (up to 20 photos)
- Business hours management
- Social media integration
- Special offers creation
- Analytics dashboard access

### Job Posting Features
- Unlimited job postings per month
- Enhanced job listing visibility
- Extended job posting duration (90 days)

### Advanced Features
- Priority customer support
- Detailed analytics and insights
- Custom business description
- Verification badge display

## Maintenance
- Test business subscription is automatically renewed during seeding
- Business data is preserved between updates
- Super admin linkage is maintained
- Protection against accidental deletion or modification

## Troubleshooting

### Common Issues
1. **Test business not appearing**: Run `/api/seed` to provision it
2. **Access denied**: Ensure user has `super_admin` role
3. **Subscription downgrade blocked**: This is intentional protection

### Manual Recovery
If the test business is accidentally modified:
1. Call `POST /api/admin/setup-test-business` with setup key
2. Or run `POST /api/seed` to restore proper configuration

## Future Enhancements
- Web UI for test business management
- Additional test scenarios and data
- Integration with payment testing workflows
- Automated feature testing suite