# Waler - Relationship Clarity Tool

## Product Vision
Waler is the first relationship clarity tool that helps users understand their social connections through introspection, not surveillance. We detect when someone leaves your digital circle and guide you through what it means about you and your relationship.

## Brand Identity
- **Name**: Waler (formerly FlowTrack)
- **Positioning**: Relationship clarity tool, not tracking tool
- **Tone**: Introspective, compassionate, psychologically aware
- **Core Value**: Self-knowledge through relational awareness

---

## Monetization Strategy

### No Free Plan
Waler operates on a **premium-only model** with two tiers:

### **Premium Plan - $9.99/month**
**Target**: Individual users seeking relationship clarity
**Trial**: 7 days free

**Features**:
- Complete AI relationship analysis based on introspection questionnaire
- See who unfollowed/blocked you (with RevealGate consciousness pause)
- Full change history (30 days)
- Personalized psychological insights
- Real-time notifications
- Unlimited introspection questionnaires

**Conversion Points**:
1. **Step 11 (AI Insights Summary)** - Primary conversion hook
   - User completes 14-step questionnaire (10-15 min investment)
   - Sees 3 free AI insights (pattern, relational style, key insight)
   - Premium content blurred with "Unlock Full Analysis" CTA
   
2. **Dashboard - "Connections Changed" click** - Secondary conversion
   - Free users see notification count but can't access names
   - Paywall before RevealGate

3. **Landing page CTA** - "Begin Your Journey" with 7-day trial mention

---

### **Pro Plan - $29.99/month**
**Target**: Coaches, mentors, creators who accompany clients digitally
**Trial**: 14 days free

**Features**: Everything in Premium +

#### **Dual Mode**
- Personal mode (all Premium features for their own account)
- Professional mode (client management dashboard)

#### **Client Management**
- Unlimited client tracking
- Individual client profiles with private notes
- Custom tags (e.g., "growth Instagram", "mindset", "product launch")
- Progress timeline per client

#### **Social Analytics (Public Data Only)**
- Track client's **follower count** over time
- Track client's **following count** over time
- Growth charts and trends
- Before/after comparison
- **Privacy**: No access to who unfollowed/blocked clients

#### **Milestone & Progress Tracking**
- Create custom goals per client (e.g., "reach 10K followers", "first sale")
- Gamified achievement system
- Celebration of wins
- Progress reports

#### **Professional Notebook**
- Session notes per client
- Resource sharing (links, PDFs, exercises)
- Interaction history
- Searchable tags

#### **Portfolio & Proof**
- Total clients coached counter
- Aggregate statistics (e.g., "My clients gained +50K followers on average")
- Client testimonials (with permission)
- "Waler Pro Coach" badge for credibility

#### **Client Onboarding**
- Personalized invitation links
- Branded coach landing page
- Automated intake forms

#### **Communication Hub**
- Secure messaging with clients
- Share insights and reports
- Automated notifications (e.g., "Client gained +500 followers this week")

#### **Reports & Export**
- Generate PDF progress reports
- Export data for invoicing
- Proof of results for renewals

**Use Cases**:
- Instagram growth coaches tracking 20+ clients
- Business/mindset coaches monitoring client confidence via social presence
- Creator mentors analyzing growth patterns

---

## Technical Architecture

### Frontend (`/client`)
- **Framework**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **State**: React Context (Auth, Subscription)
- **Routing**: Wouter
- **Icons**: Lucide React

### Backend (`/server`)
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Session-based with HTTP-only cookies
- **Payments**: Stripe Checkout + Webhooks
- **APIs**: Instagram Private API (instagram-private-api)
- **Platform**: Instagram only (Facebook removed)

### Key Components

#### Subscription System
- `SubscriptionContext.tsx` - Global subscription state
- `PricingModal.tsx` - Conversion modal with plan selection
- `pricing.ts` - Plan configuration
- `/api/subscription/*` - Backend routes for Stripe integration

#### Onboarding Flow
1. **Step 0**: Consent & warning
2. **Step 1**: Usage mode (personal/professional)
3. **Step 2**: Demographics (gender, age range)
4. **Steps 3-9**: 14-question introspection questionnaire
   - Phase 1: You (relationship profile, patterns)
   - Phase 2: The relationship (nature, real-life presence)
   - Phase 3: Introspection (who were you, emotional debt, responsibility)
   - Phase 4: The signal (unfollow as message, emotional reaction)
   - Phase 5: The future (hope, reflection frequency)
10. **Step 10**: Summary
11. **Step 11**: **AI Insights Summary (Conversion Wall)**
    - 3 free insights visible
    - Full analysis blurred
    - "Unlock Full Analysis" → Opens PricingModal
12. **Steps 12-15**: Technical setup (platform, username, email, password)

#### RevealGate
Before showing who unfollowed/blocked, users must answer 5 consciousness-raising questions:
1. Feeling check (calm nervous system)
2. Recent tension (anchor in relational reality)
3. Unresolved relationships (powerful question)
4. First instinct (prepare reaction)
5. Conscious commitments (micro-contract)

Then transition screen with "Reveal" button.

---

## Database Schema

### Users Table (app_users)
```sql
- id (primary key)
- email (unique)
- password_hash
- username (Instagram @username)
- platform (always 'instagram')
- avatar_url
- is_connected (boolean - agents following)
- is_verified (boolean - 2FA verified)
- verification_code
- verification_token
- verification_token_expiry
- verification_attempts
- subscription_tier (premium/pro/null)
- subscription_status (active/trialing/cancelled/expired)
- trial_ends_at
- created_at
```

### Questionnaire Responses Table
```sql
- id (primary key)
- user_id (foreign key)
- answers (JSON)
- completed_at
- ai_insights (JSON) - cached AI analysis
```

### Clients Table (Pro users only)
```sql
- id (primary key)
- coach_user_id (foreign key to users)
- instagram_username
- display_name
- tags (JSON array)
- notes (text)
- milestones (JSON)
- created_at
- updated_at
```

### Client Metrics Table
```sql
- id (primary key)
- client_id (foreign key)
- followers_count
- following_count
- recorded_at
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-region.pooler.supabase.com:6543/postgres

# Instagram Agents
AGENT_A_INSTAGRAM_USER=agent_username_a
AGENT_A_INSTAGRAM_PASS=agent_password_a
AGENT_B_INSTAGRAM_USER=agent_username_b
AGENT_B_INSTAGRAM_PASS=agent_password_b
AGENT_C_INSTAGRAM_USER=agent_username_c (Pro plan)
AGENT_C_INSTAGRAM_PASS=agent_password_c (Pro plan)

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# App
CLIENT_URL=http://localhost:5000
SESSION_SECRET=...
PORT=5000
```

---

## AI Insights Generation

The AI analysis is generated based on questionnaire answers:

### Pattern Detection
- Analyzes `q2_pattern` for recurring vs first-time disconnection
- Identifies attachment style from `q6_responsibility`
- Emotional processing from `q8`

### Insights Structure
**Free Preview** (visible):
1. **Your Pattern**: Recurring/first-time/emerging awareness
2. **Relational Style**: Self-reflective/externally-focused/balanced
3. **Key Insight**: Personalized based on pattern + responsibility

**Premium** (blurred):
4. **Deep Psychological Analysis**: 2-3 paragraphs on attachment patterns
5. **Personalized Recommendations**: 4-6 actionable steps
6. **30-Day Transformation Plan**: Week-by-week guidance

---

## Conversion Psychology

### Why Step 11 Works
1. **Sunk Cost**: User invested 10-15 minutes in deep introspection
2. **Curiosity Gap**: They see 3 powerful insights, want the rest
3. **Emotional Peak**: Just finished vulnerable self-reflection
4. **Social Proof**: "AI Analysis Complete" badge creates authority
5. **Low Friction**: 7-day trial removes risk

### Pricing Strategy
- **Premium ($9.99)**: Positioned as "self-care investment" (~price of 2 coffees)
- **Pro ($29.99)**: 3x price justified by client ROI (coaches charge $100-500/client)
- **Trials**: Longer for Pro (14 days) to let coaches onboard clients and see value

---

## Future Roadmap

### V1 (Current)
- ✅ Introspection questionnaire
- ✅ AI insights with paywall
- ✅ RevealGate
- ✅ Premium/Pro plans
- ⏳ Stripe integration
- ⏳ Dashboard with connection tracking

### V2 (Next)
- Pro dashboard with client management
- Client analytics (followers/following graphs)
- Milestone tracking system
- Professional notebook
- Coach onboarding flow

### V3 (Future)
- Messaging hub
- PDF report generation
- Coach marketplace/directory
- Group coaching features
- Advanced AI insights (predictive patterns)

---

## Brand Voice Guidelines

### Do's
✅ Use introspective, compassionate language
✅ Focus on self-knowledge and growth
✅ Acknowledge emotional complexity
✅ Frame disconnection as opportunity for clarity

### Don'ts
❌ Surveillance or stalking language
❌ Blame or judgment
❌ Oversimplification of relationships
❌ Fear-mongering or drama

### Example Copy
- **Good**: "You noticed. Now understand why."
- **Bad**: "Catch who unfollowed you!"

- **Good**: "The first relationship clarity tool"
- **Bad**: "Track your Instagram followers"

---

## Support & Documentation

### For Users
- Questionnaire takes 10-15 minutes
- RevealGate requires honest self-reflection
- AI insights update with each new questionnaire
- Subscription can be cancelled anytime

### For Pro Users
- Client limit: Unlimited
- Data retention: 90 days of metrics
- Privacy: Coaches never see who unfollowed clients
- Client consent: Clients must approve coach access

---

## Analytics & Metrics

### Key Metrics to Track
- **Conversion Rate**: Step 11 → Paid subscription
- **Trial-to-Paid**: % of trials that convert
- **Churn Rate**: Monthly subscription cancellations
- **ARPU**: Average revenue per user
- **LTV**: Lifetime value (Premium vs Pro)
- **Questionnaire Completion**: % who finish all 14 steps

### Success Indicators
- Premium conversion >15% at Step 11
- Pro adoption >5% of Premium users
- Trial-to-paid >40%
- Monthly churn <10%

---

## Agent Follow System (Post-Payment)

### Automatic Follow Process

After a user completes payment via Stripe, the system automatically triggers the agent follow process:

1. **Stripe Webhook** (`checkout.session.completed`)
   - Creates subscription in database
   - Triggers `followNewClient(userId)` function
   
2. **Agent Follow** (`server/instagram-follow.ts`)
   - Agent A follows the user (unfollow detection)
   - Agent B follows the user (blocker verification)
   - Detects if account is private
   
3. **Private Account Handling**
   - If private: Sets `needsApproval = true`
   - User must manually accept follow requests
   - System shows onboarding tutorial with instructions
   
4. **Approval Verification**
   - User clicks "Verify" in onboarding
   - API checks if agents have been accepted
   - Updates `isConnected = true` when approved

### API Endpoints

```
POST /api/agents/follow
- Manually trigger agent follow
- Returns: { needsManualApproval, agentA, agentB }

POST /api/check-agent-approval
- Check if private account accepted agents
- Returns: { agentAApproved, agentBApproved, allApproved }
```

### Onboarding Tutorial

**Component**: `client/src/components/Onboarding.tsx`

**Steps**:
1. Welcome to Waler (concept explanation)
2. How it works (agent system)
3. Private account instructions (if applicable)
4. Dashboard features overview

**Private Account Flow**:
- Shows agent usernames to accept
- Step-by-step Instagram instructions
- "Verify" button to check approval status
- Auto-updates `isConnected` when approved

### How It Works Page

**Route**: `/how-it-works`
**Component**: `client/src/pages/HowItWorks.tsx`

Explains:
- The concept of relationship clarity
- Agent A and Agent B roles
- 5-step process from payment to insights
- Private account handling
- Security & privacy guarantees

### Environment Variables

```env
AGENT_A_INSTAGRAM_USER=agent_username_a
AGENT_A_INSTAGRAM_PASS=agent_password_a
AGENT_B_INSTAGRAM_USER=agent_username_b
AGENT_B_INSTAGRAM_PASS=agent_password_b
```

---

## Recent Technical Updates (2026-04-20)

### Session Management
- **Migrated from MemoryStore to PostgreSQL session store** (`connect-pg-simple`)
- Sessions now persist across server restarts
- Users no longer need to re-login after deployment
- Session table auto-created in database

### Authentication & Verification
- Users must be verified (`is_verified = true`) to access protected routes
- Verification status checked via middleware
- Script available: `scripts/verify-user.ts` for manual verification

### Dashboard & Statistics
- **Real Instagram stats** displayed from database (not mock data)
- Instagram stats banner shows: `instagramFollowers`, `instagramFollowing`
- Activity tracking separate from Instagram profile stats:
  - **Instagram stats**: Total followers/following from profile analysis
  - **Activity stats**: Recent followers/unfollowers/blockers detected by agents
- Chart data generated from real activity, not random data

### API Improvements
- `/api/stats/:userId` returns both Instagram stats and activity stats
- `/api/subscription/status` with debug logging
- Chart data uses real timestamps for proportional date spacing

### Pro Dashboard Features

#### Client Management
- **Client Detail View** with comprehensive tracking
- Client creation date automatically recorded
- Global deadline per client (optional, with visual indicators)
- Tags system for client categorization
- Delete client functionality

#### Milestone System
- Create custom milestones per client
- Mark milestones as success/failed
- Lock/unlock milestones to prevent accidental changes
- Deadline tracking with countdown timer (updates every second)
- Progress bar showing time elapsed vs total duration
- Visual indicators: green (success), red (failed), blue (in progress)
- Milestones displayed on growth chart as reference dots
- Click milestone badge to view details in modal

#### Session Notes with Rich Text Editor
- **Live WYSIWYG editor** - see formatting as you type
- **Text highlighting** - select text and apply colors (yellow, green, pink, blue, purple)
- **URL links** - add clickable links with custom modal (no prompt())
- **Milestone linking** - link text to specific milestones, clickable badges
- **Real-time preview** - annotations visible during editing, not just after save
- **Overlay rendering** - transparent textarea with colored overlay for live preview
- Edit/Save mode with visual feedback

#### Data Persistence
- **localStorage integration** for all client data
- Notes, annotations, and milestones persist across sessions
- Per-client storage with unique keys (`client-${id}-notes`, etc.)
- Date serialization for milestones (deadline, deadlineSetAt, date)
- Auto-save on every change via `useEffect` hooks

#### Analytics & Charts
- Growth chart with followers/following trends
- Chart uses `useMemo` to prevent data regeneration on re-render
- X-axis uses timestamps for proportional date spacing
- Date formatting via `tickFormatter` for readability
- Toggle followers/following visibility
- Period selection: 7d, 30d, 90d
- Milestone markers on chart with grouped display

### Database Schema Updates
```sql
-- Users table includes Instagram stats
- followers_count (from agent analysis)
- following_count (from agent analysis)
- posts_count
- bio
- is_private
- analysis_status (pending/analyzing/completed/failed)
- last_analyzed_at

-- Session table (auto-created)
- sid (primary key)
- sess (JSON)
- expire (timestamp)
```

### Agent Analysis System
- Agents (Clara & Nathan) analyze user Instagram profiles
- Extract followers, following, posts, bio, privacy status
- Timeout handling for robust data extraction
- Results stored in `app_users` table
- Analysis triggered on registration with Pro plan

### Scripts Available
- `scripts/verify-user.ts` - Mark user as verified
- `scripts/fix-user-plan.ts` - Update user plan and trigger analysis
- `scripts/check-user-stats.ts` - Check stored user statistics
- `scripts/delete-test-users.ts` - Delete test users (except agents)
- `scripts/generate-6digit.ts` - Generate verification codes manually

### Known Issues & Fixes
- ✅ Sessions persist across restarts (PostgreSQL store)
- ✅ Real stats displayed instead of mock data
- ✅ Chart data stable on milestone toggle
- ✅ Dates proportionally spaced on charts
- ✅ Subscription status correctly loaded from API
- ✅ Pro badge and mode switcher display correctly

### Technical Implementation Details

#### Rich Text Editor Architecture
- **Component**: `ClientDetailView.tsx`
- **Overlay technique**: Absolute positioned div with annotations rendered above transparent textarea
- **Annotation types**: 
  - `link`: URL with blue underline
  - `highlight`: Background color with black text
  - `milestone`: Purple badge with click handler
- **State management**: 
  - `annotations`: Array of `NoteAnnotation` objects
  - `selectedText`: Current text selection with start/end positions
  - `tempNotes`: Textarea content during editing
- **Modal**: Custom URL input modal (replaces browser `prompt()`)

#### Client Interface Updates
```typescript
interface Client {
  id: string;
  instagramUsername: string;
  displayName: string;
  tags: string[];
  currentFollowers: number;
  currentFollowing: number;
  followersChange: number;
  followingChange: number;
  lastUpdated: Date;
  createdAt: Date;           // NEW
  globalDeadline?: Date | null; // NEW
}
```

#### Milestone Interface
```typescript
interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  status: 'success' | 'failed' | null;
  date: Date | null;
  deadline: Date | null;
  deadlineSetAt: Date | null; // For accurate progress calculation
}
```

#### NoteAnnotation Interface
```typescript
interface NoteAnnotation {
  start: number;        // Character position
  end: number;          // Character position
  type: 'link' | 'highlight' | 'milestone';
  value: string;        // URL, color hex, or milestone ID
  text: string;         // Selected text
}
```

#### localStorage Keys
- `client-${clientId}-notes`: Session notes text
- `client-${clientId}-annotations`: JSON array of annotations
- `client-${clientId}-milestones`: JSON array of milestones (with date serialization)

#### Vite Configuration
- **Proxy**: `/api` routes proxied to Express server on port 5000
- **Root**: `client/` directory
- **Build output**: `dist/public/`
- **Aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

---

## Session Update - 2026-04-27

### Paywall Plan Recommendation System
- **Feature**: Dynamic plan recommendation in onboarding paywall based on usage type
- **Implementation**:
  - Modified `PaywallStep.tsx` to accept `usageMode` prop
  - Plans reordered: Premium first for "personal", Pro first for "professional"
  - Added "⭐ Recommended" badge on recommended plan
  - Visual highlighting: purple border and gradient for recommended plan
  - Button text changes: "Recommended" instead of "Select Plan"
  - Feature icons color-coded to match recommendation (purple vs green)

### Onboarding Questionnaire Enhancements
- **Continent & Country Selection**:
  - Added dependent dropdown: select continent first, then country
  - Country list filtered by selected continent
  - Auto-reset country when continent changes
  - Data structure: `CONTINENTS` array with country mappings in `questionnaire.ts`
  - New component: `QuestionCountry.tsx` for country selector

- **Usage Type Descriptions Updated**:
  - Personal: "I want to keep an eye on what and who I am with others"
  - Professional: "I live mainly through virtual relationships and want to better understand them"

### Data Architecture Cleanup
- **Removed Mock Data**:
  - Eliminated all mock data from `use-waler.ts` hooks
  - Application now uses only real API data
  - Proper error handling when API fails (no fallback to fake data)

- **API Schema Synchronization**:
  - Updated `shared/routes.ts` to match server response structure
  - Added Instagram profile stats fields: `instagramFollowers`, `instagramFollowing`, `instagramPosts`, `instagramBio`, `isPrivate`, `analysisStatus`, `lastAnalyzedAt`
  - Added `blockers` field to chart data
  - All fields marked as optional for backward compatibility

### Authentication & Dashboard Fixes
- **Authentication Flow**:
  - Re-enabled authentication checks in Dashboard
  - Redirect to home page if not authenticated
  - Use authenticated user's ID for API calls (no more hardcoded IDs)
  - Temporarily disabled `requireVerified` middleware for development

- **Dashboard Data Loading**:
  - Fixed `filteredChartData` calculation to use real timestamps
  - Chart now displays data spread across days/months correctly
  - Added comprehensive debug logging for auth and data states
  - Fixed TypeScript errors with optional Instagram stats fields

### UI/UX Improvements
- **Agent Banner**:
  - Added close button (X) to "Action required: Accept Waler agents" banner
  - State management with `hideAgentBanner` to toggle visibility
  - Banner can be dismissed without page reload

- **Settings Modal**:
  - Created floating settings button (bottom-left corner)
  - Settings icon rotates on hover
  - Gradient purple-blue design
  - Modal with 3 tabs: Account, Notifications, Privacy
  - Account tab shows username, email, logout, and delete account options
  - Notifications tab with toggle switches for preferences
  - Privacy tab with privacy settings toggles
  - Properly centered modal with backdrop blur
  - Accessible in both personal and professional modes

### Technical Improvements
- **Server Configuration**:
  - Routes `/api/users/:id` and `/api/stats/:userId` temporarily work without email verification
  - Session-based authentication working correctly
  - Proper error responses (401, 403) for unauthorized access

- **Component Structure**:
  - `SettingsModal.tsx`: Reusable settings modal component
  - Props: `isOpen`, `onClose`, `onLogout`, `user`
  - Framer Motion animations for smooth open/close
  - Responsive design with max-width and mobile padding

### Files Modified
- `client/src/types/questionnaire.ts` - Added continent/country types and data
- `client/src/components/questionnaire/QuestionCountry.tsx` - New country selector
- `client/src/components/questionnaire/UsageCard.tsx` - Updated descriptions
- `client/src/components/PaywallStep.tsx` - Plan recommendation logic
- `client/src/components/SettingsModal.tsx` - New settings modal
- `client/src/pages/Onboard.tsx` - Integrated country selector, pass usageMode to paywall
- `client/src/pages/Dashboard.tsx` - Auth fixes, debug logs, settings button
- `client/src/hooks/use-waler.ts` - Removed all mock data
- `shared/routes.ts` - Updated API response schema
- `server/routes.ts` - Disabled requireVerified temporarily
- `server/middleware.ts` - (no changes, but referenced for auth flow)

### Known Issues & Resolutions
- ✅ Mock data removed - app uses real API only
- ✅ Chart data synchronized with database records
- ✅ Authentication working with session persistence
- ✅ Settings modal properly centered
- ✅ TypeScript errors resolved for optional fields
- ⚠️ Email verification temporarily disabled for development

### Next Steps
- Re-enable email verification in production
- Add localStorage persistence for agent banner dismissal
- Consider adding more settings options (theme, language, etc.)
- Implement actual functionality for notification/privacy toggles

---

## Session Update - 2026-05-02

### Design System: Emoji to Minimalist Green Icons

**Objective**: Replace all emojis across the application with minimalist green Lucide React icons for a more professional and cohesive design.

#### Changes Made:

**1. Dashboard & Banners**
- `Dashboard.tsx`: Replaced ⚠️ emoji with `<AlertTriangle>` icon (green)
- Changed banner colors from orange/red to green/emerald gradient
- Updated text colors to green-100/green-200

**2. Onboarding Flow**
- `Onboarding.tsx`: 
  - 💡 → `<Lightbulb>` icon
  - 📊 → `<BarChart3>` icon
  - Added imports: `Shield`, `UserPlus`, `Check`, `Eye`, `TrendingUp`

**3. Pro Dashboard**
- `ProDashboard.tsx`: Filter buttons now use icons instead of emojis:
  - 🎯 → `<Target>` (Prospects)
  - 👑 → `<Crown>` (VIP)
  - ⭐ → `<Star>` (À garder)
  - 👁️ → `<Eye>` (À surveiller)
  - ✅ → `<CheckCircle>` (Convertis)

**4. Badge System**
- `types.ts`: Updated badge icon strings to Lucide icon names:
  - Prospect statuses: `Flame`, `Thermometer`, `Snowflake`, `CheckCircle`, `AlertCircle`
  - Circle badges: `Crown`, `Star`, `Eye`
  - All badges now use green color scheme (`text-green-400 bg-green-500/20 border-green-500/30`)

- Created `BadgeIcon.tsx`: Dynamic icon component that maps icon names to Lucide components
  - Accepts `iconName` prop (string) and renders corresponding Lucide icon
  - Used in `PersonCard.tsx` to display badges dynamically

**5. Modals & Forms**
- `AddPersonModal.tsx`:
  - 💡 → `<Lightbulb>` icon
  - Changed help text background to green
  - Removed emojis from dropdown options (VIP, À garder, À surveiller)

- `UnfollowerModal.tsx`: 👤 → `<User>` icon (green)
- `PersonCard.tsx`: ✅ → `<CheckCircle>` icon in "Converti" status

**6. Other Pages**
- `Verification.tsx`: ⚠️ → `<AlertTriangle>` icon with green styling
- `Landing.tsx`: 👤 → `<User>` icon
- `use-verification.ts`: Removed ✅ emoji from toast title

#### Technical Implementation:

**Icon Mapping System**:
```typescript
// BadgeIcon.tsx
const iconMap: Record<string, React.ComponentType> = {
  Flame, Thermometer, Snowflake, CheckCircle, 
  AlertCircle, Crown, Star, Eye
};
```

**Color Scheme**:
- Primary: `text-green-400`
- Background: `bg-green-500/20`
- Border: `border-green-500/30`
- Gradients: `from-green-500/20 to-emerald-500/20`

#### Files Modified:
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/Landing.tsx`
- `client/src/pages/Verification.tsx`
- `client/src/components/Onboarding.tsx`
- `client/src/components/UnfollowerModal.tsx`
- `client/src/components/pro/ProDashboard.tsx`
- `client/src/components/pro/AddPersonModal.tsx`
- `client/src/components/pro/PersonCard.tsx`
- `client/src/components/pro/types.ts`
- `client/src/components/pro/BadgeIcon.tsx` (NEW)
- `client/src/hooks/use-verification.ts`

#### Benefits:
- ✅ Consistent visual language across the app
- ✅ Professional, minimalist aesthetic
- ✅ Better accessibility (icons with semantic meaning)
- ✅ Scalable icon system (easy to add new icons)
- ✅ Green color scheme reinforces brand identity

---

Last updated: 2026-05-02
