/* 리눅스 따라하기 · 연출 계획 (순수 로직, 화면을 만지지 않는다)
 * 셸(lab-shell.js)은 결과를 한 번에 내놓는다. 실제 서버처럼 보이게 하려고, 시간이 걸리는 명령(apt·dnf·ping)의 결과를
 * "한 줄씩, 기다림과 진행 막대를 섞어" 보여 줄 계획으로 바꾼다. 재생은 lab.js가 맡는다.
 *
 * plan(distro, text, res) → 이벤트 배열
 *   { t:'line', s, cls }          한 줄을 바로 찍는다
 *   { t:'wait', ms }              잠시 멈춘다
 *   { t:'temp', s, ms }           ms 동안 보였다가 사라지는 줄(연결 중 표시)
 *   { t:'spin', s, ms, done }     s 뒤에 점이 돌다가 done 으로 끝나는 줄(최종 글자: s + ' ' + done)
 *   { t:'bar', label, ms, size }  다운로드 진행 막대(끝나면 사라진다)
 * 일반 명령은 빈 배열을 돌려주고, 그러면 lab.js는 즉시 출력한다. 그래서 이 파일이 없어도 실습은 동작한다.
 * 규칙: temp·bar를 뺀 line·spin의 글자를 이으면 항상 셸이 낸 text와 같다(check.js가 확인한다). */
(() => {
  'use strict';
  const SLOW = new Set(['apt', 'apt-get', 'dnf', 'yum', 'ping']);
  const size = (s) => { const m = /\[(\d+(?:\.\d+)?)\s*(kB|MB)\]/.exec(s); return m ? m[1] + ' ' + m[2] : null; };

  function build(distro, text, res) {
    const toks = String(text || '').trim().split(/\s+/);
    while (toks[0] === 'sudo') toks.shift();
    const prog = toks[0], sub = toks[1];
    if (!SLOW.has(prog) || !res || !res.out) return [];
    const ev = [], L = res.out.split('\n'), line = (s, cls) => ev.push({ t: 'line', s, cls });
    const wait = (ms) => ev.push({ t: 'wait', ms });
    const bad = res.code ? 'bad' : '';

    if (prog === 'ping') { // 한 줄에 약 0.6초, 통계는 마지막에 한꺼번에
      let first = true;
      for (const s of L) {
        if (/bytes from|Destination|Unreachable/i.test(s)) { wait(first ? 350 : 640); first = false; }
        else if (/^---/.test(s)) wait(300);
        line(s, bad);
      }
      return ev;
    }

    const deb = prog === 'apt' || prog === 'apt-get', net = (sub === 'update' || sub === 'install') && !res.code;
    if (net) { // 서버와 연결하는 동안
      if (deb) ev.push({ t: 'temp', s: '0% [Connecting to archive.ubuntu.com (185.125.190.83)]', ms: 750 });
      else ev.push({ t: 'temp', s: 'Rocky Linux 9 - BaseOS   connecting to dl.rockylinux.org ...', ms: 750 });
    } else if (deb) wait(250);

    for (const s of L) {
      if (/^(Hit|Ign):\d+/.test(s)) { wait(160); line(s, bad); continue; }
      if (/^Get:\d+/.test(s)) { // 내려받는 줄: 줄이 먼저 뜨고 막대가 채워진다
        line(s, bad);
        const sz = size(s), big = /\bMB\b/.test(sz || '');
        ev.push({ t: 'bar', label: sz ? '다운로드' : '다운로드', ms: big ? 1500 : 900 + (s.length % 5) * 120, size: sz });
        continue;
      }
      const m = /^(.*\.\.\.) (Done)$/.exec(s);
      if (m) { ev.push({ t: 'spin', s: m[1], ms: 600 + (m[1].length % 4) * 110, done: m[2] }); continue; }
      if (/^Fetched /.test(s)) { wait(200); line(s, bad); continue; }
      if (/^(Selecting previously|Preparing to unpack|Unpacking)/.test(s)) { wait(320); line(s, bad); continue; }
      if (/^Setting up /.test(s)) { wait(520); line(s, bad); continue; }
      if (/^Dependencies resolved\.$/.test(s)) { wait(450); line(s, bad); continue; }
      if (/^Transaction Summary$/.test(s)) { wait(250); line(s, bad); continue; }
      if (/^Installed:/.test(s)) { // dnf는 요약 뒤에 내려받고 설치한다
        ev.push({ t: 'bar', label: 'Downloading Packages', ms: 1100, size: null });
        wait(350); line(s, bad); continue;
      }
      if (/^Complete!/.test(s)) { wait(200); line(s, bad); continue; }
      if (/^The following NEW packages/.test(s)) { wait(300); line(s, bad); continue; }
      line(s, bad);
    }
    return ev;
  }

  /* 전체 속도: 1이 기본, 작을수록 빠르다. 연출 시간은 모두 이 값을 곱해 정한다 */
  const SPEED = 0.6;
  const plan = (distro, text, res) => build(distro, text, res).map((e) => (e.ms ? { ...e, ms: Math.round(e.ms * SPEED) } : e));

  /* 계획을 글자로 합친다(검사용): temp·bar를 빼고 line·spin을 이어 붙인 결과 */
  const flatten = (ev) => ev.filter((e) => e.t === 'line' || e.t === 'spin').map((e) => (e.t === 'spin' ? e.s + ' ' + e.done : e.s)).join('\n');
  const total = (ev) => ev.reduce((n, e) => n + (e.ms || 0), 0);

  const api = { plan, flatten, total };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else window.LabTheatre = api;
})();
