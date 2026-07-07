// 🏘️ 우리반 마을 - 픽셀아트 스프라이트 렌더러 (Canvas Vector Pixel Engine)

const Sprites = {
  // 픽셀 단위를 그리는 헬퍼 함수
  drawPixelRect: function(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
  },

  // --------------------------------------------------------
  // 1. 캐릭터 (플레이어 & 주민) 그리기
  // --------------------------------------------------------
  drawCharacter: function(ctx, x, y, size, avatarConfig, direction = 'down', isMoving = false, tick = 0) {
    let cfg = { skin: '#ffedd5', hair: '#3b82f6', eyes: '#1e293b', gender: 'male' };
    if (avatarConfig) {
      try {
        cfg = typeof avatarConfig === 'string' ? JSON.parse(avatarConfig) : avatarConfig;
      } catch (e) {
        // use default
      }
    }

    const p = size / 16; // 16x16 픽셀 가이드라인
    const bounce = isMoving ? Math.sin(tick * 0.2) * 2 * p : 0;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size - 2 * p, size / 3, size / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. 몸통 (옷)
    const shirtColor = cfg.gender === 'female' ? '#f43f5e' : '#10b981';
    this.drawPixelRect(ctx, x + 4 * p, y + 9 * p + bounce, 8 * p, 5 * p, shirtColor); // 상의
    this.drawPixelRect(ctx, x + 5 * p, y + 14 * p + bounce, 6 * p, 2 * p, '#4b5563'); // 하의

    // 2. 발 (이동 애니메이션 적용)
    let leftFootY = y + 15 * p;
    let rightFootY = y + 15 * p;
    if (isMoving) {
      if (Math.floor(tick / 8) % 2 === 0) {
        leftFootY -= 2 * p;
      } else {
        rightFootY -= 2 * p;
      }
    }
    this.drawPixelRect(ctx, x + 4 * p, leftFootY, 3 * p, 2 * p, '#1e293b'); // 왼발
    this.drawPixelRect(ctx, x + 9 * p, rightFootY, 3 * p, 2 * p, '#1e293b'); // 오른발

    // 3. 팔
    this.drawPixelRect(ctx, x + 2 * p, y + 9 * p + bounce, 2 * p, 4 * p, cfg.skin); // 왼팔
    this.drawPixelRect(ctx, x + 12 * p, y + 9 * p + bounce, 2 * p, 4 * p, cfg.skin); // 오른팔

    // 4. 얼굴 (머리)
    this.drawPixelRect(ctx, x + 3 * p, y + 3 * p + bounce, 10 * p, 7 * p, cfg.skin);

    // 5. 눈 (방향에 따른 처리)
    ctx.fillStyle = cfg.eyes;
    if (direction === 'down') {
      this.drawPixelRect(ctx, x + 5 * p, y + 6 * p + bounce, 2 * p, 2 * p, cfg.eyes);
      this.drawPixelRect(ctx, x + 9 * p, y + 6 * p + bounce, 2 * p, 2 * p, cfg.eyes);
      // 볼터치
      this.drawPixelRect(ctx, x + 4 * p, y + 8 * p + bounce, 1 * p, 1 * p, '#fca5a5');
      this.drawPixelRect(ctx, x + 11 * p, y + 8 * p + bounce, 1 * p, 1 * p, '#fca5a5');
    } else if (direction === 'up') {
      // 뒤쪽은 눈 안 보임
    } else if (direction === 'left') {
      this.drawPixelRect(ctx, x + 4 * p, y + 6 * p + bounce, 2 * p, 2 * p, cfg.eyes);
      this.drawPixelRect(ctx, x + 3 * p, y + 8 * p + bounce, 1 * p, 1 * p, '#fca5a5');
    } else if (direction === 'right') {
      this.drawPixelRect(ctx, x + 10 * p, y + 6 * p + bounce, 2 * p, 2 * p, cfg.eyes);
      this.drawPixelRect(ctx, x + 12 * p, y + 8 * p + bounce, 1 * p, 1 * p, '#fca5a5');
    }

    // 6. 머리카락
    ctx.fillStyle = cfg.hair;
    this.drawPixelRect(ctx, x + 3 * p, y + 2 * p + bounce, 10 * p, 2 * p, cfg.hair); // 머리 덮개
    if (direction === 'up') {
      this.drawPixelRect(ctx, x + 3 * p, y + 4 * p + bounce, 10 * p, 5 * p, cfg.hair); // 뒷머리 가득
    } else {
      this.drawPixelRect(ctx, x + 3 * p, y + 4 * p + bounce, 2 * p, 3 * p, cfg.hair); // 옆머리 좌
      this.drawPixelRect(ctx, x + 11 * p, y + 4 * p + bounce, 2 * p, 3 * p, cfg.hair); // 옆머리 우
      if (cfg.gender === 'female') {
        // 양갈래 머리 혹은 긴머리 픽셀 추가
        this.drawPixelRect(ctx, x + 1 * p, y + 6 * p + bounce, 2 * p, 4 * p, cfg.hair);
        this.drawPixelRect(ctx, x + 13 * p, y + 6 * p + bounce, 2 * p, 4 * p, cfg.hair);
      } else {
        // 앞머리 살짝
        this.drawPixelRect(ctx, x + 5 * p, y + 4 * p + bounce, 6 * p, 1 * p, cfg.hair);
      }
    }
  },

  // --------------------------------------------------------
  // 2. 수확 노드 (나무, 꽃, 광석) 그리기
  // --------------------------------------------------------
  drawHarvestNode: function(ctx, x, y, size, nodeId, elapsed = 999999) {
    const isCooldown = elapsed < CONFIG.GAME.HARVEST_COOLDOWN;
    const p = size / 32; // 32x32 픽셀 기준

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size - 3 * p, size / 2.5, size / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (nodeId === 'node_1') {
      // 🍎 사과나무 (Apple Tree)
      // 기둥 (Brown)
      this.drawPixelRect(ctx, x + 13 * p, y + 16 * p, 6 * p, 13 * p, '#854d0e');
      this.drawPixelRect(ctx, x + 11 * p, y + 20 * p, 2 * p, 4 * p, '#854d0e');
      this.drawPixelRect(ctx, x + 19 * p, y + 18 * p, 2 * p, 3 * p, '#854d0e');

      // 풍성한 나뭇잎 (Green)
      const leafColor = isCooldown ? '#4d7c0f' : '#22c55e';
      const shadowLeafColor = isCooldown ? '#3f6212' : '#15803d';

      ctx.fillStyle = leafColor;
      // 좌측 원
      ctx.beginPath(); ctx.arc(x + 10 * p, y + 12 * p, 8 * p, 0, Math.PI * 2); ctx.fill();
      // 우측 원
      ctx.beginPath(); ctx.arc(x + 22 * p, y + 12 * p, 8 * p, 0, Math.PI * 2); ctx.fill();
      // 상단 원
      ctx.beginPath(); ctx.arc(x + 16 * p, y + 8 * p, 9 * p, 0, Math.PI * 2); ctx.fill();

      // 어두운 명암
      ctx.fillStyle = shadowLeafColor;
      ctx.beginPath(); ctx.arc(x + 10 * p, y + 14 * p, 6 * p, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 22 * p, y + 14 * p, 6 * p, 0, Math.PI * 2); ctx.fill();

      // 사과 (빨갛게!) - 쿨다운 중이 아닐 때만 열림
      if (!isCooldown) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(x + 9 * p, y + 9 * p, 2.5 * p, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 21 * p, y + 10 * p, 2.5 * p, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 15 * p, y + 14 * p, 2.5 * p, 0, Math.PI * 2); ctx.fill();
        // 사과 하이라이트
        ctx.fillStyle = '#ffffff';
        this.drawPixelRect(ctx, x + 8 * p, y + 8 * p, 1 * p, 1 * p, '#ffffff');
        this.drawPixelRect(ctx, x + 20 * p, y + 9 * p, 1 * p, 1 * p, '#ffffff');
        this.drawPixelRect(ctx, x + 14 * p, y + 13 * p, 1 * p, 1 * p, '#ffffff');
      }
    } 
    else if (nodeId === 'node_2') {
      // 🌸 꽃 밭 (Flower Bed)
      // 풀 바닥
      this.drawPixelRect(ctx, x + 4 * p, y + 20 * p, 24 * p, 8 * p, '#15803d');
      this.drawPixelRect(ctx, x + 8 * p, y + 16 * p, 16 * p, 4 * p, '#16a34a');

      if (!isCooldown) {
        // 예쁜 튤립 세 송이 (빨강, 노랑, 분홍)
        // 송이 1
        this.drawPixelRect(ctx, x + 8 * p, y + 10 * p, 3 * p, 6 * p, '#22c55e'); // 줄기
        this.drawPixelRect(ctx, x + 7 * p, y + 6 * p, 5 * p, 5 * p, '#ec4899'); // 꽃봉오리
        this.drawPixelRect(ctx, x + 9 * p, y + 7 * p, 1 * p, 1 * p, '#fbcfe8');

        // 송이 2
        this.drawPixelRect(ctx, x + 16 * p, y + 8 * p, 3 * p, 8 * p, '#22c55e'); // 줄기
        this.drawPixelRect(ctx, x + 15 * p, y + 3 * p, 5 * p, 5 * p, '#ef4444'); // 꽃봉오리
        this.drawPixelRect(ctx, x + 17 * p, y + 4 * p, 1 * p, 1 * p, '#fee2e2');

        // 송이 3
        this.drawPixelRect(ctx, x + 24 * p, y + 12 * p, 3 * p, 5 * p, '#22c55e'); // 줄기
        this.drawPixelRect(ctx, x + 23 * p, y + 8 * p, 5 * p, 5 * p, '#eab308'); // 꽃봉오리
        this.drawPixelRect(ctx, x + 25 * p, y + 9 * p, 1 * p, 1 * p, '#fef9c3');
      } else {
        // 쿨다운 중엔 꽃 다 꺾이고 풀만 남음
        ctx.fillStyle = '#854d0e';
        this.drawPixelRect(ctx, x + 10 * p, y + 13 * p, 2 * p, 3 * p, '#854d0e'); // 잘린 줄기 흔적
        this.drawPixelRect(ctx, x + 18 * p, y + 11 * p, 2 * p, 5 * p, '#854d0e');
      }
    } 
    else if (nodeId === 'node_3') {
      // 💎 광산 바위 (Ore Rock)
      const baseColor = isCooldown ? '#6b7280' : '#9ca3af';
      const shadowColor = isCooldown ? '#374151' : '#4b5563';
      const gemColor = '#38bdf8'; // 반짝이는 하늘색 보석

      // 바위 형태 묘사
      this.drawPixelRect(ctx, x + 6 * p, y + 8 * p, 20 * p, 20 * p, baseColor);
      this.drawPixelRect(ctx, x + 3 * p, y + 13 * p, 26 * p, 15 * p, baseColor);
      this.drawPixelRect(ctx, x + 10 * p, y + 5 * p, 12 * p, 4 * p, baseColor);

      // 바위 그림자/어두운 면
      this.drawPixelRect(ctx, x + 6 * p, y + 18 * p, 20 * p, 10 * p, shadowColor);
      this.drawPixelRect(ctx, x + 18 * p, y + 8 * p, 8 * p, 10 * p, shadowColor);

      // 보석 원석 (쿨다운 중이 아닐 때 바위에 콕콕 박혀있음)
      if (!isCooldown) {
        this.drawPixelRect(ctx, x + 9 * p, y + 9 * p, 3 * p, 3 * p, gemColor);
        this.drawPixelRect(ctx, x + 10 * p, y + 10 * p, 1 * p, 1 * p, '#ffffff'); // 반짝임

        this.drawPixelRect(ctx, x + 18 * p, y + 14 * p, 3 * p, 3 * p, gemColor);
        this.drawPixelRect(ctx, x + 19 * p, y + 15 * p, 1 * p, 1 * p, '#ffffff');

        this.drawPixelRect(ctx, x + 11 * p, y + 19 * p, 3 * p, 3 * p, gemColor);
      }
    }
  },

  // --------------------------------------------------------
  // 3. 건물 (마을회관, 상점, 경찰서, 세무서, 일반 주택) 그리기
  // --------------------------------------------------------
  drawBuilding: function(ctx, x, y, width, height, type, label = "") {
    // 테두리 및 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(x + 4, y + 8, width - 4, height - 4);

    if (type === 'townhall') {
      // 🏛️ 마을회관 (빨간 삼각지붕 + 시계탑 + 대리석 벽)
      // 벽면
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(x + 10, y + 30, width - 20, height - 30);
      
      // 기둥들
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x + 15, y + 30, 8, height - 30);
      ctx.fillRect(x + width - 23, y + 30, 8, height - 30);
      ctx.fillRect(x + width/2 - 4, y + 35, 8, height - 35);

      // 지붕
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 30);
      ctx.lineTo(x + width/2, y + 10);
      ctx.lineTo(x + width - 5, y + 30);
      ctx.closePath();
      ctx.fill();

      // 문 (중앙)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + width/2 - 10, y + height - 25, 20, 25);

      // 시계탑 (지붕 위)
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x + width/2 - 12, y + 2, 24, 15);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + width/2 - 14, y, 28, 3);
      // 시계판
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + width/2, y + 9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + width/2, y + 9);
      ctx.lineTo(x + width/2, y + 6);
      ctx.moveTo(x + width/2, y + 9);
      ctx.lineTo(x + width/2 + 3, y + 9);
      ctx.stroke();

    } 
    else if (type === 'market') {
      // 🛒 마켓 (상점 - 오렌지/화이트 스트라이프 차양 + 갈색 나무벽 + 쇼윈도)
      // 벽면
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + 8, y + 25, width - 16, height - 25);

      // 큰 쇼윈도 창문
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(x + 15, y + 32, 25, 20);
      ctx.strokeStyle = '#78350f';
      ctx.strokeRect(x + 15, y + 32, 25, 20);

      // 문
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + width - 35, y + height - 30, 20, 30);

      // 스트라이프 어닝 (차양)
      const awningY = y + 16;
      ctx.fillStyle = '#ea580c'; // 주황
      ctx.fillRect(x + 4, awningY, width - 8, 10);
      
      // 스트라이프 표현
      ctx.fillStyle = '#ffffff';
      for (let offset = 8; offset < width - 8; offset += 16) {
        ctx.fillRect(x + offset, awningY, 8, 10);
      }
      
      // 입간판
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 5, y + height - 12, 6, 12);

    }
    else if (type === 'police') {
      // 👮 경찰서 (진청색 모던 빌딩 + 노란 경찰 배지)
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x + 10, y + 20, width - 20, height - 20);
      
      // 하늘색 유리창들
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 18, y + 28, 12, 12);
      ctx.fillRect(x + width - 30, y + 28, 12, 12);

      // 경찰 문
      ctx.fillStyle = '#374151';
      ctx.fillRect(x + width/2 - 10, y + height - 22, 20, 22);

      // 노란 경찰 스타 배지 (지붕 위)
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      const cx = x + width/2;
      const cy = y + 10;
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      // 별 모양 데코
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);

    }
    else if (type === 'tax') {
      // 🏛️ 세무서 (보라색 중후한 대리석 건물 + 금빛 동전 로고)
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x + 10, y + 20, width - 20, height - 20);
      
      // 지붕
      ctx.fillStyle = '#4a044e';
      ctx.fillRect(x + 6, y + 15, width - 12, 6);

      // 창문들
      ctx.fillStyle = '#fef08a'; // 황금빛 따뜻한 조명창문
      ctx.fillRect(x + 18, y + 26, 12, 14);
      ctx.fillRect(x + width - 30, y + 26, 12, 14);

      // 문
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + width/2 - 12, y + height - 24, 24, 24);

      // 황금 동전 로고
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x + width/2, y + 9, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 8px Courier';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', x + width/2, y + 9);

    }
    else {
      // 🏡 일반 주택 (Cozy House - 삼각 지붕 + 파스텔톤 벽 + 굴뚝)
      const roofColor = type === 'house_teacher' ? '#ec4899' : '#0ea5e9'; // 교사집은 핑크, 일반학생은 파랑
      const wallColor = '#fef3c7';

      // 굴뚝
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(x + width - 22, y + 5, 6, 15);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(x + width - 23, y + 3, 8, 3);

      // 벽면
      ctx.fillStyle = wallColor;
      ctx.fillRect(x + 12, y + 24, width - 24, height - 24);

      // 삼각 지붕
      ctx.fillStyle = roofColor;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 24);
      ctx.lineTo(x + width/2, y + 6);
      ctx.lineTo(x + width - 6, y + 24);
      ctx.closePath();
      ctx.fill();

      // 문
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + width/2 - 8, y + height - 20, 16, 20);
      // 손잡이
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + width/2 + 4, y + height - 10, 2, 0, Math.PI * 2);
      ctx.fill();

      // 동그란 창문
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(x + width/2, y + 17, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = roofColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 건물 라벨 텍스트 그리기
    if (label) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x + width/2 - 35, y + height + 2, 70, 13);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + width/2, y + height + 11);
    }
  },

  // --------------------------------------------------------
  // 4. 가구 아이템 (집 꾸미기 모드용) 그리기
  // --------------------------------------------------------
  drawFurniture: function(ctx, x, y, size, itemId) {
    const p = size / 16; // 16x16 픽셀 스케일링

    if (itemId === 'item_bed') {
      // 🛏️ 침대 (Bed)
      this.drawPixelRect(ctx, x + 1 * p, y + 4 * p, 14 * p, 10 * p, '#3b82f6'); // 매트리스
      this.drawPixelRect(ctx, x + 1 * p, y + 2 * p, 14 * p, 2 * p, '#ffffff'); // 베개구역
      this.drawPixelRect(ctx, x + 2 * p, y + 2 * p, 4 * p, 2 * p, '#e2e8f0'); // 베개
      this.drawPixelRect(ctx, x + 10 * p, y + 2 * p, 4 * p, 2 * p, '#e2e8f0'); // 베개2
      // 이불 접힌 선
      this.drawPixelRect(ctx, x + 1 * p, y + 6 * p, 14 * p, 8 * p, '#1d4ed8');
      // 다리
      this.drawPixelRect(ctx, x + 1 * p, y + 14 * p, 1 * p, 2 * p, '#78350f');
      this.drawPixelRect(ctx, x + 14 * p, y + 14 * p, 1 * p, 2 * p, '#78350f');
    }
    else if (itemId === 'item_desk') {
      // 🪵 나무 책상 (Desk)
      this.drawPixelRect(ctx, x + 1 * p, y + 4 * p, 14 * p, 3 * p, '#b45309'); // 상판
      this.drawPixelRect(ctx, x + 2 * p, y + 7 * p, 2 * p, 8 * p, '#78350f'); // 왼쪽 다리
      this.drawPixelRect(ctx, x + 12 * p, y + 7 * p, 2 * p, 8 * p, '#78350f'); // 오른쪽 다리
      // 서랍장 표현
      this.drawPixelRect(ctx, x + 8 * p, y + 7 * p, 4 * p, 4 * p, '#92400e');
      this.drawPixelRect(ctx, x + 9 * p, y + 9 * p, 2 * p, 1 * p, '#f59e0b'); // 손잡이
    }
    else if (itemId === 'item_chair') {
      // 🪑 나무 의자 (Chair)
      this.drawPixelRect(ctx, x + 4 * p, y + 2 * p, 8 * p, 6 * p, '#78350f'); // 등받이
      this.drawPixelRect(ctx, x + 3 * p, y + 8 * p, 10 * p, 2 * p, '#b45309'); // 안장
      this.drawPixelRect(ctx, x + 4 * p, y + 10 * p, 1.5 * p, 6 * p, '#78350f'); // 앞다리 좌
      this.drawPixelRect(ctx, x + 10.5 * p, y + 10 * p, 1.5 * p, 6 * p, '#78350f'); // 앞다리 우
    }
    else if (itemId === 'item_bookshelf') {
      // 📚 책장 (Bookshelf)
      this.drawPixelRect(ctx, x + 1 * p, y + 1 * p, 14 * p, 14 * p, '#78350f'); // 외곽틀
      // 책꽂이 구획들 & 책들
      this.drawPixelRect(ctx, x + 2 * p, y + 2 * p, 12 * p, 3 * p, '#f59e0b'); // 상단 책 구역
      this.drawPixelRect(ctx, x + 3 * p, y + 2 * p, 2 * p, 3 * p, '#ef4444'); // 빨간 책
      this.drawPixelRect(ctx, x + 6 * p, y + 2 * p, 1.5 * p, 3 * p, '#3b82f6'); // 파란 책
      this.drawPixelRect(ctx, x + 8 * p, y + 2 * p, 2 * p, 3 * p, '#10b981'); // 녹색 책

      this.drawPixelRect(ctx, x + 2 * p, y + 6 * p, 12 * p, 1 * p, '#451a03'); // 중간 선반
      this.drawPixelRect(ctx, x + 2 * p, y + 7 * p, 12 * p, 3 * p, '#f59e0b'); // 하단 책 구역
      this.drawPixelRect(ctx, x + 4 * p, y + 7 * p, 2 * p, 3 * p, '#eab308'); // 노란 책
      this.drawPixelRect(ctx, x + 9 * p, y + 7 * p, 1.5 * p, 3 * p, '#a855f7'); // 보라 책

      this.drawPixelRect(ctx, x + 2 * p, y + 11 * p, 12 * p, 1 * p, '#451a03'); // 아래 선반
    }
    else if (itemId === 'item_lamp') {
      // 💡 탁상 램프 (Lamp)
      this.drawPixelRect(ctx, x + 7 * p, y + 11 * p, 2 * p, 4 * p, '#4b5563'); // 전등 기둥
      this.drawPixelRect(ctx, x + 6 * p, y + 14 * p, 4 * p, 1 * p, '#1f2937'); // 받침대
      
      this.drawPixelRect(ctx, x + 4 * p, y + 5 * p, 8 * p, 6 * p, '#fbbf24'); // 갓
      this.drawPixelRect(ctx, x + 5 * p, y + 3 * p, 6 * p, 2 * p, '#d97706'); // 갓 위쪽
      // 전등 불빛 효과
      ctx.fillStyle = 'rgba(253, 224, 71, 0.2)';
      ctx.beginPath();
      ctx.moveTo(x + 8 * p, y + 11 * p);
      ctx.lineTo(x + 1 * p, y + 16 * p);
      ctx.lineTo(x + 15 * p, y + 16 * p);
      ctx.closePath();
      ctx.fill();
    }
    else if (itemId === 'item_rug') {
      // ⭕ 동그란 러그 (Rug) - 바닥 장식용
      ctx.fillStyle = 'rgba(236, 72, 153, 0.4)'; // 파스텔 핑크 투명 러그
      ctx.beginPath();
      ctx.arc(x + 8 * p, y + 8 * p, 7 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // 꽃무늬 데코
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 8 * p, y + 8 * p, 2 * p, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (itemId === 'item_plant') {
      // 🪴 화분 (Plant)
      this.drawPixelRect(ctx, x + 5 * p, y + 11 * p, 6 * p, 4 * p, '#ea580c'); // 화분 통
      this.drawPixelRect(ctx, x + 4 * p, y + 10 * p, 8 * p, 1 * p, '#c2410c'); // 화분 턱
      
      // 풀잎 (동그란 형태)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(x + 8 * p, y + 6 * p, 4 * p, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5 * p, y + 8 * p, 3 * p, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 11 * p, y + 7 * p, 3 * p, 0, Math.PI * 2); ctx.fill();
    }
    else {
      // 📦 기본 박스 (Etc Item)
      this.drawPixelRect(ctx, x + 2 * p, y + 4 * p, 12 * p, 10 * p, '#d97706'); // 박스 옆
      this.drawPixelRect(ctx, x + 1 * p, y + 2 * p, 14 * p, 2 * p, '#f59e0b'); // 박스 뚜껑
      this.drawPixelRect(ctx, x + 7 * p, y + 2 * p, 2 * p, 12 * p, '#92400e'); // 테이프 줄
    }
  }
};

window.Sprites = Sprites;
