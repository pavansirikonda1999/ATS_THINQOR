# Debugging Guide for ATS Backend

## Quick Fix Summary

I've fixed the following issues:

1. ✅ **Circular import** - Moved AI controller import to after env loading
2. ✅ **Environment loading** - Both `app.py` and `ai_data_service.py` now load `.env` or `config.env`
3. ✅ **None connection handling** - Added safety checks in `_fetch_one` and `_fetch_all`
4. ✅ **Debug output** - Added console messages to show what env vars are loaded

## How to Run & Debug

### Step 1: Verify Environment File
Make sure `config.env` exists in `ats_backend/` with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=5757
DB_NAME=ats_system
GROQ_API_KEY=your_key_here
LLM_MODEL=llama-3.3-70b-instruct
```

### Step 2: Install Dependencies (if needed)
```powershell
cd "C:\Users\Prajith Reddy\Downloads\ATS_System_Full\ats_full\ats_backend"
.\venv\Scripts\Activate.ps1
pip install python-dotenv requests
```

### Step 3: Run the Server
```powershell
cd "C:\Users\Prajith Reddy\Downloads\ATS_System_Full\ats_full\ats_backend"
.\venv\Scripts\Activate.ps1
python app.py
```

### Step 4: Check Debug Output
When you run `python app.py`, you should see:
- ✅ `Loaded environment from: config.env` (or `.env`)
- 🔧 `DB Config: host=localhost, user=root, database=ats_system, password=***`
- ✅ `MySQL Database connected successfully!`
- ✅ `Admin 'Srini' already exists.` (or inserted)
- ✅ Flask server starting on `http://127.0.0.1:5000`

### Step 5: Test the API
Open browser: `http://127.0.0.1:5000/` - should show "ATS Backend is Running! 🚀"

## Common Issues & Solutions

### Issue: "Access denied for user 'root'@'localhost' (using password: NO)"
**Solution**: The password isn't being loaded. Check:
1. `config.env` file exists and has `DB_PASSWORD=5757` (no quotes, no spaces)
2. You see the message `✅ Loaded environment from: config.env`
3. The debug output shows `password=***` (not `password=(empty)`)

### Issue: "No .env or config.env found"
**Solution**: Create `config.env` in the `ats_backend/` folder with the DB credentials.

### Issue: "python-dotenv not installed"
**Solution**: Run `pip install python-dotenv` in your venv.

### Issue: Circular import errors
**Solution**: Already fixed - AI routes are imported after env loading.

## Testing the AI Chat Endpoint

Once the server is running, test with PowerShell:
```powershell
$body = @{
    message = "show candidates in final round for R-123"
    user = @{
        id = "USR1"
        role = "RECRUITER"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/ai/chat" -Method Post -ContentType "application/json" -Body $body
```

Or use curl:
```powershell
curl.exe -X POST http://127.0.0.1:5000/api/ai/chat -H "Content-Type: application/json" -d '{\"message\":\"test\",\"user\":{\"id\":\"1\",\"role\":\"ADMIN\"}}'
```

## What Changed

1. **app.py**: 
   - Improved env loading with better error messages
   - Added debug output for DB config
   - Moved AI route import to avoid circular dependency

2. **services/ai_data_service.py**:
   - Added dotenv loading (same logic as app.py)
   - Fixed None connection handling in `_fetch_one` and `_fetch_all`
   - Removed hardcoded password fallback

3. **utils/llm_client.py**:
   - Auto-detects Groq API URL when `GROQ_API_KEY` is set
   - No need for `LLM_API_URL` when using Groq

## Next Steps

1. ✅ Run the server and check debug output
2. ✅ Verify database connection works
3. ✅ Test the `/api/ai/chat` endpoint
4. ✅ Integrate `AiChat.jsx` component in your frontend

