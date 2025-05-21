module.exports = {
  apps: [
    {
      name: "productif-app",
      script: "./start.bat",
      interpreter: "cmd.exe",
      env: {
        NODE_ENV: "development",
        PORT: 3000
      },
      watch: true,
      ignore_watch: ["node_modules", ".next"],
      max_memory_restart: "1G",
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 3000
    },
    {
      name: "db-backup-scheduler",
      script: "./scripts/schedule-backups.js",
      env: {
        NODE_ENV: "production"
      },
      watch: false,
      autorestart: true,
      max_memory_restart: "200M"
    },
  ],
} 