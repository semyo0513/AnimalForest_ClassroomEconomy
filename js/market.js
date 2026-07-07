// 🏘️ 우리반 마을 - 마켓 시스템 (쇼핑몰 및 가구 매대 관리)

const Market = {
  items: [],
  currentCategory: 'all',

  init: async function() {
    this.currentCategory = 'all';
    this.bindEvents();
    await this.loadItems();
    this.render();
  },

  // 아이템 전체 목록 조회
  loadItems: async function() {
    try {
      const result = await API.call('getMarketItems');
      if (result && result.success) {
        this.items = result.data || [];
      }
    } catch (e) {
      console.error("아이템 목록 로드 실패:", e);
    }
  },

  // 이벤트 바인딩
  bindEvents: function() {
    // 카테고리 탭 클릭 이벤트 바인딩
    const tabs = document.querySelectorAll('.market-category-tab');
    tabs.forEach(tab => {
      tab.onclick = (e) => {
        tabs.forEach(t => t.classList.remove('btn-primary'));
        tab.classList.add('btn-primary');
        this.currentCategory = tab.dataset.category;
        this.render();
      };
    });

    // 마켓 관리자 패널 버튼 제어
    const managerPanel = document.getElementById('market-manager-panel');
    if (managerPanel) {
      const isManager = Auth.hasRole(['teacher', 'market_manager']);
      managerPanel.style.display = isManager ? 'block' : 'none';
      if (isManager) {
        this.bindManagerEvents();
      }
    }
  },

  // 마켓 아이템 목록 렌더링
  render: function() {
    const grid = document.getElementById('market-item-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = this.items.filter(item => {
      if (this.currentCategory === 'all') return true;
      return item.category === this.currentCategory;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="text-muted text-center py-8" style="grid-column: 1/-1;">해당 카테고리에 등록된 상품이 없습니다.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      
      const stockText = Number(item.stock) > 0 ? `재고: ${item.stock}개` : '<span style="color:var(--danger)">품절</span>';
      
      // 스프라이트를 그릴 고유한 ID 생성
      const canvasId = `market-sprite-${item.itemId}`;

      card.innerHTML = `
        <div class="item-sprite-box">
          <canvas id="${canvasId}" width="48" height="48" style="background:#fffbeb; border-radius:4px;"></canvas>
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">💰 ${Number(item.price).toLocaleString()} 코인</div>
        <div class="item-stock">${stockText}</div>
        <button class="btn btn-sm ${Number(item.stock) > 0 ? 'btn-accent' : ''}" 
                onclick="Market.purchase('${item.itemId}')" 
                ${Number(item.stock) <= 0 ? 'disabled' : ''}>
          구매하기
        </button>
      `;
      grid.appendChild(card);

      // 스프라이트 렌더링
      setTimeout(() => {
        const canv = document.getElementById(canvasId);
        if (canv) {
          const ctx = canv.getContext('2d');
          ctx.clearRect(0,0,48,48);
          Sprites.drawFurniture(ctx, 0, 0, 48, item.itemId);
        }
      }, 0);
    });
  },

  // 구매 처리
  purchase: async function(itemId) {
    const item = this.items.find(i => i.itemId === itemId);
    if (!item) return;

    // 수량 입력 유도
    const maxQty = Math.min(Number(item.stock), 99);
    
    App.modal.show(
      `🛍️ 상품 구매: ${item.name}`,
      `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <p>💰 가격: ${Number(item.price).toLocaleString()} 코인 (현재 재고: ${item.stock}개)</p>
        <div class="form-group">
          <label>구매 수량</label>
          <input type="number" id="purchase-qty" class="form-input" value="1" min="1" max="${maxQty}">
        </div>
      </div>
      `,
      async () => {
        const qtyEl = document.getElementById('purchase-qty');
        const qty = parseInt(qtyEl.value, 10);

        if (isNaN(qty) || qty <= 0 || qty > maxQty) {
          App.modal.alert("구매 실패", "유효한 수량을 입력하세요.");
          return;
        }

        const result = await API.call('purchaseItem', {
          studentId: Auth.currentUser.studentId,
          itemId: itemId,
          quantity: qty
        });

        if (result && result.success) {
          App.modal.alert("구매 성공 🎉", `${item.name} ${qty}개를 성공적으로 구매했습니다!`);
          await Auth.syncState(); // 잔액 최신화
          await this.loadItems();  // 카탈로그 최신화
          this.render();
          
          // 관리자 탭도 열려있으면 목록 리프레시
          if (Auth.hasRole(['teacher', 'market_manager'])) {
            this.renderManagerTable();
          }
        } else {
          App.modal.alert("구매 실패 ❌", result.error || "오류가 발생했습니다.");
        }
      },
      true
    );
  },

  // ========================================================
  // 관리자 패널 관련 기능
  // ========================================================
  bindManagerEvents: function() {
    this.renderManagerTable();

    // 상품 등록 폼 리셋 버튼
    const resetBtn = document.getElementById('market-btn-form-reset');
    if (resetBtn) {
      resetBtn.onclick = () => this.resetForm();
    }

    // 상품 등록/수정 전송
    const form = document.getElementById('market-form-item');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        
        const itemId = document.getElementById('market-input-id').value;
        const name = document.getElementById('market-input-name').value;
        const category = document.getElementById('market-input-category').value;
        const price = document.getElementById('market-input-price').value;
        const stock = document.getElementById('market-input-stock').value;

        const result = await API.call('upsertMarketItem', {
          itemId: itemId || '', // 비어있으면 백엔드에서 신규 생성
          name,
          category,
          price,
          stock,
          requesterId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("완료", "상품이 성공적으로 저장되었습니다.");
          this.resetForm();
          await this.loadItems();
          this.render();
          this.renderManagerTable();
        } else {
          App.modal.alert("오류", result.error || "상품 저장 실패");
        }
      };
    }
  },

  // 관리자 상품 목록 표 출력
  renderManagerTable: function() {
    const tbody = document.getElementById('market-tbody-items');
    if (!tbody) return;
    tbody.innerHTML = '';

    this.items.forEach(item => {
      const tr = document.createElement('tr');
      const categoryKr = CONFIG.CATEGORIES[item.category] || '기타';
      
      tr.innerHTML = `
        <td><b>${item.itemId}</b></td>
        <td>${item.name}</td>
        <td>${categoryKr}</td>
        <td>${Number(item.price).toLocaleString()} 코인</td>
        <td>${item.stock}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="Market.editItem('${item.itemId}')">수정</button>
          <button class="btn btn-sm btn-danger" onclick="Market.deleteItem('${item.itemId}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  // 상품 수정폼 바인딩
  editItem: function(itemId) {
    const item = this.items.find(i => i.itemId === itemId);
    if (!item) return;

    document.getElementById('market-input-id').value = item.itemId;
    document.getElementById('market-input-name').value = item.name;
    document.getElementById('market-input-category').value = item.category;
    document.getElementById('market-input-price').value = item.price;
    document.getElementById('market-input-stock').value = item.stock;
    
    // 버튼 라벨 변경
    const submitBtn = document.querySelector('#market-form-item button[type="submit"]');
    if (submitBtn) submitBtn.textContent = '상품 정보 수정하기';
  },

  // 상품 삭제
  deleteItem: function(itemId) {
    const item = this.items.find(i => i.itemId === itemId);
    if (!item) return;

    App.modal.confirm(
      "🗑️ 상품 삭제 확인",
      `정말로 <b>${item.name}</b> 상품을 영구 삭제하시겠습니까?`,
      async () => {
        const result = await API.call('deleteMarketItem', {
          itemId,
          requesterId: Auth.currentUser.studentId
        });

        if (result && result.success) {
          App.modal.alert("완료", "상품이 삭제되었습니다.");
          await this.loadItems();
          this.render();
          this.renderManagerTable();
        } else {
          App.modal.alert("오류", result.error || "삭제 실패");
        }
      }
    );
  },

  resetForm: function() {
    document.getElementById('market-input-id').value = '';
    document.getElementById('market-input-name').value = '';
    document.getElementById('market-input-category').value = 'furniture';
    document.getElementById('market-input-price').value = '100';
    document.getElementById('market-input-stock').value = '10';

    const submitBtn = document.querySelector('#market-form-item button[type="submit"]');
    if (submitBtn) submitBtn.textContent = '신규 상품 등록하기';
  }
};

window.Market = Market;
