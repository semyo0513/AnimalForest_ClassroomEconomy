// 🏘️ 우리반 마을 - 설정 (Constants & Configurations)

const CONFIG = {
  // Google Apps Script 웹 앱 배포 URL (배포 후 이곳에 입력)
  GAS_URL: "https://script.google.com/macros/s/AKfycby3h86qd60nUHXeC7tycUMjhz7hHtFFtYUXxpoK4Jc5SD1f5gDK47FHmF7wlNTLsXLf/exec", 

  // 역할 및 권한 설정
  ROLES: {
    student: { name: "주민", color: "#a3e635" },
    salary_manager: { name: "월급담당관", color: "#60a5fa" },
    market_manager: { name: "마켓운영자", color: "#fbbf24" },
    police: { name: "경찰", color: "#f87171" },
    tax_manager: { name: "국세청장", color: "#c084fc" },
    teacher: { name: "선생님", color: "#f472b6" }
  },

  // 아이템 카테고리
  CATEGORIES: {
    furniture: "가구",
    wallpaper: "벽지",
    flooring: "바닥",
    harvest: "수확물",
    etc: "기타"
  },

  // 게임 월드 관련 상수
  GAME: {
    TILE_SIZE: 32,          // 한 타일의 크기 (px)
    MAP_WIDTH: 25,          // 가로 타일 개수
    MAP_HEIGHT: 20,         // 세로 타일 개수
    FPS: 60,                // 목표 프레임 레이트
    SPEED: 4,               // 플레이어 이동 속도 (px/frame)
    HARVEST_COOLDOWN: 300000 // 수확 쿨다운 (5분 = 300,000ms)
  },

  // 내 집 내부 크기 (타일 단위)
  HOUSE: {
    WIDTH: 10,
    HEIGHT: 8
  }
};

window.CONFIG = CONFIG;
