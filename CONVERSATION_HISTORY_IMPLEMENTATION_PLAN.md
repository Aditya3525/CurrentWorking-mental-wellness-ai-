# 💬 Conversation History Implementation Plan

## Overview
Implement a ChatGPT-style conversation history sidebar that allows users to:
- View all past conversation sessions
- Switch between conversations
- Search conversations
- Create new conversations
- Delete/archive conversations
- Auto-generate conversation titles

---

## 🎯 Core Features

### 1. **Conversation Sessions** (Similar to ChatGPT)
- Each chat session has a unique ID
- Sessions are grouped by date (Today, Yesterday, Last 7 Days, etc.)
- Auto-generate titles from first message
- Show last message preview
- Display timestamp

### 2. **Sidebar Navigation**
- Collapsible/expandable sidebar
- "New Chat" button at top
- List of conversations with:
  - Auto-generated title
  - Last message preview (truncated)
  - Timestamp
  - Active state indicator
- Search functionality
- Mobile-responsive (drawer on small screens)

### 3. **Conversation Management**
- Create new conversation
- Switch between conversations
- Rename conversations
- Delete conversations
- Archive old conversations
- Export conversation

---

## 🏗️ Database Schema Changes

### Add `conversations` Table

```prisma
model Conversation {
  id          String   @id @default(uuid())
  userId      String
  title       String?  // Auto-generated or user-edited
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastMessageAt DateTime @default(now())
  isArchived  Boolean  @default(false)
  metadata    Json?    // Store additional info like tags, summary, etc.
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    ChatMessage[]
  
  @@index([userId, lastMessageAt])
  @@index([userId, isArchived])
  @@map("conversations")
}
```

### Update `ChatMessage` Table

```prisma
model ChatMessage {
  id              String   @id @default(uuid())
  conversationId  String   // NEW: Link to conversation
  userId          String
  content         String
  type            String   // 'user' | 'bot' | 'system'
  metadata        Json?
  createdAt       DateTime @default(now())
  
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([conversationId, createdAt])
  @@index([userId, createdAt])
  @@map("chat_messages")
}
```

---

## 📡 Backend API Endpoints

### 1. Conversation Management

```typescript
// GET /api/conversations
// Get all conversations for user
interface GetConversationsResponse {
  conversations: {
    id: string;
    title: string;
    lastMessage: string;
    lastMessageAt: Date;
    messageCount: number;
    createdAt: Date;
  }[];
}

// POST /api/conversations
// Create new conversation
interface CreateConversationRequest {
  title?: string; // Optional initial title
}

// GET /api/conversations/:id
// Get conversation details with messages
interface GetConversationResponse {
  id: string;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
}

// PATCH /api/conversations/:id
// Update conversation (rename)
interface UpdateConversationRequest {
  title?: string;
  isArchived?: boolean;
}

// DELETE /api/conversations/:id
// Delete conversation

// POST /api/conversations/:id/title
// Auto-generate title from messages
interface GenerateTitleResponse {
  title: string;
}
```

### 2. Enhanced Chat Endpoints

```typescript
// POST /api/chat/message
// Modified to include conversationId
interface SendMessageRequest {
  content: string;
  conversationId?: string; // Create new if not provided
}

interface SendMessageResponse {
  message: ChatMessage;
  conversationId: string;
  conversationTitle?: string; // If newly generated
}
```

---

## 🎨 Frontend Components

### 1. ConversationHistorySidebar Component

```tsx
// frontend/src/components/features/chat/ConversationHistorySidebar.tsx
interface ConversationHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationHistorySidebar: React.FC<ConversationHistorySidebarProps> = ({
  isOpen,
  onClose,
  currentConversationId,
  onConversationSelect,
  onNewConversation
}) => {
  const { data: conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Group conversations by date
  const groupedConversations = useMemo(() => {
    return groupByDate(conversations, searchQuery);
  }, [conversations, searchQuery]);
  
  return (
    <div className={`conversation-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Header with New Chat button */}
      <div className="sidebar-header">
        <Button onClick={onNewConversation}>
          <Plus /> New Chat
        </Button>
      </div>
      
      {/* Search */}
      <div className="search-box">
        <Search className="icon" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Conversation List */}
      <div className="conversations-list">
        {Object.entries(groupedConversations).map(([group, convs]) => (
          <div key={group} className="conversation-group">
            <h3 className="group-title">{group}</h3>
            {convs.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onClick={() => onConversationSelect(conv.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. ConversationItem Component

```tsx
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick
}) => {
  const [showActions, setShowActions] = useState(false);
  const { mutate: deleteConversation } = useDeleteConversation();
  const { mutate: renameConversation } = useRenameConversation();
  
  return (
    <div 
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <MessageCircle className="icon" />
      
      <div className="content">
        <h4 className="title">{conversation.title}</h4>
        <p className="preview">{conversation.lastMessage}</p>
        <span className="timestamp">
          {formatDistanceToNow(conversation.lastMessageAt, { addSuffix: true })}
        </span>
      </div>
      
      {showActions && (
        <div className="actions">
          <DropdownMenu>
            <DropdownMenuItem onClick={() => renameConversation(conversation.id)}>
              <Edit2 /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteConversation(conversation.id)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
```

### 3. Updated Chatbot Component

```tsx
// Modified Chatbot.tsx to support multiple conversations
export function Chatbot({ user, onNavigate, isModal = false, onClose }: ChatbotProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Load messages for current conversation
  const { data: messages } = useConversationMessages(currentConversationId);
  
  const handleNewConversation = () => {
    setCurrentConversationId(null); // Clear current conversation
    // Messages will be empty, showing EmptyState
  };
  
  const handleSendMessage = async (content: string) => {
    const response = await chatApi.sendMessage({
      content,
      conversationId: currentConversationId || undefined
    });
    
    // If new conversation, update current ID
    if (!currentConversationId && response.data.conversationId) {
      setCurrentConversationId(response.data.conversationId);
    }
  };
  
  return (
    <div className="chatbot-container">
      {/* Conversation History Sidebar */}
      <ConversationHistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onConversationSelect={setCurrentConversationId}
        onNewConversation={handleNewConversation}
      />
      
      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header with toggle */}
        <div className="chat-header">
          <Button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu />
          </Button>
          <h2>{getCurrentConversationTitle()}</h2>
        </div>
        
        {/* Messages (existing implementation) */}
        {/* ... */}
      </div>
    </div>
  );
}
```

---

## 🔧 Backend Service Implementation

### 1. ConversationService

```typescript
// backend/src/services/conversationService.ts
export class ConversationService {
  
  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string, includeArchived = false): Promise<Conversation[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        isArchived: includeArchived ? undefined : false
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get last message for preview
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
    
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title || this.generateDefaultTitle(conv),
      lastMessage: conv.messages[0]?.content.substring(0, 50) || '',
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv._count.messages,
      createdAt: conv.createdAt
    }));
  }
  
  /**
   * Create new conversation
   */
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    return await prisma.conversation.create({
      data: {
        userId,
        title: title || null
      }
    });
  }
  
  /**
   * Get conversation with messages
   */
  async getConversation(conversationId: string, userId: string): Promise<ConversationWithMessages> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    return conversation;
  }
  
  /**
   * Auto-generate conversation title from messages
   */
  async generateConversationTitle(conversationId: string): Promise<string> {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 3 // First 3 messages
    });
    
    if (messages.length === 0) {
      return 'New Conversation';
    }
    
    // Use first user message as base
    const firstUserMessage = messages.find(m => m.type === 'user');
    if (!firstUserMessage) {
      return 'New Conversation';
    }
    
    // Generate title using AI (optional, more sophisticated)
    const title = await this.generateTitleWithAI(firstUserMessage.content);
    
    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title }
    });
    
    return title;
  }
  
  /**
   * Generate title using AI
   */
  private async generateTitleWithAI(content: string): Promise<string> {
    // Simple version: Use first 50 chars
    let title = content.substring(0, 50).trim();
    
    // Or use AI to generate a better title
    try {
      const response = await llmService.generateResponse(
        [
          {
            role: 'system',
            content: 'Generate a short 3-5 word title for this conversation. Return only the title, no quotes.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        { maxTokens: 20 }
      );
      
      title = response.content.trim();
    } catch (error) {
      // Fallback to simple version
      console.error('Failed to generate AI title:', error);
    }
    
    return title;
  }
  
  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string, 
    userId: string, 
    updates: { title?: string; isArchived?: boolean }
  ): Promise<Conversation> {
    return await prisma.conversation.update({
      where: { 
        id: conversationId,
        userId // Ensure user owns conversation
      },
      data: updates
    });
  }
  
  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    await prisma.conversation.delete({
      where: { 
        id: conversationId,
        userId 
      }
    });
  }
  
  /**
   * Update last message timestamp
   */
  async updateLastMessageTime(conversationId: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });
  }
  
  /**
   * Generate default title from creation date
   */
  private generateDefaultTitle(conversation: any): string {
    const date = new Date(conversation.createdAt);
    return `Conversation on ${date.toLocaleDateString()}`;
  }
}

export const conversationService = new ConversationService();
```

### 2. Update ChatService

```typescript
// Modify sendMessage to work with conversations
async sendMessage(
  userId: string,
  content: string,
  conversationId?: string
): Promise<{
  message: ChatMessage;
  conversationId: string;
  conversationTitle?: string;
}> {
  let convId = conversationId;
  let newTitle: string | undefined;
  
  // Create new conversation if not provided
  if (!convId) {
    const newConversation = await conversationService.createConversation(userId);
    convId = newConversation.id;
  }
  
  // Save user message
  const userMessage = await this.saveChatMessage(
    userId,
    content,
    'user',
    { conversationId: convId }
  );
  
  // Generate AI response (existing logic)
  const response = await this.generateResponse(userId, content);
  
  // Save bot message
  const botMessage = await this.saveChatMessage(
    userId,
    response.content,
    'bot',
    {
      conversationId: convId,
      sentiment: response.sentiment,
      smartReplies: response.smartReplies
    }
  );
  
  // Update conversation's last message time
  await conversationService.updateLastMessageTime(convId);
  
  // Generate title if this is the first message
  const messageCount = await prisma.chatMessage.count({
    where: { conversationId: convId }
  });
  
  if (messageCount === 2) { // First user + bot message
    newTitle = await conversationService.generateConversationTitle(convId);
  }
  
  return {
    message: botMessage,
    conversationId: convId,
    conversationTitle: newTitle
  };
}
```

---

## 🎣 Frontend Hooks

### 1. useConversations Hook

```typescript
// frontend/src/hooks/useConversations.ts
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    staleTime: 30 * 1000 // 30 seconds
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId, 'messages'],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.messages;
    },
    enabled: !!conversationId
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}
```

---

## 📱 Mobile Responsiveness

### Sidebar Behavior
- **Desktop (>768px)**: Sidebar always visible, can toggle collapse
- **Tablet (768px-1024px)**: Sidebar collapsible, starts collapsed
- **Mobile (<768px)**: Sidebar as drawer/modal, hidden by default

### Implementation
```tsx
const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

return (
  <div className="chatbot-container">
    {/* Desktop: Side panel */}
    {!isMobile && (
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <ConversationHistorySidebar />
      </aside>
    )}
    
    {/* Mobile: Drawer */}
    {isMobile && (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left">
          <ConversationHistorySidebar />
        </SheetContent>
      </Sheet>
    )}
  </div>
);
```

---

## 🎨 UI/UX Details

### Date Grouping
```typescript
function groupByDate(conversations: Conversation[]): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    'Older': []
  };
  
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = subDays(today, 1);
  const last7Days = subDays(today, 7);
  const last30Days = subDays(today, 30);
  
  conversations.forEach(conv => {
    const date = new Date(conv.lastMessageAt);
    
    if (isAfter(date, today)) {
      groups['Today'].push(conv);
    } else if (isAfter(date, yesterday)) {
      groups['Yesterday'].push(conv);
    } else if (isAfter(date, last7Days)) {
      groups['Last 7 Days'].push(conv);
    } else if (isAfter(date, last30Days)) {
      groups['Last 30 Days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, convs]) => convs.length > 0)
  );
}
```

### Search Functionality
```typescript
function filterConversations(conversations: Conversation[], query: string) {
  if (!query) return conversations;
  
  const lowerQuery = query.toLowerCase();
  return conversations.filter(conv => 
    conv.title.toLowerCase().includes(lowerQuery) ||
    conv.lastMessage.toLowerCase().includes(lowerQuery)
  );
}
```

---

## 🚀 Implementation Steps

### Phase 1: Database & Backend (2-3 hours)
1. ✅ Create migration for `conversations` table
2. ✅ Update `ChatMessage` schema to include `conversationId`
3. ✅ Implement `ConversationService`
4. ✅ Update `ChatService` to work with conversations
5. ✅ Add API routes for conversation management

### Phase 2: Frontend Components (3-4 hours)
1. ✅ Create `ConversationHistorySidebar` component
2. ✅ Create `ConversationItem` component
3. ✅ Implement conversation hooks
4. ✅ Update `Chatbot.tsx` to support multiple conversations
5. ✅ Add mobile drawer for sidebar

### Phase 3: Features & Polish (2-3 hours)
1. ✅ Implement search functionality
2. ✅ Add rename conversation modal
3. ✅ Add delete confirmation
4. ✅ Implement auto-title generation
5. ✅ Add keyboard shortcuts (Cmd+K for new chat)
6. ✅ Polish animations and transitions

### Phase 4: Testing (1-2 hours)
1. ✅ Test conversation creation
2. ✅ Test switching between conversations
3. ✅ Test delete and rename
4. ✅ Test mobile responsiveness
5. ✅ Test search functionality

---

## 💡 Additional Features (Optional)

### 1. Conversation Tags/Categories
- Tag conversations (work, personal, anxiety, etc.)
- Filter by tags
- Color-coded tags

### 2. Conversation Sharing
- Export conversation as text/PDF
- Share conversation link (with privacy controls)

### 3. Conversation Analytics
- Track conversation topics
- Show emotional trends across conversations
- Highlight breakthrough moments

### 4. Advanced Search
- Search within conversation content
- Filter by date range
- Filter by sentiment/emotion

### 5. Keyboard Shortcuts
- `Cmd/Ctrl + K` - New conversation
- `Cmd/Ctrl + Shift + F` - Search conversations
- `Cmd/Ctrl + Shift + D` - Delete conversation
- `Arrow Up/Down` - Navigate conversations

---

## 📊 Success Metrics

- **User Engagement**: Increase session duration by 40%
- **Retention**: Users return to previous conversations 3+ times/week
- **Organization**: Average of 5-10 active conversations per user
- **Search Usage**: 20% of users use search weekly

---

## 🎯 Final Notes

This implementation provides a full ChatGPT-style conversation history experience with:
- ✅ Clean, organized sidebar
- ✅ Easy conversation switching
- ✅ Auto-generated titles
- ✅ Search functionality
- ✅ Mobile-responsive design
- ✅ Smooth animations
- ✅ Database efficiency (indexed queries)

The architecture is scalable and can handle thousands of conversations per user without performance issues.
