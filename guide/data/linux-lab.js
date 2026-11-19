/* 리눅스 따라하기 실습 데이터 (assets/linux/lab-shell.js와 lab.js가 읽는다)
 * - files: 가상 파일 시스템의 처음 모습. distro를 적으면 그 계열에서만 만들어진다(deb, rh). text에 { deb, rh }를 쓰면 계열별 내용이다.
 * - lessons: 실습 목록. steps의 cmd는 학습자가 그대로 입력해야 하는 명령이다. { deb, rh }로 계열별로 다르게 줄 수 있다.
 *   say = 지금 하는 일의 설명, ok = 성공했을 때 보여 주는 해설. 모두 "~다." 문체로 쓴다.
 * - 단계의 명령이 시뮬레이터에서 실제로 성공하는지는 tools의 npm run check가 계열마다 순서대로 실행해 확인한다.
 * 이 데이터는 화면 안에서만 쓰이고 어디에도 저장되지 않는다. 새로고침하면 처음 상태로 돌아간다. */
const LAB = {
  files: [
    { path: '/home/master', type: 'd', mode: '755' },
    { path: '/home/master/readme.txt', type: 'f', mode: '644', text: '리눅스 실습 공간에 온 것을 환영한다.\n' },
    { path: '/home/master/docs', type: 'd', mode: '755' },
    { path: '/home/master/docs/todo.txt', type: 'f', mode: '644', text: '1. ls로 둘러본다\n2. chmod로 권한을 바꾼다\n3. 패키지를 설치한다\n' },
    { path: '/home/master/.profile', type: 'f', mode: '644', text: '# 로그인할 때 읽는 설정 파일\n' },
    { path: '/etc', type: 'd', mode: '755', owner: 'root' },
    { path: '/etc/hostname', type: 'f', mode: '644', owner: 'root', text: { deb: 'ubuntu\n', rh: 'rhel\n' } },
    { path: '/etc/os-release', type: 'f', mode: '644', owner: 'root', text: {
      deb: 'PRETTY_NAME="Ubuntu 22.04.4 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nID=ubuntu\nID_LIKE=debian\n',
      rh: 'NAME="Rocky Linux"\nVERSION="9.3 (Blue Onyx)"\nID="rocky"\nID_LIKE="rhel centos fedora"\nPRETTY_NAME="Rocky Linux 9.3 (Blue Onyx)"\n',
    } },
    { path: '/etc/shadow', type: 'f', mode: '640', owner: 'root', text: 'root:*:19000:0:99999:7:::\n' },
    { path: '/var/log', type: 'd', mode: '755', owner: 'root' },
    { path: '/var/log/syslog', type: 'f', mode: '640', owner: 'root', distro: 'deb', text: 'Nov 19 09:00:01 ubuntu systemd[1]: Started Daily apt download activities.\n' },
    { path: '/var/log/messages', type: 'f', mode: '600', owner: 'root', distro: 'rh', text: 'Nov 19 09:00:01 rhel systemd[1]: Started Session 1 of User master.\n' },
    { path: '/usr', type: 'd', mode: '755', owner: 'root' },
    { path: '/bin', type: 'd', mode: '755', owner: 'root' },
    { path: '/tmp', type: 'd', mode: '1777', owner: 'root' },
    { path: '/root', type: 'd', mode: '700', owner: 'root' },
  ],
  lessons: [
    { id: 'look', title: '둘러보기', steps: [
      { say: '지금 내가 어느 폴더에 있는지 본다. pwd는 print working directory(현재 작업 폴더 출력)의 줄임말이다.', cmd: 'pwd', ok: '/home/master가 나왔다. 로그인하면 시작하는 홈 폴더이고, ~ 기호가 이 폴더를 가리킨다.' },
      { say: '이 폴더에 무엇이 있는지 본다. ls는 list의 줄임말이다.', cmd: 'ls', ok: '파일 이름이 나왔다. 파란색 이름은 폴더다. 점으로 시작하는 숨김 파일은 보이지 않는다.' },
      { say: '자세히 본다. -l 옵션은 권한, 소유자, 크기를 한 줄에 하나씩 보여 준다.', cmd: 'ls -l', ok: '맨 앞의 -rw-r--r--가 권한이다. 첫 글자 -는 파일, d는 폴더다. 이어서 소유자, 그룹, 그 밖의 사용자 순서로 r(읽기) w(쓰기) x(실행)가 세 칸씩 나온다.' },
      { say: '숨김 파일까지 모두 본다. -a 옵션은 all(전부)이다.', cmd: 'ls -a', ok: '.profile 같은 점 파일이 보였다. . 은 현재 폴더, .. 은 위 폴더다.' },
      { say: '시스템 설정 폴더 /etc로 이동한다. cd는 change directory(폴더 변경)의 줄임말이다.', cmd: 'cd /etc', ok: '/로 시작하는 경로는 루트에서 출발하는 절대 경로다. 프롬프트의 위치도 바뀌었다.' },
      { say: '이 컴퓨터가 어떤 배포판인지 파일을 열어 확인한다. cat은 파일 내용을 그대로 출력한다.', cmd: 'cat /etc/os-release', ok: 'ID와 ID_LIKE로 어느 계열인지 알 수 있다. 오른쪽 위 스위치로 계열을 바꾸면 이 내용도 달라진다.' },
      { say: '홈 폴더로 돌아간다. cd만 쓰면 홈으로 간다.', cmd: 'cd', ok: '프롬프트가 ~로 돌아왔다.' },
    ] },
    { id: 'perm', title: '파일 만들고 권한 바꾸기', steps: [
      { say: '연습용 폴더를 만든다. mkdir은 make directory(폴더 만들기)의 줄임말이다.', cmd: 'mkdir lab', ok: 'lab 폴더가 생겼다.' },
      { say: '만든 폴더 안으로 들어간다.', cmd: 'cd lab', ok: '프롬프트가 ~/lab으로 바뀌었다.' },
      { say: '파일을 만든다. echo는 글자를 출력하고, > 기호는 그 출력을 파일로 보낸다.', cmd: 'echo hello > note.txt', ok: 'note.txt가 만들어졌다. > 는 파일을 덮어쓰고, >> 는 뒤에 덧붙인다.' },
      { say: '내용을 확인한다.', cmd: 'cat note.txt', ok: 'hello가 나왔다.' },
      { say: '처음 권한을 본다.', cmd: 'ls -l', ok: '-rw-r--r--, 숫자로는 644다. 소유자는 읽고 쓸 수 있고 나머지는 읽기만 가능하다.' },
      { say: '소유자만 읽고 쓰게 바꾼다. 6은 r(4)+w(2), 0은 아무 권한 없음이다.', cmd: 'chmod 600 note.txt', ok: '이제 소유자 외에는 아무것도 못 한다.' },
      { say: '바뀐 권한을 확인한다.', cmd: 'ls -l', ok: '-rw-------로 바뀌었다. 위의 chmod 계산기와 같은 규칙이다.' },
      { say: '이번에는 모든 권한을 없앤다.', cmd: 'chmod 000 note.txt', ok: '소유자도 읽을 수 없는 상태가 됐다.' },
      { say: '내 파일을 읽어 본다.', cmd: 'cat note.txt', ok: 'Permission denied가 나왔다. 권한이 실제로 동작한다는 뜻이다. 다음 단계에서 되돌린다.', fails: true },
      { say: '권한을 원래대로 되돌린다.', cmd: 'chmod 644 note.txt', ok: '644로 복구했다.' },
    ] },
    { id: 'pkg', title: '패키지 설치와 서비스', steps: [
      { say: { deb: '패키지 목록을 최신으로 갱신한다. 관리자 권한이 필요하므로 sudo를 앞에 붙인다.', rh: '업데이트 가능한 패키지를 확인한다. 관리자 권한이 필요하므로 sudo를 앞에 붙인다.' },
        cmd: { deb: 'sudo apt update', rh: 'sudo dnf check-update' }, ok: { deb: '저장소에서 최신 목록을 받았다. 설치 전에 먼저 하는 습관이 좋다.', rh: '저장소의 상태를 확인했다. 설치 전에 확인하는 습관이 좋다.' } },
      { say: 'sudo 없이 설치를 시도해 본다. 일반 사용자는 시스템에 프로그램을 설치할 수 없다.', cmd: { deb: 'apt install tree', rh: 'dnf install tree' }, ok: '권한 오류가 나왔다. 시스템 전체를 바꾸는 작업은 관리자 권한이 필요하다.', fails: true },
      { say: 'tree 프로그램을 설치한다.', cmd: { deb: 'sudo apt install tree', rh: 'sudo dnf install tree' }, ok: '설치가 끝났다. 패키지 관리자가 필요한 파일을 내려받아 자리에 놓았다.' },
      { say: '설치된 패키지 목록에서 tree를 찾는다. | 는 앞 명령의 출력을 다음 명령에 넘기는 파이프, grep은 글자를 찾는다.', cmd: { deb: 'dpkg -l | grep tree', rh: 'rpm -qa | grep tree' }, ok: { deb: 'dpkg가 설치된 .deb 패키지를 알려 준다.', rh: 'rpm이 설치된 .rpm 패키지를 알려 준다.' } },
      { say: '설치한 프로그램을 실행한다. 폴더 구조를 나무 모양으로 보여 준다.', cmd: 'tree', ok: '설치 전에는 command not found였을 명령이 이제 동작한다.' },
      { say: { deb: 'SSH 서비스의 상태를 본다. Debian 계열의 서비스 이름은 ssh다.', rh: 'SSH 서비스의 상태를 본다. Red Hat 계열의 서비스 이름은 sshd다.' },
        cmd: { deb: 'systemctl status ssh', rh: 'systemctl status sshd' }, ok: 'active (running)이면 서비스가 켜져 있는 것이다. 이름이 계열마다 다르다는 점을 기억한다.' },
    ] },
    { id: 'net', title: '네트워크 확인', steps: [
      { say: '내 컴퓨터의 네트워크 주소를 본다.', cmd: 'ip addr', ok: 'lo는 자기 자신(127.0.0.1), eth0은 실제 네트워크 장치다. inet 옆이 IP 주소와 /24 같은 CIDR 표기다.' },
      { say: '외부 주소와 통신이 되는지 두 번만 확인한다. -c 2는 2번만 보내라는 뜻이다.', cmd: 'ping -c 2 8.8.8.8', ok: 'time이 응답 시간이다. 0% packet loss면 정상이다.' },
      { say: '열려 있는 포트를 본다. -t는 TCP, -l은 대기 중, -n은 숫자로 보여 준다.', cmd: 'ss -tln', ok: '22번 포트가 LISTEN이면 SSH가 접속을 기다리는 중이다.' },
      { say: { deb: '방화벽 상태를 본다. Ubuntu의 방화벽 도구는 ufw다.', rh: '방화벽 규칙을 본다. Red Hat 계열의 방화벽 서비스는 firewalld다.' },
        cmd: { deb: 'sudo ufw status', rh: 'sudo firewall-cmd --list-all' }, ok: { deb: 'inactive는 방화벽이 꺼진 상태다. sudo ufw enable로 켤 수 있다.', rh: 'zone과 허용된 service 목록이 나온다. ssh가 허용돼 있다.' } },
    ] },
  ],
};
if (typeof window !== 'undefined') window.LINUX_LAB = LAB;
if (typeof module !== 'undefined') module.exports = LAB;
