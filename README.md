# 📖 EOTC-Media

**የኢትዮጵያ ኦርቶዶክስ ተዋህዶ ቤተክርስቲያን የሚዲያ ውጤቶች**  
**Ethiopian Orthodox Tewahedo Church Media Resources**

EOTC-Media is a web platform that provides access to spiritual resources from the Ethiopian Orthodox Tewahedo Church. Users can browse, search, and share various types of media, including books, hymns, sermons, and the Holy Bible in multiple languages.

---

## 🌟 Features

- 📚 **Bible** – The Holy Bible in Amharic, English, Afaan Oromo, Tigrigna, and more
- 📘 **Books** – Writings by early Church Fathers and modern spiritual teachers
- 🎵 **Hymns** – Categorized hymn videos sourced from YouTube
- 📢 **Sermons** – Collection of teachings and spiritual messages (coming soon...)
- 👤 **User Accounts** – Create an account to share your own spiritual content
- 💬 **Feedback** – Share your suggestions through the platform

---

## 🛠️ Tech Stack

- **Backend**: Laravel
- **Frontend**: Vue.js (via Inertia.js)
- **Database**: MySQL

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/eotc-media.git
   cd eotc-media
   ```

2. Install backend dependencies:
   ```bash
   composer install
   ```

3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Copy the example environment file and rename it:
   ```bash
   cp .env.example .env
   ```
   Then configure your environment settings in the .env file.

5. Generate a key:
   ```bash
   php artisan key:generate
   ```
   Then configure your environment settings in the .env file.

6. Run migrations:

   ```bash
   php artisan migrate
   ```

7. Start the development servers:

   ```bash
   php artisan serve
   npm run dev
   ```

## 📌 Notes
- Video details (title, thumbnail, etc.) are automatically fetched using the YouTube video ID.
- Hymns are displayed with clean, meaningful URLs.
- Content is organized by channel and category for better browsing.

## 🤝 Contribution
If you'd like to contribute, feel free to fork the repo and submit a pull request. For feedback or feature requests, please open an issue or use the feedback form on the site.

## 📄 License
MIT License
