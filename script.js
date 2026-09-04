(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-button");
  const header = document.querySelector(".site-header");
  const navigation = document.querySelector(".desktop-nav");
  const orbitSystem = document.querySelector("[data-orbit-system]");
  const orbitStatus = document.querySelector("#orbit-status");
  const orbitCards = Array.from(document.querySelectorAll(".orbit-card--satellite"));
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setMenuState = (isOpen) => {
    if (!header || !menuButton) {
      return;
    }
    header.classList.toggle("mobile-nav-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuButton.textContent = isOpen ? "×" : "☰";
  };

  const closeMenu = () => setMenuState(false);

  menuButton?.addEventListener("click", () => {
    const isOpen = !header?.classList.contains("mobile-nav-open");
    setMenuState(Boolean(isOpen));
  });

  navigation?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!header?.classList.contains("mobile-nav-open")) {
      return;
    }
    if (event.target instanceof Node && !header.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header?.classList.contains("mobile-nav-open")) {
      closeMenu();
      menuButton?.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      closeMenu();
    }
  });

  const normalizeAngle = (angle) => {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  };

  if (orbitSystem && orbitCards.length) {
    let orbitRotation = 0;
    let activePointerId = null;
    let startX = 0;
    let startY = 0;
    let startRotation = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let rafId = null;
    let hasDragged = false;
    let suppressClickUntil = 0;
    let orbitMetrics = { radiusX: 220, radiusY: 220 };
    let isReleasingPointerNormally = false;
    const dragThreshold = 6;
    const clickSuppressDurationMs = 300;

const readOrbitMetrics = () => {
  const containerWidth = orbitSystem.clientWidth;

  // 上限はヒーローの高さ（固定）に収まる炎の大きさに合わせている。
  // ここを広げると、広い画面でカードだけが炎の外へ離れていく。
  orbitMetrics = {
    radiusX: Math.min(
      Math.max(containerWidth * 0.34, 180),
      330
    ),
    radiusY: Math.min(
      Math.max(containerWidth * 0.29, 165),
      290
    )
  };
};  

    const renderOrbit = () => {
      const { radiusX, radiusY } = orbitMetrics;

      orbitCards.forEach((card) => {
        const baseAngle = Number(card.dataset.angle || 0);
        const tilt = Number(card.dataset.tilt || 0);
        const angleDeg = baseAngle + orbitRotation;
        const angle = angleDeg * Math.PI / 180;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        const depth = (Math.sin(angle) + 1) / 2;
        const scale = 0.84 + depth * 0.24;
        const zIndex = 2 + Math.round(depth * 8);
        const brightness = 0.8 + depth * 0.28;

        card.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${tilt}deg) scale(${scale})`;
        card.style.zIndex = String(zIndex);
        card.style.filter = `brightness(${brightness})`;
      });
    };

    const refreshOrbitLayout = () => {
      readOrbitMetrics();
      renderOrbit();
    };

    const updateStatus = () => {
      if (orbitStatus) {
        orbitStatus.textContent = `Card carousel rotated ${Math.round(normalizeAngle(orbitRotation))} degrees.`;
      }
    };

    const stopMomentum = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const applyMomentum = () => {
      stopMomentum();
      if (reduceMotionQuery.matches) {
        velocity = 0;
        updateStatus();
        return;
      }

      const animate = () => {
        velocity *= 0.94;
        if (Math.abs(velocity) < 0.02) {
          velocity = 0;
          rafId = null;
          updateStatus();
          return;
        }
        orbitRotation += velocity;
        renderOrbit();
        rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
    };

    const releasePointerCapture = (pointerId) => {
      if (!orbitSystem.hasPointerCapture(pointerId)) {
        return;
      }

      isReleasingPointerNormally = true;
      orbitSystem.releasePointerCapture(pointerId);
    };

    const finishPointerInteraction = (pointerId) => {
      activePointerId = null;
      hasDragged = false;
      orbitSystem.classList.remove("is-dragging");
      releasePointerCapture(pointerId);
    };

    const endDrag = (event) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      const completedDrag = hasDragged;
      finishPointerInteraction(event.pointerId);

      if (completedDrag) {
        suppressClickUntil = performance.now() + clickSuppressDurationMs;
        applyMomentum();
      } else {
        velocity = 0;
        updateStatus();
      }
    };

    const cancelDrag = (event) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      finishPointerInteraction(event.pointerId);
      velocity = 0;
      suppressClickUntil = 0;
      stopMomentum();
      updateStatus();
    };

    orbitSystem.addEventListener("pointerdown", (event) => {
      if (activePointerId !== null) {
        return;
      }
      stopMomentum();
      activePointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastTime = event.timeStamp;
      startRotation = orbitRotation;
      velocity = 0;
      hasDragged = false;
      orbitSystem.setPointerCapture(event.pointerId);
    });

    orbitSystem.addEventListener("pointermove", (event) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const movementDistance = Math.hypot(deltaX, deltaY);

      if (!hasDragged && movementDistance < dragThreshold) {
        return;
      }

      if (!hasDragged) {
        // Vertical gestures remain available to the browser because touch-action is pan-y.
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return;
        }
        hasDragged = true;
        orbitSystem.classList.add("is-dragging");
      }

      event.preventDefault();
      const frameDeltaX = event.clientX - lastX;
      const deltaTime = Math.max(1, event.timeStamp - lastTime);
      orbitRotation = startRotation + deltaX * 0.4;
      velocity = Math.max(-8, Math.min(8, (frameDeltaX / deltaTime) * 12));
      lastX = event.clientX;
      lastTime = event.timeStamp;
      renderOrbit();
    });

    orbitSystem.addEventListener("click", (event) => {
      if (performance.now() > suppressClickUntil) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    }, true);

    orbitSystem.addEventListener("pointerup", endDrag);
    orbitSystem.addEventListener("pointercancel", cancelDrag);
    orbitSystem.addEventListener("lostpointercapture", () => {
      if (isReleasingPointerNormally) {
        isReleasingPointerNormally = false;
        return;
      }

      activePointerId = null;
      hasDragged = false;
      velocity = 0;
      suppressClickUntil = 0;
      stopMomentum();
      orbitSystem.classList.remove("is-dragging");
      updateStatus();
    });

    orbitSystem.addEventListener("dblclick", (event) => {
      if (event.target instanceof Element && event.target.closest(".orbit-card")) {
        return;
      }

      stopMomentum();
      orbitRotation = 0;
      velocity = 0;
      renderOrbit();
      updateStatus();
    });

    orbitSystem.addEventListener("keydown", (event) => {
      if (event.target !== orbitSystem) {
        return;
      }

      const step = event.shiftKey ? 24 : 10;
      let handled = true;

      switch (event.key) {
        case "ArrowLeft":
          orbitRotation -= step;
          break;
        case "ArrowRight":
          orbitRotation += step;
          break;
        case "Home":
        case "Escape":
          orbitRotation = 0;
          break;
        default:
          handled = false;
      }

      if (handled) {
        stopMomentum();
        event.preventDefault();
        renderOrbit();
        updateStatus();
      }
    });

    refreshOrbitLayout();

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(refreshOrbitLayout);
      resizeObserver.observe(orbitSystem);
    } else {
      window.addEventListener("resize", refreshOrbitLayout);
    }
  }

})();


/* Google Map の iframe 読み込み完了でフォールバック画像を隠す */
(() => {
  const storeMapFrame = document.querySelector("[data-map-frame]");
  const iframe = storeMapFrame?.querySelector("iframe");
  iframe?.addEventListener("load", () => storeMapFrame.classList.add("is-loaded"));
})();

/* 実店舗の営業状態（Asia/Tokyo 基準・火水定休） */
(() => {
  const targets = document.querySelectorAll("[data-opening-status]");
  if (!targets.length) return;

  const HOURS_TEXT = "Weekdays 13:00\u201319:00 \u00b7 Sat, Sun & holidays 12:00\u201319:00";

  const nowInJapan = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date()).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
    return { weekday: parts.weekday, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  };

  // 日本の祝日は判定できないため、平日開店時刻を保守的な基準として扱う
  const scheduleFor = (weekday) => {
    if (weekday === "Tue" || weekday === "Wed") return null;
    if (weekday === "Sat" || weekday === "Sun") return { open: 12 * 60, close: 19 * 60 };
    return { open: 13 * 60, close: 19 * 60 };
  };

  const render = () => {
    const now = nowInJapan();
    const schedule = scheduleFor(now.weekday);
    let state, text;

    if (!schedule) {
      state = "is-closed";
      text = "Closed today (Tuesdays and Wednesdays). " + HOURS_TEXT;
    } else if (now.minutes >= schedule.open && now.minutes < schedule.close) {
      state = "is-open";
      text = "Open now, until 19:00 Japan time. " + HOURS_TEXT;
    } else {
      state = "is-closed";
      text = "Closed right now. " + HOURS_TEXT;
    }

    targets.forEach((el) => {
      el.classList.remove("is-open", "is-closed");
      el.classList.add(state);
      el.textContent = text;
    });
  };

  render();
  setInterval(render, 60000);
})();


/* Instagram 投稿サムネイル
   assets/data/instagram-posts.js が window.NEXUS_INSTAGRAM_POSTS を定義していれば
   最大6件表示する。空の場合はフィード枠を出さず、フォロー導線だけを残す。
   （JSON を fetch すると file:// で開いたときに読めないため、JS ファイルで持つ） */
(() => {
  const mount = document.querySelector("[data-instagram-feed]");
  if (!mount) return;

  const data = window.NEXUS_INSTAGRAM_POSTS;
  const posts = Array.isArray(data && data.posts) ? data.posts : [];
  if (!posts.length) return;

  const isSafeImage = (src) => typeof src === "string" && /^[\w./-]+\.(webp|jpg|jpeg|png)$/i.test(src) && !src.startsWith("/");
  const isSafeLink = (url) => typeof url === "string" && /^https:\/\/(www\.)?instagram\.com\//.test(url);

  const usable = posts.filter((p) => p && isSafeImage(p.image) && isSafeLink(p.url)).slice(0, 6);
  if (!usable.length) return;

  usable.forEach((post) => {
    const link = document.createElement("a");
    link.href = post.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const img = document.createElement("img");
    img.src = post.image;
    img.alt = typeof post.alt === "string" && post.alt ? post.alt : "Instagram post";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 300;
    img.height = 300;

    link.appendChild(img);
    mount.appendChild(link);
  });
  mount.hidden = false;
})();

/* 公式ブランドロゴ（assets/brands/）
   拡張子を問わず、見つかったファイルを使う。どれも無ければ <img> ごと取り除く。
   ファイルを置くだけで表示されるので、HTML を触る必要はない。 */
(() => {
  const EXTENSIONS = ["svg", "png", "webp", "jpg", "jpeg"];

  document.querySelectorAll("[data-brand-logo]").forEach((img) => {
    const name = img.dataset.brandLogo;
    if (!name || !/^[a-z0-9-]+$/.test(name)) { img.remove(); return; }

    const base = img.closest(".price-list-page") ? "../assets/brands/" : "assets/brands/";
    let index = 0;

    const tryNext = () => {
      if (index >= EXTENSIONS.length) {
        // どの拡張子でも見つからない場合は枠ごと隠す（レイアウトは崩さない）
        const wrap = img.closest(".channel-media-wrap");
        if (wrap) wrap.remove(); else img.remove();
        return;
      }
      img.src = `${base}${name}.${EXTENSIONS[index++]}`;
    };

    img.addEventListener("load", () => img.classList.add("is-ready"));
    img.addEventListener("error", tryNext);
    tryNext();
  });
})();
