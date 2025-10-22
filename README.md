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

### 🧠 Notes

* Ensure the backend is running before starting the frontend.
* If any dependency issues occur, try upgrading:

```bash
uv pip install --upgrade -r requirements.txt
```
