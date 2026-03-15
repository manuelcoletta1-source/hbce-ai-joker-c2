JOKER-C2 WEB SEARCH SETUP

1. Open Vercel project settings
2. Go to Environment Variables
3. Add:

TAVILY_API_KEY=your_real_api_key_here

4. Redeploy the project

Behavior:
- If TAVILY_API_KEY is present, Joker-C2 uses live web search
- If TAVILY_API_KEY is missing, Joker-C2 uses mock-web fallback

Current architecture:
user -> interface.html -> /api/chat -> corpus search + web search -> merged response
