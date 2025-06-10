module.exports = {
  "apps": [
    {
      "name": "8trader8panda",
      "script": "npm",
      "args": "run dev",
      "cwd": "/opt/trading-app",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "error_file": "/var/log/8trader8panda-error.log",
      "out_file": "/var/log/8trader8panda-out.log",
      "log_file": "/var/log/8trader8panda.log",
      "time": true,
      "autorestart": true,
      "max_restarts": 10,
      "min_uptime": "10s",
      "max_memory_restart": "1G"
    }
  ]
};