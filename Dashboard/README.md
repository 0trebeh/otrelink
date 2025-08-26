# 🔗 Otrelink Dashboard

## Overview
Otrelink Dashboard is a modern, minimalistic React app for managing your profile and links, styled with Tailwind CSS and powered by MongoDB.

---

## Layout

- **Header:**  
    - Left: Text logo (`🔗 Otrelink`)
    - Right: Save button

- **Main Layout:**  
    - **Left Panel:** Navigation (Profile, Links, Style, Wallpaper, Analytics)
    - **Center Area:** Edit selected section
    - **Right Panel:** Real-time phone preview of your profile

---

## Features

### Profile Section
- User photo with add/change button
- Editable "Heading" (Title page)
- Editable "Description"
- "View Link Page" button (opens final page)
- Manage links: add, move, remove
    - `[+ Add]` button opens modal for block type/content
    - Drag & drop to reorder (left side)
    - Edit (pencil) and delete (trash) buttons (right side)

### Style Section
- "Customizable" tab: edit button/text colors, fonts, sizes, borders, shadows, transparency
- Theme grid (Air, Blocks, Bloom, Breeze, Lake, Mineral, etc.)
- All changes update preview instantly
- Easy modal management for adding/removing themes

### Wallpaper Section
- Choose from preset backgrounds (CSS effects, images)
- Upload custom image

### Preview (Phone)
- Embedded live preview of your link page

---

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Database:** MongoDB
- **Design:** Clean, minimal, modern
- **Components:** Reusable cards, switches, buttons

---

## Example Screenshot

> _(Add a screenshot here showing the dashboard layout)_

---

## Getting Started

1. Clone the repo
2. Install dependencies
3. Run the development server

```bash
git clone https://github.com/yourusername/otrelink-dashboard.git
cd otrelink-dashboard
npm install
npm start
```

---

## License

MIT
