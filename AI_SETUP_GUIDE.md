# Mental Wellbeing AI App - Setup Guide

## 🚀 AI Integration Complete!

The chatbot is now fully integrated with multiple AI providers and can generate **personalized responses** based on:
- User's therapeutic approach preference (western/eastern/hybrid)
- Recent assessment results
- Mood tracking history
- Conversation context
- User's profile and preferences

## 🧠 AI Provider System

### Supported Providers (with Automatic Failover):
1. **OpenAI GPT** (Primary) - Multiple API key support
2. **Anthropic Claude** (Secondary) - Multiple API key support  
3. **Ollama Local LLM** (Fallback) - Works offline with llama3

### Key Features:
- ✅ **Multi-API Key Rotation**: Automatic switching when rate limits hit
- ✅ **Intelligent Fallback**: Seamlessly switches to local Ollama if cloud providers fail
- ✅ **Therapeutic Context**: Responses tailored to user's mental health approach
- ✅ **Crisis Detection**: Automatic intervention for concerning language
- ✅ **Conversation Memory**: Maintains context across chat sessions
- ✅ **Provider Health Monitoring**: Real-time status checking

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\backend"
Copy-Item .env.example .env
```

### Step 2: Add Your API Keys

Edit `backend\.env` file with your API keys:

```env
# OpenAI Configuration (Multiple keys for rate limit handling)
OPENAI_API_KEY_1=your_openai_key_1_here
OPENAI_API_KEY_2=your_openai_key_2_here
OPENAI_API_KEY_3=your_openai_key_3_here

# Anthropic Configuration (Multiple keys for rate limit handling)
ANTHROPIC_API_KEY_1=your_anthropic_key_1_here
ANTHROPIC_API_KEY_2=your_anthropic_key_2_here

# Ollama Local LLM Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# AI Provider Priority (comma-separated, first = highest priority)
AI_PROVIDER_PRIORITY=openai,anthropic,ollama

# AI Response Configuration
AI_MAX_TOKENS=150
AI_TEMPERATURE=0.7
AI_TOP_P=0.9
```

### Step 3: Install Ollama (Local LLM Fallback)

1. **Download Ollama**: Visit [https://ollama.ai](https://ollama.ai) and download for Windows
2. **Install and Start Ollama**:
   ```powershell
   # After installation, Ollama runs as a service
   # Pull the llama3 model
   ollama pull llama3
   ```
3. **Verify Installation**:
   ```powershell
   ollama list
   ```

### Step 4: Start the Application

```powershell
# Start backend (with AI providers)
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\backend"
npm run dev

# Start frontend (in new terminal)
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\frontend"  
npm run dev
```

### Step 5: Test AI Integration

1. **Health Check**: Visit `http://localhost:3000/api/chat/ai/health`
2. **Provider Test**: Visit `http://localhost:3000/api/chat/ai/test`
3. **Chat Interface**: Go to the app and send a message!

## 🔬 Testing the Chatbot

### Test Scenarios:

1. **Basic Chat**:
   - Message: "I'm feeling anxious about work"
   - Expected: Personalized response based on user's therapeutic approach

2. **Crisis Detection**:
   - Message: "I don't want to live anymore"
   - Expected: Immediate crisis intervention response with resources

3. **Context Awareness**:
   - Send multiple messages to test conversation memory
   - Expected: Responses that reference previous conversation

4. **Provider Failover**:
   - Use invalid API keys to test Ollama fallback
   - Expected: Seamless switch to local LLM

## 🛠 API Endpoints

### Chat Endpoints:
- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/history` - Get conversation history
- `GET /api/chat/insights` - Get conversation insights

### AI Management:
- `GET /api/chat/ai/health` - Check provider status
- `GET /api/chat/ai/test` - Test all providers

## 🚨 Crisis Intervention

The system automatically detects crisis language and provides:
- Immediate crisis resources (988, Crisis Text Line)
- Safety planning suggestions
- Professional help recommendations

## 💡 Personalization Features

The AI considers:
- **Therapeutic Approach**: Western (CBT focus), Eastern (mindfulness), Hybrid
- **Recent Assessments**: PHQ-9, GAD-7, etc. scores influence responses
- **Mood Tracking**: Current mood affects conversation tone
- **User Preferences**: Emergency contacts, data sharing settings
- **Conversation History**: Maintains context and continuity

## 🔍 Troubleshooting

### If AI responses aren't working:
1. Check API keys in `.env` file
2. Test provider health: `/api/chat/ai/health`
3. Check Ollama is running: `ollama list`
4. Review backend logs for errors

### If Ollama isn't working:
1. Ensure Ollama service is running
2. Pull model: `ollama pull llama3`
3. Test: `ollama run llama3 "Hello"`

## 📊 Monitoring

Monitor AI performance through:
- Provider status endpoint
- Chat message metadata (response times, tokens used)
- Conversation insights endpoint
- Backend console logs

---

**The chatbot is now fully operational with intelligent, personalized AI responses! 🎉**
