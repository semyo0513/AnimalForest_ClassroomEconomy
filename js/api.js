// 🏘️ 우리반 마을 - API 클라이언트 (GAS 통신 및 로컬 모크 폴백)

const API = {
  // 로딩 오버레이 제어
  showLoading: function() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('active');
  },
  hideLoading: function() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.remove('active');
  },

  // API 호출 메인 함수
  call: async function(action, params = {}) {
    this.showLoading();
    
    // GAS URL이 설정되어 있으면 실제 요청을 보냄
    if (CONFIG.GAS_URL && CONFIG.GAS_URL.trim() !== "") {
      try {
        const queryParams = new URLSearchParams({ action, ...params });
        const response = await fetch(`${CONFIG.GAS_URL}?${queryParams.toString()}`, {
          method: 'GET',
          mode: 'cors'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        this.hideLoading();
        return result;
      } catch (error) {
        console.error("API Call Failed, falling back to Local Mock:", error);
        this.hideLoading();
        // 실제 에러가 나면 경고 후 로컬 데이터로 대체할지 결정
        alert(`백엔드 통신 실패: ${error.message}\n로컬 데모 모드로 임시 진행합니다.`);
        return this.mockCall(action, params);
      }
    } else {
      // GAS URL이 없으면 즉시 로컬 모크 DB로 실행
      this.hideLoading();
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.mockCall(action, params));
        }, 300); // 실제 API 느낌의 짧은 딜레이
      });
    }
  },

  // ========================================================
  // 로컬 시뮬레이터 (Mock Database) - 브라우저 localStorage 사용
  // ========================================================
  mockDb: {
    get: function(table) {
      const data = localStorage.getItem(`village_mock_${table}`);
      return data ? JSON.parse(data) : null;
    },
    set: function(table, data) {
      localStorage.setItem(`village_mock_${table}`, JSON.stringify(data));
    },
    init: function() {
      // 1. Users
      if (!this.get('Users')) {
        this.set('Users', [
          { studentId: 'teacher', name: '선생님', pin: '0000', role: 'teacher', balance: 999999, avatarConfig: '{"skin":"#ffedd5","hair":"#ec4899","eyes":"#1e3a8a","gender":"female"}', petId: '', lastLogin: new Date().toISOString() },
          { studentId: 'student1', name: '동석', pin: '1234', role: 'student', balance: 500, avatarConfig: '{"skin":"#ffedd5","hair":"#3b82f6","eyes":"#1e293b","gender":"male"}', petId: '', lastLogin: new Date().toISOString() },
          { studentId: 'student2', name: '예리', pin: '1234', role: 'student', balance: 1200, avatarConfig: '{"skin":"#ffedd5","hair":"#f59e0b","eyes":"#0f766e","gender":"female"}', petId: '', lastLogin: new Date().toISOString() }
        ]);
      }
      // 2. Houses
      if (!this.get('Houses')) {
        this.set('Houses', [
          { studentId: 'teacher', layoutData: '[]', wallThemeId: 'wall_default', floorThemeId: 'floor_default', bulletinMemo: '선생님의 방입니다! 즐거운 학급 경제 활동 하세요!' },
          { studentId: 'student1', layoutData: '[{"itemId":"item_bed","x":1,"y":1},{"itemId":"item_chair","x":4,"y":3}]', wallThemeId: 'wall_blue', floorThemeId: 'floor_wood', bulletinMemo: '내 방에 온 걸 환영해!' },
          { studentId: 'student2', layoutData: '[{"itemId":"item_desk","x":3,"y":2},{"itemId":"item_chair","x":3,"y":3},{"itemId":"item_plant","x":1,"y":1}]', wallThemeId: 'wall_pink', floorThemeId: 'floor_carpet', bulletinMemo: '방명록 남겨줘~' }
        ]);
      }
      // 3. MarketItems
      if (!this.get('MarketItems')) {
        this.set('MarketItems', [
          { itemId: 'item_desk', name: '나무 책상', category: 'furniture', price: 100, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_chair', name: '나무 의자', category: 'furniture', price: 60, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_bookshelf', name: '책장', category: 'furniture', price: 200, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_lamp', name: '탁상 램프', category: 'furniture', price: 80, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_rug', name: '동그란 러그', category: 'furniture', price: 120, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_plant', name: '화분', category: 'furniture', price: 50, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_bed', name: '침대', category: 'furniture', price: 300, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'wall_blue', name: '파란 벽지', category: 'wallpaper', price: 150, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'wall_pink', name: '분홍 벽지', category: 'wallpaper', price: 150, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'wall_green', name: '초록 벽지', category: 'wallpaper', price: 150, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'wall_wood', name: '나무 벽지', category: 'wallpaper', price: 200, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'floor_wood', name: '나무 바닥', category: 'flooring', price: 180, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'floor_tile', name: '타일 바닥', category: 'flooring', price: 180, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'floor_carpet', name: '카펫 바닥', category: 'flooring', price: 160, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: new Date().toISOString() },
          { itemId: 'item_apple', name: '사과', category: 'harvest', price: 30, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: new Date().toISOString() },
          { itemId: 'item_flower', name: '꽃', category: 'harvest', price: 25, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: new Date().toISOString() },
          { itemId: 'item_wood', name: '나무', category: 'harvest', price: 20, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: new Date().toISOString() },
          { itemId: 'item_stone', name: '돌', category: 'harvest', price: 15, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: new Date().toISOString() }
        ]);
      }
      // 4. Inventory
      if (!this.get('Inventory')) {
        this.set('Inventory', [
          { studentId: 'student1', itemId: 'item_desk', quantity: 1, source: 'purchase', acquiredAt: new Date().toISOString() },
          { studentId: 'student1', itemId: 'item_apple', quantity: 3, source: 'harvest', acquiredAt: new Date().toISOString() },
          { studentId: 'student2', itemId: 'item_rug', quantity: 1, source: 'purchase', acquiredAt: new Date().toISOString() }
        ]);
      }
      // 5. Transactions
      if (!this.get('Transactions')) {
        this.set('Transactions', [
          { txId: 'tx_init1', studentId: 'student1', type: 'salary', amount: 500, processedBy: 'teacher', reason: '기본 용돈 지급', timestamp: new Date().toISOString() },
          { txId: 'tx_init2', studentId: 'student2', type: 'salary', amount: 1200, processedBy: 'teacher', reason: '반장 월급 지급', timestamp: new Date().toISOString() }
        ]);
      }
      // 6. Announcements
      if (!this.get('Announcements')) {
        this.set('Announcements', [
          { announcementId: 'ann1', title: '🏘️ 우리반 마을 개장!', content: '마을에 오신 여러분 환영합니다! 오늘부터 열심히 코인을 모으고 집을 꾸며보세요!', author: 'teacher', createdAt: new Date().toISOString(), isPinned: 'true' }
        ]);
      }
      // 7. Missions
      if (!this.get('Missions')) {
        this.set('Missions', [
          { missionId: 'mis1', content: '마을 수확물 3회 채집하기', reward: 100, startDate: new Date().toISOString(), endDate: '', target: 'all' },
          { missionId: 'mis2', content: '마켓에서 가구 1개 구매하기', reward: 50, startDate: new Date().toISOString(), endDate: '', target: 'all' }
        ]);
      }
      // 8. MissionProgress
      if (!this.get('MissionProgress')) {
        this.set('MissionProgress', []);
      }
      // 9. HarvestNodes
      if (!this.get('HarvestNodes')) {
        const defaultDropTable1 = JSON.stringify([
          { type: 'coin', min: 10, max: 30, weight: 60 },
          { type: 'coin', min: 31, max: 50, weight: 30 },
          { type: 'item', itemId: 'item_apple', name: '사과', weight: 10 }
        ]);
        const defaultDropTable2 = JSON.stringify([
          { type: 'coin', min: 15, max: 40, weight: 50 },
          { type: 'coin', min: 41, max: 50, weight: 25 },
          { type: 'item', itemId: 'item_flower', name: '꽃', weight: 25 }
        ]);
        const defaultDropTable3 = JSON.stringify([
          { type: 'coin', min: 20, max: 50, weight: 40 },
          { type: 'item', itemId: 'item_wood', name: '나무', weight: 35 },
          { type: 'item', itemId: 'item_stone', name: '돌', weight: 25 }
        ]);
        this.set('HarvestNodes', [
          { nodeId: 'node_1', x: 3, y: 12, dropTable: defaultDropTable1, lastHarvestByStudent: '{}' },
          { nodeId: 'node_2', x: 12, y: 13, dropTable: defaultDropTable2, lastHarvestByStudent: '{}' },
          { nodeId: 'node_3', x: 21, y: 6, dropTable: defaultDropTable3, lastHarvestByStudent: '{}' }
        ]);
      }
    }
  },

  // 모크 호출 처리기 (doGet API의 로컬 자바스크립트 모사)
  mockCall: function(action, params) {
    this.mockDb.init();

    switch (action) {
      case 'initializeDatabase':
        return { success: true, data: { message: '로컬 데이터베이스가 초기화되었습니다.', spreadsheetId: 'local_mock_db', spreadsheetUrl: '#' } };

      case 'login': {
        const users = this.mockDb.get('Users');
        const user = users.find(u => String(u.studentId) === String(params.studentId));
        if (!user) return { success: false, error: '존재하지 않는 학생 ID입니다.' };
        if (String(user.pin) !== String(params.pin)) return { success: false, error: 'PIN이 일치하지 않습니다.' };
        user.lastLogin = new Date().toISOString();
        this.mockDb.set('Users', users);
        const { pin, ...sanitized } = user;
        return { success: true, data: sanitized };
      }

      case 'getUserState': {
        const users = this.mockDb.get('Users');
        const user = users.find(u => String(u.studentId) === String(params.studentId));
        if (!user) return { success: false, error: '존재하지 않는 사용자입니다.' };
        
        const inventory = (this.mockDb.get('Inventory') || []).filter(i => String(i.studentId) === String(params.studentId));
        const house = (this.mockDb.get('Houses') || []).find(h => String(h.studentId) === String(params.studentId));
        
        const { pin, ...sanitized } = user;
        return {
          success: true,
          data: {
            user: sanitized,
            inventory: inventory,
            house: house || null,
            pet: null
          }
        };
      }

      case 'registerStudent': {
        const users = this.mockDb.get('Users');
        const houses = this.mockDb.get('Houses');
        
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || (requester.role !== 'teacher' && requester.role !== 'salary_manager')) {
          return { success: false, error: '학생 등록 권한이 없습니다.' };
        }

        if (users.some(u => u.studentId === params.studentId)) {
          return { success: false, error: '이미 존재하는 학생 ID입니다.' };
        }

        const newUser = {
          studentId: params.studentId,
          name: params.name,
          pin: String(params.pin),
          role: 'student',
          balance: 0,
          avatarConfig: '{"skin":"#ffedd5","hair":"#10b981","eyes":"#1e293b","gender":"male"}',
          petId: '',
          lastLogin: new Date().toISOString()
        };
        users.push(newUser);
        this.mockDb.set('Users', users);

        const newHouse = {
          studentId: params.studentId,
          layoutData: '[]',
          wallThemeId: 'wall_default',
          floorThemeId: 'floor_default',
          bulletinMemo: ''
        };
        houses.push(newHouse);
        this.mockDb.set('Houses', houses);

        const { pin, ...sanitized } = newUser;
        return { success: true, data: sanitized };
      }

      case 'getUsers': {
        const users = this.mockDb.get('Users');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || requester.role !== 'teacher') {
          return { success: false, error: '사용자 조회 권한이 없습니다.' };
        }
        return { success: true, data: users.map(({ pin, ...rest }) => rest) };
      }

      case 'updateUserRole': {
        const users = this.mockDb.get('Users');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || requester.role !== 'teacher') {
          return { success: false, error: '역할 변경 권한이 없습니다.' };
        }
        const user = users.find(u => u.studentId === params.targetStudentId);
        if (!user) return { success: false, error: '학생을 찾을 수 없습니다.' };
        
        user.role = params.newRole;
        this.mockDb.set('Users', users);
        return { success: true, data: { studentId: params.targetStudentId, newRole: params.newRole } };
      }

      case 'paySalary': {
        const users = this.mockDb.get('Users');
        const txs = this.mockDb.get('Transactions');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || (requester.role !== 'teacher' && requester.role !== 'salary_manager')) {
          return { success: false, error: '급여 지급 권한이 없습니다.' };
        }

        const ids = String(params.targetStudentIds).split(',');
        const amount = parseInt(params.amount, 10);
        const results = [];

        ids.forEach(sid => {
          const id = sid.trim();
          if (!id) return;
          const user = users.find(u => u.studentId === id);
          if (!user) {
            results.push({ studentId: id, success: false, error: '학생을 찾을 수 없습니다.' });
            return;
          }
          user.balance += amount;
          txs.push({
            txId: 'tx_' + Math.random().toString(36).substr(2, 9),
            studentId: id,
            type: 'salary',
            amount: amount,
            processedBy: params.requesterId,
            reason: params.reason || '급여',
            timestamp: new Date().toISOString()
          });
          results.push({ studentId: id, success: true, newBalance: user.balance });
        });

        this.mockDb.set('Users', users);
        this.mockDb.set('Transactions', txs);
        return { success: true, data: results };
      }

      case 'collectTax': {
        const users = this.mockDb.get('Users');
        const txs = this.mockDb.get('Transactions');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || (requester.role !== 'teacher' && requester.role !== 'tax_manager')) {
          return { success: false, error: '세금 징수 권한이 없습니다.' };
        }

        const ids = String(params.targetStudentIds).split(',');
        const amount = parseInt(params.amount, 10);
        const results = [];

        ids.forEach(sid => {
          const id = sid.trim();
          if (!id) return;
          const user = users.find(u => u.studentId === id);
          if (!user) {
            results.push({ studentId: id, success: false, error: '학생을 찾을 수 없습니다.' });
            return;
          }
          if (user.balance < amount) {
            results.push({ studentId: id, success: false, error: `잔액이 부족합니다. (현재: ${user.balance})` });
            return;
          }
          user.balance -= amount;
          txs.push({
            txId: 'tx_' + Math.random().toString(36).substr(2, 9),
            studentId: id,
            type: 'tax',
            amount: amount,
            processedBy: params.requesterId,
            reason: params.reason || '세금',
            timestamp: new Date().toISOString()
          });
          results.push({ studentId: id, success: true, newBalance: user.balance });
        });

        this.mockDb.set('Users', users);
        this.mockDb.set('Transactions', txs);
        return { success: true, data: results };
      }

      case 'issuePenalty': {
        const users = this.mockDb.get('Users');
        const txs = this.mockDb.get('Transactions');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || (requester.role !== 'teacher' && requester.role !== 'police')) {
          return { success: false, error: '벌금 부과 권한이 없습니다.' };
        }

        const user = users.find(u => u.studentId === params.targetStudentId);
        if (!user) return { success: false, error: '학생을 찾을 수 없습니다.' };
        
        const amount = parseInt(params.amount, 10);
        if (user.balance < amount) {
          return { success: false, error: `잔액이 부족합니다. (현재: ${user.balance})` };
        }

        user.balance -= amount;
        txs.push({
          txId: 'tx_' + Math.random().toString(36).substr(2, 9),
          studentId: params.targetStudentId,
          type: 'penalty',
          amount: amount,
          processedBy: params.requesterId,
          reason: params.reason || '벌금',
          timestamp: new Date().toISOString()
        });

        this.mockDb.set('Users', users);
        this.mockDb.set('Transactions', txs);
        return { success: true, data: { studentId: params.targetStudentId, newBalance: user.balance } };
      }

      case 'getMarketItems': {
        return { success: true, data: this.mockDb.get('MarketItems') };
      }

      case 'upsertMarketItem': {
        const users = this.mockDb.get('Users');
        const items = this.mockDb.get('MarketItems');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || (requester.role !== 'teacher' && requester.role !== 'market_manager')) {
          return { success: false, error: '마켓 관리 권한이 없습니다.' };
        }

        let item;
        if (params.itemId) {
          item = items.find(i => i.itemId === params.itemId);
        }

        if (item) {
          item.name = params.name;
          item.category = params.category;
          item.price = parseInt(params.price, 10);
          item.stock = parseInt(params.stock, 10);
          item.imageUrl = params.imageUrl || '';
          item.registeredBy = params.requesterId;
          item.registeredAt = new Date().toISOString();
        } else {
          item = {
            itemId: params.itemId || 'item_' + Math.random().toString(36).substr(2, 9),
            name: params.name,
            category: params.category || 'etc',
            price: parseInt(params.price, 10),
            stock: parseInt(params.stock, 10),
            imageUrl: params.imageUrl || '',
            registeredBy: params.requesterId,
            registeredAt: new Date().toISOString()
          };
          items.push(item);
        }

        this.mockDb.set('MarketItems', items);
        return { success: true, data: item };
      }

      case 'deleteMarketItem': {
        const users = this.mockDb.get('Users');
        const items = this.mockDb.get('MarketItems');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || (requester.role !== 'teacher' && requester.role !== 'market_manager')) {
          return { success: false, error: '마켓 관리 권한이 없습니다.' };
        }

        const index = items.findIndex(i => i.itemId === params.itemId);
        if (index < 0) return { success: false, error: '아이템을 찾을 수 없습니다.' };
        items.splice(index, 1);
        this.mockDb.set('MarketItems', items);
        return { success: true, data: { deletedItemId: params.itemId } };
      }

      case 'purchaseItem': {
        const users = this.mockDb.get('Users');
        const items = this.mockDb.get('MarketItems');
        const inv = this.mockDb.get('Inventory');
        const txs = this.mockDb.get('Transactions');

        const user = users.find(u => u.studentId === params.studentId);
        if (!user) return { success: false, error: '사용자를 찾을 수 없습니다.' };

        const item = items.find(i => i.itemId === params.itemId);
        if (!item) return { success: false, error: '아이템이 존재하지 않습니다.' };

        const quantity = parseInt(params.quantity, 10) || 1;
        if (item.stock < quantity) return { success: false, error: `재고가 부족합니다. (현재: ${item.stock})` };

        const totalCost = item.price * quantity;
        if (user.balance < totalCost) return { success: false, error: `잔액이 부족합니다. (필요: ${totalCost}, 잔액: ${user.balance})` };

        user.balance -= totalCost;
        item.stock -= quantity;

        const invItem = inv.find(i => i.studentId === params.studentId && i.itemId === params.itemId);
        if (invItem) {
          invItem.quantity += quantity;
        } else {
          inv.push({
            studentId: params.studentId,
            itemId: params.itemId,
            quantity: quantity,
            source: 'purchase',
            acquiredAt: new Date().toISOString()
          });
        }

        txs.push({
          txId: 'tx_' + Math.random().toString(36).substr(2, 9),
          studentId: params.studentId,
          type: 'purchase',
          amount: totalCost,
          processedBy: '',
          reason: `${item.name} x${quantity} 구매`,
          timestamp: new Date().toISOString()
        });

        this.mockDb.set('Users', users);
        this.mockDb.set('MarketItems', items);
        this.mockDb.set('Inventory', inv);
        this.mockDb.set('Transactions', txs);

        return {
          success: true,
          data: {
            itemId: params.itemId,
            itemName: item.name,
            quantity,
            totalCost,
            newBalance: user.balance
          }
        };
      }

      case 'getHouse': {
        const houses = this.mockDb.get('Houses') || [];
        const house = houses.find(h => String(h.studentId) === String(params.studentId));
        if (!house) return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
        return { success: true, data: house };
      }

      case 'updateHouseLayout': {
        const houses = this.mockDb.get('Houses') || [];
        const house = houses.find(h => String(h.studentId) === String(params.studentId));
        if (!house) return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
        
        if (params.layoutData !== undefined) house.layoutData = params.layoutData;
        if (params.wallThemeId !== undefined) house.wallThemeId = params.wallThemeId;
        if (params.floorThemeId !== undefined) house.floorThemeId = params.floorThemeId;
        
        this.mockDb.set('Houses', houses);
        return { success: true, data: house };
      }

      case 'getBulletin': {
        const houses = this.mockDb.get('Houses') || [];
        const house = houses.find(h => String(h.studentId) === String(params.studentId));
        return { success: true, data: { studentId: params.studentId, memo: house ? house.bulletinMemo : '' } };
      }

      case 'postBulletin': {
        const houses = this.mockDb.get('Houses') || [];
        const house = houses.find(h => String(h.studentId) === String(params.studentId));
        if (!house) return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
        house.bulletinMemo = params.memo || '';
        this.mockDb.set('Houses', houses);
        return { success: true, data: { studentId: params.studentId, memo: house.bulletinMemo } };
      }

      case 'getAnnouncements': {
        const ann = this.mockDb.get('Announcements') || [];
        return { success: true, data: ann };
      }

      case 'postAnnouncement': {
        const users = this.mockDb.get('Users');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || requester.role !== 'teacher') {
          return { success: false, error: '공지사항 작성 권한이 없습니다.' };
        }

        const ann = this.mockDb.get('Announcements') || [];
        const newAnn = {
          announcementId: 'ann_' + Math.random().toString(36).substr(2, 9),
          title: params.title,
          content: params.content,
          author: params.requesterId,
          createdAt: new Date().toISOString(),
          isPinned: params.isPinned === 'true' || params.isPinned === true ? 'true' : 'false'
        };
        ann.unshift(newAnn);
        this.mockDb.set('Announcements', ann);
        return { success: true, data: newAnn };
      }

      case 'getMissions': {
        const missions = this.mockDb.get('Missions') || [];
        const progress = this.mockDb.get('MissionProgress') || [];
        
        const studentId = params.studentId;
        const result = missions.map(m => {
          const isCompleted = progress.some(p => p.missionId === m.missionId && p.studentId === studentId && p.isCompleted === 'true');
          return { ...m, isCompletedByMe: isCompleted };
        });
        return { success: true, data: result };
      }

      case 'createMission': {
        const users = this.mockDb.get('Users');
        const requester = users.find(u => u.studentId === params.requesterId);
        if (!requester || requester.role !== 'teacher') {
          return { success: false, error: '미션 생성 권한이 없습니다.' };
        }

        const missions = this.mockDb.get('Missions') || [];
        const newMission = {
          missionId: 'mis_' + Math.random().toString(36).substr(2, 9),
          content: params.content,
          reward: parseInt(params.reward, 10),
          startDate: params.startDate || new Date().toISOString(),
          endDate: params.endDate || '',
          target: params.target || 'all'
        };
        missions.push(newMission);
        this.mockDb.set('Missions', missions);
        return { success: true, data: newMission };
      }

      case 'completeMission': {
        const progress = this.mockDb.get('MissionProgress') || [];
        const missions = this.mockDb.get('Missions') || [];
        const users = this.mockDb.get('Users');
        const txs = this.mockDb.get('Transactions');

        const mission = missions.find(m => m.missionId === params.missionId);
        if (!mission) return { success: false, error: '존재하지 않는 미션입니다.' };

        const alreadyDone = progress.some(p => p.missionId === params.missionId && p.studentId === params.studentId);
        if (alreadyDone) return { success: false, error: '이미 완료한 미션입니다.' };

        progress.push({
          missionId: params.missionId,
          studentId: params.studentId,
          isCompleted: 'true',
          completedAt: new Date().toISOString()
        });

        const user = users.find(u => u.studentId === params.studentId);
        const reward = parseInt(mission.reward, 10) || 0;
        if (user && reward > 0) {
          user.balance += reward;
          txs.push({
            txId: 'tx_' + Math.random().toString(36).substr(2, 9),
            studentId: params.studentId,
            type: 'mission',
            amount: reward,
            processedBy: '',
            reason: `미션 완료 보상: ${mission.content}`,
            timestamp: new Date().toISOString()
          });
        }

        this.mockDb.set('MissionProgress', progress);
        this.mockDb.set('Users', users);
        this.mockDb.set('Transactions', txs);

        return {
          success: true,
          data: {
            missionId: params.missionId,
            reward: reward,
            message: '미션을 완료했습니다!'
          }
        };
      }

      case 'harvestNode': {
        const nodes = this.mockDb.get('HarvestNodes');
        const node = nodes.find(n => n.nodeId === params.nodeId);
        if (!node) return { success: false, error: '존재하지 않는 수확 노드입니다.' };

        // 쿨다운 검사 (5분)
        let lastHarvests = {};
        try { lastHarvests = JSON.parse(node.lastHarvestByStudent || '{}'); } catch(e) {}
        
        const lastTime = lastHarvests[params.studentId];
        if (lastTime) {
          const elapsed = new Date().getTime() - new Date(lastTime).getTime();
          if (elapsed < CONFIG.GAME.HARVEST_COOLDOWN) {
            const remaining = Math.ceil((CONFIG.GAME.HARVEST_COOLDOWN - elapsed) / 1000);
            return { success: false, error: `쿨다운 중입니다. ${remaining}초 후에 다시 시도하세요.` };
          }
        }

        // 보상 계산
        let dropTable = [];
        try { dropTable = JSON.parse(node.dropTable); } catch(e) {}
        
        if (dropTable.length === 0) return { success: false, error: '드롭 테이블이 비어있습니다.' };

        const totalWeight = dropTable.reduce((sum, item) => sum + (item.weight || 1), 0);
        let rand = Math.random() * totalWeight;
        let selectedDrop = dropTable[0];
        let cum = 0;
        for (let i = 0; i < dropTable.length; i++) {
          cum += (dropTable[i].weight || 1);
          if (rand <= cum) {
            selectedDrop = dropTable[i];
            break;
          }
        }

        const users = this.mockDb.get('Users');
        const txs = this.mockDb.get('Transactions');
        const inv = this.mockDb.get('Inventory');
        const user = users.find(u => u.studentId === params.studentId);
        
        let reward = {};

        if (selectedDrop.type === 'coin') {
          const coins = Math.floor(Math.random() * ((selectedDrop.max || 50) - (selectedDrop.min || 10) + 1)) + (selectedDrop.min || 10);
          if (user) user.balance += coins;
          txs.push({
            txId: 'tx_' + Math.random().toString(36).substr(2, 9),
            studentId: params.studentId,
            type: 'harvest',
            amount: coins,
            processedBy: '',
            reason: '수확 보상 (코인)',
            timestamp: new Date().toISOString()
          });
          reward = { type: 'coin', amount: coins };
        } else if (selectedDrop.type === 'item') {
          const invItem = inv.find(i => i.studentId === params.studentId && i.itemId === selectedDrop.itemId);
          if (invItem) {
            invItem.quantity += 1;
          } else {
            inv.push({
              studentId: params.studentId,
              itemId: selectedDrop.itemId,
              quantity: 1,
              source: 'harvest',
              acquiredAt: new Date().toISOString()
            });
          }
          txs.push({
            txId: 'tx_' + Math.random().toString(36).substr(2, 9),
            studentId: params.studentId,
            type: 'harvest',
            amount: 0,
            processedBy: '',
            reason: `수확 보상: ${selectedDrop.name}`,
            timestamp: new Date().toISOString()
          });
          reward = { type: 'item', itemId: selectedDrop.itemId, name: selectedDrop.name, quantity: 1 };
        }

        // 쿨다운 업데이트
        lastHarvests[params.studentId] = new Date().toISOString();
        node.lastHarvestByStudent = JSON.stringify(lastHarvests);

        this.mockDb.set('Users', users);
        this.mockDb.set('Transactions', txs);
        this.mockDb.set('Inventory', inv);
        this.mockDb.set('HarvestNodes', nodes);

        return { success: true, data: { nodeId: params.nodeId, reward: reward } };
      }

      case 'getTransactions': {
        const txs = this.mockDb.get('Transactions') || [];
        const userTxs = txs.filter(t => t.studentId === params.studentId)
                           .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                           .slice(0, 50);
        return { success: true, data: userTxs };
      }

      case 'getVillageMap': {
        const users = this.mockDb.get('Users') || [];
        const nodes = this.mockDb.get('HarvestNodes') || [];
        
        const villagers = users.map(u => ({
          studentId: u.studentId,
          name: u.name,
          avatarConfig: u.avatarConfig
        }));

        const harvestNodes = nodes.map(n => ({
          nodeId: n.nodeId,
          x: n.x,
          y: n.y
        }));

        return {
          success: true,
          data: {
            villagers: villagers,
            harvestNodes: harvestNodes
          }
        };
      }

      default:
        return { success: false, error: 'Unknown action: ' + action };
    }
  }
};

window.API = API;
