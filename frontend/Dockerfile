# ใช้ NodeJS เวอร์ชั่น LTS ที่เป็น Alpine (ขนาดเล็ก) FROM node:lts-alpine
FROM node:lts-alpine

# กำหนด Working directory ภายใน Container WORKDIR /app
WORKDIR /app

# Copy ไฟล์ package
COPY package*.json ./

# ติดตั้ง Dependencies 
RUN npm install

# Copy โค้ดทั้งหมด
COPY . .

# บอกให้ Docker รู้ว่า Container ใช้ Port 5173
EXPOSE 5173

#คำสั่งที่จะรันสำหรับ Development Server ของ Vite
CMD [ "npm", "run", "dev" ]
