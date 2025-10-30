# 🚀 How to Run the Project

Follow these steps to get both the **backend** and **frontend** running on your system.

---

## 🧩 1. Run the Backend

📍 Navigate to the backend directory:

```bash
cd Backend
```

📝 Create a `.env` file inside the `Backend` folder with the following values:

```
GROQ_API_KEY=example_api_key
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
GROQ_MODEL=example_model
SMTP_FROM_EMAIL=from_email@example.com
SMTP_FROM_NAME=Company Name
GMAIL_APP_PASSWORD=app_password
JWT_SECRET_KEY=secret_key
HUGGINGFACE_HUB_TOKEN=huggingface_token
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=example_model
```

🧱 Create a virtual environment using **uv** (if uv is not installed, run `pip install uv` first):

```bash
uv venv
```

⚙️ Activate the virtual environment:

```bash
.venv\Scripts\activate
```

📦 Install dependencies:

```bash
uv pip install -r requirements.txt
```

▶️ Start the backend server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

✅ Once you see “Finished server process,” your backend is running.
Verify it here: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 2. Run the Frontend

📍 Open a new terminal and navigate to the frontend folder:

```bash
cd Frontend
```

📝 Create a `.env` file inside the `Frontend` folder with the following value:

```
VITE_API_BASE_URL=https://example-api-backend.onrender.com
VITE_GA_MEASUREMENT_ID=G-EXAMPLE123
```

📦 Install dependencies:

```bash
npm install
```

▶️ Start the frontend development server:

```bash
npm run dev
```

✅ Your frontend will now run locally. Open your browser to access the complete system.

---

---

## 🔌 3. Run the Browser Extension (Optional)

🎯 **NEW!** Use Medha.ai directly on YouTube with the browser extension!

📍 Navigate to the extension directory:

```bash
cd BrowserExtension
```

⚙️ **Quick Setup (5 minutes):**

1. **Configure URLs** (see `QUICK_START.md`):
   - Update backend URL in `lib/api.js`
   - Update frontend URL in `popup/popup.js`

2. **Add Icons** to `assets/` folder:
   - `icon16.png`, `icon48.png`, `icon128.png`
   - Use https://www.favicon-generator.org/ for quick icons

3. **Load Extension:**
   - **Chrome/Edge:** Go to `chrome://extensions` → Enable "Developer mode" → "Load unpacked" → Select `BrowserExtension/` folder
   - **Firefox:** Go to `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → Select `manifest.json`

4. **Test It:**
   - Click extension icon → Login/Signup
   - Go to any YouTube video
   - Floating widget appears automatically!
   - Start taking notes, chat with AI, generate quizzes 🎉

📖 **Full Documentation:**
- `QUICK_START.md` - Get running in 5 minutes
- `SETUP.md` - Production configuration & publishing
- `README.md` - Complete feature documentation

✨ **Features:**
- 📝 Timestamped notes while watching videos
- 🤖 AI chat about video content
- 📊 Auto-generate quizzes from videos
- 🧠 Create mindmaps
- ✨ AI-powered note organization

---

### 🧠 Notes

* Ensure the backend is running before starting the frontend or extension.
* If any dependency issues occur, try upgrading:

```bash
uv pip install --upgrade -r requirements.txt
```
