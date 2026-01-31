# Image delivery & caching

The site now uses Firebase Storage download URLs for images instead of `getBlob()`.
This allows the browser to cache responses and reuse them across sessions.

## One-time cache headers for existing uploads

New uploads already set `Cache-Control: public, max-age=31536000, immutable`.
To apply the same headers to files that are already in Storage:

```bash
gsutil -m setmeta -h "Cache-Control: public, max-age=31536000, immutable" gs://ajaimemory.firebasestorage.app/uploads/**
```

## Optional next step (faster thumbnails)

Create smaller thumbnail images on upload (e.g. 600px wide) and load those
in the gallery, while keeping originals for the full view. This dramatically
reduces bytes transferred on the gallery page.
