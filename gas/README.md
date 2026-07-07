# 🏘️ 우리반 마을 - Google Apps Script 백엔드 설정 가이드

## 📋 목차

1. [Google Apps Script 프로젝트 생성](#1-google-apps-script-프로젝트-생성)
2. [코드 붙여넣기](#2-코드-붙여넣기)
3. [웹 앱으로 배포](#3-웹-앱으로-배포)
4. [배포 URL 설정](#4-배포-url-설정)
5. [데이터베이스 초기화](#5-데이터베이스-초기화)
6. [기본 로그인 정보](#6-기본-로그인-정보)
7. [API 레퍼런스](#7-api-레퍼런스)
8. [문제 해결](#8-문제-해결)

---

## 1. Google Apps Script 프로젝트 생성

1. 브라우저에서 [script.google.com](https://script.google.com) 에 접속합니다.
2. Google 계정으로 로그인합니다.
3. 왼쪽 상단의 **`+ 새 프로젝트`** 버튼을 클릭합니다.
4. 프로젝트 이름을 **`우리반마을_Backend`** 로 변경합니다.
   - 상단의 "제목 없는 프로젝트"를 클릭하여 이름 변경

---

## 2. 코드 붙여넣기

1. 기본으로 생성된 `코드.gs` (또는 `Code.gs`) 파일의 내용을 **전부 삭제**합니다.
2. `Code.gs` 파일의 전체 내용을 **복사**하여 붙여넣습니다.
3. **`Ctrl + S`** (Mac: `Cmd + S`) 를 눌러 저장합니다.

> ⚠️ **주의**: 코드를 부분적으로 복사하지 말고, `Code.gs` 파일 전체를 한 번에 복사하세요.

---

## 3. 웹 앱으로 배포

1. 상단 메뉴에서 **배포 > 새 배포**를 클릭합니다.
2. 왼쪽의 ⚙️ 아이콘(유형 선택) 옆 **톱니바퀴**를 클릭하고 **`웹 앱`** 을 선택합니다.
3. 다음과 같이 설정합니다:

   | 항목 | 설정값 |
   |------|--------|
   | 설명 | `우리반마을 API v1` (자유롭게 작성) |
   | 다음 사용자 인증으로 실행 | **나 (본인 이메일)** |
   | 액세스 권한이 있는 사용자 | **모든 사용자** |

4. **`배포`** 버튼을 클릭합니다.
5. 처음 배포 시 **권한 승인**이 필요합니다:
   - "이 앱은 확인되지 않았습니다" 경고가 나타나면
   - **`고급`** > **`우리반마을_Backend(으)로 이동(안전하지 않음)`** 을 클릭
   - **`허용`** 을 클릭하여 권한을 승인합니다.
6. 배포가 완료되면 **웹 앱 URL**이 표시됩니다. 이 URL을 복사하세요!

> 📌 URL 형식 예시:
> ```
> https://script.google.com/macros/s/AKfycbx.../exec
> ```

### 코드 수정 후 재배포

코드를 수정한 후에는 반드시 **새 버전으로 재배포**해야 합니다:
1. **배포 > 배포 관리** 클릭
2. 오른쪽 상단 ✏️(연필) 아이콘 클릭
3. 버전을 **`새 버전`** 으로 변경
4. **`배포`** 클릭

---

## 4. 배포 URL 설정

프론트엔드 코드의 `js/config.js` 파일을 열고, 배포 URL을 입력합니다:

```javascript
var GAS_URL = 'https://script.google.com/macros/s/여기에_배포_URL_붙여넣기/exec';
```

---

## 5. 데이터베이스 초기화

**최초 1회만** 실행하면 됩니다. 브라우저 주소창에 다음 URL을 입력하세요:

```
https://script.google.com/macros/s/여기에_배포_URL/exec?action=initializeDatabase
```

### 초기화 시 자동으로 생성되는 것들

| 항목 | 내용 |
|------|------|
| **스프레드시트** | '우리반마을_DB' 이름의 새 Google Sheets 파일 |
| **시트 10개** | Users, Houses, MarketItems, Inventory, Transactions, Announcements, Missions, MissionProgress, HarvestNodes, Pets |
| **교사 계정** | studentId: `teacher`, PIN: `0000`, 잔액: 999,999 |
| **수확 노드 3개** | 위치 (3,12), (4,13), (17,6) |
| **기본 마켓 아이템** | 가구 7종, 벽지 4종, 바닥재 3종, 수확 아이템 4종 |

### 초기화 성공 응답 예시

```json
{
  "success": true,
  "data": {
    "message": "데이터베이스가 성공적으로 생성되었습니다.",
    "spreadsheetId": "1ABC...",
    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1ABC.../edit"
  }
}
```

> ✅ Google Drive에서 '우리반마을_DB' 파일이 생성된 것을 확인할 수 있습니다.

---

## 6. 기본 로그인 정보

| 역할 | 학생 ID | PIN | 비고 |
|------|---------|-----|------|
| 교사 | `teacher` | `0000` | 모든 권한 보유, 잔액 999,999 |

### 학생 등록 방법

교사 계정으로 로그인한 뒤, 다음 API로 학생을 등록할 수 있습니다:

```
?action=registerStudent&studentId=1&name=김철수&pin=1234&requesterId=teacher
```

### 역할(Role) 종류

| 역할 | 설명 | 권한 |
|------|------|------|
| `student` | 일반 학생 | 기본 활동 (구매, 수확 등) |
| `salary_manager` | 급여 담당 | 급여 지급, 학생 등록 |
| `market_manager` | 시장 담당 | 마켓 아이템 등록/수정/삭제 |
| `police` | 경찰 | 벌금 부과 |
| `tax_manager` | 세무 담당 | 세금 징수 |
| `teacher` | 교사 | 모든 권한 |

---

## 7. API 레퍼런스

모든 API는 `GET` 요청으로 호출합니다. 기본 형식:

```
{배포URL}?action={액션명}&param1=value1&param2=value2
```

### 인증/사용자 관리

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `login` | studentId, pin | 로그인 |
| `getUserState` | studentId | 사용자 전체 상태 조회 |
| `registerStudent` | studentId, name, pin, requesterId | 학생 등록 |
| `getUsers` | requesterId | 전체 사용자 목록 (교사 전용) |
| `updateUserRole` | targetStudentId, newRole, requesterId | 역할 변경 (교사 전용) |

### 경제 활동

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `paySalary` | targetStudentIds(콤마구분), amount, reason, requesterId | 급여 지급 |
| `collectTax` | targetStudentIds(콤마구분), amount, reason, requesterId | 세금 징수 |
| `issuePenalty` | targetStudentId, amount, reason, requesterId | 벌금 부과 |
| `getTransactions` | studentId | 거래 내역 조회 (최근 50건) |

### 마켓

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `getMarketItems` | (없음) | 전체 아이템 목록 |
| `purchaseItem` | studentId, itemId, quantity | 아이템 구매 |
| `upsertMarketItem` | itemId, name, category, price, stock, imageUrl, requesterId | 아이템 등록/수정 |
| `deleteMarketItem` | itemId, requesterId | 아이템 삭제 |

### 집 꾸미기

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `getHouse` | studentId | 집 레이아웃 조회 |
| `updateHouseLayout` | studentId, layoutData, wallThemeId, floorThemeId | 집 레이아웃 저장 |
| `getBulletin` | studentId | 게시판 메모 조회 |
| `postBulletin` | studentId, memo | 게시판 메모 작성 |

### 수확

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `harvestNode` | nodeId, studentId | 수확 노드에서 자원 채집 (5분 쿨다운) |

### 공지사항

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `getAnnouncements` | (없음) | 공지사항 목록 |
| `postAnnouncement` | title, content, isPinned, requesterId | 공지사항 작성 (교사 전용) |

### 미션

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `getMissions` | studentId(선택) | 활성 미션 목록 |
| `createMission` | content, reward, startDate, endDate, target, requesterId | 미션 생성 (교사 전용) |
| `completeMission` | missionId, studentId | 미션 완료 |

### 마을 지도

| 액션 | 파라미터 | 설명 |
|------|----------|------|
| `getVillageMap` | studentId(선택) | 마을 주민 + 수확 노드 목록 |

---

## 8. 문제 해결

### ❌ "데이터베이스가 초기화되지 않았습니다" 오류

→ `?action=initializeDatabase` 를 먼저 실행하세요.

### ❌ CORS 오류

→ 모든 API가 `doGet`으로 구현되어 있으므로 CORS 문제가 발생하지 않아야 합니다. 만약 발생한다면:
- 배포 설정에서 "액세스 권한이 있는 사용자"가 **모든 사용자**로 되어 있는지 확인하세요.
- 프론트엔드에서 `fetch` 시 `mode: 'no-cors'` 를 사용하지 **마세요**. 일반 `fetch`를 사용하세요.

### ❌ "권한이 없습니다" 오류

→ `requesterId`에 적절한 권한을 가진 사용자 ID를 전달하고 있는지 확인하세요.

### ❌ 코드 수정 후 반영되지 않음

→ 코드 수정 후에는 반드시 **새 버전으로 재배포**해야 합니다. (3번 참고)

### ❌ 스프레드시트를 실수로 삭제한 경우

1. Google Drive 휴지통에서 복원하거나
2. Apps Script 에디터에서 **파일 > 프로젝트 속성 > 스크립트 속성** 으로 이동
3. `SPREADSHEET_ID` 속성을 삭제
4. `?action=initializeDatabase` 를 다시 실행하여 새로 생성

---

## 💡 팁

- 스프레드시트에서 직접 데이터를 확인하고 수정할 수 있습니다.
- Google Drive에서 "우리반마을_DB"를 검색하면 데이터 시트를 찾을 수 있습니다.
- 대량의 학생을 등록할 때는 스프레드시트의 Users 시트에 직접 데이터를 입력해도 됩니다.
  (단, 헤더 순서를 반드시 지켜야 합니다)
- `getTransactions`는 최근 50건만 반환합니다. 전체 내역은 스프레드시트에서 확인하세요.
