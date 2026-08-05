(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-button");
  const header = document.querySelector(".site-header");
  const navigation = document.querySelector(".desktop-nav");
  const orbitSystem = document.querySelector("[data-orbit-system]");
  const newsletterForm = document.querySelector(".newsletter-form");
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

  orbitMetrics = {
    radiusX: Math.min(
      Math.max(containerWidth * 0.34, 180),
      440
    ),
    radiusY: Math.min(
      Math.max(containerWidth * 0.29, 165),
      380
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

  newsletterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = newsletterForm.querySelector("input");
    const value = input?.value.trim();
    if (!value) {
      input?.focus();
      return;
    }
    window.alert("Mock site: newsletter registration is not connected yet.");
  });

})();


const storeMapFrame = document.querySelector('[data-map-frame]');
if (storeMapFrame) {
  const iframe = storeMapFrame.querySelector('iframe');
  if (iframe) {
    iframe.addEventListener('load', () => storeMapFrame.classList.add('is-loaded'));
  }
}
