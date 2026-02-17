# 🔍 Debugging: Status Transitions Not Inserting

## Problem
Status transitions are not being inserted into the `status_transitions` table.

## Changes Made to Fix

### 1. Added Comprehensive Logging ✅

**File**: `src/domain/use-cases/update-credit-request-status.ts`
- Added try-catch block around transition creation
- Logs before and after insertion
- Doesn't throw error if transition logging fails (graceful degradation)

**File**: `src/infrastructure/adapters/repositories/status-transition-repository.ts`
- Added logging before insert
- Logs success or failure
- Shows actual data being inserted

### 2. Added Initial Transition Logging ✅

**File**: `src/domain/use-cases/create-credit-request.ts`
- Now logs initial transition when credit request is created
- Creates transition with `fromStatusId: null` (initial state)
- Reason: "Solicitud creada"

**File**: `src/infrastructure/di.ts`
- Updated `CreateCreditRequestUseCase` to receive `statusTransitionRepository`

### 3. Fixed Metadata Type ✅

**File**: `src/infrastructure/db/schemas/status-transition.ts`
- Added explicit type annotation: `.$type<Record<string, any>>()`
- Ensures TypeScript and Drizzle handle the JSONB field correctly

## How to Debug

### Step 1: Check Console Logs

Start the backend and watch for these logs:

```bash
# When creating a credit request:
[CreateCreditRequest] Creating initial transition log
[StatusTransitionRepository] Inserting transition: {...}
[StatusTransitionRepository] Transition inserted successfully: {...}
[CreateCreditRequest] Initial transition logged

# When updating status:
[UpdateStatus] Creating transition log: {...}
[StatusTransitionRepository] Inserting transition: {...}
[StatusTransitionRepository] Transition inserted successfully: {...}
[UpdateStatus] Transition created successfully: <uuid>
```

### Step 2: Check for Errors

If you see error logs:
```bash
[StatusTransitionRepository] Insert failed: <error details>
[UpdateStatus] Failed to create transition log: <error details>
```

This will tell you exactly what's wrong (foreign key violation, type mismatch, etc.)

### Step 3: Manually Test Database

You can test if the table accepts inserts:

```bash
# Connect to your database
psql $DATABASE_URL

# Check if table exists
\d status_transitions

# Try manual insert
INSERT INTO status_transitions (
  credit_request_id,
  from_status_id,
  to_status_id,
  reason,
  triggered_by,
  metadata
) 
SELECT 
  cr.id,
  (SELECT id FROM request_statuses WHERE code = 'CREATED'),
  (SELECT id FROM request_statuses WHERE code = 'EVALUATING'),
  'Manual test',
  'user',
  '{"test": true}'::jsonb
FROM credit_requests cr
LIMIT 1
RETURNING *;

# Check if it inserted
SELECT * FROM status_transitions ORDER BY created_at DESC LIMIT 5;
```

### Step 4: Test the Flow

1. **Create a new credit request**
   ```bash
   # Watch backend logs
   # Should see "[CreateCreditRequest] Creating initial transition log"
   ```

2. **Update the status**
   ```bash
   # Watch backend logs
   # Should see "[UpdateStatus] Creating transition log"
   ```

3. **Check the database**
   ```bash
   # Should have entries in status_transitions
   ```

### Step 5: Check Foreign Keys

Ensure the UUIDs are valid:

```sql
-- Check if credit request exists
SELECT id, status_id FROM credit_requests WHERE id = '<credit-request-uuid>';

-- Check if status exists
SELECT id, code, name FROM request_statuses WHERE id = '<status-uuid>';
```

## Common Issues

### Issue 1: Foreign Key Violation
**Symptom**: Error mentions "violates foreign key constraint"

**Solution**: 
- Verify `creditRequestId` exists in `credit_requests` table
- Verify `toStatusId` exists in `request_statuses` table
- Verify `fromStatusId` (if not null) exists in `request_statuses` table

### Issue 2: JSONB Type Error
**Symptom**: Error about JSONB format

**Solution**:
- The metadata field now has explicit type annotation
- Should accept any valid JSON object

### Issue 3: Silent Failure
**Symptom**: No logs, no errors, but no data

**Solution**:
- Check if the use case is actually being called
- Add breakpoint or log in the controller
- Verify DI is wired correctly

### Issue 4: Transaction Rollback
**Symptom**: Credit request updates but no transition logged

**Solution**:
- The try-catch prevents this now
- If transition fails, it logs error but doesn't throw
- Credit request update still succeeds

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Create a credit request and check logs
- [ ] Check if initial transition was created in DB
- [ ] Update status with reason and check logs
- [ ] Check if transition was created in DB
- [ ] View history in frontend
- [ ] Verify timeline shows both transitions

## SQL Queries for Verification

```sql
-- Count transitions
SELECT COUNT(*) FROM status_transitions;

-- View recent transitions with details
SELECT 
  st.id,
  st.reason,
  st.triggered_by,
  st.metadata,
  cr.full_name as client,
  fs.code as from_status,
  ts.code as to_status,
  st.created_at
FROM status_transitions st
JOIN credit_requests cr ON st.credit_request_id = cr.id
LEFT JOIN request_statuses fs ON st.from_status_id = fs.id
JOIN request_statuses ts ON st.to_status_id = ts.id
ORDER BY st.created_at DESC
LIMIT 10;

-- Check transitions for specific credit request
SELECT 
  st.id,
  fs.code as from_status,
  ts.code as to_status,
  st.reason,
  st.triggered_by,
  st.created_at
FROM status_transitions st
LEFT JOIN request_statuses fs ON st.from_status_id = fs.id
JOIN request_statuses ts ON st.to_status_id = ts.id
WHERE st.credit_request_id = '<credit-request-uuid>'
ORDER BY st.created_at ASC;
```

## What Changed in Code

### Files Modified (6 files)

1. **src/domain/use-cases/create-credit-request.ts**
   - Added `IStatusTransitionRepository` import
   - Added to constructor
   - Logs initial transition after creating credit request

2. **src/domain/use-cases/update-credit-request-status.ts**
   - Wrapped transition creation in try-catch
   - Added detailed logging

3. **src/infrastructure/adapters/repositories/status-transition-repository.ts**
   - Added logging to `create()` method
   - Better error handling

4. **src/infrastructure/db/schemas/status-transition.ts**
   - Added explicit type for `metadata` field

5. **src/infrastructure/di.ts**
   - Updated `CreateCreditRequestUseCase` instantiation

## Next Steps

1. Restart the backend server
2. Try creating a new credit request
3. Watch the console for log messages
4. Check the database for the inserted row
5. Report back what you see in the logs

---

**Date**: February 16, 2026
**Status**: Debugging in progress
