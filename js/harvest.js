// 🏘️ 우리반 마을 - 수확 활동 시스템 (자원 획득 및 결과 이펙트)

const Harvest = {
  // 수확 시도
  attempt: async function(nodeId) {
    try {
      const result = await API.call('harvestNode', {
        nodeId: nodeId,
        studentId: Auth.currentUser.studentId
      });

      if (result && result.success) {
        // 수확 성공 시 쿨다운 즉시 로컬 갱신
        Village.cooldowns[nodeId] = new Date().getTime();
        
        // 보상 표시
        const reward = result.data.reward;
        this.showRewardModal(nodeId, reward);
        
        // 유저 상태(잔액, 인벤토리 등) 동기화
        await Auth.syncState();
      } else {
        // 쿨다운 경고 등 에러 처리
        App.modal.alert("수확 불가 ⏳", result.error || "수확할 수 없는 상태입니다.");
      }
    } catch (e) {
      console.error("수확 요청 에러:", e);
      App.modal.alert("통신 오류", "수확을 시도하는 도중 오류가 발생했습니다.");
    }
  },

  // 수확 보상 팝업창 (픽셀 그래픽 애니메이션 활용)
  showRewardModal: function(nodeId, reward) {
    const nodeName = nodeId === 'node_1' ? '사과나무' : nodeId === 'node_2' ? '꽃밭' : '광산 바위';
    let rewardText = '';
    const canvasId = `reward-sprite-canvas`;

    if (reward.type === 'coin') {
      rewardText = `<span style="font-size:1.25rem; font-weight:800; color:#b45309;">💰 ${reward.amount} 코인</span>을 획득했습니다!`;
    } else {
      rewardText = `<span style="font-size:1.25rem; font-weight:800; color:var(--primary);">📦 ${reward.name} 1개</span>를 획득했습니다!<br>(보관함에 보관되었습니다)`;
    }

    const modalHTML = `
      <div class="reward-anim-container">
        <p style="font-weight:600; color:var(--text-muted);">${nodeName}에서 보물을 찾았습니다!</p>
        <div class="reward-sprite-container">
          <canvas id="${canvasId}" width="48" height="48"></canvas>
        </div>
        <div style="text-align:center; margin-top:8px;">
          ${rewardText}
        </div>
      </div>
    `;

    // 커스텀 모달 호출
    App.modal.show("🎉 수확 성공!", modalHTML, () => {
      // 닫힐 때 맵 렌더링 갱신
      if (window.location.hash === '#village') {
        Village.render();
      }
    });

    // 보상 스프라이트 렌더링
    setTimeout(() => {
      const canv = document.getElementById(canvasId);
      if (canv) {
        const ctx = canv.getContext('2d');
        ctx.clearRect(0,0,48,48);
        if (reward.type === 'coin') {
          // 코인 스프라이트 (노란 원)
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(24, 24, 16, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 16px Outfit';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 24, 24);
        } else {
          // 아이템 스프라이트 그리기
          Sprites.drawFurniture(ctx, 0, 0, 48, reward.itemId);
        }
      }
    }, 50);
  }
};

window.Harvest = Harvest;
