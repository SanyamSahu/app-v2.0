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

  # Update .env file with user inputs
  sed -i "s|DB_USER=.*|DB_USER=$DB_USER|" "$ENV_FILE"
  sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" "$ENV_FILE"
fi

# 2. Export .env to environment variables
set -a
. ./"$ENV_FILE"
set +a

# 3. Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready at $DB_HOST:$DB_PORT..."
until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"root" -p"$MYSQL_ROOT_PASSWORD" --silent; do
  echo "Waiting for MySQL connection..."
  sleep 3
done
echo "✅ MySQL is ready!"

# 4. Create database user if it doesn't exist (only if not using root)
if [ "$DB_USER" != "root" ]; then
  echo "🔐 Creating database user..."
  mysql -h"$DB_HOST" -P"$DB_PORT" -u"root" -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
EOF
  echo "✅ Database user created!"
fi

# 5. Run schema setup
echo "⛏️ Creating database schema..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < schema.sql
echo "✅ Schema created!"

# 6. Start the Next.js app
echo "🚀 Starting the application..."
npm run start