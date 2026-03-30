import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

// sudo - Superuser do (the classic)
const sudoCommand: CommandDefinition = {
  aliases: ['sudo', 'sudo su'],
  description: 'Execute command as superuser',
  category: 'easter',
  execute: (args) => {
    const cmd = args.join(' ') || 'shell';
    return {
      output: `[sudo] password for jlmt: \n\nSorry, user jlmt is not in the sudoers file.\nThis incident will be reported to: /dev/null\n\n(Just kidding. Try: sudo make coffee)`,
      action: 'none',
    };
  },
};

// apt - Package manager
const aptCommand: CommandDefinition = {
  aliases: ['apt', 'apt-get'],
  description: 'Package manager',
  category: 'easter',
  execute: (args) => {
    const subcmd = args[0] || 'help';
    const packages = args.slice(1).join(' ') || 'packages';
    
    switch(subcmd) {
      case 'install':
        return {
          output: `Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nE: Unable to locate package ${packages}\n\nNote: This is not a real Linux system.\nPackages are virtual in the JLMT Lab.`,
          action: 'none',
        };
      case 'update':
        return {
          output: `Hit:1 http://lab.jlmt.io stable InRelease\nGet:2 http://repo.jlmt.io robotics/main amd64 Packages [42.0 kB]\nFetched 42.0 kB in 1s (42.0 kB/s)\nReading package lists... Done\nBuilding dependency tree... Done\n42 packages can be upgraded. Run 'apt upgrade' to see them.`,
          action: 'none',
        };
      case 'upgrade':
        return {
          output: `Calculating upgrade... Done\nThe following packages will be upgraded:\n  openfreqbench swarm-lab fpga-tools control-lib\n4 upgraded, 0 newly installed, 0 to remove and 0 not upgraded\nNeed to get 1337 kB of archives.\nAfter this operation, 42 MB disk space will be freed.\n\nContinue? [Y/n]`,
          action: 'none',
        };
      default:
        return {
          output: `apt ${subcmd} [options] package\n\nMost used commands:\n  install - Install packages\n  remove - Remove packages\n  update - Update package list\n  upgrade - Upgrade packages\n  search - Search for packages\n\nThis is a simulated package manager for the Lab environment.`,
          action: 'none',
        };
    }
  },
};

// ssh - Secure shell
const sshCommand: CommandDefinition = {
  aliases: ['ssh', 'remote'],
  description: 'OpenSSH client',
  category: 'easter',
  execute: (args) => {
    const host = args[0] || 'unknown';
    return {
      output: `ssh jlmt@${host}\n\nThe authenticity of host '${host} (10.0.0.42)' can't be established.\nED25519 key fingerprint is SHA256:JLMT+FPGA+ROBOTICS+CONTROL+SYSTEMS.\nThis key is not known by any other names.\nAre you sure you want to continue connecting (yes/no/[fingerprint])?\n\nWarning: Permanently added '${host}' (ED25519) to the list of known hosts.\njlmt@${host}'s password: \n\nPermission denied, please try again.\n\n(Note: This is a simulation. No actual connection attempted.)`,
      action: 'none',
    };
  },
};

// ping - Network testing
const pingCommand: CommandDefinition = {
  aliases: ['ping', 'ping6'],
  description: 'Send ICMP echo requests',
  category: 'easter',
  execute: (args) => {
    const host = args[0] || 'localhost';
    return {
      output: `PING ${host} (127.0.0.1) 56(84) bytes of data.\n64 bytes from localhost: icmp_seq=1 ttl=64 time=0.420 ms\n64 bytes from localhost: icmp_seq=2 ttl=64 time=0.1337 ms\n64 bytes from localhost: icmp_seq=3 ttl=64 time=0.69 ms\n^C\n--- ${host} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2003ms\nrtt min/avg/max/mdev = 0.420/0.749/1.337/0.404 ms\n\nSystem latency: EXCELLENT (FPGA-grade)`,
      action: 'none',
    };
  },
};

// netstat - Network statistics
const netstatCommand: CommandDefinition = {
  aliases: ['netstat', 'ss'],
  description: 'Network statistics',
  category: 'easter',
  execute: () => {
    return {
      output: `Active Internet connections (servers and established)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN\ntcp        0      0 10.0.0.42:8080          192.168.1.100:54321     ESTABLISHED\nudp        0      0 0.0.0.0:53              0.0.0.0:*                           \nudp        0      0 0.0.0.0:123             0.0.0.0:*               NTP Sync\n\nActive Robot connections:\nRobot-01: ARM_CONNECTED (Serial: /dev/ttyUSB0)\nRobot-02: SWARM_NODE (UDP: 10.0.0.101)\nFPGA-Board: JTAG_CONNECTED`,
      action: 'none',
    };
  },
};

// ps - Process status
const psCommand: CommandDefinition = {
  aliases: ['ps', 'top', 'htop'],
  description: 'Report process status',
  category: 'easter',
  execute: (args) => {
    if (args[0] === 'aux' || args[0] === '-ef') {
      return {
        output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\njlmt      1337  4.2  8.5 133742 69696 pts/0    Sl+  09:00   0:42 /usr/bin/openfreqbench --realtime\njlmt      2048  2.1  6.9  65536 42000 pts/0    S+   09:01   0:21 swarm-simulator --agents=6\njlmt      3141  1.5  4.2  45056 21000 pts/0    S+   09:02   0:15 fpga-synthesizer --device=xc7k325t\njlmt      4242  0.8  3.1  32768 16384 pts/0    R+   09:03   0:08 terminal-server --port=8080\njlmt      5555  0.1  1.2  16384  8192 pts/0    S    09:00   0:01 sshd: jlmt@pts/0\n\nSystem load: 0.42, 0.38, 0.31 (FPGA-optimized)`,
        action: 'none',
      };
    }
    return {
      output: `  PID TTY          TIME CMD\n1337 pts/0    00:00:42 bash\n2048 pts/0    00:00:21 openfreqbench\n3141 pts/0    00:00:15 swarm-sim\n\nTry 'ps aux' for detailed view`,
      action: 'none',
    };
  },
};

// kill - Terminate processes
const killCommand: CommandDefinition = {
  aliases: ['kill', 'pkill', 'killall'],
  description: 'Terminate processes',
  category: 'easter',
  execute: (args) => {
    const pid = args[0] || '1337';
    return {
      output: `kill -9 ${pid}\n\nbash: kill: (${pid}) - Operation not permitted\n\nThe process '${pid}' is a critical system component.\nAttempting to kill robot control processes is not recommended.\n\nHint: Use 'systemctl stop' for graceful shutdown.`,
      action: 'none',
    };
  },
};

// df - Disk free
const dfCommand: CommandDefinition = {
  aliases: ['df', 'df -h'],
  description: 'Report file system disk space',
  category: 'easter',
  execute: () => {
    return {
      output: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        512G   42G  445G   9% /\n/dev/sdb1        2.0T  1.3T  700G  65% /data\ntmpfs             32G  2.1G   30G   7% /tmp\nfpga-dev          64M   42M   22M  66% /dev/fpga\nresearch-fs      100T   73T   27T  73% /research\n\nNote: FPGA device storage is bitstream-limited.`,
      action: 'none',
    };
  },
};

// du - Disk usage
const duCommand: CommandDefinition = {
  aliases: ['du', 'du -sh'],
  description: 'Estimate file space usage',
  category: 'easter',
  execute: (args) => {
    const path = args[0] || '.';
    return {
      output: `4.2K\t./.config\n13M\t./projects\n42M\t./research\n133M\t./datasets\n2.1G\t./fpga-bitstreams\n6.9G\t./simulations\n8.5G\t.\n\nTotal project size: 8.5 GB\nLargest: FPGA bitstreams (2.1 GB)`,
      action: 'none',
    };
  },
};

// free - Memory usage
const freeCommand: CommandDefinition = {
  aliases: ['free', 'free -h'],
  description: 'Display memory usage',
  category: 'easter',
  execute: () => {
    return {
      output: `              total        used        free      shared  buff/cache   available\nMem:           64Gi       8.2Gi        42Gi       2.1Gi        14Gi        52Gi\nSwap:         8.0Gi       0.0Ki       8.0Gi\nFPGA-DDR:     4.0Gi       2.1Gi       1.9Gi\n\nMemory optimized for real-time processing.`,
      action: 'none',
    };
  },
};

// uname - System info
const unameCommand: CommandDefinition = {
  aliases: ['uname', 'uname -a'],
  description: 'Print system information',
  category: 'easter',
  execute: (args) => {
    if (args.includes('-a')) {
      return {
        output: `Linux jlmt-lab 5.15.0-fpga-rt #1 SMP PREEMPT_RT Thu Mar 28 10:42:00 UTC 2025 x86_64 GNU/Linux\n\nKernel: Real-time patched for control systems\nArchitecture: x86_64 with FPGA co-processing\nPreemption: Full RT (robotics-optimized)\nScheduler: JLMT-LAB-CFS v2.4.1`,
        action: 'none',
      };
    }
    return {
      output: `Linux`,
      action: 'none',
    };
  },
};

// hostname - Show hostname
const hostnameCommand: CommandDefinition = {
  aliases: ['hostname', 'hostname -i'],
  description: 'Show system hostname',
  category: 'easter',
  execute: (args) => {
    if (args.includes('-i') || args.includes('--ip-address')) {
      return {
        output: `10.0.0.42 127.0.0.1 192.168.1.100`,
        action: 'none',
      };
    }
    return {
      output: `jlmt-lab`,
      action: 'none',
    };
  },
};

// id - User identity
const idCommand: CommandDefinition = {
  aliases: ['id', 'who'],
  description: 'Print user identity',
  category: 'easter',
  execute: () => {
    return {
      output: `uid=1337(jlmt) gid=1337(engineers) groups=1337(engineers),2048(robotics),3141(fpga),4242(research),9999(sudo)`,
      action: 'none',
    };
  },
};

// curl - Transfer data
const curlCommand: CommandDefinition = {
  aliases: ['curl', 'wget'],
  description: 'Transfer data from/to server',
  category: 'easter',
  execute: (args) => {
    const url = args[0] || 'https://api.jlmt.io/status';
    return {
      output: `curl ${url}\n\n  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n100   133  100   133    0     0   4200      0 --:--:-- --:--:-- --:--:--  4300\n\n{"status": "operational", "uptime": "99.9%", "version": "2.4.1", "node": "jlmt-lab", "fpga": "online", "robots": 6}\n\nAPI Status: OPERATIONAL (Latency: 13.37ms)`,
      action: 'none',
    };
  },
};

// gcc - C compiler
const gccCommand: CommandDefinition = {
  aliases: ['gcc', 'g++', 'make', 'cmake'],
  description: 'C/C++ compiler',
  category: 'easter',
  execute: (args) => {
    const file = args[0] || 'main.c';
    return {
      output: `gcc -o output ${file} -lrobotics -lcontrol -lfpga\n\nCompiling: ${file}\nLinking with: librobotics.so, libcontrol.so, libfpga.so\n\nIn file included from ${file}:1:\n${file}:42:5: warning: variable 'unused' set but not used [-Wunused-variable]\n   42 |     int unused = 42;\n      |     ^~~\n\n${file}:1337:13: error: 'swarm_consensus' undeclared (first use in this function)\n 1337 |     result = swarm_consensus(agents, topology);\n      |             ^~~~~~~~~~~~~~~\n\nCompilation FAILED (1 error, 1 warning)\n\nHint: Include <swarm.h> and link with -lswarm`,
      action: 'none',
    };
  },
};

// git - Version control
const gitCommand: CommandDefinition = {
  aliases: ['git', 'git status'],
  description: 'Git version control',
  category: 'easter',
  execute: (args) => {
    const subcmd = args[0] || 'status';
    
    switch(subcmd) {
      case 'status':
        return {
          output: `On branch main\nYour branch is ahead of 'origin/main' by 42 commits.\n  (use "git push" to publish your local commits)\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   src/fpga/kalman_filter.v\n\tmodified:   src/control/mpc_controller.cpp\n\tmodified:   notebooks/frequency_analysis.ipynb\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\texperiments/swarm_formation_v2/\n\tsimulations/low_inertia_scenarios/\n\nno changes added to commit (use "git add" or "git commit -a")`,
          action: 'none',
        };
      case 'log':
        return {
          output: `commit 1337424242424242424242424242424242424242 (HEAD -> main, tag: v2.4.1)\nAuthor: Jorge Mayorga <jlmt@jlmt.io>\nDate:   Thu Mar 28 10:42:00 2025 -0500\n\n    feat(fpga): optimize Kalman filter for 50μs latency\n    \n    - Pipeline stages reduced from 5 to 3\n    - BRAM usage optimized\n    - Verified on Zynq-7000\n\ncommit 6969696969696969696969696969696969696969\nAuthor: Jorge Mayorga <jlmt@jlmt.io>\nDate:   Wed Mar 27 15:30:00 2025 -0500\n\n    feat(swarm): implement hexagonal formation consensus\n    \n    - 6-agent topology working\n    - Convergence in <100 iterations\n    - Added visualization`,
          action: 'none',
        };
      case 'commit':
        return {
          output: `git commit -m "${args.slice(2).join(' ') || 'WIP: more experiments'}"\n\n[main 4242424] ${args.slice(2).join(' ') || 'WIP: more experiments'}\n 3 files changed, 1337 insertions(+), 42 deletions(-)\n create mode 100644 experiments/new_approach.py\n\nPushing to origin...\nremote: Resolving deltas: 100% (42/42), done.\nTo github.com:jlmayorga/lab-systems.git\n   1337424..4242424  main -> main`,
          action: 'none',
        };
      default:
        return {
          output: `git version 2.42.0.jlmt.lab.1\n\nCommon git commands:\n  git status     - Show working tree status\n  git log        - Show commit history\n  git commit     - Record changes\n  git push       - Update remote refs\n  git pull       - Fetch and merge\n\nLab repository: github.com:jlmayorga/lab-systems`,
          action: 'none',
        };
    }
  },
};

// docker - Container management
const dockerCommand: CommandDefinition = {
  aliases: ['docker', 'docker ps'],
  description: 'Docker container management',
  category: 'easter',
  execute: (args) => {
    const subcmd = args[0] || 'ps';
    
    if (subcmd === 'ps') {
      return {
        output: `CONTAINER ID   IMAGE                    COMMAND                  CREATED        STATUS          PORTS                    NAMES\n133742424242   openfreqbench:latest     "python3 -m openfreq…"   2 hours ago    Up 2 hours      0.0.0.0:8080->80/tcp     openfreqbench\n696969696969   swarm-simulator:latest   "ros2 launch swarm …"   5 hours ago    Up 5 hours      0.0.0.0:9090->9090/tcp   swarm-sim\n424242424242   fpga-dev:latest          "/bin/bash"              8 hours ago    Up 8 hours                               fpga-toolchain\n000000000001   postgres:15              "docker-entrypoint.s…"   2 days ago     Up 2 days       0.0.0.0:5432->5432/tcp   lab-db\n\n4 containers running (all systems operational)`,
        action: 'none',
      };
    }
    
    return {
      output: `Docker version 24.0.7, build afdd53b\n\nLab Containers:\n  openfreqbench - Signal analysis platform\n  swarm-simulator - Multi-agent simulation\n  fpga-dev - FPGA development environment\n  lab-db - PostgreSQL research database\n\nUse 'docker ps' to see running containers.`,
      action: 'none',
    };
  },
};

// kubectl - Kubernetes
const kubectlCommand: CommandDefinition = {
  aliases: ['kubectl', 'k', 'k8s'],
  description: 'Kubernetes control',
  category: 'easter',
  execute: (args) => {
    return {
      output: `kubectl get pods -n lab-systems\n\nNAME                              READY   STATUS    RESTARTS   AGE\nopenfreqbench-7d9f4b8c5-x2k9p     1/1     Running   0          2h\nswarm-simulator-5c7d8f9b4-v3m8n    1/1     Running   0          5h\nfpga-controller-9f4b8c5d7-w5n2q    1/1     Running   0          8h\nrobot-arm-hmi-3b7c6d8e9-q7p4r      1/1     Running   0          1d\nterminal-server-8d5f7c9b2-r9k3m    1/1     Running   0          1d\n\nAll pods healthy. Swarm consensus: ACHIEVED.`,
      action: 'none',
    };
  },
};

// systemctl - System control
const systemctlCommand: CommandDefinition = {
  aliases: ['systemctl', 'service', 'rc-service'],
  description: 'Control system services',
  category: 'easter',
  execute: (args) => {
    const service = args[1] || 'lab-core';
    const action = args[0] || 'status';
    
    return {
      output: `systemctl ${action} ${service}\n\n● ${service}.service - JLMT Lab Core System\n     Loaded: loaded (/etc/systemd/system/${service}.service; enabled; vendor preset: enabled)\n     Active: active (running) since Thu 2025-03-28 09:00:00 UTC; 4h 20min ago\n       Docs: https://lab.jlmt.io/docs/${service}\n   Main PID: 1337 (lab-core)\n      Tasks: 42 (limit: 8192)\n     Memory: 512.0M\n        CPU: 2h 13min 37.042s\n     CGroup: /system.slice/${service}.service\n             ├─1337 /usr/bin/lab-core --daemon\n             ├─2048 /usr/bin/fpga-manager\n             ├─3141 /usr/bin/robot-controller\n             └─4242 /usr/bin/terminal-server\n\nMar 28 13:20:01 jlmt-lab lab-core[1337]: FPGA bitstream loaded: kalman_filter_v2.3.bit\nMar 28 13:20:02 jlmt-lab lab-core[1337]: Robot arm initialized: HOME position\nMar 28 13:20:03 jlmt-lab lab-core[1337]: Swarm network: 6 nodes connected\nMar 28 13:20:04 jlmt-lab lab-core[1337]: System READY. All subsystems operational.`,
      action: 'none',
    };
  },
};

// shutdown - Power off
const shutdownCommand: CommandDefinition = {
  aliases: ['shutdown', 'poweroff', 'reboot', 'halt'],
  description: 'Power off or reboot system',
  category: 'easter',
  execute: (args) => {
    const isReboot = args[0] === '-r' || args[0] === '--reboot' || args[0] === 'reboot';
    
    if (isReboot) {
      return {
        output: `System is going down for reboot NOW!\n\nBroadcast message from jlmt@jlmt-lab:\nThe system is going down for reboot NOW!\n\nSaving FPGA state...\nStopping robot arm... (safely parked)\nClosing swarm connections...\nSyncing research data...\n\n[ OK ] Stopped lab-core.service\n[ OK ] Stopped fpga-manager.service\n[ OK ] Stopped robot-controller.service\n\n...\n\n[    0.000000] JLMT Lab Kernel 5.15.0-fpga-rt booting...\n[    1.337042] FPGA: Xilinx Zynq-7000 detected\n[    2.042000] Robot: 6 DOF arm initialized\n[    3.141592] Swarm: 6 agents ready\n\nWelcome to JLMT Lab v2.4.1`,
        action: 'none',
      };
    }
    
    return {
      output: `Shutdown scheduled for Thu 2025-03-28 22:00:00 UTC!\n\nBroadcast message from root@jlmt-lab:\nThe system is going down for maintenance NOW!\n\nWARNING: Active robot processes detected!\nWARNING: FPGA bitstream in use!\nWARNING: 6 swarm agents connected!\n\nAre you sure you want to shut down? (y/N) _\n\nShutdown cancelled. All systems remain operational.`,
      action: 'none',
    };
  },
};

// history - Command history
const historyCommand: CommandDefinition = {
  aliases: ['history'],
  description: 'Show command history',
  category: 'easter',
  execute: () => {
    return {
      output: `  1  whoami\n  2  ls -la\n  3  cd projects/\n  4  git status\n  5  git commit -m "feat: add kalman filter"\n  6  ssh robot-01\n  7  ping swarm-node-1\n  8  fpga-load kalman_filter.bit\n  9  swarm-start --agents=6\n 10  openfreqbench --dataset=pmu_real\n 11  docker ps\n 12  kubectl get pods\n 13  sudo make coffee\n 14  cat profile.txt\n 15  neofetch\n 16  theme matrix\n 17  chaos\n 18  stabilize\n 19  rocof\n 20  consensus\n\nType 'history | grep git' to search history.`,
      action: 'none',
    };
  },
};

// alias - Command aliases
const aliasCommand: CommandDefinition = {
  aliases: ['alias'],
  description: 'Define command aliases',
  category: 'easter',
  execute: () => {
    return {
      output: `Current aliases:\n\nalias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\nalias ..='cd ..'\nalias ...='cd ../..'\nalias gs='git status'\nalias gp='git push'\nalias gl='git log --oneline'\nalias fpga-load='vivado -mode batch -source'\nalias swarm-start='ros2 launch swarm_bringup swarm.launch.py'\nalias robot-home='rostopic pub /robot/arm/command std_msgs/String "home"'\nalias lab-status='systemctl status lab-core'\n\nTo add permanent aliases, edit ~/.bashrc`,
      action: 'none',
    };
  },
};

// fortune - Random quote
const fortuneCommand: CommandDefinition = {
  aliases: ['fortune'],
  description: 'Print random quote',
  category: 'easter',
  execute: () => {
    const quotes = [
      "The best error message is the one that never shows up. - Thomas Fuchs",
      "First, solve the problem. Then, write the code. - John Johnson",
      "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler",
      "Simplicity is the soul of efficiency. - Austin Freeman",
      "Code is like humor. When you have to explain it, it's bad. - Cory House",
      "Fix the cause, not the symptom. - Steve Maguire",
      "Optimism is an occupational hazard of programming: feedback is the treatment. - Kent Beck",
      "Make it work, make it right, make it fast. - Kent Beck",
      "In theory, there is no difference between theory and practice. But, in practice, there is.",
      "A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable. - Leslie Lamport",
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return {
      output: `\n  "${quote}"\n`,
      action: 'none',
    };
  },
};

// cowsay - ASCII cow
const cowsayCommand: CommandDefinition = {
  aliases: ['cowsay', 'cowthink'],
  description: 'ASCII cow says message',
  category: 'easter',
  execute: (args) => {
    const msg = args.join(' ') || 'Moo! Welcome to the Lab!';
    return {
      output: ` ${'_'.repeat(msg.length + 2)}\n< ${msg} >\n ${'-'.repeat(msg.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`,
      action: 'none',
    };
  },
};

// sl - Steam locomotive
const slCommand: CommandDefinition = {
  aliases: ['sl', 'LS'],
  description: 'Steam locomotive animation',
  category: 'easter',
  execute: () => {
    return {
      output: `\n      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|   _________________\n   /     |  |   H  |  |     |   |         ||_| |_||   _|                \\\_____  |  |   H  |__--------------------| [___] |   =|\n        |______|_|______________________________|_________|   ____      |\n        |/__]  |/__]  |/__]  |/__]  |/__]  |/__]  |/__]  |/      |/\\___\n\n(You typed 'sl' instead of 'ls'. This is the Steam Locomotive.)`,
      action: 'none',
    };
  },
};

// cmatrix - Matrix rain
const cmatrixCommand: CommandDefinition = {
  aliases: ['cmatrix', 'matrix'],
  description: 'Matrix digital rain effect',
  category: 'easter',
  execute: () => {
    return {
      output: `Wake up, Neo...\nThe Matrix has you...\nFollow the white rabbit.\n\n01001010 01001100 01001101 01010100\n10101010 11001100 11110000 00001111\n00110011 01010101 10101010 01010101\n\n(Use 'theme matrix' for the actual matrix theme)`,
      action: 'none',
    };
  },
};

// hackerman - Hollywood hacking
const hackermanCommand: CommandDefinition = {
  aliases: ['hackerman', 'hack', 'mainframe'],
  description: 'Hollywood-style hacking',
  category: 'easter',
  execute: () => {
    return {
      output: `INITIALIZING HACK SEQUENCE...\n[OK] Bypassing mainframe firewall\n[OK] Decrypting AES-256 encryption\n[OK] Accessing root privileges\n[OK] Uploading virus.exe\n[OK] Disabling security protocols\n[OK] Downloading confidential data...\n\nACCESS GRANTED TO: PENTAGON MAINFRAME\n\nJust kidding. This is not a real hacking tool.\nReal security professionals use proper tools and ethical methods.\n\nTry 'sudo make coffee' instead.`,
      action: 'none',
    };
  },
};

// tree - Directory tree
const treeCommand: CommandDefinition = {
  aliases: ['tree'],
  description: 'List directory contents in tree-like format',
  category: 'easter',
  execute: () => {
    return {
      output: `.\n├── projects/\n│   ├── openfreqbench/\n│   │   ├── src/\n│   │   ├── tests/\n│   │   └── README.md\n│   ├── swarm-robotics/\n│   │   ├── firmware/\n│   │   ├── simulations/\n│   │   └── docs/\n│   └── fpga-kalman/\n│       ├── verilog/\n│       ├── constraints/\n│       └── bitstreams/\n├── research/\n│   ├── papers/\n│   ├── notes/\n│   └── data/\n├── notebooks/\n├── docs/\n└── README.md\n\n8 directories, 0 files shown`,
      action: 'none',
    };
  },
};

// chmod - Change permissions
const chmodCommand: CommandDefinition = {
  aliases: ['chmod', 'chown'],
  description: 'Change file permissions',
  category: 'easter',
  execute: (args) => {
    return {
      output: `chmod 777 ${args[1] || 'important_file.txt'}\n\nWARNING: Setting permissions to 777 is a security risk!\n\nThe Lab Safety Protocol recommends:\n  - 644 for regular files\n  - 755 for executables\n  - 600 for sensitive data\n\nPermission denied. Security policy prevents unsafe operations.`,
      action: 'none',
    };
  },
};

// export - Environment variables
const exportCommand: CommandDefinition = {
  aliases: ['export', 'env', 'printenv'],
  description: 'Set/export environment variables',
  category: 'easter',
  execute: () => {
    return {
      output: `LAB_HOME=/home/jlmt/lab\nLAB_VERSION=2.4.1\nFPGA_DEVICE=/dev/fpga0\nROBOT_SERIAL=/dev/ttyUSB0\nSWARM_NODES=6\nROS_DISTRO=humble\nPYTHONPATH=/home/jlmt/lab/lib/python\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/fpga/bin\nEDITOR=nano\nPAGER=less\nLANG=en_US.UTF-8\nTERM=xterm-256color\nUSER=jlmt\nHOME=/home/jlmt\nSHELL=/bin/bash\n\nType 'export VAR=value' to set variables.`,
      action: 'none',
    };
  },
};

// man - Manual pages
const manCommand: CommandDefinition = {
  aliases: ['man', 'info', 'helpman'],
  description: 'Display manual pages',
  category: 'easter',
  execute: (args) => {
    const topic = args[0] || 'lab';
    return {
      output: `MANUAL PAGE: ${topic.toUpperCase()}(1)\n\nNAME\n       ${topic} - JLMT Lab system component\n\nSYNOPSIS\n       ${topic} [OPTIONS] [ARGS...]\n\nDESCRIPTION\n       The ${topic} command is part of the JLMT Lab system version 2.4.1.\n       It provides integrated functionality for research and development\n       in robotics, control systems, and FPGA applications.\n\nOPTIONS\n       -h, --help\n              Display help message and exit\n\n       -v, --version\n              Output version information and exit\n\n       --verbose\n              Enable verbose output\n\nEXAMPLES\n       ${topic} --help\n              Show help for ${topic}\n\nSEE ALSO\n       whoami(1), lab(1), fpga(1), robot(1), swarm(1)\n\nAUTHOR\n       Written by Jorge Mayorga.\n\nJLMT Lab Manual                    March 2025                           ${topic.toUpperCase()}(1)`,
      action: 'none',
    };
  },
};

// passwd - Change password
const passwdCommand: CommandDefinition = {
  aliases: ['passwd', 'password'],
  description: 'Change user password',
  category: 'easter',
  execute: () => {
    return {
      output: `Changing password for user jlmt.\nCurrent password: \nNew password: \nRetype new password: \n\npasswd: all authentication tokens updated successfully.\n\nPassword requirements:\n  - Minimum 12 characters\n  - Mix of uppercase, lowercase, numbers, symbols\n  - Cannot contain "password", "123456", or "jlmt"\n  - Must include at least one emoji (just kidding)\n\nYour password has been updated.`,
      action: 'none',
    };
  },
};

// cal - Calendar
const calCommand: CommandDefinition = {
  aliases: ['cal', 'calendar', 'ncal'],
  description: 'Display calendar',
  category: 'easter',
  execute: () => {
    return {
      output: `     March 2025\nSu Mo Tu We Th Fr Sa\n                   1\n 2  3  4  5  6  7  8\n 9 10 11 12 13 14 15\n16 17 18 19 20 21 22\n23 24 25 26 27 28 29\n30 31\n\nUpcoming deadlines:\n  Mar 30 - Paper submission\n  Apr 05 - FPGA demo\n  Apr 15 - Conference presentation`,
      action: 'none',
    };
  },
};

// Safe math evaluator - replaces eval() for security
function safeMathEval(expression: string): number | null {
  // Remove all characters except numbers, operators, parentheses, and spaces
  const sanitized = expression.replace(/[^0-9+\-*/.()\s]/g, '');
  
  // Validate the expression contains only allowed characters
  if (!/^[\d+\-*/.()\s]+$/.test(sanitized)) {
    return null;
  }
  
  try {
    // Use Function constructor with limited scope (safer than eval)
    // This creates a function that only has access to Math and the expression
    const fn = new Function(`"use strict"; return (${sanitized})`);
    const result = fn();
    
    // Validate result is a finite number
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    
    return result;
  } catch {
    return null;
  }
}

// bc - Calculator
const bcCommand: CommandDefinition = {
  aliases: ['bc', 'calc', 'calculator'],
  description: 'Arbitrary precision calculator',
  category: 'easter',
  execute: (args) => {
    const expression = args.join(' ') || '42 * 1337';
    const result = safeMathEval(expression);
    
    if (result !== null) {
      return {
        output: `${expression}\n${result}\n`,
        action: 'none',
      };
    } else {
      return {
        output: `${expression}\n(standard_in) 1: syntax error\n\nTry: 42 * 1337 or 3.14159 * 2`,
        action: 'none',
      };
    }
  },
};

// yes - Output string repeatedly
const yesCommand: CommandDefinition = {
  aliases: ['yes'],
  description: 'Output a string repeatedly',
  category: 'easter',
  execute: (args) => {
    const msg = args.join(' ') || 'yes';
    const lines = Array(10).fill(msg).join('\n');
    return {
      output: `${lines}\n... (10 lines shown, press Ctrl+C to stop in real terminal)`,
      action: 'none',
    };
  },
};

// rev - Reverse lines
const revCommand: CommandDefinition = {
  aliases: ['rev', 'reverse'],
  description: 'Reverse lines characterwise',
  category: 'easter',
  execute: (args) => {
    const text = args.join(' ') || 'JLMT Lab';
    return {
      output: `${text.split('').reverse().join('')}`,
      action: 'none',
    };
  },
};

// figlet - Large text
const figletCommand: CommandDefinition = {
  aliases: ['figlet', 'banner', 'bigtext'],
  description: 'Display large characters',
  category: 'easter',
  execute: (args) => {
    const text = args.join(' ') || 'JLMT';
    return {
      output: ` _      _____ __  __ _______ \n| |    |_   _|  \\/  |__   __|\n| |      | | | \\  / |  | |   \n| |      | | | |\\/| |  | |   \n| |____ _| |_| |  | |  | |   \n|______|_____|_|  |_|  |_|   \n\n${text.toUpperCase()} LAB v2.4.1`,
      action: 'none',
    };
  },
};

// uptime - System uptime
const uptimeCommand: CommandDefinition = {
  aliases: ['uptime'],
  description: 'Tell how long the system has been running',
  category: 'easter',
  execute: () => {
    return {
      output: ` 14:20:00 up 420 days, 13:37, 1 user, load average: 0.42, 0.38, 0.31\n\nSystem has been running for 420 days, 13 hours, 37 minutes.\nThis is a stable research workstation.\n\nUptime record: 847 days (previous session)`,
      action: 'none',
    };
  },
};

// Register all commands
export function registerLinuxEasterCommands() {
  registerCommand(sudoCommand);
  registerCommand(aptCommand);
  registerCommand(sshCommand);
  registerCommand(pingCommand);
  registerCommand(netstatCommand);
  registerCommand(psCommand);
  registerCommand(killCommand);
  registerCommand(dfCommand);
  registerCommand(duCommand);
  registerCommand(freeCommand);
  registerCommand(unameCommand);
  registerCommand(hostnameCommand);
  registerCommand(idCommand);
  registerCommand(curlCommand);
  registerCommand(gccCommand);
  registerCommand(gitCommand);
  registerCommand(dockerCommand);
  registerCommand(kubectlCommand);
  registerCommand(systemctlCommand);
  registerCommand(shutdownCommand);
  registerCommand(historyCommand);
  registerCommand(aliasCommand);
  registerCommand(fortuneCommand);
  registerCommand(cowsayCommand);
  registerCommand(slCommand);
  registerCommand(cmatrixCommand);
  registerCommand(hackermanCommand);
  registerCommand(treeCommand);
  registerCommand(chmodCommand);
  registerCommand(exportCommand);
  registerCommand(manCommand);
  registerCommand(passwdCommand);
  registerCommand(calCommand);
  registerCommand(bcCommand);
  registerCommand(yesCommand);
  registerCommand(revCommand);
  registerCommand(figletCommand);
  registerCommand(uptimeCommand);
}
