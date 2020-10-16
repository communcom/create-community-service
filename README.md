# create-community-service

#### Clone the repository

```bash
git clone https://github.com/communcom/create-community-service.git
cd create-community-service
```

#### Create .env file

```bash
cp .env.example .env
```

Add variables

```bash
CYBERWAY_HTTP_URL=http://cyberway
GLS_WALLET_CONNECT=http://wallet-node:3000
```

#### Create docker-compose file

```bash
cp docker-compose.example.yml docker-compose.yml
```

#### Run

```bash
docker-compose up -d --build
```
