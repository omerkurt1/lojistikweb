FROM node:18-alpine

WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Proje dosyalarını kopyala
COPY . .

# Vite portunu dışarı aç
EXPOSE 5173

# Geliştirme sunucusunu başlat
CMD ["npm", "run", "dev", "--", "--host"]
