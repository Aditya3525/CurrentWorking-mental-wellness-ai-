# Conversation Advanced Features Implementation Plan

## Features to Implement

1. **📤 Export Conversations** - PDF/Text download (4-6 hours)
2. **🏷️ Tags/Labels** - Categorize conversations (8-10 hours)
3. **📝 Conversation Templates** - Quick start templates (6-8 hours)

**Total Estimated Time:** 18-24 hours

---

## Phase 1: Export Conversations (4-6 hours)

### Overview
Allow users to export their conversations in multiple formats (PDF, Text, JSON) with formatting options.

### Backend Changes

#### 1.1 Database Schema (No changes needed)
- Conversations and messages already contain all necessary data

#### 1.2 New API Endpoints
**File:** `backend/src/controllers/conversationController.ts`

```typescript
// Export single conversation
GET /api/conversations/:id/export?format=pdf|text|json

// Export multiple conversations
POST /api/conversations/export/bulk
Body: { conversationIds: string[], format: 'pdf' | 'text' | 'json' }
```

#### 1.3 Export Service
**File:** `backend/src/services/exportService.ts` (NEW)

```typescript
- generateTextExport(conversation, messages)
- generatePDFExport(conversation, messages) // Using pdfkit
- generateJSONExport(conversation, messages)
- generateBulkExport(conversations, format)
```

**Dependencies to install:**
```bash
npm install pdfkit
npm install @types/pdfkit --save-dev
```

### Frontend Changes

#### 1.4 Export UI Component
**File:** `frontend/src/components/features/chat/ExportDialog.tsx` (NEW)

Features:
- Format selection (PDF, Text, JSON)
- Include/exclude system messages toggle
- Date range filter
- Single or bulk export
- Preview before export
- Download progress indicator

#### 1.5 Integration Points

**ConversationItem.tsx:**
- Add "Export" option to dropdown menu

**ConversationHistorySidebar.tsx:**
- Add bulk select mode
- Add "Export Selected" button in header

**Chatbot.tsx:**
- Add "Export Current Chat" in QuickActionsBar

#### 1.6 Export Hooks
**File:** `frontend/src/hooks/useConversationExport.ts` (NEW)

```typescript
- useExportConversation(conversationId, format)
- useBulkExport(conversationIds, format)
```

### Export Format Details

#### Text Export Format
```
===========================================
Conversation: [Title]
Date: [Created Date]
Messages: [Count]
===========================================

[Timestamp] You:
[Message content]

[Timestamp] AI Assistant:
[Response content]

-------------------------------------------
```

#### PDF Export Format
- Header with logo and title
- Metadata table (date, message count, duration)
- Formatted messages with timestamps
- Page numbers and footer
- Professional styling

#### JSON Export Format
```json
{
  "conversation": {
    "id": "...",
    "title": "...",
    "createdAt": "...",
    "metadata": {}
  },
  "messages": [
    {
      "id": "...",
      "type": "user",
      "content": "...",
      "timestamp": "..."
    }
  ],
  "exportedAt": "...",
  "version": "1.0"
}
```

---

## Phase 2: Tags/Labels (8-10 hours)

### Overview
Allow users to create custom tags and organize conversations by categories.

### Backend Changes

#### 2.1 Database Schema Updates
**File:** `backend/prisma/schema.prisma`

```prisma
// New Tag model
model Tag {
  id        String   @id @default(cuid())
  name      String
  color     String   // Hex color code
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  conversations ConversationTag[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, name]) // User can't have duplicate tag names
  @@index([userId])
}

// Junction table for many-to-many relationship
model ConversationTag {
  id             String       @id @default(cuid())
  conversationId String
  tagId          String
  
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  tag            Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  createdAt      DateTime     @default(now())
  
  @@unique([conversationId, tagId])
  @@index([conversationId])
  @@index([tagId])
}

// Update Conversation model
model Conversation {
  // ... existing fields
  tags ConversationTag[]
}
```

#### 2.2 New Tag Service
**File:** `backend/src/services/tagService.ts` (NEW)

```typescript
- createTag(userId, name, color)
- getUserTags(userId)
- updateTag(tagId, name, color)
- deleteTag(tagId)
- addTagToConversation(conversationId, tagId)
- removeTagFromConversation(conversationId, tagId)
- getConversationsByTag(userId, tagId)
```

#### 2.3 New API Endpoints
**File:** `backend/src/controllers/tagController.ts` (NEW)

```typescript
GET    /api/tags                    // Get all user tags
POST   /api/tags                    // Create new tag
PUT    /api/tags/:id                // Update tag
DELETE /api/tags/:id                // Delete tag

POST   /api/conversations/:id/tags/:tagId    // Add tag
DELETE /api/conversations/:id/tags/:tagId    // Remove tag
GET    /api/conversations/by-tag/:tagId      // Get conversations by tag
```

#### 2.4 Update Conversation Controller
**File:** `backend/src/controllers/conversationController.ts`

- Update `listConversations` to include tags
- Update `getConversation` to return tags
- Add tag filtering support

### Frontend Changes

#### 2.5 Tag Management Components

**TagManager.tsx** (NEW)
- List all tags
- Create new tag with color picker
- Edit tag name/color
- Delete tag
- Show conversation count per tag

**TagSelector.tsx** (NEW)
- Multi-select dropdown for tags
- Create tag on-the-fly
- Color-coded badges

**TagBadge.tsx** (NEW)
- Display tag with color
- Remove tag button (X)
- Click to filter

#### 2.6 Integration Points

**ConversationItem.tsx:**
- Display tags as colored badges
- Click badge to filter by tag
- Add tag button in dropdown menu

**ConversationHistorySidebar.tsx:**
- Tag filter section in header
- Group by tags option
- "All Tags" dropdown

**Chatbot.tsx:**
- Add tags to current conversation
- Show active conversation tags

#### 2.7 Tag Hooks
**File:** `frontend/src/hooks/useTags.ts` (NEW)

```typescript
- useTags()                          // Get all user tags
- useCreateTag()                     // Create new tag
- useUpdateTag()                     // Update tag
- useDeleteTag()                     // Delete tag
- useAddTagToConversation()          // Add tag
- useRemoveTagFromConversation()     // Remove tag
- useConversationsByTag()            // Filter by tag
```

### Tag Features

#### Predefined Tag Colors
```typescript
const TAG_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];
```

#### Tag Use Cases
- **Mood-based:** "Anxious", "Happy", "Stressed"
- **Topic-based:** "Work", "Relationships", "Self-care"
- **Priority:** "Important", "Follow-up", "Urgent"
- **Progress:** "Breakthrough", "Challenge", "Goal"

---

## Phase 3: Conversation Templates (6-8 hours)

### Overview
Pre-built conversation starters with common mental wellness topics and structured flows.

### Backend Changes

#### 3.1 Database Schema
**File:** `backend/prisma/schema.prisma`

```prisma
model ConversationTemplate {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String   // 'anxiety', 'depression', 'stress', 'self-care', etc.
  icon        String?  // Icon name for display
  
  // Template messages
  messages    TemplateMessage[]
  
  // Admin-created or user-created
  isGlobal    Boolean  @default(false)
  createdBy   String?  // null if admin/system template
  user        User?    @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  
  // Usage tracking
  usageCount  Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([isGlobal])
  @@index([createdBy])
}

model TemplateMessage {
  id         String               @id @default(cuid())
  templateId String
  template   ConversationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  order      Int                  // Message order in template
  type       String               // 'user' or 'bot'
  content    String               @db.Text
  
  createdAt  DateTime             @default(now())
  
  @@index([templateId, order])
}
```

#### 3.2 Template Service
**File:** `backend/src/services/templateService.ts` (NEW)

```typescript
- getTemplates(userId?, category?)           // Get all templates
- getTemplateById(templateId)                // Get single template
- createTemplate(data)                       // Create custom template
- updateTemplate(templateId, data)           // Update template
- deleteTemplate(templateId)                 // Delete template
- useTemplate(userId, templateId)            // Create conversation from template
- incrementUsageCount(templateId)            // Track usage
```

#### 3.3 New API Endpoints
**File:** `backend/src/controllers/templateController.ts` (NEW)

```typescript
GET    /api/templates                   // Get all templates
GET    /api/templates/:id               // Get template by ID
POST   /api/templates                   // Create custom template
PUT    /api/templates/:id               // Update template
DELETE /api/templates/:id               // Delete template
POST   /api/templates/:id/use           // Use template (create conversation)
```

### Frontend Changes

#### 3.4 Template Components

**TemplateGallery.tsx** (NEW)
- Grid/list view of templates
- Category filters
- Search templates
- Preview template messages
- "Use Template" button

**TemplateCard.tsx** (NEW)
- Template preview
- Category badge
- Usage count
- Description
- Click to preview/use

**TemplateCreator.tsx** (NEW)
- Create custom template
- Add/remove messages
- Set category and icon
- Save as personal template

**TemplatePreviewDialog.tsx** (NEW)
- Show full template conversation flow
- Edit before starting
- Customize messages
- Start conversation

#### 3.5 Integration Points

**Chatbot.tsx:**
- "Browse Templates" button in empty state
- Quick template suggestions

**ConversationHistorySidebar.tsx:**
- "Templates" tab alongside conversations
- Quick access to favorites

**Dashboard.tsx:**
- "Recommended Templates" widget
- Based on user's patterns

#### 3.6 Template Hooks
**File:** `frontend/src/hooks/useTemplates.ts` (NEW)

```typescript
- useTemplates(category?)                // Get all templates
- useTemplate(templateId)                // Get single template
- useCreateTemplate()                    // Create custom template
- useUpdateTemplate()                    // Update template
- useDeleteTemplate()                    // Delete template
- useTemplateStart()                     // Start conversation from template
```

### Default Templates to Create

#### 1. Anxiety Management
```
Category: Anxiety
Messages:
1. User: "I've been feeling anxious lately and I'm not sure how to cope."
2. Bot: "I'm here to help. Let's explore what's been making you feel anxious..."
```

#### 2. Daily Check-In
```
Category: Self-Care
Messages:
1. User: "I'd like to do a daily wellness check-in."
2. Bot: "Great! Let's start with a few questions about how you're feeling today..."
```

#### 3. Stress Management
```
Category: Stress
Messages:
1. User: "I'm feeling overwhelmed with stress from work/life."
2. Bot: "Let's work through this together. First, can you tell me what's causing the most stress?"
```

#### 4. Sleep Issues
```
Category: Sleep
Messages:
1. User: "I'm having trouble sleeping and it's affecting my day."
2. Bot: "Sleep is crucial for mental health. Let's discuss your sleep patterns..."
```

#### 5. Gratitude Practice
```
Category: Positive Psychology
Messages:
1. User: "I want to practice gratitude."
2. Bot: "Wonderful! Gratitude practices can significantly improve wellbeing. Let's start..."
```

#### 6. Relationship Support
```
Category: Relationships
Messages:
1. User: "I'm struggling with a relationship issue."
2. Bot: "Relationships can be complex. Tell me more about what's happening..."
```

#### 7. Goal Setting
```
Category: Personal Growth
Messages:
1. User: "I want to set some personal wellness goals."
2. Bot: "That's fantastic! Let's create achievable goals together..."
```

#### 8. Coping Skills
```
Category: Skills Building
Messages:
1. User: "What coping skills can I learn?"
2. Bot: "I can teach you several evidence-based coping techniques..."
```

---

## Implementation Order

### Week 1: Export Feature (Days 1-2)
1. ✅ Backend export service
2. ✅ PDF generation with pdfkit
3. ✅ Export API endpoints
4. ✅ Frontend export dialog
5. ✅ Integration with sidebar & chatbot
6. ✅ Testing all formats

### Week 2: Tags/Labels (Days 3-6)
1. ✅ Database migration for tags
2. ✅ Tag service & API endpoints
3. ✅ Tag management UI
4. ✅ Tag badges in conversations
5. ✅ Filtering by tags
6. ✅ Bulk tagging operations
7. ✅ Testing & refinement

### Week 3: Templates (Days 7-9)
1. ✅ Database migration for templates
2. ✅ Template service & API
3. ✅ Seed default templates
4. ✅ Template gallery UI
5. ✅ Template creator
6. ✅ Integration with chatbot
7. ✅ Testing & refinement

---

## Technical Considerations

### Export Feature
- **PDF Generation:** Use `pdfkit` for server-side PDF generation
- **Large Exports:** Stream large files instead of loading in memory
- **Rate Limiting:** Limit export frequency to prevent abuse
- **Storage:** Consider temporary file cleanup after download

### Tags
- **Performance:** Index tag queries for fast filtering
- **Validation:** Limit tag name length and special characters
- **Uniqueness:** Prevent duplicate tag names per user
- **Cascade Delete:** Remove tags from conversations when deleted

### Templates
- **Caching:** Cache global templates for performance
- **Versioning:** Consider template versioning for updates
- **Permissions:** Ensure users can only edit their own templates
- **Seeding:** Create seed file for default templates

---

## Dependencies to Install

### Backend
```bash
cd backend
npm install pdfkit
npm install @types/pdfkit --save-dev
```

### Frontend
```bash
cd frontend
npm install jspdf  # Alternative client-side PDF generation
npm install file-saver  # For downloads
npm install react-colorful  # Color picker for tags
```

---

## API Summary

### Export APIs
- `GET /api/conversations/:id/export?format=pdf|text|json`
- `POST /api/conversations/export/bulk`

### Tag APIs
- `GET /api/tags`
- `POST /api/tags`
- `PUT /api/tags/:id`
- `DELETE /api/tags/:id`
- `POST /api/conversations/:id/tags/:tagId`
- `DELETE /api/conversations/:id/tags/:tagId`
- `GET /api/conversations/by-tag/:tagId`

### Template APIs
- `GET /api/templates`
- `GET /api/templates/:id`
- `POST /api/templates`
- `PUT /api/templates/:id`
- `DELETE /api/templates/:id`
- `POST /api/templates/:id/use`

---

## Testing Strategy

### Export Testing
- Test each format (PDF, Text, JSON)
- Test with various message counts (1, 100, 1000+)
- Test special characters and emojis
- Test download on different browsers
- Test bulk export with multiple conversations

### Tags Testing
- Create/edit/delete tags
- Add/remove tags from conversations
- Filter by single tag
- Filter by multiple tags
- Test cascade delete behavior
- Test duplicate tag name validation

### Templates Testing
- Browse and search templates
- Use template to start conversation
- Create custom template
- Edit template messages
- Delete template
- Test template categories
- Test usage count tracking

---

## Success Criteria

### Export Feature ✅
- Users can export conversations in 3 formats
- PDF exports are well-formatted and professional
- Bulk export works efficiently
- Downloads work on all major browsers

### Tags Feature ✅
- Users can create unlimited tags with custom colors
- Tags are visible on conversation items
- Filtering by tags works instantly
- Tag management is intuitive

### Templates Feature ✅
- 8+ default templates available
- Users can create custom templates
- Template gallery is easy to browse
- Starting from template creates conversation correctly

---

## Next Steps

Ready to start implementation! Which feature would you like to begin with?

1. **📤 Export Conversations** (quickest, 4-6 hours)
2. **🏷️ Tags/Labels** (most complex, 8-10 hours)
3. **📝 Conversation Templates** (medium complexity, 6-8 hours)

Or start with **Export** since it's the quickest win? 🚀
