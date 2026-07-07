// ========================================================
// 우리반 마을 (Our Class Village) - Google Apps Script Backend
// ========================================================
// All API calls go through doGet(e) to avoid CORS issues
// with GitHub Pages. Deploy as Web App with "Anyone" access.
// ========================================================

var SPREADSHEET_NAME = '우리반마을_DB';
var PROP_KEY_SS_ID = 'SPREADSHEET_ID';

// --------------------------------------------------------
// Helper: get or create spreadsheet
// --------------------------------------------------------
function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(PROP_KEY_SS_ID);
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (err) {
      // stored ID is stale – fall through and create a new one
    }
  }
  return null;
}

function getSheet(name) {
  var ss = getSpreadsheet();
  if (!ss) return null;
  return ss.getSheetByName(name);
}

// --------------------------------------------------------
// Helper: read all rows as objects
// --------------------------------------------------------
function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

// --------------------------------------------------------
// Helper: find row index (1-based, including header) by column value
// --------------------------------------------------------
function findRowIndex(sheet, colName, value) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return -1;
  var headers = data[0];
  var colIdx = headers.indexOf(colName);
  if (colIdx === -1) return -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(value)) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

// --------------------------------------------------------
// Helper: find row as object
// --------------------------------------------------------
function findRow(sheet, colName, value) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  var colIdx = headers.indexOf(colName);
  if (colIdx === -1) return null;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(value)) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      return obj;
    }
  }
  return null;
}

// --------------------------------------------------------
// Helper: get column index (0-based)
// --------------------------------------------------------
function getColIndex(sheet, colName) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(colName);
}

// --------------------------------------------------------
// Helper: append a row from object (matching header order)
// --------------------------------------------------------
function appendRowFromObject(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : '');
  }
  sheet.appendRow(row);
}

// --------------------------------------------------------
// Helper: update a row from object
// --------------------------------------------------------
function updateRowFromObject(sheet, rowIndex, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : '');
  }
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

// --------------------------------------------------------
// Helper: authenticate user
// --------------------------------------------------------
function authenticateUser(studentId, pin) {
  var sheet = getSheet('Users');
  if (!sheet) return null;
  var user = findRow(sheet, 'studentId', studentId);
  if (!user) return null;
  if (String(user.pin) !== String(pin)) return null;
  return user;
}

// --------------------------------------------------------
// Helper: get user by ID (no pin check)
// --------------------------------------------------------
function getUserById(studentId) {
  var sheet = getSheet('Users');
  if (!sheet) return null;
  return findRow(sheet, 'studentId', studentId);
}

// --------------------------------------------------------
// Helper: check role permission
// --------------------------------------------------------
function hasRole(studentId, allowedRoles) {
  var user = getUserById(studentId);
  if (!user) return false;
  for (var i = 0; i < allowedRoles.length; i++) {
    if (user.role === allowedRoles[i]) return true;
  }
  return false;
}

// --------------------------------------------------------
// Helper: strip pin from user object
// --------------------------------------------------------
function sanitizeUser(user) {
  var result = {};
  for (var key in user) {
    if (key !== 'pin') {
      result[key] = user[key];
    }
  }
  return result;
}

// --------------------------------------------------------
// Helper: get current ISO timestamp
// --------------------------------------------------------
function nowISO() {
  return new Date().toISOString();
}

// ========================================================
// doGet Router
// ========================================================
function doGet(e) {
  var action = e.parameter.action;
  var result;
  try {
    switch (action) {
      case 'initializeDatabase':
        result = initializeDatabase();
        break;
      case 'login':
        result = handleLogin(e.parameter);
        break;
      case 'getUserState':
        result = handleGetUserState(e.parameter);
        break;
      case 'getVillageMap':
        result = handleGetVillageMap(e.parameter);
        break;
      case 'getHouse':
        result = handleGetHouse(e.parameter);
        break;
      case 'updateHouseLayout':
        result = handleUpdateHouseLayout(e.parameter);
        break;
      case 'getBulletin':
        result = handleGetBulletin(e.parameter);
        break;
      case 'postBulletin':
        result = handlePostBulletin(e.parameter);
        break;
      case 'getMarketItems':
        result = handleGetMarketItems(e.parameter);
        break;
      case 'upsertMarketItem':
        result = handleUpsertMarketItem(e.parameter);
        break;
      case 'deleteMarketItem':
        result = handleDeleteMarketItem(e.parameter);
        break;
      case 'purchaseItem':
        result = handlePurchaseItem(e.parameter);
        break;
      case 'paySalary':
        result = handlePaySalary(e.parameter);
        break;
      case 'collectTax':
        result = handleCollectTax(e.parameter);
        break;
      case 'issuePenalty':
        result = handleIssuePenalty(e.parameter);
        break;
      case 'harvestNode':
        result = handleHarvestNode(e.parameter);
        break;
      case 'getAnnouncements':
        result = handleGetAnnouncements(e.parameter);
        break;
      case 'postAnnouncement':
        result = handlePostAnnouncement(e.parameter);
        break;
      case 'getMissions':
        result = handleGetMissions(e.parameter);
        break;
      case 'completeMission':
        result = handleCompleteMission(e.parameter);
        break;
      case 'getUsers':
        result = handleGetUsers(e.parameter);
        break;
      case 'updateUserRole':
        result = handleUpdateUserRole(e.parameter);
        break;
      case 'registerStudent':
        result = handleRegisterStudent(e.parameter);
        break;
      case 'getTransactions':
        result = handleGetTransactions(e.parameter);
        break;
      case 'createMission':
        result = handleCreateMission(e.parameter);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.message || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================================
// initializeDatabase
// ========================================================
function initializeDatabase() {
  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty(PROP_KEY_SS_ID);

  // Check if spreadsheet already exists
  if (existingId) {
    try {
      var existing = SpreadsheetApp.openById(existingId);
      return { success: true, data: { message: '데이터베이스가 이미 존재합니다.', spreadsheetId: existingId } };
    } catch (err) {
      // stale ID, continue to create new
    }
  }

  // Create new spreadsheet
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  var ssId = ss.getId();
  props.setProperty(PROP_KEY_SS_ID, ssId);

  // Define sheets and their headers
  var sheetDefs = [
    { name: 'Users', headers: ['studentId', 'name', 'pin', 'role', 'balance', 'avatarConfig', 'petId', 'lastLogin'] },
    { name: 'Houses', headers: ['studentId', 'layoutData', 'wallThemeId', 'floorThemeId', 'bulletinMemo'] },
    { name: 'MarketItems', headers: ['itemId', 'name', 'category', 'price', 'stock', 'imageUrl', 'registeredBy', 'registeredAt'] },
    { name: 'Inventory', headers: ['studentId', 'itemId', 'quantity', 'source', 'acquiredAt'] },
    { name: 'Transactions', headers: ['txId', 'studentId', 'type', 'amount', 'processedBy', 'reason', 'timestamp'] },
    { name: 'Announcements', headers: ['announcementId', 'title', 'content', 'author', 'createdAt', 'isPinned'] },
    { name: 'Missions', headers: ['missionId', 'content', 'reward', 'startDate', 'endDate', 'target'] },
    { name: 'MissionProgress', headers: ['missionId', 'studentId', 'isCompleted', 'completedAt'] },
    { name: 'HarvestNodes', headers: ['nodeId', 'x', 'y', 'dropTable', 'lastHarvestByStudent'] },
    { name: 'Pets', headers: ['studentId', 'species', 'growthStage', 'affinity', 'acquiredAt'] }
  ];

  // Create each sheet
  for (var i = 0; i < sheetDefs.length; i++) {
    var def = sheetDefs[i];
    var sheet;
    if (i === 0) {
      // Rename the default sheet
      sheet = ss.getSheets()[0];
      sheet.setName(def.name);
    } else {
      sheet = ss.insertSheet(def.name);
    }
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
    // Bold and freeze header row
    sheet.getRange(1, 1, 1, def.headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Delete any remaining default sheets (e.g. '시트1' or 'Sheet1')
  var allSheets = ss.getSheets();
  var validNames = [];
  for (var v = 0; v < sheetDefs.length; v++) {
    validNames.push(sheetDefs[v].name);
  }
  for (var s = 0; s < allSheets.length; s++) {
    var sName = allSheets[s].getName();
    var isValid = false;
    for (var vn = 0; vn < validNames.length; vn++) {
      if (validNames[vn] === sName) {
        isValid = true;
        break;
      }
    }
    if (!isValid) {
      ss.deleteSheet(allSheets[s]);
    }
  }

  // Create default teacher account
  var usersSheet = ss.getSheetByName('Users');
  usersSheet.appendRow(['teacher', '교사', '0000', 'teacher', 999999, '', '', nowISO()]);

  // Create default teacher house
  var housesSheet = ss.getSheetByName('Houses');
  housesSheet.appendRow(['teacher', '[]', 'wall_default', 'floor_default', '']);

  // Create default harvest nodes
  var harvestSheet = ss.getSheetByName('HarvestNodes');
  var defaultDropTable1 = JSON.stringify([
    { type: 'coin', min: 10, max: 30, weight: 60 },
    { type: 'coin', min: 31, max: 50, weight: 30 },
    { type: 'item', itemId: 'item_apple', name: '사과', weight: 10 }
  ]);
  var defaultDropTable2 = JSON.stringify([
    { type: 'coin', min: 15, max: 40, weight: 50 },
    { type: 'coin', min: 41, max: 50, weight: 25 },
    { type: 'item', itemId: 'item_flower', name: '꽃', weight: 25 }
  ]);
  var defaultDropTable3 = JSON.stringify([
    { type: 'coin', min: 20, max: 50, weight: 40 },
    { type: 'item', itemId: 'item_wood', name: '나무', weight: 35 },
    { type: 'item', itemId: 'item_stone', name: '돌', weight: 25 }
  ]);
  harvestSheet.appendRow(['node_1', 3, 12, defaultDropTable1, '{}']);
  harvestSheet.appendRow(['node_2', 4, 13, defaultDropTable2, '{}']);
  harvestSheet.appendRow(['node_3', 17, 6, defaultDropTable3, '{}']);

  // Create default market items
  var marketSheet = ss.getSheetByName('MarketItems');
  var defaultItems = [
    { itemId: 'item_desk', name: '나무 책상', category: 'furniture', price: 100, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_chair', name: '나무 의자', category: 'furniture', price: 60, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_bookshelf', name: '책장', category: 'furniture', price: 200, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_lamp', name: '탁상 램프', category: 'furniture', price: 80, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_rug', name: '동그란 러그', category: 'furniture', price: 120, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_plant', name: '화분', category: 'furniture', price: 50, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_bed', name: '침대', category: 'furniture', price: 300, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'wall_blue', name: '파란 벽지', category: 'wallpaper', price: 150, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'wall_pink', name: '분홍 벽지', category: 'wallpaper', price: 150, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'wall_green', name: '초록 벽지', category: 'wallpaper', price: 150, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'wall_wood', name: '나무 벽지', category: 'wallpaper', price: 200, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'floor_wood', name: '나무 바닥', category: 'flooring', price: 180, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'floor_tile', name: '타일 바닥', category: 'flooring', price: 180, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'floor_carpet', name: '카펫 바닥', category: 'flooring', price: 160, stock: 99, imageUrl: '', registeredBy: 'teacher', registeredAt: nowISO() },
    { itemId: 'item_apple', name: '사과', category: 'harvest', price: 30, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: nowISO() },
    { itemId: 'item_flower', name: '꽃', category: 'harvest', price: 25, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: nowISO() },
    { itemId: 'item_wood', name: '나무', category: 'harvest', price: 20, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: nowISO() },
    { itemId: 'item_stone', name: '돌', category: 'harvest', price: 15, stock: 0, imageUrl: '', registeredBy: 'system', registeredAt: nowISO() }
  ];

  for (var d = 0; d < defaultItems.length; d++) {
    var item = defaultItems[d];
    marketSheet.appendRow([
      item.itemId, item.name, item.category, item.price,
      item.stock, item.imageUrl, item.registeredBy, item.registeredAt
    ]);
  }

  return {
    success: true,
    data: {
      message: '데이터베이스가 성공적으로 생성되었습니다.',
      spreadsheetId: ssId,
      spreadsheetUrl: ss.getUrl()
    }
  };
}

// ========================================================
// login
// ========================================================
function handleLogin(params) {
  var studentId = params.studentId;
  var pin = params.pin;
  if (!studentId || !pin) {
    return { success: false, error: '학생 ID와 PIN을 입력해주세요.' };
  }

  var sheet = getSheet('Users');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var user = findRow(sheet, 'studentId', studentId);
  if (!user) {
    return { success: false, error: '존재하지 않는 학생 ID입니다.' };
  }
  if (String(user.pin) !== String(pin)) {
    return { success: false, error: 'PIN이 일치하지 않습니다.' };
  }

  // Update lastLogin
  var rowIdx = findRowIndex(sheet, 'studentId', studentId);
  var colIdx = getColIndex(sheet, 'lastLogin');
  if (rowIdx > 0 && colIdx >= 0) {
    sheet.getRange(rowIdx, colIdx + 1).setValue(nowISO());
  }

  return { success: true, data: sanitizeUser(user) };
}

// ========================================================
// getUserState
// ========================================================
function handleGetUserState(params) {
  var studentId = params.studentId;
  if (!studentId) {
    return { success: false, error: '학생 ID가 필요합니다.' };
  }

  var user = getUserById(studentId);
  if (!user) {
    return { success: false, error: '존재하지 않는 학생입니다.' };
  }

  // Get inventory
  var invSheet = getSheet('Inventory');
  var inventory = [];
  if (invSheet) {
    var allInv = sheetToObjects(invSheet);
    for (var i = 0; i < allInv.length; i++) {
      if (String(allInv[i].studentId) === String(studentId)) {
        inventory.push(allInv[i]);
      }
    }
  }

  // Get house
  var houseSheet = getSheet('Houses');
  var house = null;
  if (houseSheet) {
    house = findRow(houseSheet, 'studentId', studentId);
  }

  // Get pet
  var petSheet = getSheet('Pets');
  var pet = null;
  if (petSheet) {
    pet = findRow(petSheet, 'studentId', studentId);
  }

  return {
    success: true,
    data: {
      user: sanitizeUser(user),
      inventory: inventory,
      house: house,
      pet: pet
    }
  };
}

// ========================================================
// registerStudent
// ========================================================
function handleRegisterStudent(params) {
  var studentId = params.studentId;
  var name = params.name;
  var pin = params.pin;
  var requesterId = params.requesterId;

  if (!studentId || !name || !pin || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (studentId, name, pin, requesterId)' };
  }

  // Check permission
  if (!hasRole(requesterId, ['teacher', 'salary_manager'])) {
    return { success: false, error: '학생 등록 권한이 없습니다.' };
  }

  var usersSheet = getSheet('Users');
  if (!usersSheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  // Check if studentId already exists
  var existing = findRow(usersSheet, 'studentId', studentId);
  if (existing) {
    return { success: false, error: '이미 존재하는 학생 ID입니다.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    // Add user
    usersSheet.appendRow([studentId, name, String(pin), 'student', 0, '', '', nowISO()]);

    // Create house
    var housesSheet = getSheet('Houses');
    if (housesSheet) {
      housesSheet.appendRow([studentId, '[]', 'wall_default', 'floor_default', '']);
    }

    lock.releaseLock();
  } catch (err) {
    return { success: false, error: '등록 중 오류가 발생했습니다: ' + err.message };
  }

  return {
    success: true,
    data: { studentId: studentId, name: name, role: 'student', balance: 0 }
  };
}

// ========================================================
// getUsers
// ========================================================
function handleGetUsers(params) {
  var requesterId = params.requesterId;
  if (!requesterId) {
    return { success: false, error: '요청자 ID가 필요합니다.' };
  }

  if (!hasRole(requesterId, ['teacher'])) {
    return { success: false, error: '사용자 목록 조회 권한이 없습니다.' };
  }

  var sheet = getSheet('Users');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var allUsers = sheetToObjects(sheet);
  var sanitized = [];
  for (var i = 0; i < allUsers.length; i++) {
    sanitized.push(sanitizeUser(allUsers[i]));
  }

  return { success: true, data: sanitized };
}

// ========================================================
// updateUserRole
// ========================================================
function handleUpdateUserRole(params) {
  var targetStudentId = params.targetStudentId;
  var newRole = params.newRole;
  var requesterId = params.requesterId;

  if (!targetStudentId || !newRole || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다.' };
  }

  if (!hasRole(requesterId, ['teacher'])) {
    return { success: false, error: '역할 변경 권한이 없습니다. 교사만 가능합니다.' };
  }

  var validRoles = ['student', 'salary_manager', 'market_manager', 'police', 'tax_manager'];
  var isValidRole = false;
  for (var r = 0; r < validRoles.length; r++) {
    if (validRoles[r] === newRole) {
      isValidRole = true;
      break;
    }
  }
  if (!isValidRole) {
    return { success: false, error: '유효하지 않은 역할입니다. 가능한 역할: ' + validRoles.join(', ') };
  }

  var sheet = getSheet('Users');
  var rowIdx = findRowIndex(sheet, 'studentId', targetStudentId);
  if (rowIdx < 0) {
    return { success: false, error: '대상 학생을 찾을 수 없습니다.' };
  }

  var colIdx = getColIndex(sheet, 'role');
  sheet.getRange(rowIdx, colIdx + 1).setValue(newRole);

  return { success: true, data: { studentId: targetStudentId, newRole: newRole } };
}

// ========================================================
// paySalary
// ========================================================
function handlePaySalary(params) {
  var targetStudentIds = params.targetStudentIds;
  var amount = parseInt(params.amount, 10);
  var reason = params.reason || '급여';
  var requesterId = params.requesterId;

  if (!targetStudentIds || !amount || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (targetStudentIds, amount, requesterId)' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: '금액은 양수여야 합니다.' };
  }

  if (!hasRole(requesterId, ['teacher', 'salary_manager'])) {
    return { success: false, error: '급여 지급 권한이 없습니다.' };
  }

  var ids = String(targetStudentIds).split(',');
  var lock = LockService.getScriptLock();
  var results = [];

  try {
    lock.waitLock(15000);

    var usersSheet = getSheet('Users');
    var txSheet = getSheet('Transactions');
    var balanceCol = getColIndex(usersSheet, 'balance');

    for (var i = 0; i < ids.length; i++) {
      var sid = ids[i].replace(/^\s+|\s+$/g, ''); // trim
      if (!sid) continue;

      var rowIdx = findRowIndex(usersSheet, 'studentId', sid);
      if (rowIdx < 0) {
        results.push({ studentId: sid, success: false, error: '학생을 찾을 수 없습니다.' });
        continue;
      }

      var currentBalance = Number(usersSheet.getRange(rowIdx, balanceCol + 1).getValue()) || 0;
      var newBalance = currentBalance + amount;
      usersSheet.getRange(rowIdx, balanceCol + 1).setValue(newBalance);

      // Log transaction
      txSheet.appendRow([
        Utilities.getUuid(), sid, 'salary', amount, requesterId, reason, nowISO()
      ]);

      results.push({ studentId: sid, success: true, newBalance: newBalance });
    }

    lock.releaseLock();
  } catch (err) {
    return { success: false, error: '급여 지급 중 오류: ' + err.message };
  }

  return { success: true, data: results };
}

// ========================================================
// collectTax
// ========================================================
function handleCollectTax(params) {
  var targetStudentIds = params.targetStudentIds;
  var amount = parseInt(params.amount, 10);
  var reason = params.reason || '세금';
  var requesterId = params.requesterId;

  if (!targetStudentIds || !amount || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (targetStudentIds, amount, requesterId)' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: '금액은 양수여야 합니다.' };
  }

  if (!hasRole(requesterId, ['teacher', 'tax_manager'])) {
    return { success: false, error: '세금 징수 권한이 없습니다.' };
  }

  var ids = String(targetStudentIds).split(',');
  var lock = LockService.getScriptLock();
  var results = [];

  try {
    lock.waitLock(15000);

    var usersSheet = getSheet('Users');
    var txSheet = getSheet('Transactions');
    var balanceCol = getColIndex(usersSheet, 'balance');

    for (var i = 0; i < ids.length; i++) {
      var sid = ids[i].replace(/^\s+|\s+$/g, '');
      if (!sid) continue;

      var rowIdx = findRowIndex(usersSheet, 'studentId', sid);
      if (rowIdx < 0) {
        results.push({ studentId: sid, success: false, error: '학생을 찾을 수 없습니다.' });
        continue;
      }

      var currentBalance = Number(usersSheet.getRange(rowIdx, balanceCol + 1).getValue()) || 0;
      if (currentBalance < amount) {
        results.push({ studentId: sid, success: false, error: '잔액이 부족합니다. 현재 잔액: ' + currentBalance });
        continue;
      }

      var newBalance = currentBalance - amount;
      usersSheet.getRange(rowIdx, balanceCol + 1).setValue(newBalance);

      txSheet.appendRow([
        Utilities.getUuid(), sid, 'tax', amount, requesterId, reason, nowISO()
      ]);

      results.push({ studentId: sid, success: true, newBalance: newBalance });
    }

    lock.releaseLock();
  } catch (err) {
    return { success: false, error: '세금 징수 중 오류: ' + err.message };
  }

  return { success: true, data: results };
}

// ========================================================
// issuePenalty
// ========================================================
function handleIssuePenalty(params) {
  var targetStudentId = params.targetStudentId;
  var amount = parseInt(params.amount, 10);
  var reason = params.reason || '벌금';
  var requesterId = params.requesterId;

  if (!targetStudentId || !amount || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (targetStudentId, amount, requesterId)' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: '금액은 양수여야 합니다.' };
  }

  if (!hasRole(requesterId, ['teacher', 'police'])) {
    return { success: false, error: '벌금 부과 권한이 없습니다.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var usersSheet = getSheet('Users');
    var txSheet = getSheet('Transactions');
    var balanceCol = getColIndex(usersSheet, 'balance');

    var rowIdx = findRowIndex(usersSheet, 'studentId', targetStudentId);
    if (rowIdx < 0) {
      lock.releaseLock();
      return { success: false, error: '학생을 찾을 수 없습니다.' };
    }

    var currentBalance = Number(usersSheet.getRange(rowIdx, balanceCol + 1).getValue()) || 0;
    if (currentBalance < amount) {
      lock.releaseLock();
      return { success: false, error: '잔액이 부족합니다. 현재 잔액: ' + currentBalance };
    }

    var newBalance = currentBalance - amount;
    usersSheet.getRange(rowIdx, balanceCol + 1).setValue(newBalance);

    txSheet.appendRow([
      Utilities.getUuid(), targetStudentId, 'penalty', amount, requesterId, reason, nowISO()
    ]);

    lock.releaseLock();

    return { success: true, data: { studentId: targetStudentId, newBalance: newBalance } };
  } catch (err) {
    return { success: false, error: '벌금 부과 중 오류: ' + err.message };
  }
}

// ========================================================
// purchaseItem
// ========================================================
function handlePurchaseItem(params) {
  var studentId = params.studentId;
  var itemId = params.itemId;
  var quantity = parseInt(params.quantity, 10) || 1;

  if (!studentId || !itemId) {
    return { success: false, error: '학생 ID와 아이템 ID가 필요합니다.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var usersSheet = getSheet('Users');
    var marketSheet = getSheet('MarketItems');
    var invSheet = getSheet('Inventory');
    var txSheet = getSheet('Transactions');

    // Find item
    var item = findRow(marketSheet, 'itemId', itemId);
    if (!item) {
      lock.releaseLock();
      return { success: false, error: '존재하지 않는 아이템입니다.' };
    }

    var price = Number(item.price);
    var totalCost = price * quantity;
    var stock = Number(item.stock);

    // Check stock
    if (stock < quantity) {
      lock.releaseLock();
      return { success: false, error: '재고가 부족합니다. 현재 재고: ' + stock };
    }

    // Check balance
    var userRowIdx = findRowIndex(usersSheet, 'studentId', studentId);
    if (userRowIdx < 0) {
      lock.releaseLock();
      return { success: false, error: '학생을 찾을 수 없습니다.' };
    }

    var balanceCol = getColIndex(usersSheet, 'balance');
    var currentBalance = Number(usersSheet.getRange(userRowIdx, balanceCol + 1).getValue()) || 0;

    if (currentBalance < totalCost) {
      lock.releaseLock();
      return { success: false, error: '잔액이 부족합니다. 필요: ' + totalCost + ', 현재: ' + currentBalance };
    }

    // Subtract balance
    var newBalance = currentBalance - totalCost;
    usersSheet.getRange(userRowIdx, balanceCol + 1).setValue(newBalance);

    // Subtract stock
    var itemRowIdx = findRowIndex(marketSheet, 'itemId', itemId);
    var stockCol = getColIndex(marketSheet, 'stock');
    marketSheet.getRange(itemRowIdx, stockCol + 1).setValue(stock - quantity);

    // Add to inventory (or update quantity)
    var invData = sheetToObjects(invSheet);
    var existingInvRow = -1;
    for (var i = 0; i < invData.length; i++) {
      if (String(invData[i].studentId) === String(studentId) && String(invData[i].itemId) === String(itemId)) {
        existingInvRow = i + 2; // 1-based, +1 for header
        break;
      }
    }

    if (existingInvRow > 0) {
      var qtyCol = getColIndex(invSheet, 'quantity');
      var currentQty = Number(invSheet.getRange(existingInvRow, qtyCol + 1).getValue()) || 0;
      invSheet.getRange(existingInvRow, qtyCol + 1).setValue(currentQty + quantity);
    } else {
      invSheet.appendRow([studentId, itemId, quantity, 'purchase', nowISO()]);
    }

    // Log transaction
    txSheet.appendRow([
      Utilities.getUuid(), studentId, 'purchase', totalCost, '', item.name + ' x' + quantity, nowISO()
    ]);

    lock.releaseLock();

    return {
      success: true,
      data: {
        itemId: itemId,
        itemName: item.name,
        quantity: quantity,
        totalCost: totalCost,
        newBalance: newBalance
      }
    };
  } catch (err) {
    return { success: false, error: '구매 중 오류: ' + err.message };
  }
}

// ========================================================
// getMarketItems
// ========================================================
function handleGetMarketItems(params) {
  var sheet = getSheet('MarketItems');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }
  var items = sheetToObjects(sheet);
  return { success: true, data: items };
}

// ========================================================
// upsertMarketItem
// ========================================================
function handleUpsertMarketItem(params) {
  var itemId = params.itemId;
  var name = params.name;
  var category = params.category;
  var price = parseInt(params.price, 10);
  var stock = parseInt(params.stock, 10);
  var imageUrl = params.imageUrl || '';
  var requesterId = params.requesterId;

  if (!name || isNaN(price) || isNaN(stock) || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (name, price, stock, requesterId)' };
  }

  if (!hasRole(requesterId, ['teacher', 'market_manager'])) {
    return { success: false, error: '마켓 관리 권한이 없습니다.' };
  }

  var sheet = getSheet('MarketItems');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (itemId) {
      // Try to update existing
      var rowIdx = findRowIndex(sheet, 'itemId', itemId);
      if (rowIdx > 0) {
        var updatedItem = {
          itemId: itemId,
          name: name,
          category: category || '',
          price: price,
          stock: stock,
          imageUrl: imageUrl,
          registeredBy: requesterId,
          registeredAt: nowISO()
        };
        updateRowFromObject(sheet, rowIdx, updatedItem);
        lock.releaseLock();
        return { success: true, data: updatedItem };
      }
    }

    // Create new item
    var newItemId = itemId || Utilities.getUuid();
    var newItem = {
      itemId: newItemId,
      name: name,
      category: category || 'etc',
      price: price,
      stock: stock,
      imageUrl: imageUrl,
      registeredBy: requesterId,
      registeredAt: nowISO()
    };
    appendRowFromObject(sheet, newItem);
    lock.releaseLock();

    return { success: true, data: newItem };
  } catch (err) {
    return { success: false, error: '아이템 등록/수정 중 오류: ' + err.message };
  }
}

// ========================================================
// deleteMarketItem
// ========================================================
function handleDeleteMarketItem(params) {
  var itemId = params.itemId;
  var requesterId = params.requesterId;

  if (!itemId || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (itemId, requesterId)' };
  }

  if (!hasRole(requesterId, ['teacher', 'market_manager'])) {
    return { success: false, error: '마켓 관리 권한이 없습니다.' };
  }

  var sheet = getSheet('MarketItems');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var rowIdx = findRowIndex(sheet, 'itemId', itemId);
  if (rowIdx < 0) {
    return { success: false, error: '아이템을 찾을 수 없습니다.' };
  }

  sheet.deleteRow(rowIdx);
  return { success: true, data: { deletedItemId: itemId } };
}

// ========================================================
// getHouse
// ========================================================
function handleGetHouse(params) {
  var studentId = params.studentId;
  if (!studentId) {
    return { success: false, error: '학생 ID가 필요합니다.' };
  }

  var sheet = getSheet('Houses');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var house = findRow(sheet, 'studentId', studentId);
  if (!house) {
    return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
  }

  return { success: true, data: house };
}

// ========================================================
// updateHouseLayout
// ========================================================
function handleUpdateHouseLayout(params) {
  var studentId = params.studentId;
  var layoutData = params.layoutData;
  var wallThemeId = params.wallThemeId;
  var floorThemeId = params.floorThemeId;

  if (!studentId) {
    return { success: false, error: '학생 ID가 필요합니다.' };
  }

  var sheet = getSheet('Houses');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var rowIdx = findRowIndex(sheet, 'studentId', studentId);
  if (rowIdx < 0) {
    return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
  }

  // Get current values
  var currentHouse = findRow(sheet, 'studentId', studentId);

  var updatedHouse = {
    studentId: studentId,
    layoutData: layoutData !== undefined ? layoutData : currentHouse.layoutData,
    wallThemeId: wallThemeId !== undefined ? wallThemeId : currentHouse.wallThemeId,
    floorThemeId: floorThemeId !== undefined ? floorThemeId : currentHouse.floorThemeId,
    bulletinMemo: currentHouse.bulletinMemo
  };

  updateRowFromObject(sheet, rowIdx, updatedHouse);

  return { success: true, data: updatedHouse };
}

// ========================================================
// getBulletin
// ========================================================
function handleGetBulletin(params) {
  var studentId = params.studentId;
  if (!studentId) {
    return { success: false, error: '학생 ID가 필요합니다.' };
  }

  var sheet = getSheet('Houses');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var house = findRow(sheet, 'studentId', studentId);
  if (!house) {
    return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
  }

  return { success: true, data: { studentId: studentId, memo: house.bulletinMemo || '' } };
}

// ========================================================
// postBulletin
// ========================================================
function handlePostBulletin(params) {
  var studentId = params.studentId;
  var memo = params.memo;

  if (!studentId) {
    return { success: false, error: '학생 ID가 필요합니다.' };
  }

  var sheet = getSheet('Houses');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var rowIdx = findRowIndex(sheet, 'studentId', studentId);
  if (rowIdx < 0) {
    return { success: false, error: '집 데이터를 찾을 수 없습니다.' };
  }

  var memoCol = getColIndex(sheet, 'bulletinMemo');
  if (memoCol < 0) {
    return { success: false, error: 'bulletinMemo 컬럼을 찾을 수 없습니다.' };
  }

  sheet.getRange(rowIdx, memoCol + 1).setValue(memo || '');

  return { success: true, data: { studentId: studentId, memo: memo || '' } };
}

// ========================================================
// harvestNode
// ========================================================
function handleHarvestNode(params) {
  var nodeId = params.nodeId;
  var studentId = params.studentId;

  if (!nodeId || !studentId) {
    return { success: false, error: '노드 ID와 학생 ID가 필요합니다.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var harvestSheet = getSheet('HarvestNodes');
    if (!harvestSheet) {
      lock.releaseLock();
      return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
    }

    var node = findRow(harvestSheet, 'nodeId', nodeId);
    if (!node) {
      lock.releaseLock();
      return { success: false, error: '존재하지 않는 수확 노드입니다.' };
    }

    // Check cooldown (5 minutes = 300000ms)
    var lastHarvestMap = {};
    try {
      lastHarvestMap = JSON.parse(node.lastHarvestByStudent || '{}');
    } catch (parseErr) {
      lastHarvestMap = {};
    }

    var lastTime = lastHarvestMap[studentId];
    if (lastTime) {
      var elapsed = new Date().getTime() - new Date(lastTime).getTime();
      if (elapsed < 300000) {
        var remaining = Math.ceil((300000 - elapsed) / 1000);
        lock.releaseLock();
        return { success: false, error: '쿨다운 중입니다. ' + remaining + '초 후에 다시 시도하세요.' };
      }
    }

    // Parse drop table and generate reward
    var dropTable = [];
    try {
      dropTable = JSON.parse(node.dropTable || '[]');
    } catch (parseErr2) {
      dropTable = [];
    }

    if (dropTable.length === 0) {
      lock.releaseLock();
      return { success: false, error: '드롭 테이블이 비어있습니다.' };
    }

    // Weighted random selection
    var totalWeight = 0;
    for (var w = 0; w < dropTable.length; w++) {
      totalWeight += (dropTable[w].weight || 1);
    }
    var rand = Math.random() * totalWeight;
    var cumulative = 0;
    var selectedDrop = dropTable[0];
    for (var d = 0; d < dropTable.length; d++) {
      cumulative += (dropTable[d].weight || 1);
      if (rand <= cumulative) {
        selectedDrop = dropTable[d];
        break;
      }
    }

    var reward = {};
    var usersSheet = getSheet('Users');
    var txSheet = getSheet('Transactions');

    if (selectedDrop.type === 'coin') {
      var minCoins = selectedDrop.min || 10;
      var maxCoins = selectedDrop.max || 50;
      var coins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;

      // Add coins to balance
      var userRowIdx = findRowIndex(usersSheet, 'studentId', studentId);
      if (userRowIdx > 0) {
        var balanceCol = getColIndex(usersSheet, 'balance');
        var currentBalance = Number(usersSheet.getRange(userRowIdx, balanceCol + 1).getValue()) || 0;
        usersSheet.getRange(userRowIdx, balanceCol + 1).setValue(currentBalance + coins);
      }

      // Log transaction
      txSheet.appendRow([
        Utilities.getUuid(), studentId, 'harvest', coins, '', '수확 보상 (코인)', nowISO()
      ]);

      reward = { type: 'coin', amount: coins };
    } else if (selectedDrop.type === 'item') {
      // Add item to inventory
      var invSheet = getSheet('Inventory');
      var invData = sheetToObjects(invSheet);
      var existingInvRow2 = -1;
      for (var ii = 0; ii < invData.length; ii++) {
        if (String(invData[ii].studentId) === String(studentId) && String(invData[ii].itemId) === String(selectedDrop.itemId)) {
          existingInvRow2 = ii + 2;
          break;
        }
      }

      if (existingInvRow2 > 0) {
        var qtyCol2 = getColIndex(invSheet, 'quantity');
        var currentQty2 = Number(invSheet.getRange(existingInvRow2, qtyCol2 + 1).getValue()) || 0;
        invSheet.getRange(existingInvRow2, qtyCol2 + 1).setValue(currentQty2 + 1);
      } else {
        invSheet.appendRow([studentId, selectedDrop.itemId, 1, 'harvest', nowISO()]);
      }

      // Log transaction
      txSheet.appendRow([
        Utilities.getUuid(), studentId, 'harvest', 0, '', '수확 보상: ' + (selectedDrop.name || selectedDrop.itemId), nowISO()
      ]);

      reward = { type: 'item', itemId: selectedDrop.itemId, name: selectedDrop.name || selectedDrop.itemId, quantity: 1 };
    }

    // Update lastHarvestByStudent
    lastHarvestMap[studentId] = nowISO();
    var harvestRowIdx = findRowIndex(harvestSheet, 'nodeId', nodeId);
    var lastHarvestCol = getColIndex(harvestSheet, 'lastHarvestByStudent');
    harvestSheet.getRange(harvestRowIdx, lastHarvestCol + 1).setValue(JSON.stringify(lastHarvestMap));

    lock.releaseLock();

    return { success: true, data: { nodeId: nodeId, reward: reward } };
  } catch (err) {
    return { success: false, error: '수확 중 오류: ' + err.message };
  }
}

// ========================================================
// getAnnouncements
// ========================================================
function handleGetAnnouncements(params) {
  var sheet = getSheet('Announcements');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var announcements = sheetToObjects(sheet);

  // Sort by createdAt descending
  announcements.sort(function (a, b) {
    var dateA = new Date(a.createdAt || 0);
    var dateB = new Date(b.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return { success: true, data: announcements };
}

// ========================================================
// postAnnouncement
// ========================================================
function handlePostAnnouncement(params) {
  var title = params.title;
  var content = params.content;
  var isPinned = params.isPinned === 'true' || params.isPinned === true;
  var requesterId = params.requesterId;

  if (!title || !content || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (title, content, requesterId)' };
  }

  if (!hasRole(requesterId, ['teacher'])) {
    return { success: false, error: '공지사항 작성 권한이 없습니다. 교사만 가능합니다.' };
  }

  var sheet = getSheet('Announcements');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var announcement = {
    announcementId: Utilities.getUuid(),
    title: title,
    content: content,
    author: requesterId,
    createdAt: nowISO(),
    isPinned: isPinned ? 'true' : 'false'
  };

  appendRowFromObject(sheet, announcement);

  return { success: true, data: announcement };
}

// ========================================================
// getMissions
// ========================================================
function handleGetMissions(params) {
  var sheet = getSheet('Missions');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var allMissions = sheetToObjects(sheet);
  var now = new Date();
  var activeMissions = [];

  for (var i = 0; i < allMissions.length; i++) {
    var mission = allMissions[i];
    var startDate = mission.startDate ? new Date(mission.startDate) : null;
    var endDate = mission.endDate ? new Date(mission.endDate) : null;

    var isActive = true;
    if (startDate && now < startDate) isActive = false;
    if (endDate && now > endDate) isActive = false;

    if (isActive) {
      activeMissions.push(mission);
    }
  }

  // If studentId provided, include completion status
  var studentId = params ? params.studentId : null;
  if (studentId) {
    var progressSheet = getSheet('MissionProgress');
    var allProgress = progressSheet ? sheetToObjects(progressSheet) : [];

    for (var m = 0; m < activeMissions.length; m++) {
      var mid = String(activeMissions[m].missionId);
      var completed = false;
      for (var p = 0; p < allProgress.length; p++) {
        if (String(allProgress[p].missionId) === mid && String(allProgress[p].studentId) === String(studentId)) {
          completed = allProgress[p].isCompleted === 'true' || allProgress[p].isCompleted === true;
          break;
        }
      }
      activeMissions[m].isCompletedByMe = completed;
    }
  }

  return { success: true, data: activeMissions };
}

// ========================================================
// createMission
// ========================================================
function handleCreateMission(params) {
  var content = params.content;
  var reward = parseInt(params.reward, 10);
  var startDate = params.startDate;
  var endDate = params.endDate;
  var target = params.target || 'all';
  var requesterId = params.requesterId;

  if (!content || isNaN(reward) || !requesterId) {
    return { success: false, error: '필수 항목이 누락되었습니다. (content, reward, requesterId)' };
  }

  if (!hasRole(requesterId, ['teacher'])) {
    return { success: false, error: '미션 생성 권한이 없습니다. 교사만 가능합니다.' };
  }

  var sheet = getSheet('Missions');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var mission = {
    missionId: Utilities.getUuid(),
    content: content,
    reward: reward,
    startDate: startDate || nowISO(),
    endDate: endDate || '',
    target: target
  };

  appendRowFromObject(sheet, mission);

  return { success: true, data: mission };
}

// ========================================================
// completeMission
// ========================================================
function handleCompleteMission(params) {
  var missionId = params.missionId;
  var studentId = params.studentId;

  if (!missionId || !studentId) {
    return { success: false, error: '미션 ID와 학생 ID가 필요합니다.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    // Check mission exists
    var missionSheet = getSheet('Missions');
    var mission = findRow(missionSheet, 'missionId', missionId);
    if (!mission) {
      lock.releaseLock();
      return { success: false, error: '존재하지 않는 미션입니다.' };
    }

    // Check not already completed
    var progressSheet = getSheet('MissionProgress');
    var allProgress = sheetToObjects(progressSheet);
    for (var i = 0; i < allProgress.length; i++) {
      if (String(allProgress[i].missionId) === String(missionId) &&
          String(allProgress[i].studentId) === String(studentId) &&
          (allProgress[i].isCompleted === 'true' || allProgress[i].isCompleted === true)) {
        lock.releaseLock();
        return { success: false, error: '이미 완료한 미션입니다.' };
      }
    }

    // Mark as complete
    progressSheet.appendRow([missionId, studentId, 'true', nowISO()]);

    // Add reward to balance
    var reward = parseInt(mission.reward, 10) || 0;
    if (reward > 0) {
      var usersSheet = getSheet('Users');
      var userRowIdx = findRowIndex(usersSheet, 'studentId', studentId);
      if (userRowIdx > 0) {
        var balanceCol = getColIndex(usersSheet, 'balance');
        var currentBalance = Number(usersSheet.getRange(userRowIdx, balanceCol + 1).getValue()) || 0;
        usersSheet.getRange(userRowIdx, balanceCol + 1).setValue(currentBalance + reward);
      }

      // Log transaction
      var txSheet = getSheet('Transactions');
      txSheet.appendRow([
        Utilities.getUuid(), studentId, 'mission', reward, '', '미션 완료: ' + mission.content, nowISO()
      ]);
    }

    lock.releaseLock();

    return {
      success: true,
      data: {
        missionId: missionId,
        reward: reward,
        message: '미션을 완료했습니다!'
      }
    };
  } catch (err) {
    return { success: false, error: '미션 완료 중 오류: ' + err.message };
  }
}

// ========================================================
// getTransactions
// ========================================================
function handleGetTransactions(params) {
  var studentId = params.studentId;
  if (!studentId) {
    return { success: false, error: '학생 ID가 필요합니다.' };
  }

  var sheet = getSheet('Transactions');
  if (!sheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var allTx = sheetToObjects(sheet);
  var studentTx = [];
  for (var i = 0; i < allTx.length; i++) {
    if (String(allTx[i].studentId) === String(studentId)) {
      studentTx.push(allTx[i]);
    }
  }

  // Sort by timestamp descending
  studentTx.sort(function (a, b) {
    var dateA = new Date(a.timestamp || 0);
    var dateB = new Date(b.timestamp || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Limit to 50
  if (studentTx.length > 50) {
    studentTx = studentTx.slice(0, 50);
  }

  return { success: true, data: studentTx };
}

// ========================================================
// getVillageMap
// ========================================================
function handleGetVillageMap(params) {
  var usersSheet = getSheet('Users');
  if (!usersSheet) {
    return { success: false, error: '데이터베이스가 초기화되지 않았습니다.' };
  }

  var allUsers = sheetToObjects(usersSheet);
  var villagers = [];
  for (var i = 0; i < allUsers.length; i++) {
    villagers.push({
      studentId: allUsers[i].studentId,
      name: allUsers[i].name,
      avatarConfig: allUsers[i].avatarConfig || ''
    });
  }

  // Also return harvest nodes
  var harvestSheet = getSheet('HarvestNodes');
  var harvestNodes = [];
  if (harvestSheet) {
    var nodes = sheetToObjects(harvestSheet);
    for (var n = 0; n < nodes.length; n++) {
      harvestNodes.push({
        nodeId: nodes[n].nodeId,
        x: nodes[n].x,
        y: nodes[n].y
      });
    }
  }

  return {
    success: true,
    data: {
      villagers: villagers,
      harvestNodes: harvestNodes
    }
  };
}
