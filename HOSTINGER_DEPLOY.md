# AMMIGE — Hostinger VPS Deploy Guide

> **Important:** Hostinger **Shared Hosting** (Single/Premium/Business web hosting)
> does NOT run Node.js apps — it only supports PHP. This Next.js app needs
> **Hostinger VPS** (KVM 1 or higher). Shared plan pe ye deploy nahi hoga.

## 1. VPS tayyar karo

1. Hostinger → VPS → Ubuntu 22.04 select karo.
2. SSH se connect karo aur Node.js 20 install karo:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node -v   # v20.x.x hona chahiye
   ```
3. PM2 aur Nginx install karo:
   ```bash
   sudo npm i -g pm2
   sudo apt-get install -y nginx
   ```

## 2. Code lao (GitHub se)

```bash
cd /var/www
sudo git clone https://github.com/Taha-Siraj/ammige.git
cd ammige
npm ci
```

## 3. Environment variables

`.env.production` banao (ye file git me commit NA karo):

```bash
nano .env.production
```

```ini
NODE_ENV=production
# Admin panel password — mazboot password rakho (pehli boot pe DB me save hoga)
AMMIGE_ADMIN_PASSWORD=apna-mazboot-password-yahan
# Admin session sign karne ke liye lambi random string
ADMIN_SECRET=koi-lambi-random-string-min-32-chars
# Site ka final URL (domain lagne ke baad update karo)
NEXT_PUBLIC_SITE_URL=https://ammige.com
# (Optional) DB file ka path — default project folder me ammige.db banta hai
# DB_PATH=/var/www/ammige-data/ammige.db
```

> Note: VPS pe database `./ammige.db` file me save hoti hai jo **permanent**
> rehti hai (Vercel jaisi temporary nahi). Phir bhi regular backup lo:
> `cp ammige.db ammige-backup-$(date +%F).db`

## 4. Build + start (PM2)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # diye gaye command ko sudo ke sath chalao taake reboot pe auto-start ho
```

Check: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` → `200`

## 5. Domain + Nginx + SSL

1. Hostinger DNS me domain ka **A record** VPS ke IP pe point karo.
2. Nginx reverse proxy:
   ```bash
   sudo nano /etc/nginx/sites-available/ammige
   ```
   ```nginx
   server {
     listen 80;
     server_name ammige.com www.ammige.com;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/ammige /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Free SSL (Let's Encrypt):
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d ammige.com -d www.ammige.com
   ```

## 6. Update deploy karna

```bash
cd /var/www/ammige
git pull
npm ci
npm run build
pm2 restart ammige
```

## 7. Admin panel

`https://ammige.com/admin` — login me wahi password jo `.env.production` me
`AMMIGE_ADMIN_PASSWORD` rakha tha. Login ke baad **Settings** se password,
WhatsApp number, brand text waghera change kar sakte ho.

## Ports / firewall

Sirf 80 (HTTP), 443 (HTTPS) aur SSH (22) khule rakho. Port 3000 ko bahar se
band rakho — Nginx ke through hi traffic aana chahiye.
