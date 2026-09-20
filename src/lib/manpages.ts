// man 手册页：NAME/SYNOPSIS/DESCRIPTION/SEE ALSO 传统分节，行内有梗
export const MANPAGES: Record<string, string> = {
  man: `NAME
       man — an interface to the on-line reference manuals
SYNOPSIS
       man <command>
DESCRIPTION
       man 是手册的手册。你现在读的，就是手册的手册。
       想退出：按任何键，这里没有 less(1)，只有 life。
BUGS
       没有手册的手册不是手册，是 README。`,
  help: `NAME
       help — 列出可用命令
SYNOPSIS
       help
DESCRIPTION
       你已经会用了。你现在就是在用它。
SEE ALSO
       man(1) —— 比 help 更啰嗦的版本`,
  ls: `NAME
       ls — list directory contents
SYNOPSIS
       ls [dir] · ls -R · ls -a
DESCRIPTION
       无参数：列出 ~/ghost 下的子目录。
       ls <dir>：列出该目录文件（posts / notes / lab）。
       ls -R：递归列出全部。
       ls -a：显示隐藏项。根下有些目录平时不表态。
       文件带全局编号 [01]…，与页面显示和 cat <n> 一致。
SEE ALSO
       cat(1), cd(1), grep(1)`,
  cat: `NAME
       cat — concatenate and print files
SYNOPSIS
       cat <n> · cat <dir>/<file>[.md] · cat /etc/passwd
DESCRIPTION
       两种打开方式：全局编号（cat 1 或 cat 01），或文件路径
       （cat posts/evasion-decade.md，扩展名可省略）。
       在子目录里可以用相对路径：cat evasion-decade.md。
       系统文件直接 cat（/etc/passwd、/var/log/site.log …），
       管道里输出纯文本而非跳转。
SEE ALSO
       ls(1), grep(1), dmesg(1)`,
  cd: `NAME
       cd — change working directory
SYNOPSIS
       cd [dir]
DESCRIPTION
       支持相对路径（cd ..、cd ../notes）、~ 与 / 回家。
       无参数等同于 cd ~——和真 shell 一样。
       提示符会跟着变：v01d@cyber:~/posts$
SEE ALSO
       ls(1)`,
  grep: `NAME
       grep — search（本站唯一真·实用命令）
SYNOPSIS
       grep <关键词> [关键词…] · <cmd> | grep <关键词>
DESCRIPTION
       无管道：全站搜索标题 / tags / 正文，命中给出 cat 序号。
       多关键词按 AND 过滤。
       有管道：在上一命令的输出里过滤，和真 grep 一样。
EXAMPLES
       grep 免杀
       ls | grep posts
       man ls | grep NAME`,
  whoami: `NAME
       whoami — display effective username
DESCRIPTION
       答案取决于你是第几次来。会变的。
       站主身份见 who(1)。`,
  who: `NAME
       who — show who is logged on
DESCRIPTION
       两行登录者：自称站主的 v01d，和此刻的你。
       顺带当场采样你的本地指纹 —— agent / 语言 / 时区 / 屏幕。
       全部只显示在你的屏幕上：本站是纯静态，没有后端，无处上传。
SEE ALSO
       whoami(1) —— 一个会随时间改变答案的问题`,
  connect: `NAME
       connect — connect to the WIRED
SYNOPSIS
       connect
DESCRIPTION
       建立连接。连接期间站点换一副面孔，首屏锁在 lain，
       音乐退到远处，正文以另一种方式浮现。
       连接会被记住 —— 下次来的时候，你已经在里面了。
SEE ALSO
       disconnect(1), lain(1)`,
  disconnect: `NAME
       disconnect — close the connection
SYNOPSIS
       disconnect
DESCRIPTION
       拔线。所有状态回落。
       有些东西据说会留下来，但日志里没写。`,
  lain: `NAME
       lain — present day, present time
SYNOPSIS
       lain
DESCRIPTION
       no matter where you go, everyone is connected.
       切换连接态（connect / disconnect 的开关版）。konami code 同理。
SEE ALSO
       connect(1), 你路由器的 DHCP 列表`,
  sudo: `NAME
       sudo — execute a command as another user
DESCRIPTION
       v01d is not in the sudoers file. This incident will
       be reported.（骗你的，你是 root 又怎样）`,
  mpg123: `NAME
       mpg123 — play audio from ~/audio
SYNOPSIS
       mpg123
DESCRIPTION
       播放 bôa — Duvet（serial experiments lain, OP），
       低音量循环。再输一次停止；偏好会记住，下次进站
       在你第一次交互后自动续播（浏览器不允许静默自动
       播放，这不是 bug，是礼貌）。
       文件: public/audio/duvet.mp3（不入库，自备）。
NOTES
       无论你在哪个页面，Duvet 都会跟着你。
       no matter where you go…`,
  history: `NAME
       history — display the command history
DESCRIPTION
       ↑/↓ 翻历史，Ctrl+R 反向搜索。本页刷新即失忆——
       静态站不记仇。`,
  uptime: `NAME
       uptime — show how long the system has been running
DESCRIPTION
       自 serial experiments lain 开播日（1998-07-06）起算，
       显示你与 wired 连接的第 N 天。数字是真的，意义是你给的。`,
  dmesg: `NAME
       dmesg — print or control the kernel ring buffer
DESCRIPTION
       启动日志。与 cat /var/log/dmesg 同源。
       注意 clock 那行：这台机器认为 1998 与 2026 可以双启动。
       它没有错。`,
  nmap: `NAME
       nmap — Network Mapper
DESCRIPTION
       对纯静态站做端口扫描的结局：All 65535 ports filtered。
       连个端口都不给你。这不是 bug，是尊严。`,
  rm: `NAME
       rm — remove files or directories
DESCRIPTION
       rm -rf / 会删除 /dev/ghost。大概 1.5 秒。
       然后 just kidding :)`,
};

export const manPage = (cmd: string): string | null => MANPAGES[cmd] ?? null;
