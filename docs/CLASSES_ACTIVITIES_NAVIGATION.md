# Classes & Activities Navigation - Implementation Guide

## ✅ Implemented Solution: **Tab-Based Navigation** (Recommended)

### Why This Approach?

**Option Comparison:**
1. ❌ Separate route `/profile/:memberId/classes-activities` - Duplicates data fetching
2. ✅ **Tab with URL parameter `/profile/:memberId?tab=courses`** - Best UX (CHOSEN)
3. ❌ Global page `/classes-activities` - No personalization

### Implementation Details

#### 1. **Profile Page with Tab Support**

**URL Structure:**
- `/profile/M0001` → Default to profile tab
- `/profile/M0001?tab=courses` → Opens "My Courses & Activities" tab
- `/profile/M0001?tab=profile` → Explicitly opens profile tab

**Key Features:**
- ✅ **Personalized View**: Shows which classes/activities member is enrolled in
- ✅ **"Enrolled" Badges**: Clear visual indication of registration status
- ✅ **No Duplicate Fetching**: Member data already loaded
- ✅ **Deep Linking**: LINE rich menu can directly open specific tab
- ✅ **Better UX**: "My enrolled items" vs "Available items" sections

#### 2. **LINE Rich Menu Integration**

**Button Configuration (6-button layout):**

```
┌─────────────────────────────────────────────────────┐
│                  TOP ROW (Y: 0-843)                 │
│  [個人資料 會員管理 Membership]                       │
│  → /profile/:memberId                               │
├──────────────────┬─────────────────┬────────────────┤
│   課程/活動       │   點數/禮物      │   邀請碼        │
│ Classes &        │  Points &       │  Referral      │
│ Activities       │  Gifts          │  Code          │
│ (Y: 843-1686)    │ (Y: 843-1686)   │ (Y: 843-1686)  │
│ X: 0-833        │ X: 834-1667     │ X: 1667-2500   │
│                  │                 │                │
│ → LINK           │ → MESSAGE       │ → MESSAGE      │
│ ?tab=courses     │ "點數/禮物"     │ "邀請碼"       │
└──────────────────┴─────────────────┴────────────────┘
```

**Technical Details:**
- **Top button**: Opens `/profile/:memberId` (profile tab)
- **Bottom-left button**: Opens `/profile/:memberId?tab=courses` ⭐
- **Bottom-middle button**: Sends message "點數/禮物 Points & Gifts" (webhook handles it)
- **Bottom-right button**: Sends message "邀請碼 Referral Code" (webhook handles it)

#### 3. **Rich Menu Image**

**Location:** `/public/images/rich-menu/richmenu.png`

**Specifications:**
- Dimensions: **2500 x 1686 pixels** (required by LINE)
- Format: PNG
- Size: < 1MB recommended

**Loading Method:**
```javascript
// File: lib/lineRichMenu.js
async function loadRichMenuImage() {
  const imagePath = path.join(process.cwd(), 'public', 'images', 'rich-menu', 'richmenu.png');
  return await fs.readFile(imagePath);
}
```

### User Flow Example

**Scenario: Member M0001 wants to enroll in classes**

1. **From LINE App:**
   - User taps "課程/活動" button in rich menu

2. **Browser Opens:**
   - URL: `https://your-domain.com/profile/M0001?tab=courses`
   - Page auto-selects "My Courses & Activities" tab

3. **User Sees:**
   - **Top Section**: "My Enrolled Classes" (classes they're already in)
   - **Bottom Section**: "Available Classes" (can enroll)
   - "Enrolled" button (disabled) vs "Enroll" button (active)

4. **Enrollment:**
   - Click "Enroll" on any available class
   - Instant feedback
   - Class moves to "Enrolled" section

### Benefits Summary

| Feature | Benefit |
|---------|---------|
| **Single Data Load** | Member info fetched once, used for both tabs |
| **Personalization** | Shows enrolled vs available items |
| **Visual Clarity** | "Enrolled" badges prevent duplicate enrollment |
| **Deep Linking** | Direct access from LINE to specific tab |
| **Better Navigation** | Stay within profile, no context switching |
| **Mobile Friendly** | Works seamlessly with LINE browser |

### Technical Implementation

**Files Modified:**
1. `client/src/pages/Profile.js`
   - Added `useSearchParams()` hook
   - Check URL parameter on load
   - Auto-select tab based on `?tab=` param

2. `lib/lineRichMenu.js`
   - Updated bottom-left button URL to `${profileUrl}?tab=courses`
   - Changed from file generation to file loading
   - Uses uploaded richmenu.png

### Testing URLs

**Profile Tab:**
- `http://localhost:3000/profile/M0001`
- `https://your-domain.com/profile/M0001?tab=profile`

**Classes Tab:**
- `http://localhost:3000/profile/M0001?tab=courses`
- `https://your-domain.com/profile/M0001?tab=courses`

### Future Enhancements (Optional)

1. **URL Persistence**: Update URL when user clicks tabs manually
2. **Browser Back Button**: Handle tab changes with browser history
3. **Bookmarking**: Users can bookmark specific tabs
4. **Analytics**: Track which tab users visit most

### Alternative Approaches Considered

#### A. Separate Page `/classes-activities`
**Pros:**
- Simple, standalone page
- Easy to bookmark

**Cons:**
- ❌ No personalization
- ❌ Can't show enrolled status
- ❌ Duplicate component logic
- ❌ No member context

#### B. Nested Route `/profile/:memberId/classes-activities`
**Pros:**
- Clean URL structure
- Proper React Router setup

**Cons:**
- ❌ More complex routing
- ❌ Need to refetch member data
- ❌ More code to maintain

#### C. **Tab with Query Param** `/profile/:memberId?tab=courses` ⭐ **CHOSEN**
**Pros:**
- ✅ Best UX
- ✅ Personalized
- ✅ No duplicate fetching
- ✅ Simple implementation
- ✅ Deep linking support

**Cons:**
- None significant

---

## Summary

The **tab-based approach with URL parameters** provides the best user experience by:
1. Keeping members within their profile context
2. Showing personalized enrolled vs available items
3. Supporting deep linking from LINE
4. Minimizing code duplication
5. Providing clear visual feedback

This is the recommended approach for member-focused features.
