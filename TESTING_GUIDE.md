# Phase 6 UI Implementation - Testing Guide

## Quick Start

### 1. Install Dependencies (if not already done)
```bash
cd "c:\Users\80036\Documents\Obsidian Vault\develop\discord-monitor-report-phase6\develop\discord-monitor-report"
npm install
```

### 2. Setup Database
Ensure your database is running and migrations are applied:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## Test User Accounts

Based on the database seed, you should have these test accounts:

### Manager Account
- **Email**: manager@example.com
- **Password**: (check your seed file)
- **Role**: manager
- **Permissions**: All features including master management and commenting

### Staff Account
- **Email**: staff@example.com
- **Password**: (check your seed file)
- **Role**: staff
- **Permissions**: View/create/edit own reports only

---

## Testing Checklist

### Issue #26: Login Screen (SCR-001)
**URL**: http://localhost:3000/login

- [ ] Page loads without errors
- [ ] Email input field is present
- [ ] Password input field is present (masked)
- [ ] Login button is present
- [ ] Empty form shows validation errors
- [ ] Invalid email format shows error
- [ ] Wrong credentials show error message
- [ ] Successful login redirects to /reports
- [ ] JWT token is stored in localStorage
- [ ] UI is in Japanese

**Expected Behavior:**
1. Visit root URL → auto-redirect to /login (if not logged in)
2. Enter valid credentials → redirect to /reports
3. Token stored in localStorage under key "token"
4. User info stored in localStorage under key "user"

---

### Issue #27: Report List (SCR-002)
**URL**: http://localhost:3000/reports

- [ ] Page requires authentication (redirects to /login if not logged in)
- [ ] Header shows user name and logout button
- [ ] Reports are displayed as cards
- [ ] Each card shows: date, user name, monitoring count, comment count
- [ ] Period filter dropdown works (今日/今週/今月/すべて)
- [ ] Filtering updates the report list
- [ ] "新規日報作成" button navigates to /reports/new
- [ ] "マスタ管理" button only visible to managers
- [ ] Clicking "詳細を見る" navigates to report detail
- [ ] Empty state shows "日報がありません"
- [ ] Loading spinner shows during fetch

**Test Cases:**
1. **As Staff**: Should only see own reports
2. **As Manager**: Should see all reports
3. **Filter by Period**: Test each period option
4. **Card Click**: Click anywhere on card to open detail

---

### Issue #28: Report Create/Edit (SCR-003)

#### Create Report
**URL**: http://localhost:3000/reports/new

- [ ] Page requires authentication
- [ ] Date field auto-filled with today's date
- [ ] Date field is editable
- [ ] Server dropdown is populated from database
- [ ] Can add monitoring records (+ 監視報告を追加)
- [ ] Can remove monitoring records (削除 button)
- [ ] Must have at least one monitoring record
- [ ] Problem field is optional
- [ ] Plan field is optional
- [ ] Validation prevents empty server or content
- [ ] "キャンセル" button returns to /reports
- [ ] "保存" button creates report and redirects
- [ ] Loading state during save

**Test Cases:**
1. **Add Multiple Servers**: Add 3+ monitoring records
2. **Remove Record**: Should not allow removal if only one record
3. **Validation**: Try to submit with empty server/content
4. **Cancel**: Click cancel and verify no report created
5. **Save**: Create report and verify redirect to list

#### Edit Report
**URL**: http://localhost:3000/reports/[id]/edit

- [ ] Page requires authentication
- [ ] Only report owner can access
- [ ] Date field is disabled (cannot be changed)
- [ ] Existing data is pre-filled
- [ ] Can modify monitoring records
- [ ] Can add/remove records
- [ ] Can modify Problem and Plan
- [ ] "キャンセル" returns to detail page
- [ ] "保存" updates report and redirects

**Test Cases:**
1. **Access Control**: Try to edit another user's report (should redirect)
2. **Update Records**: Modify existing monitoring content
3. **Add/Remove**: Add new record and remove old one
4. **Save**: Update and verify changes persist

---

### Issue #29: Report Detail (SCR-004)
**URL**: http://localhost:3000/reports/[id]

- [ ] Page requires authentication
- [ ] Shows formatted date with weekday
- [ ] Shows report owner's name
- [ ] Shows all monitoring records with server names
- [ ] Problem section displays if present
- [ ] Plan section displays if present
- [ ] Comments are grouped by target field (problem/plan)
- [ ] Comment shows author name and timestamp
- [ ] "編集" button only visible to report owner
- [ ] Comment input only visible to managers
- [ ] Can post comment on Problem
- [ ] Can post comment on Plan
- [ ] Comments refresh after posting
- [ ] "戻る" button returns to list

**Test Cases:**
1. **As Staff (Owner)**: Should see edit button
2. **As Staff (Not Owner)**: Should not see edit button
3. **As Manager**: Should see comment inputs
4. **Post Comment**: Add comment to Problem and Plan
5. **Navigation**: Test back button and edit button

---

### Issue #30: Master Management (SCR-005)
**URL**: http://localhost:3000/masters

- [ ] Page requires manager role (staff cannot access)
- [ ] Tab navigation works (Discordサーバー / 担当者)
- [ ] "戻る" button returns to /reports

#### Servers Tab
- [ ] Server list displays in table
- [ ] Shows server name, description, status
- [ ] Active servers show green badge
- [ ] Inactive servers show gray badge
- [ ] "+ 新規サーバー追加" opens modal
- [ ] "編集" button opens modal with data
- [ ] "削除" button shows confirmation
- [ ] Cannot delete servers in use
- [ ] Modal form validation works
- [ ] Create server adds to list
- [ ] Edit server updates list
- [ ] Status checkbox toggles active/inactive

**Test Cases:**
1. **Create Server**: Add new server with name and description
2. **Edit Server**: Update existing server
3. **Toggle Status**: Change active to inactive
4. **Delete Unused**: Delete server not used in reports
5. **Delete In-Use**: Try to delete server used in reports (should fail)

#### Users Tab
- [ ] User list displays in table
- [ ] Shows name, email, role
- [ ] Role displays in Japanese (担当者/上長)
- [ ] "+ 新規担当者追加" opens modal
- [ ] "編集" button opens modal with data
- [ ] "削除" button shows confirmation
- [ ] Cannot delete users with reports/comments
- [ ] Password required on create
- [ ] Password optional on edit
- [ ] Role selection works
- [ ] Email validation works
- [ ] Create user adds to list
- [ ] Edit user updates list

**Test Cases:**
1. **Create User**: Add new staff user
2. **Create Manager**: Add new manager user
3. **Edit User**: Update user name and role
4. **Change Password**: Edit user with new password
5. **Delete Unused**: Delete user with no data
6. **Delete In-Use**: Try to delete user with reports (should fail)

---

## Authentication & Authorization Tests

### Route Protection
- [ ] Accessing /reports while logged out → redirect to /login
- [ ] Accessing /masters as staff → redirect to /reports
- [ ] Accessing edit page for other user's report → redirect
- [ ] Logout clears token and redirects to login

### Token Management
- [ ] Token included in API requests (check Network tab)
- [ ] Invalid token returns 401 error
- [ ] Expired token triggers re-login

### Role-Based Access
- [ ] Staff cannot see "マスタ管理" button
- [ ] Staff cannot access /masters URL directly
- [ ] Staff cannot post comments
- [ ] Manager can access all features

---

## UI/UX Tests

### Responsive Design
- [ ] Test on mobile viewport (320px width)
- [ ] Test on tablet viewport (768px width)
- [ ] Test on desktop viewport (1920px width)
- [ ] Cards stack properly on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Forms are usable on mobile

### Loading States
- [ ] Login button shows "ログイン中..." while processing
- [ ] Report list shows spinner while loading
- [ ] Save button shows "保存中..." while processing
- [ ] Comment button shows "投稿中..." while processing

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Validation errors highlight specific fields
- [ ] API errors display error message
- [ ] 404 errors show "見つかりません"

### Japanese Interface
- [ ] All labels are in Japanese
- [ ] All buttons are in Japanese
- [ ] All error messages are in Japanese
- [ ] Date formatting includes Japanese weekdays (月火水木金土日)

---

## API Integration Tests

### Authentication Endpoints
- [ ] POST /api/auth/login - Returns token and user
- [ ] POST /api/auth/logout - Clears session

### Report Endpoints
- [ ] GET /api/reports - Lists reports with filters
- [ ] GET /api/reports/[id] - Returns report detail
- [ ] POST /api/reports - Creates new report
- [ ] PUT /api/reports/[id] - Updates report
- [ ] DELETE /api/reports/[id] - Deletes report

### Comment Endpoints
- [ ] POST /api/reports/[id]/comments - Creates comment
- [ ] Requires manager role
- [ ] Returns comment with user info

### Master Endpoints
- [ ] GET /api/masters/servers - Lists servers
- [ ] POST /api/masters/servers - Creates server
- [ ] PUT /api/masters/servers/[id] - Updates server
- [ ] DELETE /api/masters/servers/[id] - Deletes server
- [ ] GET /api/masters/users - Lists users
- [ ] POST /api/masters/users - Creates user
- [ ] PUT /api/masters/users/[id] - Updates user
- [ ] DELETE /api/masters/users/[id] - Deletes user

---

## Browser Compatibility

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)

---

## Performance Tests

- [ ] Initial page load < 3 seconds
- [ ] Report list loads < 2 seconds
- [ ] Form submission < 1 second
- [ ] No console errors
- [ ] No console warnings

---

## Accessibility Tests

- [ ] All forms can be submitted with keyboard (Enter key)
- [ ] Tab navigation works correctly
- [ ] Focus indicators are visible
- [ ] Labels are associated with inputs
- [ ] Buttons have accessible names

---

## Common Issues & Solutions

### Issue: Cannot login
**Solution**:
1. Check database is running
2. Verify seed data exists
3. Check JWT_SECRET in .env.local
4. Check browser console for errors

### Issue: API returns 401 Unauthorized
**Solution**:
1. Clear localStorage
2. Login again
3. Check token expiration in jwt.ts

### Issue: Masters page shows 403 Forbidden
**Solution**:
1. Verify logged in as manager
2. Check user role in database
3. Clear localStorage and re-login

### Issue: Reports not showing
**Solution**:
1. Check database has report data
2. Verify date filters
3. Check user_id matches for staff
4. Check browser console for API errors

### Issue: Cannot create report
**Solution**:
1. Verify servers exist in database
2. Check monitoring record validation
3. Check browser Network tab for error details

---

## Developer Tools

### Useful Commands
```bash
# Type check
npm run tsc

# Lint check
npm run lint

# Run tests
npm run test

# Database reset
npm run db:reset

# View database
npx prisma studio
```

### Browser DevTools Checklist
1. **Console**: Check for errors/warnings
2. **Network**: Verify API requests/responses
3. **Application/Storage**: Check localStorage for token
4. **React DevTools**: Inspect component state

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No broken links
- ✅ All CRUD operations work
- ✅ Authentication flow complete
- ✅ Authorization rules enforced
- ✅ Forms validate properly
- ✅ UI is responsive
- ✅ Japanese text throughout
- ✅ Loading states visible
- ✅ Error messages clear

---

## Reporting Bugs

When reporting issues, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser and version**
5. **Console errors** (screenshot)
6. **Network tab** (screenshot of failed request)
7. **User role** (staff/manager)

---

## Next Phase

After testing Phase 6, proceed to:
- **Phase 7**: Integration testing and bug fixes
- **Phase 8**: Performance optimization
- **Phase 9**: Production deployment
