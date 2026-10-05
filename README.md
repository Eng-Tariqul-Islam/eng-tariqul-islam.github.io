# Md. Tariqul Islam · Portfolio

A static site: plain HTML, CSS and JS with no build step. Total size is about 18 MB, videos included.

```
index.html
assets/css/styles.css
assets/js/main.js
assets/img/      screenshots and stills from the demo videos
assets/video/    web-compressed demos (H.264, no audio, faststart)
assets/cv/       Tariqul-Islam-CV.pdf
```

## Preview locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

Use a local server rather than opening the file directly, so video seeking works.

## Deploy to GitHub Pages

1. Create a repo, for example `CodeBeyondTheHorizon.github.io` (it serves at the root URL) or `portfolio`.
2. Push this folder's contents to `main`.
3. Under Settings → Pages, set the source to "Deploy from a branch", choose `main` and `/ (root)`.

Netlify, Vercel and Cloudflare Pages also work: drag the folder in, with no build command.

## Editing

- **Projects:** each card in `#projects` has a `data-cat` (`isp`, `health`, `telecom`, `integration`) that drives the filters.
- **Video chapters:** `data-t` on each chapter button is the start time in seconds.
- **Swapping a video for YouTube:** replace the `<video>` element with a YouTube `<iframe>`. The chapter buttons only work with `<video>`.
- **Re-encoding a demo:** `ffmpeg -i in.mp4 -an -vf "scale=1280:-2,fps=24" -c:v libx264 -preset slow -crf 28 -tune stillimage -movflags +faststart out.mp4`
