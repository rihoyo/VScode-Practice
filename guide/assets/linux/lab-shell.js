/* 리눅스 실습용 가상 셸 (화면 없이 동작하는 순수 로직)
 * 가상 파일 시스템과 명령어 몇 가지를 흉내 낸다. 실제 컴퓨터는 건드리지 않고, 상태는 메모리에만 있다(새로고침하면 사라진다).
 * 사용: const sh = LabShell.create({ distro: 'deb' | 'rh', files: LINUX_LAB.files });
 *       const r = sh.run('ls -l');   // { out: '출력 글자', code: 0 }, clear 명령이면 clear: true
 * 폴더 이름은 \u0001이름\u0002 표시로 감싸 돌려준다(화면이 색을 입히는 용도). 화면 코드는 lab.js, 데이터는 data/linux-lab.js. */
(() => {
  const DIR_A = '\u0001', DIR_B = '\u0002';
  const D = (s) => DIR_A + s + DIR_B;
  const plain = (s) => s.replace(/[\u0001\u0002]/g, '');
  const DATE = 'Nov 19 09:00';

  function create(opts) {
    const distro = opts.distro === 'rh' ? 'rh' : 'deb';
    const user = 'master', home = '/home/master', host = distro === 'rh' ? 'rhel' : 'ubuntu';
    const root = { t: 'd', mode: 0o755, owner: 'root', group: 'root', kids: {} };
    let cwd = home;
    const history = [];

    /* ── 파일 시스템 ── */
    const norm = (p) => {
      const out = [];
      for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
      return out;
    };
    const abs = (p) => {
      if (p === '~' || p.startsWith('~/')) p = home + p.slice(1);
      return '/' + norm(p.startsWith('/') ? p : cwd + '/' + p).join('/');
    };
    const get = (p) => { let n = root; for (const s of norm(abs(p))) { if (n.t !== 'd' || !n.kids[s]) return null; n = n.kids[s]; } return n; };
    const split = (p) => { const parts = norm(abs(p)); const name = parts.pop(); return { dir: get('/' + parts.join('/')), name, path: '/' + parts.concat(name || []).join('/') }; };
    const mkNode = (t, mode, owner, text) => ({ t, mode, owner, group: owner === 'root' ? 'root' : owner, kids: t === 'd' ? {} : undefined, text: text || '' });
    function ensureDir(parts) {
      let n = root;
      for (const s of parts) { if (!n.kids[s]) n.kids[s] = mkNode('d', 0o755, 'root'); n = n.kids[s]; }
      return n;
    }
    for (const e of opts.files || []) {
      if (e.distro && e.distro !== distro) continue;
      const parts = norm(e.path), name = parts.pop(), parent = ensureDir(parts);
      const text = e.text && typeof e.text === 'object' ? e.text[distro] : e.text;
      const node = mkNode(e.type === 'd' ? 'd' : 'f', parseInt(e.mode, 8), e.owner || user, text);
      if (e.type === 'd' && parent.kids[name]) { parent.kids[name].mode = node.mode; parent.kids[name].owner = node.owner; parent.kids[name].group = node.group; }
      else parent.kids[name] = node;
    }
    const can = (n, bit, su) => su || (((n.owner === user ? n.mode >> 6 : n.mode) & bit) === bit); // 4=r 2=w 1=x (소유자 아니면 그 밖 칸 기준)
    const modeStr = (n) => { let s = n.t === 'd' ? 'd' : '-'; for (let i = 6; i >= 0; i -= 3) { const b = (n.mode >> i) & 7; s += (b & 4 ? 'r' : '-') + (b & 2 ? 'w' : '-') + (b & 1 ? 'x' : '-'); } return s; };
    const size = (n) => (n.t === 'd' ? 4096 : byteLen(n.text));
    const byteLen = (s) => new TextEncoder().encode(s).length;
    const prompt = () => { const r = cwd === home ? '~' : cwd.startsWith(home + '/') ? '~' + cwd.slice(home.length) : cwd; return `${user}@${host}:${r}$ `; };
    const files = (n) => Object.keys(n.kids).sort((a, b) => a.localeCompare(b));

    /* ── 패키지와 서비스(계열별) ── */
    const REPO = distro === 'rh'
      ? { tree: '1.8.0-10.el9', curl: '7.76.1-26.el9', nano: '5.6.1-5.el9' }
      : { tree: '2.0.2-1', curl: '7.81.0-1ubuntu1.15', nano: '6.2-1' };
    const installed = new Set(distro === 'rh' ? ['bash', 'coreutils', 'openssh-server', 'curl'] : ['bash', 'coreutils', 'openssh-server', 'curl']);
    const SERVICE = distro === 'rh' ? 'sshd' : 'ssh';
    let ufw = { on: false, rules: [] };
    const hasTree = () => installed.has('tree');

    /* ── 명령어 ── */
    const ok = (out) => ({ out: out || '', code: 0 });
    const err = (out, code = 1) => ({ out, code });
    const need = (su, msg) => (su ? null : err(msg));
    const fmtLs = (name, n, long) => {
      const label = n.t === 'd' ? D(name) : name;
      return long ? `${modeStr(n)} ${n.t === 'd' ? 2 : 1} ${n.owner} ${n.group} ${String(size(n)).padStart(5)} ${DATE} ${label}` : label;
    };
    function treeLines(n, prefix, counts) {
      const names = files(n).filter((k) => !k.startsWith('.')), lines = [];
      names.forEach((k, i) => {
        const c = n.kids[k], last = i === names.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + (c.t === 'd' ? D(k) : k));
        if (c.t === 'd') { counts.d++; lines.push(...treeLines(c, prefix + (last ? '    ' : '│   '), counts)); } else counts.f++;
      });
      return lines;
    }
    const CMD = {
      pwd: () => ok(cwd),
      whoami: () => ok(user),
      hostname: () => ok(host),
      id: () => ok(distro === 'rh' ? `uid=1000(${user}) gid=1000(${user}) groups=1000(${user}),10(wheel)` : `uid=1000(${user}) gid=1000(${user}) groups=1000(${user}),27(sudo)`),
      uname: (a) => ok(a.includes('-r') ? (distro === 'rh' ? '5.14.0-362.8.1.el9_3.x86_64' : '5.15.0-91-generic') : 'Linux'),
      date: () => ok('Thu Nov 19 09:00:00 UTC 2026'),
      clear: () => ({ out: '', code: 0, clear: true }),
      history: () => ok(history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n')),
      help: () => ok('쓸 수 있는 명령어:\n  pwd ls cd cat echo mkdir touch rm cp mv chmod tree grep wc head\n  whoami id hostname uname date clear history\n  ip ping ss systemctl sudo\n' + (distro === 'rh' ? '  dnf rpm getenforce firewall-cmd' : '  apt dpkg ufw') + '\n형식: 명령 -옵션 대상   예) ls -l /etc'),
      ls(a) {
        const flags = a.filter((x) => x.startsWith('-')).join(''), targets = a.filter((x) => !x.startsWith('-'));
        const long = flags.includes('l'), all = flags.includes('a');
        const lines = []; let code = 0;
        for (const t of targets.length ? targets : ['.']) {
          const n = get(t);
          if (!n) { lines.push(`ls: cannot access '${t}': No such file or directory`); code = 2; continue; }
          if (targets.length > 1) lines.push(`${t}:`);
          if (n.t !== 'd') { lines.push(fmtLs(t, n, long)); continue; }
          if (!can(n, 4, sudoNow)) { lines.push(`ls: cannot open directory '${t}': Permission denied`); code = 2; continue; }
          const names = files(n).filter((k) => all || !k.startsWith('.'));
          if (long) {
            lines.push(`total ${Math.max(0, names.length) * 4}`);
            if (all) { lines.push(fmtLs('.', n, true), fmtLs('..', n, true)); }
            names.forEach((k) => lines.push(fmtLs(k, n.kids[k], true)));
          } else lines.push((all ? ['.', '..'].map(D) : []).concat(names.map((k) => (n.kids[k].t === 'd' ? D(k) : k))).join('  '));
        }
        return { out: lines.join('\n'), code };
      },
      cd(a) {
        const t = a[0] === undefined ? '~' : a[0], n = get(t);
        if (!n) return err(`bash: cd: ${t}: No such file or directory`);
        if (n.t !== 'd') return err(`bash: cd: ${t}: Not a directory`);
        if (!can(n, 1, sudoNow)) return err(`bash: cd: ${t}: Permission denied`);
        cwd = abs(t); return ok();
      },
      cat(a) {
        if (!a.length) return ok();
        const out = []; let code = 0;
        for (const t of a) {
          const n = get(t);
          if (!n) { out.push(`cat: ${t}: No such file or directory`); code = 1; }
          else if (n.t === 'd') { out.push(`cat: ${t}: Is a directory`); code = 1; }
          else if (!can(n, 4, sudoNow)) { out.push(`cat: ${t}: Permission denied`); code = 1; }
          else out.push(n.text.replace(/\n$/, ''));
        }
        return { out: out.join('\n'), code };
      },
      echo: (a) => ok(a.join(' ')),
      mkdir(a) {
        const p = a.includes('-p'), out = []; let code = 0;
        for (const t of a.filter((x) => !x.startsWith('-'))) {
          const { dir, name, path } = split(t);
          if (get(t)) { if (!p) { out.push(`mkdir: cannot create directory '${t}': File exists`); code = 1; } continue; }
          if (!dir && p) { let n = root; for (const seg of norm(path)) { if (!n.kids[seg]) n.kids[seg] = mkNode('d', 0o755, sudoNow ? 'root' : user); n = n.kids[seg]; } continue; }
          if (!dir) { out.push(`mkdir: cannot create directory '${t}': No such file or directory`); code = 1; continue; }
          if (!can(dir, 2, sudoNow)) { out.push(`mkdir: cannot create directory '${t}': Permission denied`); code = 1; continue; }
          dir.kids[name] = mkNode('d', 0o755, sudoNow ? 'root' : user);
        }
        return { out: out.join('\n'), code };
      },
      touch(a) {
        const out = []; let code = 0;
        for (const t of a) {
          const { dir, name } = split(t);
          if (get(t)) continue;
          if (!dir) { out.push(`touch: cannot touch '${t}': No such file or directory`); code = 1; continue; }
          if (!can(dir, 2, sudoNow)) { out.push(`touch: cannot touch '${t}': Permission denied`); code = 1; continue; }
          dir.kids[name] = mkNode('f', 0o644, sudoNow ? 'root' : user);
        }
        return { out: out.join('\n'), code };
      },
      rm(a) {
        const r = a.some((x) => /^-[a-z]*r/i.test(x)), f = a.some((x) => /^-[a-z]*f/.test(x)), out = []; let code = 0;
        for (const t of a.filter((x) => !x.startsWith('-'))) {
          const n = get(t), { dir, name } = split(t);
          if (!n) { if (!f) { out.push(`rm: cannot remove '${t}': No such file or directory`); code = 1; } continue; }
          if (n.t === 'd' && !r) { out.push(`rm: cannot remove '${t}': Is a directory`); code = 1; continue; }
          if (!can(dir, 2, sudoNow)) { out.push(`rm: cannot remove '${t}': Permission denied`); code = 1; continue; }
          if (abs(t) === '/' || abs(t) === home) { out.push(`rm: refusing to remove '${t}': 실습에서는 지울 수 없다`); code = 1; continue; }
          delete dir.kids[name];
        }
        return { out: out.join('\n'), code };
      },
      cp(a) { return copyMove(a, false); },
      mv(a) { return copyMove(a, true); },
      chmod(a) {
        const rest = a.filter((x) => !x.startsWith('-') || /^-[rwx]/.test(x));
        if (rest.length < 2) return err('chmod: missing operand\nTry \'chmod --help\' for more information.');
        const spec = rest[0], out = []; let code = 0;
        for (const t of rest.slice(1)) {
          const n = get(t);
          if (!n) { out.push(`chmod: cannot access '${t}': No such file or directory`); code = 1; continue; }
          if (n.owner !== user && !sudoNow) { out.push(`chmod: changing permissions of '${t}': Operation not permitted`); code = 1; continue; }
          let m = n.mode;
          if (/^[0-7]{3,4}$/.test(spec)) m = parseInt(spec, 8);
          else {
            let bad = false;
            for (const clause of spec.split(',')) {
              const c = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
              if (!c) { bad = true; break; }
              const who = c[1] || 'a', bits = [...c[3]].reduce((s, ch) => s | ({ r: 4, w: 2, x: 1 })[ch], 0);
              for (const w of who === 'a' ? 'ugo' : who) {
                const sh = { u: 6, g: 3, o: 0 }[w], mask = bits << sh;
                if (c[2] === '+') m |= mask; else if (c[2] === '-') m &= ~mask; else m = (m & ~(7 << sh)) | mask;
              }
            }
            if (bad) return err(`chmod: invalid mode: '${spec}'`);
          }
          n.mode = m;
        }
        return { out: out.join('\n'), code };
      },
      tree() {
        if (!hasTree()) return distro === 'deb'
          ? err("Command 'tree' not found, but can be installed with:\n\nsudo apt install tree", 127)
          : err('bash: tree: command not found', 127);
        const n = get('.'), counts = { d: 0, f: 0 };
        const lines = ['.'].concat(treeLines(n, '', counts));
        return ok(lines.join('\n') + `\n\n${counts.d} director${counts.d === 1 ? 'y' : 'ies'}, ${counts.f} file${counts.f === 1 ? '' : 's'}`);
      },
      grep(a, input) {
        const i = a.includes('-i'), rest = a.filter((x) => !x.startsWith('-')), pat = rest[0];
        if (pat === undefined) return err('Usage: grep [OPTION]... PATTERN [FILE]...', 2);
        let text = input;
        if (rest[1]) { const n = get(rest[1]); if (!n || n.t !== 'f') return err(`grep: ${rest[1]}: No such file or directory`, 2); if (!can(n, 4, sudoNow)) return err(`grep: ${rest[1]}: Permission denied`, 2); text = n.text; }
        if (text === undefined) return err('', 1);
        const re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), i ? 'i' : '');
        const hit = plain(text).split('\n').filter((l) => re.test(l));
        return { out: text.split('\n').filter((l) => re.test(plain(l))).join('\n'), code: hit.length ? 0 : 1 };
      },
      wc(a, input) { const t = input === undefined ? '' : input; return ok(String(t ? t.split('\n').filter((l) => l !== '').length : 0)); },
      head(a, input) { const k = a.indexOf('-n'), n = k >= 0 ? Number(a[k + 1]) || 10 : 10; return ok((input || '').split('\n').slice(0, n).join('\n')); },
      ip(a) {
        if (a[0] !== 'addr' && a[0] !== 'a') return err('Usage: ip addr   (이 실습에서는 addr만 지원한다)');
        return ok('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP\n    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff\n    inet 10.0.2.15/24 brd 10.0.2.255 scope global eth0');
      },
      ping(a) {
        const k = a.indexOf('-c'), n = k >= 0 ? Math.min(5, Number(a[k + 1]) || 2) : 3, host2 = a.filter((x, i) => !x.startsWith('-') && i !== k + 1)[0];
        if (!host2) return err('ping: usage error: Destination address required', 2);
        const lines = [`PING ${host2} (${host2}) 56(84) bytes of data.`];
        for (let i = 1; i <= n; i++) lines.push(`64 bytes from ${host2}: icmp_seq=${i} ttl=117 time=${(11 + i * 0.7).toFixed(1)} ms`);
        lines.push('', `--- ${host2} ping statistics ---`, `${n} packets transmitted, ${n} received, 0% packet loss`);
        return ok(lines.join('\n'));
      },
      ss(a) {
        if (!a.join('').includes('l')) return ok('State  Recv-Q Send-Q Local Address:Port  Peer Address:Port');
        return ok('State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port\nLISTEN  0       128            0.0.0.0:22          0.0.0.0:*\nLISTEN  0       128               [::]:22             [::]:*');
      },
      systemctl(a) {
        if (a[0] !== 'status') return err('이 실습에서는 systemctl status 서비스이름만 지원한다');
        const name = (a[1] || '').replace(/\.service$/, '');
        if (name !== SERVICE) return err(`Unit ${name || '(이름 없음)'}.service could not be found.`, 4);
        const desc = distro === 'rh' ? 'OpenSSH server daemon' : 'OpenBSD Secure Shell server';
        return ok(`● ${SERVICE}.service - ${desc}\n     Loaded: loaded (/lib/systemd/system/${SERVICE}.service; enabled)\n     Active: active (running) since Thu 2026-11-19 09:00:00 UTC; 1h ago\n   Main PID: 812 (sshd)`);
      },
    };

    function copyMove(a, move) {
      const name = move ? 'mv' : 'cp', r = a.some((x) => /^-[a-z]*r/i.test(x)), args = a.filter((x) => !x.startsWith('-'));
      if (args.length < 2) return err(`${name}: missing destination file operand after '${args[0] || ''}'`);
      const dst = args.pop(), dn = get(dst), out = []; let code = 0;
      for (const s of args) {
        const sn = get(s);
        if (!sn) { out.push(`${name}: cannot stat '${s}': No such file or directory`); code = 1; continue; }
        if (sn.t === 'd' && !move && !r) { out.push(`cp: -r not specified; omitting directory '${s}'`); code = 1; continue; }
        if (!can(sn, 4, sudoNow)) { out.push(`${name}: cannot open '${s}' for reading: Permission denied`); code = 1; continue; }
        let dir, nm;
        if (dn && dn.t === 'd') { dir = dn; nm = split(s).name; } else { const sp = split(dst); dir = sp.dir; nm = sp.name; }
        if (!dir) { out.push(`${name}: cannot create '${dst}': No such file or directory`); code = 1; continue; }
        if (!can(dir, 2, sudoNow)) { out.push(`${name}: cannot create '${dst}': Permission denied`); code = 1; continue; }
        const clone = (n) => ({ ...n, kids: n.kids ? Object.fromEntries(Object.entries(n.kids).map(([k, v]) => [k, clone(v)])) : undefined });
        dir.kids[nm] = clone(sn);
        if (move) { const sp = split(s); delete sp.dir.kids[sp.name]; }
      }
      return { out: out.join('\n'), code };
    }

    /* 패키지 관리자와 방화벽은 계열마다 다르다. 다른 계열의 명령은 "없는 명령"이 된다 */
    const DEB = {
      apt(a, _in, su) {
        const sub = a[0], pk = a.filter((x, i) => i > 0 && !x.startsWith('-'));
        if (sub === 'update') {
          const e = need(su, 'Reading package lists... Done\nE: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)\nE: Unable to lock directory /var/lib/apt/lists/\nW: Problem unlinking the file /var/cache/apt/pkgcache.bin - RemoveCaches (13: Permission denied)');
          return e || ok('Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nGet:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]\nFetched 119 kB in 1s (118 kB/s)\nReading package lists... Done\nBuilding dependency tree... Done\n5 packages can be upgraded. Run \'apt list --upgradable\' to see them.');
        }
        if (sub === 'install') {
          const e = need(su, 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?');
          if (e) return e;
          if (!pk.length) return err('E: 설치할 패키지 이름이 없다');
          const out = ['Reading package lists... Done', 'Building dependency tree... Done'];
          for (const p of pk) {
            if (!REPO[p] && !installed.has(p)) return err(`E: Unable to locate package ${p}`, 100);
            if (installed.has(p)) { out.push(`${p} is already the newest version (${REPO[p] || '-'}).`); continue; }
            out.push('The following NEW packages will be installed:', `  ${p}`, '0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.', `Get:1 http://archive.ubuntu.com/ubuntu jammy/universe amd64 ${p} amd64 ${REPO[p]}`, `Selecting previously unselected package ${p}.`, `Setting up ${p} (${REPO[p]}) ...`);
            installed.add(p);
          }
          return ok(out.join('\n'));
        }
        return err('이 실습에서는 apt update, apt install 패키지이름만 지원한다');
      },
      dpkg(a) {
        if (!a.includes('-l')) return err('이 실습에서는 dpkg -l만 지원한다');
        const rows = ['Desired=Unknown/Install/Remove/Purge/Hold', 'Name            Version              Architecture Description', '+++-===============-====================-============-=========='];
        [...installed].sort().forEach((p) => rows.push(`ii  ${p.padEnd(15)} ${(REPO[p] || '1.0').padEnd(20)} amd64        ${p} package`));
        return ok(rows.join('\n'));
      },
      ufw(a, _in, su) {
        const e = need(su, 'ERROR: You need to be root to run this script');
        if (e) return e;
        if (a[0] === 'status') return ok(ufw.on ? 'Status: active\n\nTo                         Action      From\n--                         ------      ----\n' + ufw.rules.map((r) => `${r.padEnd(26)} ALLOW       Anywhere`).join('\n') : 'Status: inactive');
        if (a[0] === 'enable') { ufw.on = true; return ok('Firewall is active and enabled on system startup'); }
        if (a[0] === 'allow' && a[1]) { ufw.rules.push(a[1]); return ok('Rules updated'); }
        return err('이 실습에서는 ufw status, enable, allow 포트만 지원한다');
      },
    };
    const RH = {
      dnf(a, _in, su) {
        const sub = a[0], pk = a.filter((x, i) => i > 0 && !x.startsWith('-'));
        if (sub === 'check-update') return ok('Last metadata expiration check: 0:12:34 ago on Thu 19 Nov 2026 09:00:00 AM UTC.\n업데이트할 패키지가 없다.');
        if (sub === 'install') {
          const e = need(su, 'Error: This command has to be run with superuser privileges (under the root user on most systems).');
          if (e) return e;
          if (!pk.length) return err('Error: 설치할 패키지 이름이 없다');
          const out = ['Last metadata expiration check: 0:12:34 ago on Thu 19 Nov 2026 09:00:00 AM UTC.'];
          for (const p of pk) {
            if (!REPO[p] && !installed.has(p)) return err(`Error: Unable to find a match: ${p}`, 1);
            if (installed.has(p)) { out.push(`Package ${p}-${REPO[p] || '1.0'}.x86_64 is already installed.`, 'Dependencies resolved.', 'Nothing to do.', 'Complete!'); continue; }
            out.push('Dependencies resolved.', ' Package  Arch    Version        Repository  Size', ' Installing:', `  ${p.padEnd(7)} x86_64  ${REPO[p]}   baseos      55 k`, '', 'Transaction Summary', 'Install  1 Package', '', `Installed: ${p}-${REPO[p]}.x86_64`, 'Complete!');
            installed.add(p);
          }
          return ok(out.join('\n'));
        }
        return err('이 실습에서는 dnf check-update, dnf install 패키지이름만 지원한다');
      },
      rpm(a) {
        if (!a.includes('-qa')) return err('이 실습에서는 rpm -qa만 지원한다');
        return ok([...installed].sort().map((p) => `${p}-${REPO[p] || '1.0'}.x86_64`).join('\n'));
      },
      getenforce: () => ok('Enforcing'),
      'firewall-cmd'(a) {
        if (!a.includes('--list-all')) return err('이 실습에서는 firewall-cmd --list-all만 지원한다');
        return ok('public (active)\n  target: default\n  interfaces: eth0\n  services: cockpit dhcpv6-client ssh\n  ports:\n  masquerade: no');
      },
    };
    const DISTRO_CMDS = distro === 'rh' ? RH : DEB;
    const OTHER = distro === 'rh' ? ['apt', 'dpkg', 'ufw', 'aa-status'] : ['dnf', 'rpm', 'getenforce', 'firewall-cmd', 'yum'];

    /* ── 실행 ── */
    let sudoNow = false;
    const tokenize = (s) => [...s.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]));
    function one(seg, input) {
      let toks = tokenize(seg);
      if (!toks.length) return ok();
      sudoNow = false;
      if (toks[0] === 'sudo') { sudoNow = true; toks = toks.slice(1); if (!toks.length) return err('usage: sudo command'); }
      const c = toks[0], a = toks.slice(1);
      const fn = CMD[c] || DISTRO_CMDS[c];
      if (!fn) {
        if (distro === 'deb' && OTHER.includes(c)) return err(`Command '${c}' not found (Debian·Ubuntu에는 ${c}가 없다. 위쪽 스위치에서 Red Hat으로 바꾸면 쓸 수 있다)`, 127);
        return err(distro === 'deb' ? `Command '${c}' not found` : `bash: ${c}: command not found${OTHER.includes(c) ? ' (Red Hat 계열에는 ${c}가 없다. 위쪽 스위치에서 Debian으로 바꾸면 쓸 수 있다)' : ''}`, 127);
      }
      return fn(a, input, sudoNow);
    }
    function run(line) {
      line = line.trim();
      if (!line) return ok();
      history.push(line);
      const segs = line.split(/\s*\|\s*/);
      let redirect = null;
      const last = segs[segs.length - 1].match(/^(.*?)\s*(>>?)\s*(\S+)\s*$/);
      if (last) { segs[segs.length - 1] = last[1]; redirect = { op: last[2], to: last[3] }; }
      let res = null, input;
      for (let i = 0; i < segs.length; i++) {
        // 첫 명령 앞의 sudo는 관리자 권한이고, 파이프 뒤 명령은 입력(input)을 받는다
        const r = i === 0 ? runFirst(segs[i]) : runFilter(segs[i], input);
        res = r; input = r.out;
        if (r.clear) return r;
      }
      if (redirect) {
        const { dir, name } = split(redirect.to), exist = get(redirect.to);
        if (!dir) return err(`bash: ${redirect.to}: No such file or directory`);
        if (exist ? !can(exist, 2, false) : !can(dir, 2, false)) return err(`bash: ${redirect.to}: Permission denied`);
        const body = plain(res.out) + (res.out ? '\n' : '');
        if (exist && exist.t === 'd') return err(`bash: ${redirect.to}: Is a directory`);
        if (exist) exist.text = redirect.op === '>>' ? exist.text + body : body; else dir.kids[name] = mkNode('f', 0o644, user, body);
        return { out: '', code: res.code };
      }
      return res;
    }
    function runFirst(seg) { return one(seg); }
    function runFilter(seg, input) {
      sudoNow = false;
      const toks = tokenize(seg), c = toks[0], a = toks.slice(1);
      if (!['grep', 'wc', 'head'].includes(c)) return err(`이 실습의 파이프(|) 뒤에는 grep, wc, head만 쓸 수 있다`);
      return CMD[c](a, input, false);
    }

    /* ── 탭 완성 ── */
    function complete(line) {
      const m = line.match(/^(.*?)(\S*)$/), head = m[1], word = m[2];
      let cands = [];
      if (!head.trim() || /^\s*sudo\s+$/.test(head)) cands = [...new Set([...Object.keys(CMD), ...Object.keys(DISTRO_CMDS), 'sudo'])].filter((c) => c.startsWith(word)).sort();
      else {
        const slash = word.lastIndexOf('/'), base = slash >= 0 ? word.slice(0, slash + 1) : '', part = word.slice(slash + 1);
        const dir = get(base || '.');
        if (dir && dir.t === 'd') cands = files(dir).filter((k) => k.startsWith(part) && (part.startsWith('.') || !k.startsWith('.'))).map((k) => base + k + (dir.kids[k].t === 'd' ? '/' : ''));
      }
      return { head, word, cands };
    }

    return { run, prompt, complete, history, distro, host, get cwd() { return cwd; }, has: (p) => installed.has(p) };
  }

  const api = { create, plain };
  if (typeof window !== 'undefined') window.LabShell = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
