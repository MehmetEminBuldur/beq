# Database Migration Guide

This guide explains how to recreate your Supabase database tables from scratch based on the actual implementation models used in your BeQ application.

## ⚠️ WARNING

**This migration will delete all existing data in your database!**
- Make sure to backup any important data before proceeding
- This process is irreversible
- Test on a development/staging environment first

## 📋 What This Migration Does

### Current Schema Issues
The original `schema.sql` file didn't match what your application was actually using:
- ❌ Wrong column names and types
- ❌ Missing required fields
- ❌ Incorrect enum values
- ❌ Wrong foreign key relationships

### New Schema Features
The new schema (`schema-from-implementation.sql`) matches your actual TypeScript models:
- ✅ **Profiles**: Matches `types.ts` exactly
- ✅ **Bricks**: Includes all fields used in the implementation
- ✅ **Quantas**: Proper structure with dependencies and scheduling
- ✅ **Calendar Events**: Full calendar integration support
- ✅ **Calendar Syncs**: OAuth token storage for calendar providers
- ✅ **Conversations**: AI chat history with metadata
- ✅ **Messages**: Rich message structure with AI responses

## 🚀 Migration Steps

### Step 1: Backup Your Data (IMPORTANT!)
```bash
# Export your current data if needed
# This step depends on your backup strategy
```

### Step 2: Run the Migration Script
```bash
cd clients/web
node migrate-database.js
```

The script will:
1. **Ask for confirmation** to prevent accidental data loss
2. **Drop all existing tables** in the correct order
3. **Create new tables** based on implementation models
4. **Verify the schema** is correct
5. **Create test data** for immediate testing

### Step 3: Verify the Migration
After migration, the script will show:
```
🎊 MIGRATION COMPLETED SUCCESSFULLY!
📋 Summary:
   ✅ All existing tables dropped
   ✅ New schema created from implementation models
   ✅ Schema verification passed
   ✅ Test data created
```

### Step 4: Test Your Application
```bash
cd clients/web
npm run dev
```

Visit `http://localhost:3003` to see your application with the new schema.

## 📊 New Database Structure

### Core Tables

#### 🧱 **Bricks** (Main Tasks/Projects)
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to profiles)
- title: TEXT (Required)
- description: TEXT
- category: ENUM ('work', 'personal', 'health', 'learning', 'social', 'maintenance', 'recreation', 'general')
- priority: ENUM ('low', 'medium', 'high', 'urgent')
- status: ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'postponed', 'on_hold', 'not_started')
- estimated_duration_minutes: INTEGER
- actual_duration_minutes: INTEGER
- completion_percentage: DECIMAL
- tags: TEXT[] (Array of tags)
- deadline: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### ⚡ **Quantas** (Sub-tasks)
```sql
- id: UUID (Primary Key)
- brick_id: UUID (Foreign Key to bricks)
- user_id: UUID (Foreign Key to profiles)
- title: TEXT (Required)
- description: TEXT
- priority: ENUM
- status: ENUM
- estimated_duration_minutes: INTEGER
- completion_percentage: DECIMAL
- scheduled_start: TIMESTAMP
- scheduled_end: TIMESTAMP
- order_index: INTEGER
- notes: TEXT
```

#### 💬 **Conversations & Messages**
```sql
conversations:
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- title: TEXT
- context: JSONB
- last_message_at: TIMESTAMP

messages:
- id: UUID (Primary Key)
- conversation_id: UUID (Foreign Key)
- user_id: UUID (Foreign Key)
- content: TEXT (Required)
- response: TEXT
- model_used: TEXT
- processing_time_ms: INTEGER
- metadata: JSONB
```

#### 📅 **Calendar Integration**
```sql
calendar_events:
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- external_id: TEXT
- title: TEXT (Required)
- start_time: TIMESTAMP (Required)
- end_time: TIMESTAMP (Required)
- calendar_source: TEXT (Required)
- is_all_day: BOOLEAN
- attendees: TEXT[]
- timezone: TEXT

calendar_syncs:
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- calendar_provider: TEXT (Required)
- access_token: TEXT
- refresh_token: TEXT
- calendar_ids: TEXT[]
- sync_enabled: BOOLEAN
```

## 🔒 Security Features

### Row Level Security (RLS)
- ✅ **Profiles**: Users can only access their own profile
- ✅ **Bricks**: Users can only manage their own bricks
- ✅ **Quantas**: Users can only manage their own quantas
- ✅ **Conversations**: Users can only access their own conversations
- ✅ **Messages**: Users can only access messages from their conversations
- ✅ **Calendar Events**: Users can only manage their own calendar events

### Automatic Features
- 🔄 **Auto-timestamps**: `updated_at` fields update automatically
- 👤 **Auto-profiles**: New user profiles created automatically on signup
- 🏷️ **Tags support**: Array fields for flexible categorization
- 📊 **Progress tracking**: Completion percentages and time tracking

## 🧪 Test Data Included

The migration script creates sample data:
- ✅ **1 User Profile** (from existing auth user)
- ✅ **2 Bricks** (Learn Spanish, Fitness Routine)
- ✅ **1 Conversation** (Schedule Planning)
- ✅ **2 Messages** (Sample AI chat)
- ✅ **1 Calendar Event** (Morning Workout)

## 🔧 Troubleshooting

### Migration Fails
```bash
# Check your environment variables
cat clients/web/.env.local

# Ensure service role key is correct
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Schema Verification Fails
- Check Supabase dashboard for any error messages
- Verify your service role key has sufficient permissions
- Some statements might fail due to dependencies - this is normal

### Application Doesn't Work
```bash
# Clear Next.js cache
cd clients/web
rm -rf .next
npm run dev
```

## 📁 Files Created

- `infra/supabase/schema-from-implementation.sql` - New database schema
- `infra/supabase/migrate-to-new-schema.sql` - Migration script
- `clients/web/migrate-database.js` - Node.js migration runner
- `infra/supabase/README-MIGRATION.md` - This documentation

## 🎯 Next Steps After Migration

1. **Test the Application**: Verify all features work with the new schema
2. **Update TypeScript Types**: Regenerate types from Supabase if needed
3. **Run Integration Tests**: Use the existing test scripts to verify functionality
4. **Deploy to Production**: Apply the same migration to your production database

## 📞 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your Supabase credentials are correct
3. Ensure you have sufficient permissions in Supabase
4. Check the Supabase dashboard for any database errors

---

**Remember**: Always backup your data before running migrations in production!
