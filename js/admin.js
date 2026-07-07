// 🏘️ 우리반 마을 - 관리자 패널 시스템 (역할별 권한 제어 및 공무 집행)

const Admin = {
  usersList: [],
  activeTab: 'salary',

  init: async function() {
    this.activeTab = 'salary';
    this.bindEvents();
    await this.loadUsers();
    this.renderTabsVisibility();
    this.switchTab(this.activeTab);
  },

  // 모든 학생 목록 가져오기 (교사용)
  loadUsers: async function() {
    try {
      // 교사가 아니어도 학생 등록/급여/세금 등을 위해 학생 목록이 필요하므로,
      // 백엔드는 getUsers에 requesterId를 받아 검사함.
      // teacher 권한이 있으면 전체 리스트를 불러오고,
      // 교사 아닌 국세청장/월급담당관 등은 본인의 API 권한 실행 시 studentId 리스트가 필요함.
      // 여기서는 UI의 체크박스 구성을 위해 목록 요청 시, 만약 교사가 아니라면 일반 목록 호출이 막힐 수 있음.
      // GAS Code.gs 의 getUsers는 requesterId가 'teacher' 권한이어야 작동함.
      // 따라서 교사가 아닐 때는 fallback으로 로컬 mock을 뒤지거나 기본 student 목록을 맵핑.
      
      const result = await API.call('getUsers', { requesterId: Auth.currentUser.studentId });
      if (result && result.success) {
        this.usersList = result.data || [];
      } else {
        // 교사가 아니라서 리스트 조회가 거부된 경우, 로컬 데이터나 현재 village map상의 유저정보로 우회
        console.warn("전체 사용자 목록 조회 실패(권한 부족). 맵 주민 정보로 갱신합니다.");
        const mapRes = await API.call('getVillageMap');
        if (mapRes && mapRes.success) {
          // 주민들 목록 수집 (단일 사용자 징수/지급용)
          this.usersList = mapRes.data.villagers.map(v => ({
            studentId: v.studentId,
            name: v.name,
            role: 'student',
            balance: 0
          }));
        }
      }
    } catch (e) {
      console.error("사용자 로드 실패:", e);
    }
  },

  // 탭 노출 여부 결정 (역할에 맞는 탭만 노출)
  renderTabsVisibility: function() {
    const isTeacher = Auth.hasRole('teacher');
    const isSalary = Auth.hasRole(['teacher', 'salary_manager']);
    const isTax = Auth.hasRole(['teacher', 'tax_manager']);
    const isPolice = Auth.hasRole(['teacher', 'police']);

    document.getElementById('admin-tab-salary').style.display = isSalary ? 'block' : 'none';
    document.getElementById('admin-tab-tax').style.display = isTax ? 'block' : 'none';
    document.getElementById('admin-tab-penalty').style.display = isPolice ? 'block' : 'none';
    
    // 교사 전용 탭들
    document.getElementById('admin-tab-register').style.display = isTeacher ? 'block' : 'none';
    document.getElementById('admin-tab-roles').style.display = isTeacher ? 'block' : 'none';
    document.getElementById('admin-tab-mission').style.display = isTeacher ? 'block' : 'none';

    // 기본 활성 탭 자동 조절 (권한이 없는 탭인 경우 노출되는 첫 탭 활성화)
    if (isSalary) this.activeTab = 'salary';
    else if (isTax) this.activeTab = 'tax';
    else if (isPolice) this.activeTab = 'penalty';
    else this.activeTab = 'audit';
  },

  // 이벤트 바인딩
  bindEvents: function() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      };
    });

    // 1. 급여 지급 폼 전송
    const salaryForm = document.getElementById('admin-form-salary');
    if (salaryForm) {
      salaryForm.onsubmit = async (e) => {
        e.preventDefault();
        const selectedIds = this.getSelectedCheckboxes('salary-user-checkbox');
        const amount = document.getElementById('admin-salary-amount').value;
        const reason = document.getElementById('admin-salary-reason').value;

        if (selectedIds.length === 0) {
          App.modal.alert("지급 실패", "월급을 받을 학생을 한 명 이상 선택하세요.");
          return;
        }

        const result = await API.call('paySalary', {
          targetStudentIds: selectedIds.join(','),
          amount,
          reason,
          requesterId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("지급 완료 🎉", "선택된 주민들에게 성공적으로 월급이 입금되었습니다!");
          salaryForm.reset();
          await this.loadUsers();
          this.switchTab('salary');
        } else {
          App.modal.alert("지급 실패 ❌", result.error || "오류 발생");
        }
      };
    }

    // 2. 세금 징수 폼 전송
    const taxForm = document.getElementById('admin-form-tax');
    if (taxForm) {
      taxForm.onsubmit = async (e) => {
        e.preventDefault();
        const selectedIds = this.getSelectedCheckboxes('tax-user-checkbox');
        const amount = document.getElementById('admin-tax-amount').value;
        const reason = document.getElementById('admin-tax-reason').value;

        if (selectedIds.length === 0) {
          App.modal.alert("징수 실패", "세금을 징수할 학생을 한 명 이상 선택하세요.");
          return;
        }

        App.modal.confirm(
          "세금 강제 징수",
          `선택된 주민 ${selectedIds.length}명에게 각 ${amount} 코인의 세금을 거두시겠습니까?`,
          async () => {
            const result = await API.call('collectTax', {
              targetStudentIds: selectedIds.join(','),
              amount,
              reason,
              requesterId: Auth.currentUser.studentId
            });

            if (result && result.success) {
              let msg = "세금 징수가 완료되었습니다.<br>";
              result.data.forEach(r => {
                msg += `<br>• ${r.studentId}: ${r.success ? '성공 (잔액: ' + r.newBalance + ')' : '실패 (' + r.error + ')'}`;
              });
              App.modal.alert("징수 결과 보고", msg);
              taxForm.reset();
              await this.loadUsers();
              this.switchTab('tax');
            } else {
              App.modal.alert("징수 실패 ❌", result.error || "오류 발생");
            }
          }
        );
      };
    }

    // 3. 벌금 부과 폼 전송
    const penaltyForm = document.getElementById('admin-form-penalty');
    if (penaltyForm) {
      penaltyForm.onsubmit = async (e) => {
        e.preventDefault();
        const targetId = document.getElementById('admin-penalty-user').value;
        const amount = document.getElementById('admin-penalty-amount').value;
        const reason = document.getElementById('admin-penalty-reason').value;

        if (!targetId) {
          App.modal.alert("벌금 실패", "벌금을 부과할 대상을 선택하세요.");
          return;
        }

        App.modal.confirm(
          "경찰 딱지 부과",
          `학번 ${targetId} 주민에게 벌금 ${amount} 코인을 부과하시겠습니까?`,
          async () => {
            const result = await API.call('issuePenalty', {
              targetStudentId: targetId,
              amount,
              reason,
              requesterId: Auth.currentUser.studentId
            });

            if (result && result.success) {
              App.modal.alert("딱지 부과 성공 👮", `성공적으로 고지서가 전달되었습니다. (남은 잔액: ${result.data.newBalance})`);
              penaltyForm.reset();
              await this.loadUsers();
              this.switchTab('penalty');
            } else {
              App.modal.alert("벌금 실패 ❌", result.error || "오류 발생");
            }
          }
        );
      };
    }

    // 4. 신규 학생 등록 폼 전송
    const registerForm = document.getElementById('admin-form-register');
    if (registerForm) {
      registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('admin-reg-id').value;
        const name = document.getElementById('admin-reg-name').value;
        const pin = document.getElementById('admin-reg-pin').value;

        const result = await API.call('registerStudent', {
          studentId,
          name,
          pin,
          requesterId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("등록 성공 🏡", `이름: ${name} (ID: ${studentId}) 주민이 마을에 입주하였습니다!`);
          registerForm.reset();
          await this.loadUsers();
          this.switchTab('register');
        } else {
          App.modal.alert("입주 실패 ❌", result.error || "오류 발생");
        }
      };
    }

    // 5. 미션 생성 폼 전송
    const missionForm = document.getElementById('admin-form-mission');
    if (missionForm) {
      missionForm.onsubmit = async (e) => {
        e.preventDefault();
        const content = document.getElementById('admin-mis-content').value;
        const reward = document.getElementById('admin-mis-reward').value;
        const target = document.getElementById('admin-mis-target').value;

        const result = await API.call('createMission', {
          content,
          reward,
          target,
          requesterId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("생성 성공 🎯", `새 미션 [${content}] 등록되었습니다!`);
          missionForm.reset();
          this.switchTab('mission');
        } else {
          App.modal.alert("생성 실패 ❌", result.error || "오류 발생");
        }
      };
    }
    
    // 6. 감사/거래 오딧 조회 학생 선택 변경 시
    const auditSelect = document.getElementById('admin-audit-user-select');
    if (auditSelect) {
      auditSelect.onchange = () => this.loadAuditTransactions();
    }
  },

  // 체크박스 선택항목 수집 헬퍼
  getSelectedCheckboxes: function(className) {
    const checkboxes = document.querySelectorAll(`.${className}:checked`);
    const ids = [];
    checkboxes.forEach(cb => {
      ids.push(cb.value);
    });
    return ids;
  },

  // 탭 전환
  switchTab: function(tabName) {
    this.activeTab = tabName;
    
    // 탭 버튼 active 클래스 제어
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // 탭 컨텐츠 활성화
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => {
      if (c.id === `admin-panel-${tabName}`) c.classList.add('active');
      else c.classList.remove('active');
    });

    // 탭 전환 시 필요한 데이터 리로드 및 렌더링
    this.renderTabContent(tabName);
  },

  // 각 탭 콘텐츠 렌더링
  renderTabContent: function(tabName) {
    switch (tabName) {
      case 'salary':
        this.renderUserChecklist('admin-salary-checklist', 'salary-user-checkbox');
        break;
      case 'tax':
        this.renderUserChecklist('admin-tax-checklist', 'tax-user-checkbox');
        break;
      case 'penalty':
        this.renderUserDropdown('admin-penalty-user');
        break;
      case 'register':
        // 특별히 렌더링할 동적 데이터 없음
        break;
      case 'roles':
        this.renderRolesTable();
        break;
      case 'mission':
        // 특별한 동적 폼 없음
        break;
      case 'audit':
        this.renderUserDropdown('admin-audit-user-select');
        this.loadAuditTransactions();
        break;
    }
  },

  // 1. 체크박스 체크리스트 출력 (급여/세금 대량 선택용)
  renderUserChecklist: function(containerId, checkboxClassName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // 선생님 계정 제외
    const studentsOnly = this.usersList.filter(u => u.studentId !== 'teacher');

    if (studentsOnly.length === 0) {
      container.innerHTML = '<div class="text-muted">등록된 학생 주민이 없습니다.</div>';
      return;
    }

    studentsOnly.forEach(student => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.padding = '6px';
      label.style.border = '1px solid #e2e8f0';
      label.style.borderRadius = '6px';
      label.style.cursor = 'pointer';

      const roleKr = CONFIG.ROLES[student.role]?.name || '주민';

      label.innerHTML = `
        <input type="checkbox" class="${checkboxClassName}" value="${student.studentId}">
        <div>
          <b>${student.name}</b> (${student.studentId})
          <span style="font-size:0.8rem; padding:1px 6px; background:#f1f5f9; border-radius:4px; margin-left:4px;">${roleKr}</span>
          <span style="font-size:0.8rem; color:#b45309; font-weight:600;">💰 ${Number(student.balance || 0).toLocaleString()} 코인</span>
        </div>
      `;
      container.appendChild(label);
    });
  },

  // 2. 단일 학생 선택 드롭다운 렌더링 (경찰 벌금 및 오딧용)
  renderUserDropdown: function(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">-- 학생 선택 --</option>';

    // 선생님 제외
    const studentsOnly = this.usersList.filter(u => u.studentId !== 'teacher');
    
    studentsOnly.forEach(student => {
      const opt = document.createElement('option');
      opt.value = student.studentId;
      opt.textContent = `${student.name} (${student.studentId}) - ${Number(student.balance || 0).toLocaleString()} 코인`;
      select.appendChild(opt);
    });
  },

  // 3. 교사전용 사용자 역할 지정 표 출력
  renderRolesTable: function() {
    const tbody = document.getElementById('admin-tbody-roles');
    if (!tbody) return;
    tbody.innerHTML = '';

    this.usersList.forEach(student => {
      // 선생님 본인은 역할 수정 불가 처리
      const isTeacherSelf = student.studentId === 'teacher';
      
      const tr = document.createElement('tr');
      
      let selectHTML = '';
      if (isTeacherSelf) {
        selectHTML = '선생님 (최고관리자)';
      } else {
        selectHTML = `
          <select class="form-input" style="padding:4px 8px; font-size:0.85rem;" onchange="Admin.changeRole('${student.studentId}', this.value)">
            <option value="student" ${student.role === 'student' ? 'selected' : ''}>주민 (일반)</option>
            <option value="salary_manager" ${student.role === 'salary_manager' ? 'selected' : ''}>월급담당관</option>
            <option value="market_manager" ${student.role === 'market_manager' ? 'selected' : ''}>마켓운영자</option>
            <option value="police" ${student.role === 'police' ? 'selected' : ''}>경찰</option>
            <option value="tax_manager" ${student.role === 'tax_manager' ? 'selected' : ''}>국세청장</option>
            <option value="teacher" ${student.role === 'teacher' ? 'selected' : ''}>선생님</option>
          </select>
        `;
      }

      tr.innerHTML = `
        <td><b>${student.studentId}</b></td>
        <td>${student.name}</td>
        <td>💰 ${Number(student.balance || 0).toLocaleString()}</td>
        <td>${selectHTML}</td>
      `;
      tbody.appendChild(tr);
    });
  },

  // 교사: 즉각 역할 변경 호출
  changeRole: async function(studentId, newRole) {
    const result = await API.call('updateUserRole', {
      targetStudentId: studentId,
      newRole: newRole,
      requesterId: Auth.currentUser.studentId
    });

    if (result && result.success) {
      App.modal.alert("역할 변경 완료", `학번 ${studentId} 주민의 역할이 성공적으로 변경되었습니다.`);
      await this.loadUsers();
      this.renderRolesTable();
    } else {
      App.modal.alert("권한 오류", result.error || "오류 발생");
    }
  },

  // 4. 감사 오딧 최근 내역 로드
  loadAuditTransactions: async function() {
    const targetId = document.getElementById('admin-audit-user-select')?.value;
    const tbody = document.getElementById('admin-tbody-audit');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!targetId) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">주민을 선택하면 거래 내역이 감사됩니다.</td></tr>';
      return;
    }

    try {
      const result = await API.call('getTransactions', { studentId: targetId });
      if (result && result.success) {
        const txs = result.data || [];
        if (txs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">거래 기록이 존재하지 않습니다.</td></tr>';
          return;
        }

        const typeMap = {
          salary: '<span style="color:#059669; font-weight:bold;">월급입금</span>',
          tax: '<span style="color:#7c3aed; font-weight:bold;">세금징수</span>',
          penalty: '<span style="color:#dc2626; font-weight:bold;">벌금부과</span>',
          purchase: '<span style="color:#ea580c; font-weight:bold;">마켓구매</span>',
          harvest: '<span style="color:#ca8a04; font-weight:bold;">수확보상</span>',
          mission: '<span style="color:#2563eb; font-weight:bold;">미션수령</span>'
        };

        txs.forEach(tx => {
          const tr = document.createElement('tr');
          const dateStr = new Date(tx.timestamp).toLocaleString();
          
          tr.innerHTML = `
            <td style="font-size:0.8rem; color:var(--text-muted)">${tx.txId.substring(0,8)}...</td>
            <td>${typeMap[tx.type] || tx.type}</td>
            <td><b>${Number(tx.amount).toLocaleString()}</b></td>
            <td>${tx.reason}</td>
            <td>${tx.processedBy || '시스템'}</td>
            <td style="font-size:0.8rem; color:var(--text-muted)">${dateStr}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch(e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">기록 조회 오류</td></tr>';
    }
  }
};

window.Admin = Admin;
