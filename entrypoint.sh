#!/bin/sh

ENV_FILE=".env"

# 1. Prepare .env from template
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env file from template..."
  cp .env.template "$ENV_FILE"

  echo -n "Enter MySQL username: "
  read DB_USER

  echo -n "Enter MySQL password: "
  read -s DB_PASSWORD
  echo

  sed -i "s|DB_USER=.*|DB_USER=$DB_USER|" "$ENV_FILE"
  sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" "$ENV_FILE"
fi

# 2. Export .env to environment variables
export $(grep -v '^#' .env | xargs)

# 3. Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready at $DB_HOST:$DB_PORT..."
until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" --silent; do
  sleep 2
done
echo "✅ MySQL is ready!"

# 4. Run schema setup
echo "⛏️ Creating database schema..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" --password="$DB_PASSWORD" "$DB_NAME" < schema.sql


# 5. Start the Next.js app
echo "🚀 Starting the application..."
npm run start
