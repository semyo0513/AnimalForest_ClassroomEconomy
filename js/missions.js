// 🏘️ 우리반 마을 - 미션 시스템 (일일/돌발 과제 해결판)

const Missions = {
  list: [],

  init: async function() {
    await this.loadMissions();
    this.render();
  },

  // 미션 목록 로드 (내 완료 상태 포함)
  loadMissions: async function() {
    try {
      const result = await API.call('getMissions', { studentId: Auth.currentUser.studentId });
      if (result && result.success) {
        this.list = result.data || [];
      }
    } catch (e) {
      console.error("미션 목록 로드 실패:", e);
    }
  },

  // 미션 화면 렌더링
  render: function() {
    const listEl = document.getElementById('missions-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (this.list.length === 0) {
      listEl.innerHTML = '<div class="text-muted text-center py-8">진행 중인 미션이 없습니다.</div>';
      return;
    }

    this.list.forEach(mission => {
      const card = document.createElement('div');
      card.className = `list-item ${mission.isCompletedByMe ? 'pinned' : ''}`;

      const btnHTML = mission.isCompletedByMe
        ? `<span class="badge" style="background:#d1fae5; color:#065f46; border-color:#34d399;">✓ 완료됨</span>`
        : `<button class="btn btn-sm btn-accent" onclick="Missions.complete('${mission.missionId}')">완료하기</button>`;

      card.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:4px; max-width: 70%;">
          <div class="list-item-title" style="${mission.isCompletedByMe ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
            ${mission.content}
          </div>
          <div class="list-item-meta" style="color:#b45309; font-weight:600;">
            🎁 보상: ${Number(mission.reward).toLocaleString()} 코인
          </div>
        </div>
        <div>
          ${btnHTML}
        </div>
      `;
      listEl.appendChild(card);
    });
  },

  // 미션 완료 보고 처리
  complete: async function(missionId) {
    const mission = this.list.find(m => m.missionId === missionId);
    if (!mission) return;

    App.modal.confirm(
      "🎯 미션 완료 확인",
      `<b>"${mission.content}"</b> 미션을 정말 완료하셨나요?<br>보고 후 즉시 <b>${mission.reward} 코인</b>이 지급됩니다.`,
      async () => {
        const result = await API.call('completeMission', {
          missionId: missionId,
          studentId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("축하합니다! 🎉", `미션을 완료하여 <b>${result.data.reward} 코인</b>을 받았습니다!`);
          await Auth.syncState(); // 코인 업데이트
          await this.loadMissions(); // 미션 목록 갱신
          this.render();
        } else {
          App.modal.alert("완료 실패 ❌", result.error || "오류가 발생했습니다.");
        }
      }
    );
  }
};

window.Missions = Missions;
