# ishipmyplants

Static storefront for I Ship My Plants (ishipmyplants.shop). Plants grown at FlashTown Farm and sourced from neighbors.

## What's in it

- **Store**: category filter, product detail, cart saved in the browser.
- **Plant ID**: uploads go to `/api/identify`, which calls Plant.id. Needs `PLANT_ID_API_KEY`.
- **Yard Visualizer**: upload a yard or house photo, place plants, drag them, resize them, remove them.

## Files

- `index.html`, `styles.css`, `app.js`: the site
- `data.js`: plant catalog (edit prices, descriptions, and image paths here)
- `img/`: product photos
- `api/identify.js`: Plant ID serverless function (Vercel)
- `vercel.json`: Vercel config

## Deploy (GitHub to Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel, import the repo. No build step is needed.
3. Add the custom domain `ishipmyplants.shop`.
4. For Plant ID, add `PLANT_ID_API_KEY` under Settings > Environment Variables, then redeploy. Until the key is set, the page says identification is not connected yet.

## Not built yet

- Checkout (the button says "coming soon")
- Photos for guava, plumeria, ice cream bean, and dendrobium orchid (they show a leaf icon)
