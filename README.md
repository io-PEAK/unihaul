<div align="center">

<img src="images/logo.svg" alt="Student Shop" width="100" />

<h1>Student Shop</h1>

<p><b>A peer-to-peer marketplace built exclusively for Indian students.</b><br/>
Buy and sell second-hand books, electronics, furniture and more —<br/>
with people from your own college or school.</p>

<br/>

![Hero Screenshot](images/screenshots/hero.png)

<br/>

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)](https://cloudinary.com)

</div>

---

## <img src="images/icons/screenshots.svg" width="20" height="20" valign="middle"/> &nbsp; Screenshots

<div align="center">

| Home | Item Detail | Dashboard |
|:----:|:-----------:|:---------:|
| ![Home](images/screenshots/home.png) | ![Item](images/screenshots/item.png) | ![Dashboard](images/screenshots/dashboard.png) |

| Messages | Settings | Post Item |
|:--------:|:--------:|:---------:|
| ![Messages](images/screenshots/messages.png) | ![Settings](images/screenshots/settings.png) | ![Post](images/screenshots/post.png) |

</div>

---

## <img src="images/icons/features.svg" width="20" height="20" valign="middle"/> &nbsp; Features

<table>
<tr>
<td width="50%">

**<img src="images/icons/search.svg" width="16" height="16" valign="middle"/> &nbsp; Live Search**<br/>
Filter by keyword, category, and institution in real time

**<img src="images/icons/carousel.svg" width="16" height="16" valign="middle"/> &nbsp; Solar Carousel**<br/>
Spring-animated 3D image viewer with infinite loop and zoom

**<img src="images/icons/message.svg" width="16" height="16" valign="middle"/> &nbsp; Messaging**<br/>
Direct conversations between buyers and sellers per listing

**<img src="images/icons/watch.svg" width="16" height="16" valign="middle"/> &nbsp; Watch & Alerts**<br/>
Watch any item and get a real-time notification on price drops

</td>
<td width="50%">

**<img src="images/icons/bell.svg" width="16" height="16" valign="middle"/> &nbsp; Live Notifications**<br/>
Sales and messages delivered instantly via WebSocket

**<img src="images/icons/palette.svg" width="16" height="16" valign="middle"/> &nbsp; 3 Themes**<br/>
Ember · Midnight · Chalk, synced to your profile

**<img src="images/icons/lock.svg" width="16" height="16" valign="middle"/> &nbsp; Flexible Auth**<br/>
Google OAuth or classic email + password, your choice

**<img src="images/icons/college.svg" width="16" height="16" valign="middle"/> &nbsp; 5000+ Institutions**<br/>
Every college and school across all Indian states

</td>
</tr>
</table>

---

## <img src="images/icons/techstack.svg" width="20" height="20" valign="middle"/> &nbsp; Tech Stack

<div align="center">

|  | Frontend | Backend | Infra |
|--|----------|---------|-------|
| **Runtime** | React 18 + Vite | Node.js + Express | PostgreSQL |
| **Styling** | Tailwind CSS + CSS vars | — | Prisma ORM v7 |
| **Auth** | — | JWT (7d) + bcrypt | — |
| **OAuth** | — | Google auth-code flow | — |
| **Media** | — | Cloudinary | — |
| **Realtime** | Socket.IO client | Socket.IO server | — |
| **Routing** | React Router DOM | Express Router | — |
| **Security** | — | Helmet + rate-limit | — |

</div>

---

## <img src="images/icons/structure.svg" width="20" height="20" valign="middle"/> &nbsp; Project Structure

```
student-shop/
│
├── frontend/
│   └── src/
│       ├── pages/          ← Home, Login, Register, ItemDetail
│       │                      PostItem, Dashboard, Messages
│       │                      Transactions, Settings
│       ├── components/     ← Navbar, SolarCarousel, ThemeToggle
│       │                      LocationPicker, MessageButton
│       ├── context/        ← ThemeContext
│       ├── hooks/          ← useDraggable
│       ├── api/            ← Axios instance
│       └── index.css       ← CSS variables + all 3 themes
│
└── backend/
    ├── src/
    │   ├── controllers/    ← auth, users, items, messages
    │   │                      transactions, notifications, upload
    │   ├── routes/
    │   ├── middleware/     ← JWT auth
    │   ├── lib/            ← Prisma client
    │   └── data/           ← institutions.js (5000+ entries)
    │ 
    └── database/
        └── prisma/
            ├── schema.prisma
            └── migrations/
```

---

## <img src="images/icons/database.svg" width="20" height="20" valign="middle"/> &nbsp; Database Schema

```
User           id · email · firstName · lastName · phone · avatar
               institution · institutionType · city · state
               theme · authProvider · profileComplete
               saleNotifications · messageNotifications · priceDropAlerts

Item           id · title · description · price · category · condition
               status · images[] · sellerId · sellerInstitution

Message        id · content · senderId · receiverId · itemId

Transaction    id · buyerId · sellerId · itemId · amount · status

Notification   id · userId · type · message · itemId · oldPrice · read

WatchedItem    userId · itemId
```

---

## <img src="images/icons/api.svg" width="20" height="20" valign="middle"/> &nbsp; API Reference

<details>
<summary>&nbsp;<b>Auth</b></summary>

```
POST  /auth/register
POST  /auth/login
POST  /auth/google
```
</details>

<details>
<summary>&nbsp;<b>Users</b></summary>

```
GET    /users/me
PUT    /users/profile
PUT    /users/complete-profile
POST   /users/create-password
POST   /users/send-otp
POST   /users/change-email
POST   /users/change-password
POST   /users/reset-password
DELETE /users/account
```
</details>

<details>
<summary>&nbsp;<b>Items</b></summary>

```
GET    /items
GET    /items/:id
GET    /items/watched
POST   /items
PUT    /items/:id
PATCH  /items/:id/status
DELETE /items/:id
```
</details>

<details>
<summary>&nbsp;<b>Messages & Notifications</b></summary>

```
POST  /messages
GET   /messages/conversations
GET   /messages/:itemId
GET   /notifications
PATCH /notifications/read
```
</details>

<details>
<summary>&nbsp;<b>Upload</b></summary>

```
POST   /upload/avatar
DELETE /upload/avatar
POST   /upload/item-image
DELETE /upload/item-image
```
</details>

<details>
<summary>&nbsp;<b>Institutions</b></summary>

```
GET /institutions/search?q=&type=&limit=
GET /institutions/states
```
</details>

---

## <img src="images/icons/start.svg" width="20" height="20" valign="middle"/> &nbsp; Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- Cloudinary account — free tier, no credit card
- Google OAuth credentials from Google Cloud Console

---

### 1 &nbsp;·&nbsp; Clone

```bash
git clone https://github.com/your-username/student-shop.git
cd student-shop
```

### 2 &nbsp;·&nbsp; Database

```bash
cd database
npm install
npx prisma migrate dev
```

### 3 &nbsp;·&nbsp; Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=8000
DATABASE_URL=postgresql://your_user@localhost:5432/student_shop?schema=public
JWT_SECRET=your_64_char_random_hex

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
# → http://localhost:8000
```

### 4 &nbsp;·&nbsp; Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm run dev
# → http://localhost:5173
```

> **Note:** Port 8000 instead of 5000 — macOS AirPlay blocks 5000.

---

## <img src="images/icons/themes.svg" width="20" height="20" valign="middle"/> &nbsp; Themes

<div align="center">

| Ember | Midnight | Chalk |
|:-----:|:--------:|:-----:|
| ![Ember](images/screenshots/theme-ember.png) | ![Midnight](images/screenshots/theme-midnight.png) | ![Chalk](images/screenshots/theme-chalk.png) |
| Dark · Glass · Orange/Gold | Dark · Sharp · Electric Blue | Light · Neumorphic · Indigo |

</div>

Themes switch via Settings → Appearance. Stored in `localStorage` + user DB profile. Applied via `data-theme` attribute on `<html>` using CSS custom properties — all components theme-aware with zero hardcoded colours.

---

## <img src="images/icons/security.svg" width="20" height="20" valign="middle"/> &nbsp; Security

- **JWT** — tokens expire after 7 days
- **bcrypt** — passwords hashed with 12 salt rounds
- **CORS** — locked to frontend origin only
- **Rate limiting** — 2000 req / 15 min general · 10 req / 15 min on auth
- **Helmet** — secure HTTP headers on all responses
- **`.env`** — gitignored, never committed
- **OAuth users** — can create a password as a backup login method; `authProvider` field tracks `local` · `google` · `both`

---
