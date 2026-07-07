// 🏘️ 우리반 마을 - 집 꾸미기 및 방문 시스템 (2D Grid Canvas Editor)

const House = {
  canvas: null,
  ctx: null,
  targetStudentId: null,
  isOwner: false,
  
  // 방 설정
  cols: CONFIG.HOUSE.WIDTH, // 10
  rows: CONFIG.HOUSE.HEIGHT, // 8
  tileSize: 48, // 집 내부는 좀더 크게 48px

  // 방 상태
  layout: [],          // [{itemId, x, y}]
  wallThemeId: 'wall_default',
  floorThemeId: 'floor_default',
  bulletinMemo: '',

  // 편집용 임시 상태
  selectedInventoryItem: null, // 배치할 아이템
  isDeleteMode: false,

  // 테마 그래픽 정의
  themes: {
    walls: {
      wall_default: { color: '#e2e8f0', line: '#cbd5e1' },
      wall_blue: { color: '#bae6fd', line: '#38bdf8' },
      wall_pink: { color: '#fbcfe8', line: '#f472b6' },
      wall_green: { color: '#bbf7d0', line: '#4ade80' },
      wall_wood: { color: '#ca8a04', line: '#a16207' }
    },
    floors: {
      floor_default: { color: '#f1f5f9', style: 'grid' },
      floor_wood: { color: '#fed7aa', style: 'plank' },
      floor_tile: { color: '#ccfbf1', style: 'check' },
      floor_carpet: { color: '#fee2e2', style: 'carpet' }
    }
  },

  start: async function(studentId, isOwner = false) {
    this.targetStudentId = studentId;
    this.isOwner = isOwner;
    
    this.canvas = document.getElementById('house-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // 캔버스 크기 초기화
    this.canvas.width = this.cols * this.tileSize;
    this.canvas.height = this.rows * this.tileSize;

    // 모드 초기화
    this.selectedInventoryItem = null;
    this.isDeleteMode = false;

    // 데이터 동기화 및 그리기
    await this.loadHouseData();
    this.bindEvents();
    this.render();
  },

  stop: function() {
    this.unbindEvents();
  },

  // 집 데이터 및 소유주 인벤토리 로드
  loadHouseData: async function() {
    try {
      const result = await API.call('getHouse', { studentId: this.targetStudentId });
      if (result && result.success) {
        const h = result.data;
        this.layout = JSON.parse(h.layoutData || '[]');
        this.wallThemeId = h.wallThemeId || 'wall_default';
        this.floorThemeId = h.floorThemeId || 'floor_default';
        this.bulletinMemo = h.bulletinMemo || '';
      }

      // UI 렌더링
      this.updateUI();
    } catch (e) {
      console.error("집 데이터를 가져오지 못했습니다:", e);
    }
  },

  // UI 엘리먼트 갱신
  updateUI: async function() {
    // 1. 방명록/게시판 노출
    const memoTitle = document.getElementById('house-memo-title');
    const memoText = document.getElementById('house-memo-text');
    const memoInput = document.getElementById('house-memo-input');
    const memoSubmit = document.getElementById('house-btn-memo-submit');

    if (memoTitle) {
      const nameRes = await API.call('getUserState', { studentId: this.targetStudentId });
      const ownerName = nameRes.success ? nameRes.data.user.name : this.targetStudentId;
      memoTitle.textContent = `🏡 ${ownerName} 님의 알림 방명록`;
    }

    if (memoText) {
      memoText.innerHTML = this.bulletinMemo 
        ? `<b>알림글:</b> <div style="padding:8px; background:#fffbeb; border:2px solid var(--border-color); border-radius:6px; margin-top:4px;">${this.bulletinMemo}</div>` 
        : '등록된 한 줄 메모가 없습니다.';
    }

    if (memoInput) {
      memoInput.value = this.bulletinMemo;
    }

    // 2. 주인 전용 편집기 패널 제어
    const editPanel = document.getElementById('house-edit-panel');
    if (editPanel) {
      editPanel.style.display = this.isOwner ? 'block' : 'none';
      if (this.isOwner) {
        this.renderFurnitureInventory();
      }
    }
  },

  // 가구 인벤토리 드롭다운 또는 버튼 목록 렌더링
  renderFurnitureInventory: async function() {
    const selector = document.getElementById('house-furniture-select');
    if (!selector) return;
    selector.innerHTML = '<option value="">-- 배치할 가구 선택 --</option>';

    await Auth.syncState();
    const inv = Auth.currentState.inventory || [];
    
    // 마켓 아이템 중 카테고리가 가구인 것 정보
    const itemsRes = await API.call('getMarketItems');
    const allItems = itemsRes.success ? itemsRes.data : [];

    // 유저 인벤토리에 있는 가구만 필터링
    const furnitureInInv = inv.filter(i => {
      const match = allItems.find(item => item.itemId === i.itemId);
      return match && match.category === 'furniture' && i.quantity > 0;
    });

    if (furnitureInInv.length === 0) {
      selector.innerHTML = '<option value="">(보관함에 가구가 없습니다)</option>';
      return;
    }

    furnitureInInv.forEach(i => {
      const match = allItems.find(item => item.itemId === i.itemId);
      const option = document.createElement('option');
      option.value = i.itemId;
      option.textContent = `${match.name} (보유: ${i.quantity}개)`;
      selector.appendChild(option);
    });
  },

  // 메모 업로드
  submitMemo: async function() {
    const input = document.getElementById('house-memo-input');
    if (!input) return;
    const memoText = input.value.trim();

    const result = await API.call('postBulletin', {
      studentId: this.targetStudentId,
      memo: memoText
    });

    if (result && result.success) {
      this.bulletinMemo = memoText;
      App.modal.alert("게시판 수정 완료", "방명록/한줄알림이 성공적으로 게시되었습니다.");
      this.updateUI();
    } else {
      App.modal.alert("오류", result.error || "수정에 실패했습니다.");
    }
  },

  // 마우스 클릭 이벤트로 가구 배치/제거
  bindEvents: function() {
    this.canvas.addEventListener('click', this.handleCanvasClick);
    
    // 메모 제출 버튼 바인딩
    const submitBtn = document.getElementById('house-btn-memo-submit');
    if (submitBtn) {
      submitBtn.onclick = () => this.submitMemo();
    }

    // 테마 설정 요소 바인딩
    const wallSelect = document.getElementById('house-wall-select');
    const floorSelect = document.getElementById('house-floor-select');
    
    if (wallSelect) {
      wallSelect.value = this.wallThemeId;
      wallSelect.onchange = (e) => {
        this.wallThemeId = e.target.value;
        this.render();
      };
    }
    if (floorSelect) {
      floorSelect.value = this.floorThemeId;
      floorSelect.onchange = (e) => {
        this.floorThemeId = e.target.value;
        this.render();
      };
    }

    // 모드 전환 버튼 바인딩
    const furnitureSelect = document.getElementById('house-furniture-select');
    if (furnitureSelect) {
      furnitureSelect.onchange = (e) => {
        this.selectedInventoryItem = e.target.value;
        this.isDeleteMode = false;
        this.updateModeHighlight();
      };
    }

    const deleteModeBtn = document.getElementById('house-btn-delete-mode');
    if (deleteModeBtn) {
      deleteModeBtn.onclick = () => {
        this.isDeleteMode = !this.isDeleteMode;
        this.selectedInventoryItem = null;
        if (furnitureSelect) furnitureSelect.value = "";
        this.updateModeHighlight();
      };
    }

    // 저장 버튼
    const saveBtn = document.getElementById('house-btn-save');
    if (saveBtn) {
      saveBtn.onclick = () => this.saveLayout();
    }
  },

  unbindEvents: function() {
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
    }
  },

  updateModeHighlight: function() {
    const btn = document.getElementById('house-btn-delete-mode');
    if (btn) {
      if (this.isDeleteMode) {
        btn.classList.add('btn-danger');
        btn.textContent = '회수 모드: ON (가구 클릭)';
      } else {
        btn.classList.remove('btn-danger');
        btn.textContent = '가구 회수하기';
      }
    }
  },

  handleCanvasClick: (e) => {
    if (!House.isOwner) return; // 주인만 가구 클릭 상호작용 가능

    const rect = House.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tx = Math.floor(clickX / House.tileSize);
    const ty = Math.floor(clickY / House.tileSize);

    // 경계 유효성 검사 (y=0은 벽면이므로 가구 배치 불가, y=1~7만 가능)
    if (tx < 0 || tx >= House.cols || ty < 1 || ty >= House.rows) {
      return;
    }

    if (House.isDeleteMode) {
      // 1. 가구 회수 모드
      const index = House.layout.findIndex(item => item.x === tx && item.y === ty);
      if (index >= 0) {
        const removed = House.layout.splice(index, 1)[0];
        House.render();
        House.renderFurnitureInventory(); // 셀렉터 수량 갱신용
      }
    } else if (House.selectedInventoryItem) {
      // 2. 가구 배치 모드
      // 이미 해당 타일에 가구가 있는지 확인
      const exists = House.layout.some(item => item.x === tx && item.y === ty);
      if (exists) {
        App.modal.alert("배치 불가", "해당 타일에 이미 다른 가구가 있습니다. 회수 후 다시 배치하세요.");
        return;
      }

      House.layout.push({
        itemId: House.selectedInventoryItem,
        x: tx,
        y: ty
      });

      House.render();
      House.renderFurnitureInventory(); // 셀렉터 수량 갱신
    }
  },

  // 집 배치 저장 호출
  saveLayout: async function() {
    const result = await API.call('updateHouseLayout', {
      studentId: Auth.currentUser.studentId,
      layoutData: JSON.stringify(this.layout),
      wallThemeId: this.wallThemeId,
      floorThemeId: this.floorThemeId
    });

    if (result && result.success) {
      App.modal.alert("저장 성공", "방 인테리어가 성공적으로 저장되었습니다!");
      await Auth.syncState();
    } else {
      App.modal.alert("저장 실패", result.error || "오류가 발생했습니다.");
    }
  },

  // 집 내부 캔버스 그리기
  render: function() {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. 벽면 렌더링 (첫 번째 행인 y=0)
    const wallTheme = this.themes.walls[this.wallThemeId] || this.themes.walls.wall_default;
    ctx.fillStyle = wallTheme.color;
    ctx.fillRect(0, 0, width, ts);
    
    // 벽면 도트/패널 라인
    ctx.fillStyle = wallTheme.line;
    for (let x = 0; x < width; x += 16) {
      ctx.fillRect(x, ts - 4, 2, 4);
    }

    // 2. 바닥 렌더링 (y=1 ~ y=7)
    const floorTheme = this.themes.floors[this.floorThemeId] || this.themes.floors.floor_default;
    ctx.fillStyle = floorTheme.color;
    ctx.fillRect(0, ts, width, height - ts);

    // 바닥 격자 및 패턴
    if (floorTheme.style === 'grid') {
      ctx.strokeStyle = 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += ts) {
        ctx.beginPath(); ctx.moveTo(x, ts); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = ts; y <= height; y += ts) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    } 
    else if (floorTheme.style === 'plank') {
      // 나무 바닥 패턴 (가로선)
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      for (let y = ts + 12; y < height; y += 12) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    } 
    else if (floorTheme.style === 'check') {
      // 체크타일 패턴
      ctx.fillStyle = '#ffffff';
      for (let x = 0; x < this.cols; x++) {
        for (let y = 1; y < this.rows; y++) {
          if ((x + y) % 2 === 0) {
            ctx.fillRect(x * ts, y * ts, ts, ts);
          }
        }
      }
    }
    else if (floorTheme.style === 'carpet') {
      // 카페트 데코
      ctx.strokeStyle = 'rgba(219, 39, 119, 0.1)';
      ctx.lineWidth = 2;
      for (let x = 8; x < width; x += 32) {
        for (let y = ts + 8; y < height; y += 32) {
          ctx.strokeRect(x, y, 16, 16);
        }
      }
    }

    // 3. 주인 편집시 타일 가이드선 그리기
    if (this.isOwner) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += ts) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += ts) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    }

    // 4. 배치된 가구 아이템 렌더링
    this.layout.forEach(item => {
      Sprites.drawFurniture(ctx, item.x * ts, item.y * ts, ts, item.itemId);
    });
  }
};

window.House = House;
