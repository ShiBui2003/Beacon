# AI Urgency Detection Implementation

## 🎯 **Feature Overview**

This implementation adds AI-based urgency detection to the civic reporting application using Hugging Face's BART model for zero-shot classification. Issues are automatically analyzed for urgency and ranked using a combined score of AI urgency and community upvotes.

## 🔧 **Implementation Details**

### **1. AI Urgency Detection Module**
- **File**: `lib/aiUrgency.ts`
- **Features**:
  - Hugging Face BART model integration
  - Zero-shot classification with candidate labels: ["high urgency", "medium urgency", "low urgency"]
  - Graceful fallback to "medium" urgency if API fails
  - Confidence scoring and result parsing
  - Utility functions for UI display and ranking

### **2. Database Schema**
- **Migration**: `supabase/migrations/0014_add_ai_urgency.sql`
- **New Fields**:
  - `ai_urgency`: TEXT with values 'low', 'medium', 'high' (default: 'medium')
  - `ai_confidence`: DECIMAL(3,2) for confidence score (0.0-1.0)
  - Indexes for efficient sorting and querying

### **3. API Integration**
- **Endpoint**: `/api/issues/[id]/ai-urgency`
- **Methods**:
  - `POST`: Trigger AI urgency detection for an issue
  - `GET`: Retrieve current AI urgency status
- **Features**:
  - Asynchronous processing
  - Error handling with graceful fallbacks
  - Database updates with confidence scores

### **4. Issue Creation Flow**
- **File**: `app/api/issues/route.ts`
- **Integration**: Automatic AI detection trigger after issue creation
- **Process**:
  1. Issue created successfully
  2. Asynchronous API call to AI urgency endpoint
  3. Non-blocking - doesn't affect user experience
  4. Database updated when AI analysis completes

## 🎯 **Ranking System**

### **Combined Score Calculation**
```typescript
// AI urgency weights
const urgencyWeight = urgency === 'high' ? 3 : urgency === 'medium' ? 2 : 1;
const upvoteScore = Math.log(1 + upvotes);

// Combined score: 0.7 * AI urgency + 0.3 * log(1 + upvotes)
const combinedScore = 0.7 * urgencyWeight + 0.3 * upvoteScore;
```

### **Sorting Logic**
1. **Primary**: Combined score (AI urgency + upvotes)
2. **Secondary**: Creation date (for stable sorting)
3. **Applied to**: All issue lists (dashboard, admin, maps, my-issues)

## 🎨 **UI Components**

### **AI Urgency Badge**
- **File**: `components/ai-urgency-badge.tsx`
- **Features**:
  - Color-coded badges (🔴 High, 🟡 Medium, 🟢 Low)
  - Loading state with spinner
  - Confidence display (optional)
  - Responsive design

### **Badge Colors**
- **High Urgency**: Red background (`bg-red-100 text-red-800`)
- **Medium Urgency**: Yellow background (`bg-yellow-100 text-yellow-800`)
- **Low Urgency**: Green background (`bg-green-100 text-green-800`)
- **Loading**: Gray with spinner
- **Unknown**: Gray with question mark

## 📊 **Updated Views**

### **Citizen Dashboard**
- AI urgency badges on issue cards
- Combined ranking in list and map views
- Real-time updates when AI analysis completes

### **Admin Issues Management**
- New "AI Urgency" column in issues table
- Combined ranking for all filtered results
- Visual indicators for urgency levels

### **Map Views (Citizen & Admin)**
- Combined ranking for map markers
- AI urgency badges in issue details
- Consistent sorting across all views

### **My Issues Page**
- AI urgency badges on personal issues
- Combined ranking for active and resolved issues
- Real-time urgency updates

## 🔄 **Data Flow**

### **Issue Creation**
1. User submits issue
2. Issue saved to database
3. Asynchronous AI urgency detection triggered
4. AI analysis completes in background
5. Database updated with urgency and confidence
6. UI updates automatically (if user still viewing)

### **Real-time Updates**
- Issues show "Detecting urgency..." while AI processes
- Badge updates automatically when AI analysis completes
- No user interaction required
- Graceful fallback if AI service unavailable

## 🛠 **Configuration**

### **Environment Variables**
```env
HF_TOKEN=your_hugging_face_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For API calls
```

### **Hugging Face Setup**
1. Get API token from Hugging Face
2. Add to environment variables
3. Model: `facebook/bart-large-mnli`
4. Endpoint: `https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli`

## 🎯 **Key Features**

### **1. Non-blocking Integration**
- AI detection doesn't slow down issue creation
- Users can continue working while AI processes
- Graceful fallback if AI service fails

### **2. Intelligent Ranking**
- Combines AI urgency (70%) with community upvotes (30%)
- Balances automated analysis with human feedback
- Stable sorting for consistent user experience

### **3. Visual Indicators**
- Clear urgency badges with emojis and colors
- Loading states for pending analysis
- Confidence scores for transparency

### **4. Backwards Compatibility**
- Existing issues default to "medium" urgency
- No breaking changes to existing functionality
- Gradual rollout of AI features

## 🚀 **Benefits**

1. **Automated Prioritization**: AI helps identify urgent issues automatically
2. **Community + AI Balance**: Combines human voting with AI analysis
3. **Improved Efficiency**: Administrators can focus on high-urgency issues
4. **Better User Experience**: Clear visual indicators of issue importance
5. **Scalable Solution**: Handles large volumes of issues efficiently

## 📈 **Performance Considerations**

- **Asynchronous Processing**: No impact on issue creation speed
- **Database Indexes**: Optimized for combined score queries
- **Caching**: AI results stored in database for fast retrieval
- **Error Handling**: Graceful degradation if AI service unavailable

## 🔍 **Testing**

### **Manual Testing**
1. Create new issues and verify AI urgency detection
2. Check that badges update automatically
3. Verify combined ranking works across all views
4. Test fallback behavior when AI service fails

### **API Testing**
```bash
# Test AI urgency detection
curl -X POST http://localhost:3000/api/issues/{issue-id}/ai-urgency

# Check urgency status
curl http://localhost:3000/api/issues/{issue-id}/ai-urgency
```

## 📝 **Maintenance**

### **Monitoring**
- Check AI service availability
- Monitor confidence scores
- Review urgency classification accuracy
- Update candidate labels if needed

### **Tuning**
- Adjust urgency weights (currently 0.7 AI + 0.3 upvotes)
- Modify candidate labels for better classification
- Update fallback behavior as needed

This implementation provides a robust, scalable AI urgency detection system that enhances the civic reporting platform without disrupting existing functionality.
