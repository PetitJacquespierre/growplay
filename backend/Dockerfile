FROM node:20-bullseye-slim

# Instalar Python, FFmpeg y dependencias necesarias para yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp a través de pip (evita bloqueos de GitHub)
RUN pip3 install -U yt-dlp

# Crear directorio de la app
WORKDIR /app

# Copiar dependencias de Node
COPY package*.json ./
RUN npm install

# Copiar el resto del código del backend
COPY . .

# Comando de inicio
CMD ["node", "server.js"]

