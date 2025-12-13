# 🌿 The Digital Garden

Welcome to your **Digital Garden**, a personal space to cultivate your reading habits, track your library, and grow your knowledge. 

This application is a modern, local-first book tracker built with **Next.js 14**. It is designed to be beautiful, fast, and private.

---

## ✨ Features

### 1. **Dashboard**
- **Currently Reading**: See your active books front and center.
- **Weekly Digest**: A summary of your reading activity for the past 7 days (books finished, notes taken).
- **Serendipity**: A special widget that surfaces a random note from your finished books to spark inspiration.

### 2. **Library**
- **Search & Add**: Integrated with **Google Books API**. Search for any book and add it instantly.
- **Organization**: Filter books by "Reading", "finished", or "TBR" (To Be Read).
- **Deletion**: Easily remove books you no longer want.

### 3. **Deep Reading Mode (Book Detail)**
- **Progress Tracking**: Visual progress bars. Drag or click to update your page number.
- **Note Taking**: Record "Thoughts" or "Quotes" as you read.
- **Timeline**: View your reading journey and insights chronologically.

### 4. **Your Profile**
- **Gamification**: Earn dynamic badges like **"Seedling"** or **"Bibliophile"** based on your stats.
- **Goals**: Set an annual reading goal (e.g., 50 books) and watch your progress ring fill up.
- **Themes**: Switch between **Paper Light**, **Midnight Ink** (Dark Mode), and **Sepia Vintage**.
- **Stats**: Track pages read, books collected, and your top genre.

---

## 🛠️ How It Works (Under the Hood)

This project uses a **"Local-First"** architecture. This means:
1.  **No Database Server**: You don't need to pay for a database.
2.  **Browser Storage**: All your data (books, notes, settings) is saved directly in your browser's `localStorage`.
3.  **Privacy**: Your data never leaves your device (except when you fetch book covers from Google).

### Technical Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State Management**: Zustand (with Persist middleware)

---

## 📂 Project Structure

Here is a quick map to help you find your way around the code:

- **`app/`**: Contains the pages of your app.
    - `page.tsx`: The main Dashboard.
    - `library/page.tsx`: The Library view.
    - `profile/page.tsx`: Your Profile and Settings.
    - `book/[id]/page.tsx`: The Book Details page.
    - `layout.tsx`: The main wrapper (fonts, themes).
    - `globals.css`: Global styles and Theme variables.

- **`components/`**: Reusable UI blocks.
    - `BookCard.tsx`: Displays a single book cover and progress.
    - `SearchModal.tsx`: The pop-up for adding new books.
    - `WeeklyDigestModal.tsx`: The weekly summary logic.
    - `ThemeProvider.tsx`: Handles switching between Light/Dark/Sepia.

- **`store/`**: The "Brain" of the app.
    - `useLibraryStore.ts`: Manages all data (Books, Notes, User Profile). This is where `addBook`, `removeBook`, and `updateUser` live.

- **`types/`**: Definitions.
    - `index.ts`: Defines what a "Book" or "User" looks like in code.

---

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    Visit [http://localhost:3000](http://localhost:3000)

4.  **Build for Production** (Optional):
    ```bash
    npm run build
    npm start
    ```

---

*Happy Reading!* 📚
