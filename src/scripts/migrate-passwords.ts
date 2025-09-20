import { getDb } from '@/lib/data';
import bcrypt from 'bcryptjs';

// Script to migrate plain text passwords to hashed passwords
async function migratePasswords() {
  console.log('Starting password migration...');
  
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Find all users with plain text passwords (not starting with $2a$ or $2b$)
    const usersWithPlainPasswords = await usersCollection.find({
      password: { 
        $exists: true, 
        $not: { $regex: /^\$2[abxy]\$/ } 
      }
    }).toArray();
    
    console.log(`Found ${usersWithPlainPasswords.length} users with plain text passwords`);
    
    for (const user of usersWithPlainPasswords) {
      console.log(`Migrating password for user: ${user.email}`);
      
      // Hash the existing plain text password
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      // Update the user with the hashed password
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword,
            passwordMigratedAt: new Date().toISOString()
          } 
        }
      );
      
      console.log(`✓ Password migrated for user: ${user.email}`);
    }
    
    console.log('Password migration completed successfully!');
    
  } catch (error) {
    console.error('Error during password migration:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migratePasswords()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migratePasswords };
