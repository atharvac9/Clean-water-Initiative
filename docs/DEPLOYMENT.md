# Deployment Guide — Watershed Photo-Satellite Fusion Dashboard

This guide walks you through deploying the **Watershed Photo-Satellite Fusion** dashboard from your GitHub repository ([`atharvac9/Clean-water-Initiative`](https://github.com/atharvac9/Clean-water-Initiative)) to live production hosting.

---

## ⚡ Quick Comparison of Deployment Platforms

| Platform | Best For | Cost | Setup Time | PyTorch / ML Support |
| :--- | :--- | :--- | :--- | :--- |
| **Streamlit Community Cloud** | Easiest 1-click deploy directly from GitHub | **Free** | ~2 minutes | ✅ Good (uses `requirements.txt`) |
| **Hugging Face Spaces** | ML & AI community demos | **Free** (16 GB RAM) | ~3 minutes | 🚀 Excellent (generous memory) |
| **Render / Railway** | Production web container via Docker | Free tier / ~$5/mo | ~5 minutes | ✅ Full control via `Dockerfile` |
| **Cloud Run / AWS App Runner** | Serverless production enterprise | Pay-as-you-go | ~10 minutes | 🚀 High scale |
| **Self-Hosted VPS (EC2/DigitalOcean)** | Custom domains, internal networks, VPN | $4–$10/mo | ~15 minutes | ✅ Full root access |

---

## 🚀 Option 1: Streamlit Community Cloud (Recommended & Easiest)

Streamlit Community Cloud is the official, zero-cost hosting service for Streamlit applications. It continuously deploys directly from your GitHub repository whenever you push commits.

### Step 1: Push Your Latest Code to GitHub
Ensure all recent changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: add production deployment configs and globe updates"
git push origin main
```

### Step 2: Sign in to Streamlit Community Cloud
1. Go to [share.streamlit.io](https://share.streamlit.io/).
2. Sign in with your GitHub account (`atharvac9`).

### Step 3: Deploy the App
1. Click the **"New app"** button.
2. Select your repository: `atharvac9/Clean-water-Initiative`.
3. Set the **Branch**: `main`.
4. Set the **Main file path**: `app.py`.
5. Under **App URL**, customize your subdomain (e.g., `watershed-monitor.streamlit.app`).

### Step 4 (Optional): Add Secrets for Live Google Earth Engine
By default, the application runs with high-fidelity pre-cached & synthetic satellite indices if no Earth Engine credentials are provided. If you want live Sentinel-2 queries:
1. In the Streamlit Cloud deployment modal, expand **Advanced Settings** -> **Secrets**.
2. Add your Google Earth Engine Service Account credentials:
   ```toml
   [earthengine]
   project = "your-gcp-project-id"
   service_account = "your-service-account@project.iam.gserviceaccount.com"
   private_key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
3. Click **"Deploy!"**.
4. Your application will build its environment from `requirements.txt` and `packages.txt` and go live in ~2 minutes!

---

## 🤗 Option 2: Hugging Face Spaces

Hugging Face Spaces provides 16 GB of RAM on its free tier, making it ideal for computer vision and PyTorch models like CLIP.

### Step 1: Create a Space
1. Log in to [huggingface.co](https://huggingface.co/) and click **New Space**.
2. Give it a name (e.g., `watershed-monitor`).
3. Select **Streamlit** as the Space SDK (or **Docker**).
4. Select **CPU basic** (Free, 2 vCPU, 16 GB RAM).

### Step 2: Connect Your GitHub Repository
1. In Space Settings, navigate to **GitHub integration** or add your Hugging Face Space as a secondary Git remote:
   ```bash
   git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/watershed-monitor
   git push hf main
   ```
2. Hugging Face will automatically detect `requirements.txt` and launch `app.py`.

---

## 🐳 Option 3: Dockerized Deployment (Render, Railway, Fly.io, Cloud Run)

The repository includes a production-ready `Dockerfile` that pre-compiles CPU-only PyTorch and builds a lightweight Linux container.

### Local Docker Build & Test
```bash
# Build the Docker image
docker build -t watershed-monitor:latest .

# Run container on port 8501
docker run -d -p 8501:8501 --name watershed watershed-monitor:latest

# Access in browser
open http://localhost:8501
```

### Deploying to Render:
1. Go to [dashboard.render.com](https://dashboard.render.com/) and create a **New Web Service**.
2. Connect your GitHub repository: `atharvac9/Clean-water-Initiative`.
3. Environment: select **Docker**.
4. Plan: Free or Starter.
5. Click **Create Web Service**. Render will build the `Dockerfile` and provide an `https://*.onrender.com` URL.

### Deploying to Railway:
1. Go to [railway.app](https://railway.app/) and create a **New Project**.
2. Choose **Deploy from GitHub repo** and pick `atharvac9/Clean-water-Initiative`.
3. Railway detects the `Dockerfile` automatically and assigns a public HTTPS domain.

---

## 🖥️ Option 4: Self-Hosted Cloud VM (Ubuntu / Debian VPS)

For deploying on your own VPS (AWS EC2, DigitalOcean, Linode, Hetzner):

### 1. Provision Server & Install Dependencies
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv git nginx certbot python3-certbot-nginx
```

### 2. Clone & Setup Python Virtual Environment
```bash
cd /opt
sudo git clone https://github.com/atharvac9/Clean-water-Initiative.git
cd Clean-water-Initiative
python3 -m venv venv
source venv/bin/activate

# Install CPU PyTorch first for fast lightweight footprint
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

### 3. Create a Systemd Service (`/etc/systemd/system/watershed.service`)
```ini
[Unit]
Description=Watershed Monitor Streamlit App
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/Clean-water-Initiative
ExecStart=/opt/Clean-water-Initiative/venv/bin/streamlit run app.py --server.port 8501 --server.headless true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable watershed
sudo systemctl start watershed
```

### 4. Configure Nginx Reverse Proxy with SSL
In `/etc/nginx/sites-available/watershed`:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable site and generate free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/watershed /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🛠️ Verification Checklist Before Deploying

Before deploying to any platform, verify:
- [x] **`app.py` compiles without errors** (`python -m py_compile app.py`)
- [x] **Pipeline unit tests pass** (`python test_pipeline.py`)
- [x] **`requirements.txt` contains all imports** (geopandas, open-clip-torch, streamlit-folium, etc.)
- [x] **`.streamlit/config.toml` is present** for headless mode and theme styling
- [x] **`Dockerfile` and `.dockerignore` are present** for container deployments
- [x] **Fallback data is enabled** so the app boots successfully even without GEE credentials
