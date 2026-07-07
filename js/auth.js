// 🏘️ 우리반 마을 - 로그인 및 세션 인증 모듈

const Auth = {
  currentUser: null,
  currentState: null, // includes user details, inventory, house, pet

  // 로그인 시도
  login: async function(studentId, pin) {
    try {
      const result = await API.call('login', { studentId, pin });
      if (result && result.success) {
        this.currentUser = result.data;
        localStorage.setItem('village_session_user', JSON.stringify(this.currentUser));
        // 유저 세부 상태도 즉시 패치
        await this.syncState();
        return { success: true };
      } else {
        return { success: false, error: result.error || '로그인 실패' };
      }
    } catch (e) {
      console.error(e);
      return { success: false, error: '서버 통신 오류가 발생했습니다.' };
    }
  },

  // 로그아웃
  logout: function() {
    this.currentUser = null;
    this.currentState = null;
    localStorage.removeItem('village_session_user');
    window.location.hash = '#login';
  },

  // 로컬 세션 확인 및 초기화
  initSession: function() {
    const session = localStorage.getItem('village_session_user');
    if (session) {
      try {
        this.currentUser = JSON.parse(session);
        return true;
      } catch (e) {
        localStorage.removeItem('village_session_user');
      }
    }
    return false;
  },

  // 유저 전체 상태(잔액, 인벤토리, 집) 동기화
  syncState: async function() {
    if (!this.currentUser) return;
    try {
      const result = await API.call('getUserState', { studentId: this.currentUser.studentId });
      if (result && result.success) {
        this.currentState = result.data;
        // 로컬에 저장된 유저 기본정보(예: 역할, 잔액 등)도 업데이트
        this.currentUser = result.data.user;
        localStorage.setItem('village_session_user', JSON.stringify(this.currentUser));
        
        // 잔액 UI가 있다면 업데이트
        this.updateHeaderUI();
      }
    } catch (e) {
      console.error("유저 상태 동기화 실패:", e);
    }
  },

  // 특정 역할 권한 검사
  hasRole: function(allowedRoles) {
    if (!this.currentUser) return false;
    const role = this.currentUser.role;
    if (role === 'teacher') return true; // 교사는 모든 권한 프리패스
    if (typeof allowedRoles === 'string') {
      return role === allowedRoles;
    }
    return allowedRoles.includes(role);
  },

  // 글로벌 헤더 유저 정보 업데이트
  updateHeaderUI: function() {
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const balEl = document.getElementById('header-user-balance');
    const headerEl = document.getElementById('main-header');

    if (this.currentUser) {
      if (headerEl) headerEl.style.display = 'flex';
      if (nameEl) nameEl.textContent = this.currentUser.name;
      if (roleEl) {
        const roleInfo = CONFIG.ROLES[this.currentUser.role] || { name: '주민', color: '#6b7280' };
        roleEl.textContent = roleInfo.name;
        roleEl.style.backgroundColor = roleInfo.color;
      }
      if (balEl) {
        balEl.textContent = Number(this.currentUser.balance || 0).toLocaleString();
      }
      
      // 관리자 권한 여부에 따라 헤더의 관리자 버튼 제어
      const adminNavBtn = document.getElementById('nav-admin');
      if (adminNavBtn) {
        const isManager = this.hasRole(['teacher', 'salary_manager', 'market_manager', 'police', 'tax_manager']);
        adminNavBtn.style.display = isManager ? 'inline-flex' : 'none';
      }
    } else {
      if (headerEl) headerEl.style.display = 'none';
    }
  }
};

window.Auth = Auth;
