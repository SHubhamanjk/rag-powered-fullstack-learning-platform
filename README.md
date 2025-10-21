# 🚀 How to Run the Project

Follow these simple steps to get both the **backend** and **frontend** running on your system.

---

## 🧩 1. Run the Backend

📍 Navigate to the backend directory:

```bash
cd Backend
```

🧱 Create a virtual environment using **uv** (if uv isn’t installed, run `pip install uv` first):

```bash
uv venv
```

⚙️ Activate the virtual environment:

```bash
.venv\Scripts\activate
```

📦 Install all dependencies:

```bash
uv pip install -r requirements.txt
```

▶️ Start the backend server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

✅ Once you see “Finished server process,” your backend is up and running!
You can verify it here: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 2. Run the Frontend

📍 Open a new terminal and go to the frontend folder:

```bash
cd Frontend
```

📦 Install dependencies:

```bash
npm install
```

▶️ Start the development server:

```bash
npm run dev
```

✅ Your frontend will start running locally. You can now access the complete system in your browser!

---

### 🧠 Notes

* Make sure your backend is running before starting the frontend.
* If any dependency errors occur, try reinstalling with:

  ```bash
  uv pip install --upgrade -r requirements.txt
  ```