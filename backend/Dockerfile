FROM node:18-bullseye-slim

# Instalar Python, FFmpeg y dependencias necesarias para yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Descargar el binario oficial de yt-dlp para Linux
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

# Crear directorio de la app
WORKDIR /app

# Copiar dependencias de Node
COPY package*.json ./
RUN npm install

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "server.js"]
