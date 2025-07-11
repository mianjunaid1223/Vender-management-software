# MongoDB Setup Guide

## Quick Setup (5 minutes)

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for a free account
3. Create a new project (e.g., "Vendor Management")

### 2. Create Database Cluster
1. Click "Build a Database"
2. Choose **M0 (Free)** tier
3. Select a cloud provider and region (closest to you)
4. Name your cluster (e.g., "vendor-cluster")
5. Click "Create"

### 3. Configure Database Access
1. **Create Database User:**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `admin` (or your choice)
   - Password: Generate a secure password
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Configure Network Access:**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow access from anywhere" (for development)
   - Click "Confirm"

### 4. Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string

### 5. Configure Your Application
1. Open `.env.local` in your project root
2. Replace the `MONGODB_URI` value with your connection string:
   ```bash
   MONGODB_URI=mongodb+srv://admin:<password>@vendor-cluster.xxxxx.mongodb.net/vendorverse?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual database user password
4. Save the file

### 6. Seed Your Database
Run this command to populate your database with sample data:
```bash
npm run seed
```

### 7. Start the Application
```bash
npm run dev
```

Visit `http://localhost:9002` to see your application with real MongoDB data!

---

## Troubleshooting

### Connection Issues

**Error: `querySrv ENOTFOUND`**
- ✅ Check your connection string is correct
- ✅ Ensure you replaced `<password>` with actual password
- ✅ Verify your IP address is whitelisted

**Error: `Authentication failed`**
- ✅ Check username and password are correct
- ✅ Ensure user has proper permissions

**Error: `Connection timeout`**
- ✅ Check network access settings
- ✅ Try "Allow access from anywhere" for testing

### Database Issues

**Empty Dashboard**
- Run `npm run seed` to populate with sample data
- Check MongoDB Atlas to see if collections exist

**Outdated Data**
- MongoDB caches are cleared automatically
- Restart the dev server if needed

---

## Database Structure

After seeding, your database will contain:

### Collections:
- **invoices** - Invoice records with buyer/seller info
- **vendors** - Vendor/supplier information  
- **contracts** - Contract agreements
- **users** - User accounts

### Sample Data:
- 5 vendors (companies like Innovate Corp, Design Co)
- 3 contracts with different terms
- 5 invoices with various statuses (paid, pending, overdue)
- 1 admin user account

---

## Security Best Practices

### For Development:
- ✅ Use "Allow access from anywhere" for testing
- ✅ Use strong passwords for database users
- ✅ Never commit `.env.local` to version control

### For Production:
- 🔒 Restrict IP access to your server only
- 🔒 Use environment-specific connection strings
- 🔒 Enable audit logging
- 🔒 Regular backup schedules
- 🔒 Monitor connection usage

---

## Alternative: Local MongoDB

If you prefer running MongoDB locally:

### Install MongoDB Community Edition:
1. Download from [MongoDB Downloads](https://www.mongodb.com/try/download/community)
2. Follow installation instructions for your OS
3. Start MongoDB service
4. Use connection string: `mongodb://localhost:27017/vendorverse`

### Using Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then update your `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/vendorverse
```

---

## Next Steps

Once your database is connected:
1. ✅ Explore the dashboard with real data
2. ✅ Create new invoices and vendors
3. ✅ Test email notifications (check console logs)
4. ✅ Try the PDF generation features
5. ✅ Set up email service for production use

Your vendor management system is now fully functional with MongoDB! 🎉
