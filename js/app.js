// 🏘️ 우리반 마을 - 메인 SPA 앱 컨트롤러 및 라우터

const App = {
  currentView: '',

  init: async function() {
    console.log("앱 초기화 중...");
    
    // 글로벌 이벤트 리스너 바인딩
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // 네비게이션 버튼 이벤트 바인딩
    this.bindNavEvents();
    
    // 최초 세션 복구 및 라우팅
    const hasSession = Auth.initSession();
    if (hasSession) {
      Auth.updateHeaderUI();
      // 유저 상태 최신화
      await Auth.syncState();
      this.handleRouting();
    } else {
      window.location.hash = '#login';
      this.handleRouting();
    }
  },

  // SPA 라우터 처리
  handleRouting: function() {
    const hash = window.location.hash || '#login';
    
    // 로그인 체크 (로그인/회원가입 화면이 아닌데 세션이 없으면 로그인으로 튕김)
    if (hash !== '#login' && hash !== '#signup' && !Auth.currentUser) {
      window.location.hash = '#login';
      return;
    }

    // 각 화면 전환
    const viewName = hash.substring(1);
    this.switchView(viewName);
  },

  // 화면 전환 (CSS 클래스 제어 및 애니메이션)
  switchView: function(viewName) {
    if (this.currentView === viewName) return;

    // 기존 뷰 정리 (예: Canvas 게임 루프 정지)
    if (this.currentView === 'village') {
      Village.stop();
    }
    if (this.currentView === 'my-house' || this.currentView === 'visit-house') {
      House.stop();
    }

    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
      s.classList.remove('active');
    });

    const activeScreen = document.getElementById(`screen-${viewName}`);
    if (activeScreen) {
      activeScreen.classList.add('active');
      this.currentView = viewName;
      
      // 스크린별 초기화 함수 호출
      this.initView(viewName);
    } else {
      console.warn(`화면을 찾을 수 없습니다: screen-${viewName}`);
      window.location.hash = '#village'; // 기본값인 마을로 이동
    }
  },

  // 각 화면 로딩 시 개별 모듈 실행
  initView: async function(viewName) {
    // 공통적으로 유저 잔액과 상태를 헤더에 최신화
    if (Auth.currentUser) {
      Auth.updateHeaderUI();
    }

    switch(viewName) {
      case 'login':
        Auth.logout(); // 로그인 화면 진입 시 로그아웃 처리
        break;
      case 'signup':
        // 회원가입 폼 초기화
        ['signup-id','signup-name','signup-pin','signup-pin-confirm','signup-teacher-code'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        break;
      case 'village':
        await Village.start();
        break;
      case 'my-house':
        await House.start(Auth.currentUser.studentId, true); // 내 집 (편집 가능)
        break;
      case 'visit-house':
        // 친구 방문 - 해시 파라미터가 있을 것이므로 확인
        // 예: #visit-house?studentId=student1
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const targetId = urlParams.get('studentId') || 'teacher';
        await House.start(targetId, false); // 친구 집 (읽기 전용)
        break;
      case 'market':
        await Market.init();
        break;
      case 'admin':
        await Admin.init();
        break;
      case 'announcements':
        await Announcements.init();
        break;
      case 'missions':
        await Missions.init();
        break;
      case 'inventory':
        this.renderInventory();
        break;
    }
  },

  // 상단 네비게이션바 바인딩
  bindNavEvents: function() {
    const navs = {
      'nav-village': '#village',
      'nav-house': '#my-house',
      'nav-market': '#market',
      'nav-missions': '#missions',
      'nav-announcements': '#announcements',
      'nav-inventory': '#inventory',
      'nav-admin': '#admin',
      'nav-logout': '#login'
    };

    Object.keys(navs).forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.hash = navs[id];
        });
      }
    });
  },

  // 인벤토리(보관함) 화면 렌더링
  renderInventory: async function() {
    await Auth.syncState();
    const listEl = document.getElementById('inventory-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const inv = Auth.currentState.inventory || [];
    if (inv.length === 0) {
      listEl.innerHTML = '<div class="text-muted text-center py-4">보관함이 비어있습니다.</div>';
      return;
    }

    // 마켓 아이템 정보 가져오기 (이름 매칭용)
    const itemsRes = await API.call('getMarketItems');
    const allItems = itemsRes.success ? itemsRes.data : [];

    inv.forEach(item => {
      const itemInfo = allItems.find(i => i.itemId === item.itemId) || { name: item.itemId, category: 'etc' };
      const card = document.createElement('div');
      card.className = 'list-item';
      
      const categoryKr = CONFIG.CATEGORIES[itemInfo.category] || '기타';

      // 캔버스 스프라이트 렌더링 추가
      const spriteCanvasId = `inv-sprite-${item.itemId}`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <canvas id="${spriteCanvasId}" width="32" height="32" style="border: 1px dashed #78350f; border-radius: 4px; background: #fffbeb;"></canvas>
          <div>
            <div class="list-item-title">${itemInfo.name}</div>
            <div class="list-item-meta">[${categoryKr}] 수량: ${item.quantity}개 / 획득일: ${new Date(item.acquiredAt).toLocaleDateString()}</div>
          </div>
        </div>
      `;
      listEl.appendChild(card);

      // 스프라이트 캔버스 그리기
      setTimeout(() => {
        const canv = document.getElementById(spriteCanvasId);
        if (canv) {
          const ctx = canv.getContext('2d');
          ctx.clearRect(0,0,32,32);
          Sprites.drawFurniture(ctx, 0, 0, 32, item.itemId);
        }
      }, 0);
    });
  },

  // ========================================================
  // 글로벌 모달 엔진 (커스텀 팝업)
  // ========================================================
  modal: {
    show: function(title, contentHTML, onConfirm = null, showCancel = false) {
      const overlay = document.getElementById('global-modal');
      const titleEl = document.getElementById('modal-title');
      const bodyEl = document.getElementById('modal-body');
      const confirmBtn = document.getElementById('modal-btn-confirm');
      const cancelBtn = document.getElementById('modal-btn-cancel');

      if (!overlay) return;

      titleEl.textContent = title;
      bodyEl.innerHTML = contentHTML;

      // 취소 버튼 노출 여부
      cancelBtn.style.display = showCancel ? 'inline-flex' : 'none';

      // 기존 이벤트 리스너 제거용 복사 클론 생성
      const newConfirm = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

      const newCancel = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

      newConfirm.addEventListener('click', () => {
        overlay.classList.remove('active');
        if (onConfirm) onConfirm();
      });

      newCancel.addEventListener('click', () => {
        overlay.classList.remove('active');
      });

      overlay.classList.add('active');
    },

    alert: function(title, message, onConfirm = null) {
      this.show(title, `<p style="text-align: center; font-size: 1rem; line-height: 1.6;">${message}</p>`, onConfirm, false);
    },

    confirm: function(title, message, onConfirm) {
      this.show(title, `<p style="text-align: center; font-size: 1rem; line-height: 1.6;">${message}</p>`, onConfirm, true);
    }
  }
};

window.App = App;

// 페이지 로드 완료 시 초기화 실행
window.addEventListener('DOMContentLoaded', () => App.init());
