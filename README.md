
# Spider.eddit React UI

This is the frontend interface for the Spider.eddit project — a word relationship graph visualizer based on Reddit comment histories. The app allows users to submit a Reddit thread URL and displays a dynamic, interactive word co-occurrence network graph based on user content.

## Features

- Clean, single-page UI built with React
- Form to input a Reddit thread URL
- Sends POST request to Spider.eddit backend API
- Receives and renders word graph JSON data
- Interactive D3 or Recharts-based visualization (customizable)
- Responsive layout and simple UX for quick interaction

## Tech Stack

- React 18
- Axios (API requests)
- D3.js or Recharts (Graph rendering)
- Tailwind CSS (Styling)
- Vite or Create React App (bundler/dev server)

## Folder Structure

```
spidereddit-ui/
├── public/
├── src/
│   ├── components/
│   │   └── SpiderWebGraph.jsx
│   ├── App.jsx
│   ├── index.js
│   └── api.js
├── package.json
```

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/spidereddit-ui.git
cd spidereddit-ui
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. The app will be available at `http://localhost:3000`

## API Integration

- The frontend sends a `POST` request to `/crawl` endpoint of the backend with the following payload:

```json
{
  "url": "https://www.reddit.com/r/example/comments/threadid/example_title/",
  "token": "your_oauth_token"
}
```

- Expects a JSON response with:

```json
{
  "nodes": [{ "id": "word", "value": 15 }],
  "links": [{ "source": "word1", "target": "word2", "value": 3 }]
}
```

## Deployment

Build the static files for production with:

```bash
npm run build
```

Then serve with:

```bash
npm run preview
```

Or deploy to platforms like Vercel, Netlify, or S3/CloudFront.

## License

This project is licensed under the MIT License.
