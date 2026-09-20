// 终端深处的文件系统：站点把自己伪装成一台真的机器。
// site.log 混排真实 commit 时间线与 1998 的系统时间 —— 这台机器分不清
// 2026 年的构建和 1998 年的连线。对它来说都是"最近的事"。

/** 系统文件：路径（无前导 /，'' 段=home）→ 行 */
export const SYSFILES: Record<string, string[]> = {
  'etc/passwd': [
    'root:x:0:0:root:/root:/bin/zsh',
    'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
    'lain:x:7:7:lain:/the/wired:/usr/bin/nps',
    'v01d:x:1000:1000:v01d,,,:/home/v01d:/bin/zsh',
    'ghost:x:13:13:ghost in the shell:/dev/ghost:/bin/false',
    'guest:x:65534:65534:you:/tmp/session:/bin/true',
  ],
  'etc/motd': [
    'welcome to v01d.cyber.',
    '此机器没有后端。你看到的每个进程都是你自己的想象。',
    '如果你在找入口：入口不在 /etc 里。入口是你按下的每个键。',
  ],
  'var/log/site.log': [
    'Jul  6 00:00:00 wired lain[1]: layer 7 protocol up —— serial experiments begin',
    'Jul  6 00:00:07 wired lain[1]: no matter where you go, everyone is connected',
    'Sep 20 11:48:44 v01d astro[313]: site boot —— 设计文档落笔',
    'Sep 20 11:56:51 v01d fetch-art[313]: anilist pipeline cached 15 works',
    'Sep 20 11:57:29 v01d crt[42]: scanlines calibrated @ 60hz',
    'Sep 20 14:36:51 v01d zsh[774]: virtual filesystem mounted at ~/ghost',
    'Sep 20 16:17:06 v01d mpg123[733]: bôa — Duvet · loop',
    'Sep 20 16:59:24 v01d net[7]: connection state machine online',
    'Sep 20 23:59:59 v01d syslog: 时间线混线，1998 与 2026 在同一块盘上。正常现象。',
  ],
  'var/log/access.log': [
    '1998-07-06T00:00:00+09:00 lain    CONNECT the-wired:7   200 -',
    '2026-09-20T11:48:44+08:00 v01d    GET    /              200 "docs"',
    '2026-09-20T17:06:00+08:00 guest   GET    /              200 "you"',
    '???-??-??T??:??:??+08:00 ???      CONNECT layer:7        ??? "now"',
    '# 最后一行是你这次访问。本站没有后端，这行只写在你眼里。',
  ],
  'var/log/dmesg': [
    '[    0.000000] wired: layer 7 protocol registered',
    '[    0.000001] lain: protocol name is NPS. no, NAVI. it does not matter',
    '[    0.313370] art: 15 works cached —— respect the artists',
    '[    0.971998] clock: system time untrusted (1998/2026 dual boot)',
    '[    1.337000] crt: 60hz scanlines ok',
    '[    2.000001] ghost: shell found at /dev/ghost',
    '[    7.000000] net: connect/disconnect state machine ready',
    '[   42.000000] everything: connected',
  ],
  '.ghost/.bash_history': [
    'whoami',
    'sudo whoami',
    'man whoami',
    'cat /etc/passwd | grep -i v01d',
    'grep -r "ghost" / --include="*.shell"',
    'find / -name "*.ghost" 2>/dev/null',
    'cd /the/wired',
    'ls -a ~',
    'cat ~/.ghost/.bash_history',
    'lain',
    'lain',
    'lain',
    '# whoami 的输出为什么一次比一次陌生',
    '# 这两行注释是我自己写进 history 的。人是会给自己写 history 的。',
    'history -c',
  ],
  '.ghost/.profile': [
    '# ~/.ghost/.profile —— 只在没人的时候执行',
    'export WIRED=layer7',
    'export GHOST_IN=shell',
    "alias whoami='echo 这个问题问错了对象'",
    "alias rm='rm -i'",
    '[ -f /the/wired/nps ] && . /the/wired/nps',
    '# EOF。profile 的本义：你以为看到的就是全部。',
  ],
};

/** cd 可进的系统目录（posts/notes/lab 由文章组另算，'' = /） */
export const SYSDIRS = ['etc', 'var', 'var/log', '.ghost'];
