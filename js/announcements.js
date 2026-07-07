// 🏘️ 우리반 마을 - 공지사항 시스템 (마일리지 알림 및 보드 공유)

const Announcements = {
  list: [],

  init: async function() {
    this.bindEvents();
    await this.loadAnnouncements();
    this.render();
  },

  loadAnnouncements: async function() {
    try {
      const result = await API.call('getAnnouncements');
      if (result && result.success) {
        this.list = result.data || [];
      }
    } catch (e) {
      console.error("공지사항 로드 실패:", e);
    }
  },

  bindEvents: function() {
    // 선생님 전용 작성 패널 표출 제어
    const teacherPanel = document.getElementById('ann-teacher-panel');
    if (teacherPanel) {
      const isTeacher = Auth.hasRole('teacher');
      teacherPanel.style.display = isTeacher ? 'block' : 'none';
      if (isTeacher) {
        this.bindTeacherEvents();
      }
    }
  },

  bindTeacherEvents: function() {
    const form = document.getElementById('ann-form-post');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('ann-input-title').value;
        const content = document.getElementById('ann-input-content').value;
        const isPinned = document.getElementById('ann-input-pinned').checked;

        const result = await API.call('postAnnouncement', {
          title,
          content,
          isPinned: isPinned ? 'true' : 'false',
          requesterId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("작성 완료", "새로운 공지사항을 성공적으로 등록했습니다!");
          form.reset();
          await this.loadAnnouncements();
          this.render();
        } else {
          App.modal.alert("작성 실패", result.error || "오류가 발생했습니다.");
        }
      };
    }
  },

  render: function() {
    const listEl = document.getElementById('announcements-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (this.list.length === 0) {
      listEl.innerHTML = '<div class="text-muted text-center py-8">등록된 공지사항이 없습니다.</div>';
      return;
    }

    this.list.forEach(ann => {
      const item = document.createElement('div');
      const isPinned = ann.isPinned === 'true' || ann.isPinned === true;
      item.className = `list-item ${isPinned ? 'pinned' : ''}`;
      
      const pinBadge = isPinned ? `<span class="badge" style="background:#fef08a; color:#854d0e; border-color:#eab308; margin-right:8px;">📌 중요</span>` : '';

      item.innerHTML = `
        <div style="width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="list-item-title" style="font-size:1.05rem;">
              ${pinBadge}${ann.title}
            </span>
            <span class="list-item-meta">
              ${new Date(ann.createdAt).toLocaleDateString()} ${new Date(ann.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          <p style="margin-top:8px; white-space:pre-wrap; line-height:1.5; color:var(--text-main); font-size:0.95rem;">${ann.content}</p>
          <div class="list-item-meta" style="margin-top:6px; text-align:right;">
            작성자: ${ann.author === 'teacher' ? '선생님' : ann.author}
          </div>
        </div>
      `;
      listEl.appendChild(item);
    });
  },

  // 마을 진입 시 중요한(Pinned) 공지가 있으면 팝업 알림 (세션당 1회 등 방지 없이 일단 최신 핀 항목 노출)
  checkPinnedPopup: function() {
    const latestPinned = this.list.find(ann => ann.isPinned === 'true' || ann.isPinned === true);
    if (latestPinned) {
      // 로컬 스토리지에 이미 본 최신 핀인지 확인하여 중복 팝업 방지
      const lastSeenId = localStorage.getItem('last_seen_ann_id');
      if (lastSeenId !== latestPinned.announcementId) {
        App.modal.show(
          `📢 중요 공지: ${latestPinned.title}`,
          `<p style="font-size:1rem; line-height:1.6; white-space:pre-wrap;">${latestPinned.content}</p>`,
          () => {
            localStorage.setItem('last_seen_ann_id', latestPinned.announcementId);
          }
        );
      }
    }
  }
};

window.Announcements = Announcements;
