// Keyboard, mouse, and touch input state for Gobble Run.
export function createInput(canvas) {
  const keysDown = new Set();
  const keysPressed = new Set();

  let pointerDown = false;
  let pointerJustPressed = false;
  let pointerPos = null;
  let touchStartY = null;
  let touchDuck = false;

  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
  const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);

  function toCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (!keysDown.has(e.code)) {
      keysPressed.add(e.code);
    }
    keysDown.add(e.code);
  }

  function onKeyUp(e) {
    keysDown.delete(e.code);
  }

  function onPointerDown(e) {
    pointerDown = true;
    pointerJustPressed = true;
    pointerPos = toCanvasCoords(e.clientX, e.clientY);
    touchStartY = e.clientY;
  }

  function onPointerMove(e) {
    if (!pointerDown || touchStartY === null) return;
    if (e.clientY - touchStartY > 36) {
      touchDuck = true;
    } else if (e.clientY - touchStartY < 12) {
      touchDuck = false;
    }
  }

  function onPointerUp() {
    pointerDown = false;
    touchStartY = null;
    touchDuck = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  return {
    isJumpHeld() {
      for (const k of JUMP_KEYS) {
        if (keysDown.has(k)) return true;
      }
      return pointerDown && !touchDuck;
    },
    wasJumpPressed() {
      for (const k of JUMP_KEYS) {
        if (keysPressed.has(k)) return true;
      }
      return pointerJustPressed;
    },
    isDuckHeld() {
      for (const k of DUCK_KEYS) {
        if (keysDown.has(k)) return true;
      }
      return touchDuck;
    },
    wasPressed(code) {
      return keysPressed.has(code);
    },
    wasPointerClicked() {
      return pointerJustPressed ? pointerPos : null;
    },
    endFrame() {
      keysPressed.clear();
      pointerJustPressed = false;
      pointerPos = null;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
