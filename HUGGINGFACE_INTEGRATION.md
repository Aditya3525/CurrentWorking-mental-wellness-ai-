# 🤗 HuggingFace Integration Guide

## Overview
MaanaSarathi now includes **HuggingFace integration** with the specialized **"Guilherme34/Psychologist-3b"** model. This model is specifically trained for psychological conversations and counseling, making it perfect for your wellbeing chatbot.

## 🎯 Benefits of Psychologist-3b Model

### ✅ **Psychology-Specific Training**
- Trained specifically for therapeutic conversations
- Understands wellbeing terminology and concepts
- Provides empathetic and professional responses
- Maintains appropriate therapeutic boundaries

### ✅ **Cost-Effective**
- **FREE** HuggingFace API tier available
- Much cheaper than GPT-4 or Claude for production use
- No rate limits on free tier (just speed limits)

### ✅ **Privacy-Focused**
- Open-source model
- Can be self-hosted if needed
- No data retention by default

## 🔧 Setup Instructions

### Step 1: Get HuggingFace API Key
1. **Go to** [HuggingFace](https://huggingface.co/settings/tokens)
2. **Sign up/Login** with your account
3. **Create a new token** with "Read" permissions
4. **Copy the token** (starts with `hf_...`)

### Step 2: Add to Environment Variables
Add to your `.env` file:
```env
# HuggingFace Configuration
HUGGINGFACE_API_KEY=hf_your_token_here
HUGGINGFACE_API_KEY_1=hf_your_token_here
HUGGINGFACE_API_KEY_2=hf_backup_token_here

# Update AI Provider Priority (HuggingFace first for psychology)
AI_PROVIDER_PRIORITY=huggingface,gemini,openai,anthropic,ollama
```

### Step 3: For Render Deployment
Add these environment variables in your Render dashboard:
```env
HUGGINGFACE_API_KEY=hf_your_token_here
AI_PROVIDER_PRIORITY=huggingface,gemini,openai,anthropic,ollama
```

## 🚀 How It Works

### **1. Specialized Prompting**
The HuggingFace provider formats conversations specifically for the Psychologist-3b model:
- Uses "Client" and "Counselor" roles
- Includes therapeutic context and guidelines
- Maintains professional boundaries

### **2. Response Cleaning**
- Removes role prefixes and formatting artifacts
- Ensures appropriate response length
- Filters out inappropriate content

### **3. Fallback System**
- If HuggingFace is unavailable, falls back to Gemini/OpenAI
- Automatic API key rotation for reliability
- Error handling and retry logic

## 🧪 Testing the Integration

Run the test script to verify everything works:

```bash
cd backend
npm run build
node test-huggingface.js
```

Expected output:
```
🤗 Testing HuggingFace Psychologist-3b Integration...

Testing connection...
Provider available: true
Testing model connection...
Can connect to model: true

Testing response generation...
✅ Response generated successfully!
Response: I understand that work-related anxiety can be quite overwhelming...
Provider: huggingface
Model: Guilherme34/Psychologist-3b
Processing time: 2500ms
```

## 📊 Model Performance

### **Response Quality**
- **Psychology-focused**: Specifically trained for wellbeing conversations
- **Empathetic tone**: Natural, caring, and professional responses
- **Appropriate boundaries**: Knows when to suggest professional help

### **Speed & Reliability**
- **Average response time**: 2-5 seconds (depending on model load)
- **Model loading**: May take 10-30 seconds on first request if model is "cold"
- **Availability**: High (HuggingFace Inference API is very reliable)

### **Cost Comparison** (per 1000 requests)
- **HuggingFace**: ~$0.50 (or FREE on free tier)
- **GPT-3.5-turbo**: ~$2.00
- **GPT-4**: ~$30.00
- **Claude**: ~$15.00

## 🎨 Example Conversations

### Input:
```
User: "I've been having trouble sleeping because I keep worrying about work deadlines."
```

### HuggingFace Psychologist-3b Response:
```
"I hear that work stress is really affecting your sleep, which can create a difficult cycle. When we're anxious about deadlines, our minds can race at bedtime, making it hard to rest. This is very common. 

Let's explore some strategies that might help. Have you tried any relaxation techniques before bed, like deep breathing or progressive muscle relaxation? Sometimes creating a 'worry window' earlier in the evening - where you write down your concerns and action steps - can help your mind let go when it's time to sleep.

What specific work deadlines are weighing on you most right now?"
```

## 🔧 Customization Options

### **Model Parameters**
```typescript
// In HuggingFaceProvider constructor
{
  model: 'Guilherme34/Psychologist-3b',
  maxTokens: 256,        // Adjust response length
  temperature: 0.7,      // Control creativity (0.1-1.0)
  top_p: 0.95,          // Nucleus sampling
  repetition_penalty: 1.1 // Reduce repetition
}
```

### **Alternative Psychology Models**
If you want to try other models, you can change the model in `HuggingFaceProvider.ts`:
- `microsoft/BlenderBot-400M-distill` (General conversation)
- `facebook/blenderbot-1B-distill` (Larger conversational model)
- `microsoft/DialoGPT-medium` (Dialogue specialist)

## 🛠️ Troubleshooting

### **Model Loading Issues**
If you get "Model is loading" errors:
- **Wait 30-60 seconds** and try again
- **Cold start**: Models sleep when not used, first request wakes them up
- **Use Inference Endpoints** for production (paid but faster)

### **API Key Issues**
- Make sure your token has **"Read"** permissions
- Check the token format: should start with `hf_`
- Verify the token is valid at HuggingFace settings

### **Response Quality Issues**
- Adjust `temperature` (lower = more consistent, higher = more creative)
- Modify the system prompt in `formatPromptForPsychologist()`
- Try different `max_new_tokens` values

## 🎯 Production Recommendations

### **For High-Volume Apps**
1. **Use HuggingFace Inference Endpoints** (dedicated instances)
2. **Set up multiple API keys** for load balancing
3. **Configure fallback** to other providers for reliability

### **For Maximum Quality**
1. **Keep HuggingFace as primary** for psychology conversations
2. **Use Gemini/GPT-4 as fallback** for complex cases
3. **Log and analyze** response quality to optimize

## 🚀 Next Steps

1. **Deploy with HuggingFace**: Add the API key to your Render environment
2. **Test thoroughly**: Try various wellbeing conversation scenarios
3. **Monitor performance**: Check response times and quality
4. **Fine-tune prompts**: Adjust the system prompts for your specific use case

MaanaSarathi now has a specialized psychology model that will provide more appropriate and empathetic responses for wellbeing conversations! 🎉
