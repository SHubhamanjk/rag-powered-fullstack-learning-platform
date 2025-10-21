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
GROQ_API_KEY=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
MONGO_URI=mongodb+srv://shubham07kumargupta:Shubham%402006@trueshorts-cluster.vzk8awq.mongodb.net/medha_ai_backend
GROQ_MODEL=llama-3.3-70b-versatile
SMTP_FROM_EMAIL=shubham07kumargupta@gmail.com
SMTP_FROM_NAME=Medha.ai
GMAIL_APP_PASSWORD=fvkgfhptqjxorwun
JWT_SECRET_KEY=528f046c-5529-45c1-8ce5-81be74fe9ab1
HUGGINGFACE_HUB_TOKEN=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
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
VITE_API_BASE_URL="http://localhost:8000"
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
