FROM node:18-alpine

WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Proje dosyalarını kopyala
COPY . .

# Backend portunu dışarı aç
EXPOSE 5000

# Uygulamayı başlat
CMD ["npm", "start"]
