# User Deletion Utility

## Usage

Run this utility from the terminal to delete a user account:

```bash
node utils/deleteUser.js
```

## Process

1. **Enter email** - Provide the email address of the user to delete
2. **User verification** - Utility will show user details if found
3. **Confirmation** - Type "DELETE" then "yes" to confirm
4. **Authentication** - Enter the user's password for security
5. **Deletion** - All user data is permanently deleted
6. **Email notification** - Confirmation email is sent to the user

## Safety Features

- ✅ **Password authentication** required before deletion
- ✅ **Double confirmation** prevents accidental deletion
- ✅ **Protected accounts** (defaultMeals) cannot be deleted
- ✅ **Complete cleanup** removes all associated data
- ✅ **Email notification** sent to user
- ✅ **Database connection** properly closed

## What Gets Deleted

- User account
- All meals created by user
- All ingredients created by user
- All shopping lists created by user
- All categories created by user

## Example Session

```
🗑️  User Account Deletion Utility

✅ Connected to database

Enter email address of user to delete: test@example.com

👤 User found:
   Username: testuser
   Email: test@example.com
   ID: 507f1f77bcf86cd799439011

⚠️  WARNING: This will permanently delete:
   • User account
   • All meals
   • All ingredients
   • All shopping lists
   • All categories
   • All associated data

Type "DELETE" to confirm: DELETE
Are you absolutely sure? (yes/no): yes

Enter user password for authentication: •••••

🔐 Authenticating...
✅ Authentication successful
🗑️  Deleting user data...
   ✅ Ingredients deleted
   ✅ Categories deleted
   ✅ Meals deleted
   ✅ Shopping lists deleted
   ✅ User account deleted
📧 Sending confirmation email...
✅ Confirmation email sent

🎉 Successfully deleted account for 'test@example.com'

👋 Utility finished
```

## Notes

- This utility is completely independent of the web application
- Uses the same deletion logic as the web interface
- Requires valid user password for authentication
- All operations are logged to console
- Database connection is automatically closed
