// 🏘️ 우리반 마을 - 2D 탑다운 마을 맵 시스템

const Village = {
  canvas: null,
  ctx: null,
  animationId: null,
  tick: 0,

  // 플레이어 상태
  player: {
    x: 12 * 32, // 시작 위치 (중앙)
    y: 9 * 32,
    width: 24,
    height: 30,
    speed: CONFIG.GAME.SPEED,
    direction: 'down',
    isMoving: false,
    frame: 0
  },

  // 키보드 입력 상태
  keys: {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    e: false, Enter: false
  },

  // 가상 조이스틱 데이터
  joystick: {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0
  },

  // 랜드마크 건물 목록
  buildings: [
    { id: 'townhall', name: '마을회관', type: 'townhall', tx: 11, ty: 3, w: 3, h: 2, door: { x: 12.5, y: 5.5 }, target: '#announcements' },
    { id: 'market', name: '마켓', type: 'market', tx: 4, ty: 5, w: 3, h: 2, door: { x: 5.5, y: 7.5 }, target: '#market' },
    { id: 'police', name: '경찰서', type: 'police', tx: 18, ty: 5, w: 3, h: 2, door: { x: 19.5, y: 7.5 }, target: '#admin' },
    { id: 'tax', name: '세무서', type: 'tax', tx: 4, ty: 12, w: 3, h: 2, door: { x: 5.5, y: 14.5 }, target: '#admin' },
    { id: 'house_teacher', name: '선생님 댁', type: 'house_teacher', tx: 11, ty: 11, w: 3, h: 2, door: { x: 12.5, y: 13.5 }, target: '#visit-house?studentId=teacher' }
  ],

  // 서버로부터 받을 마을 주민(NPC) 및 수확물 데이터
  villagers: [],
  harvestNodes: [],
  cooldowns: {}, // nodeId -> lastHarvestTime

  // 상호작용 가능한 대상 정보 캐시
  activeInteraction: null,

  // 엔진 기동
  start: async function() {
    this.canvas = document.getElementById('village-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // 맵 크기 해상도 조정
    this.canvas.width = CONFIG.GAME.MAP_WIDTH * CONFIG.GAME.TILE_SIZE;
    this.canvas.height = CONFIG.GAME.MAP_HEIGHT * CONFIG.GAME.TILE_SIZE;

    // 데이터 가져오기
    await this.loadMapData();

    // 이벤트 리스너 등록
    this.bindEvents();

    // 루프 돌입
    this.tick = 0;
    this.loop();
  },

  // 엔진 정지
  stop: function() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.unbindEvents();
  },

  // 맵 정보 패치 (주민 및 수확물 위치 정보)
  loadMapData: async function() {
    try {
      const result = await API.call('getVillageMap');
      if (result && result.success) {
        // 주민 목록 (로그인 유저 본인 제외)
        this.villagers = (result.data.villagers || []).filter(v => v.studentId !== Auth.currentUser.studentId);
        
        // 주민들에게 맵상의 임의의 고정 좌표 할당 (NPC화)
        let idx = 0;
        this.villagers.forEach(v => {
          // 일정한 간격의 좌표 배치 (겹치지 않게)
          v.tx = 6 + (idx % 4) * 4;
          v.ty = 8 + Math.floor(idx / 4) * 3;
          v.x = v.tx * 32;
          v.y = v.ty * 32;
          idx++;
        });

        // 수확 노드
        this.harvestNodes = result.data.harvestNodes || [];
        
        // 동기화된 유저 상태를 토대로 쿨다운 세팅
        await Auth.syncState();
        this.updateCooldowns();
      }
    } catch (e) {
      console.error("마을 데이터 로드 오류:", e);
    }
  },

  // 수확 쿨다운 최신 상태로 캐싱
  updateCooldowns: function() {
    if (!Auth.currentState) return;
    // mock 이든 실서버든 유저 상태 내의 house 나 nodes 내역 참고
    // 이부분은 mock/실제 GAS API의 반환 형태를 매칭
    this.harvestNodes.forEach(node => {
      // 로컬 mock에서 쿨다운 체크를 하므로, API response에 남겨둠
      // 그냥 간편하게 mock/실서버 연동을 위해 임의로 node.nodeId의 마지막 수확시간 획득
      // (로컬 스토리지에 직접 접근해서 쿨다운 받아오거나, API.mockDb.get('HarvestNodes') 활용)
      const data = localStorage.getItem(`village_mock_HarvestNodes`);
      if (data) {
        try {
          const list = JSON.parse(data);
          const n = list.find(item => item.nodeId === node.nodeId);
          if (n && n.lastHarvestByStudent) {
            const map = JSON.parse(n.lastHarvestByStudent);
            if (map[Auth.currentUser.studentId]) {
              this.cooldowns[node.nodeId] = new Date(map[Auth.currentUser.studentId]).getTime();
            }
          }
        } catch(e) {}
      }
    });
  },

  // 키보드 & 터치 이벤트 바인딩
  bindEvents: function() {
    // 키보드
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // 모바일 조이스틱
    const joyContainer = document.getElementById('joystick-container');
    if (joyContainer) {
      joyContainer.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd);
    }
    
    // 화면 터치/클릭으로 상호작용하기
    this.canvas.addEventListener('click', this.handleCanvasClick);
  },

  unbindEvents: function() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    const joyContainer = document.getElementById('joystick-container');
    if (joyContainer) {
      joyContainer.removeEventListener('touchstart', this.handleTouchStart);
      window.removeEventListener('touchmove', this.handleTouchMove);
      window.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
    }
  },

  handleKeyDown: (e) => {
    if (e.key in Village.keys) {
      Village.keys[e.key] = true;
      // 상호작용 키(E / Enter)
      if (e.key === 'e' || e.key === 'Enter') {
        Village.triggerInteraction();
      }
    }
  },

  handleKeyUp: (e) => {
    if (e.key in Village.keys) {
      Village.keys[e.key] = false;
    }
  },

  // 가상 조이스틱 로직
  handleTouchStart: (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const joy = Village.joystick;
    const stick = document.getElementById('joystick-stick');
    
    joy.active = true;
    joy.startX = touch.clientX;
    joy.startY = touch.clientY;
  },

  handleTouchMove: (e) => {
    if (!Village.joystick.active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const joy = Village.joystick;
    const stick = document.getElementById('joystick-stick');

    let dx = touch.clientX - joy.startX;
    let dy = touch.clientY - joy.startY;
    
    // 반지름 30px 제한
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 30) {
      dx = (dx / dist) * 30;
      dy = (dy / dist) * 30;
    }

    stick.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // 이동 벡터 생성 (-1 ~ 1 사이 비율)
    joy.dx = dx / 30;
    joy.dy = dy / 30;
  },

  handleTouchEnd: () => {
    const joy = Village.joystick;
    const stick = document.getElementById('joystick-stick');
    joy.active = false;
    joy.dx = 0;
    joy.dy = 0;
    if (stick) {
      stick.style.transform = 'translate(0px, 0px)';
    }
  },

  handleCanvasClick: (e) => {
    // 팁 클릭하거나 상호작용 타겟이 있을 때 바로 상호작용 촉발
    if (Village.activeInteraction) {
      Village.triggerInteraction();
    }
  },

  // 메인 업데이트 루프
  loop: function() {
    this.tick++;
    this.updatePlayerPosition();
    this.checkInteractions();
    this.render();
    this.animationId = requestAnimationFrame(() => this.loop());
  },

  // 플레이어 이동 로직 (충돌 검사 포함)
  updatePlayerPosition: function() {
    let dx = 0;
    let dy = 0;

    // 1. 키보드 입력 체크
    if (this.keys.w || this.keys.ArrowUp) { dy = -this.player.speed; this.player.direction = 'up'; }
    if (this.keys.s || this.keys.ArrowDown) { dy = this.player.speed; this.player.direction = 'down'; }
    if (this.keys.a || this.keys.ArrowLeft) { dx = -this.player.speed; this.player.direction = 'left'; }
    if (this.keys.d || this.keys.ArrowRight) { dx = this.player.speed; this.player.direction = 'right'; }

    // 2. 모바일 조이스틱 입력 보정 (키보드 안 누를 때)
    if (dx === 0 && dy === 0 && this.joystick.active) {
      dx = this.joystick.dx * this.player.speed;
      dy = this.joystick.dy * this.player.speed;
      
      // 조이스틱 방향 각도 계산
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.player.direction = dy > 0 ? 'down' : 'up';
      }
    }

    this.player.isMoving = (dx !== 0 || dy !== 0);

    if (this.player.isMoving) {
      // 다음 이동 좌표
      const nextX = this.player.x + dx;
      const nextY = this.player.y + dy;

      // 충돌 검사 (벽 / 맵 가장자리 / 건물)
      if (!this.checkCollision(nextX, this.player.y)) {
        this.player.x = nextX;
      }
      if (!this.checkCollision(this.player.x, nextY)) {
        this.player.y = nextY;
      }
    }
  },

  // 충돌 감지 (벽, 건물 영역 등)
  checkCollision: function(x, y) {
    const tileSize = CONFIG.GAME.TILE_SIZE;
    
    // 맵 경계선 콜라이더
    if (x < 0 || x + this.player.width > CONFIG.GAME.MAP_WIDTH * tileSize) return true;
    if (y < 4 * p() || y + this.player.height > CONFIG.GAME.MAP_HEIGHT * tileSize) return true; // 위쪽 하늘영역 충돌

    function p() { return tileSize / 32; }

    // 건물 콜라이더 (AABB)
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      const bx = b.tx * tileSize;
      const by = b.ty * tileSize;
      const bw = b.w * tileSize;
      const bh = b.h * tileSize;

      // 플레이어 바운딩 박스
      if (x < bx + bw && x + this.player.width > bx &&
          y < by + bh && y + this.player.height > by) {
        return true;
      }
    }

    // 주민(NPC) 콜라이더
    for (let i = 0; i < this.villagers.length; i++) {
      const v = this.villagers[i];
      if (x < v.x + 20 && x + this.player.width > v.x + 4 &&
          y < v.y + 24 && y + this.player.height > v.y + 4) {
        return true;
      }
    }

    // 수확 노드 콜라이더
    for (let i = 0; i < this.harvestNodes.length; i++) {
      const n = this.harvestNodes[i];
      const nx = n.x * tileSize + 4;
      const ny = n.y * tileSize + 4;
      const nsize = 24; // 32타일 안의 히트박스 크기
      if (x < nx + nsize && x + this.player.width > nx &&
          y < ny + nsize && y + this.player.height > ny) {
        return true;
      }
    }

    return false;
  },

  // 상호작용 가능한 영역 안에 있는지 상시 검사
  checkInteractions: function() {
    const tileSize = CONFIG.GAME.TILE_SIZE;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    this.activeInteraction = null;

    // 1. 건물 포탈/문 검사
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      const doorX = b.door.x * tileSize;
      const doorY = b.door.y * tileSize;
      const dist = Math.hypot(px - doorX, py - doorY);
      
      if (dist < 28) {
        this.activeInteraction = {
          type: 'building',
          name: b.name,
          target: b.target,
          data: b
        };
        return;
      }
    }

    // 2. 수확 노드 검사
    for (let i = 0; i < this.harvestNodes.length; i++) {
      const n = this.harvestNodes[i];
      const nodeX = (n.x + 0.5) * tileSize;
      const nodeY = (n.y + 0.5) * tileSize;
      const dist = Math.hypot(px - nodeX, py - nodeY);

      if (dist < 36) {
        this.activeInteraction = {
          type: 'harvest',
          name: n.nodeId === 'node_1' ? '사과나무' : n.nodeId === 'node_2' ? '꽃밭' : '광석',
          nodeId: n.nodeId,
          data: n
        };
        return;
      }
    }

    // 3. 다른 주민(NPC) 검사
    for (let i = 0; i < this.villagers.length; i++) {
      const v = this.villagers[i];
      const vX = v.x + tileSize / 2;
      const vY = v.y + tileSize / 2;
      const dist = Math.hypot(px - vX, py - vY);

      if (dist < 32) {
        this.activeInteraction = {
          type: 'npc',
          name: v.name,
          studentId: v.studentId,
          data: v
        };
        return;
      }
    }
  },

  // 상호작용 트리거 (E/Enter 키 혹은 터치 팁 클릭 시)
  triggerInteraction: async function() {
    if (!this.activeInteraction) return;

    const target = this.activeInteraction;
    
    if (target.type === 'building') {
      // 건물 입장
      if (target.target.startsWith('#visit-house')) {
        // 선생님집 등 주택 방문
        window.location.hash = target.target;
      } else if (target.target === '#admin') {
        // 권한 체크 후 안내
        const isManager = Auth.hasRole(['teacher', 'salary_manager', 'market_manager', 'police', 'tax_manager']);
        if (isManager) {
          window.location.hash = '#admin';
        } else {
          App.modal.alert("출입 제한", "관리 권한(역할)을 가진 요원들만 출입할 수 있습니다.");
        }
      } else {
        window.location.hash = target.target;
      }
    } 
    else if (target.type === 'npc') {
      // 주민 대화창 열기
      App.modal.confirm(
        `💬 주민 대화: ${target.name}`,
        `"안녕! 나는 우리반 마을 주민인 <b>${target.name}</b>야.<br>내 집 구경하러 갈래?"`,
        () => {
          window.location.hash = `#visit-house?studentId=${target.studentId}`;
        }
      );
    } 
    else if (target.type === 'harvest') {
      // 수확 시도
      await Harvest.attempt(target.nodeId);
    }
  },

  // 화면 렌더링
  render: function() {
    const tileSize = CONFIG.GAME.TILE_SIZE;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // 1. 하늘 그리기 (상단 타일링 4줄분)
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(0, 0, width, 4 * tileSize);

    // 구름 데코
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI*2);
    ctx.arc(130, 45, 25, 0, Math.PI*2);
    ctx.arc(160, 50, 20, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(600, 70, 15, 0, Math.PI*2);
    ctx.arc(625, 65, 20, 0, Math.PI*2);
    ctx.arc(650, 70, 15, 0, Math.PI*2);
    ctx.fill();

    // 2. 바닥 잔디 그리기
    ctx.fillStyle = '#86efac'; // Pastel green grass
    ctx.fillRect(0, 4 * tileSize, width, height - 4 * tileSize);

    // 잔디 텍스처 (도트 느낌 데코)
    ctx.fillStyle = '#4ade80';
    for (let x = 16; x < width; x += 128) {
      for (let y = 5 * tileSize + 16; y < height; y += 96) {
        ctx.fillRect(x, y, 4, 4);
        ctx.fillRect(x + 12, y + 8, 4, 4);
      }
    }

    // 3. 모래길(Path) 그리기 (건물 입구 연결용)
    ctx.fillStyle = '#fef08a'; // Sand road yellow
    // 마을 광장 길
    ctx.fillRect(4 * tileSize, 7 * tileSize, 17 * tileSize, 1 * tileSize);
    ctx.fillRect(12 * tileSize, 4 * tileSize, 1 * tileSize, 13 * tileSize);
    // 각 상점 진입로
    ctx.fillRect(5 * tileSize, 7 * tileSize, 1 * tileSize, 1 * tileSize);
    ctx.fillRect(19 * tileSize, 7 * tileSize, 1 * tileSize, 1 * tileSize);
    ctx.fillRect(5 * tileSize, 14 * tileSize, 1 * tileSize, 1 * tileSize);
    ctx.fillRect(12 * tileSize, 13 * tileSize, 1 * tileSize, 1 * tileSize);

    // 4. 수확 노드 렌더링
    this.harvestNodes.forEach(node => {
      const lastTime = this.cooldowns[node.nodeId] || 0;
      const elapsed = new Date().getTime() - lastTime;
      Sprites.drawHarvestNode(ctx, node.x * tileSize, node.y * tileSize, tileSize, node.nodeId, elapsed);
    });

    // 5. 건물 렌더링
    this.buildings.forEach(b => {
      Sprites.drawBuilding(ctx, b.tx * tileSize, b.ty * tileSize, b.w * tileSize, b.h * tileSize, b.type, b.name);
    });

    // 6. 마을 NPC 주민 렌더링
    this.villagers.forEach(v => {
      Sprites.drawCharacter(ctx, v.x, v.y, tileSize, v.avatarConfig, 'down', false, this.tick);
      
      // 이름표
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(v.x + 2, v.y - 12, tileSize - 4, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v.name, v.x + tileSize / 2, v.y - 4);
    });

    // 7. 플레이어(나) 렌더링
    Sprites.drawCharacter(
      ctx, 
      this.player.x, 
      this.player.y, 
      tileSize, 
      Auth.currentUser.avatarConfig, 
      this.player.direction, 
      this.player.isMoving, 
      this.tick
    );
    
    // 플레이어 이름표
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(this.player.x + 2, this.player.y - 14, tileSize - 4, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 8px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Auth.currentUser.name, this.player.x + tileSize / 2, this.player.y - 5);

    // 8. 상호작용 가이드 UI 렌더링
    const tipEl = document.getElementById('interaction-tip');
    if (tipEl) {
      if (this.activeInteraction) {
        let actionWord = '조사하기 (E키)';
        if (this.activeInteraction.type === 'building') actionWord = '입장하기 (E키)';
        if (this.activeInteraction.type === 'npc') actionWord = '대화하기 (E키)';
        if (this.activeInteraction.type === 'harvest') actionWord = '수확하기 (E키)';
        
        tipEl.innerHTML = `🌟 <b>${this.activeInteraction.name}</b> ${actionWord}`;
        tipEl.style.display = 'block';
      } else {
        tipEl.style.display = 'none';
      }
    }
  }
};

window.Village = Village;
