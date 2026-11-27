// Gobble Dash — keyboard + mouse input, one job: turn keys and clicks
// into a small set of named actions the game loop reads.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let pointer = { x: 0, y: 0, clicked: false };

  function code(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * (canvas.width / r.width);
    pointer.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * (canvas.width / r.width);
    pointer.y = (e.clientY - r.top) * (canvas.height / r.height);
    pointer.clicked = true;
  });

  function held(...codes) {
    return codes.some((c) => keys.has(c));
  }
  function justPressed(...codes) {
    return codes.some((c) => pressed.has(c));
  }

  return {
    // Movement
    left() { return held('ArrowLeft', 'KeyA'); },
    right() { return held('ArrowRight', 'KeyD'); },
    down() { return held('ArrowDown', 'KeyS'); },
    jumpPressed() { return justPressed('Space', 'ArrowUp', 'KeyW'); },
    dashHeld() { return held('ShiftLeft', 'ShiftRight'); },
    // Menus
    startPressed() { return justPressed('Enter', 'Space'); },
    restartPressed() { return justPressed('KeyR', 'Enter', 'Space'); },
    pausePressed() { return justPressed('KeyP', 'Escape'); },
    mutePressed() { return justPressed('KeyM'); },
    // Pointer (buttons on title / end screens)
    pointer() { return pointer; },
    consumeClick() {
      const c = pointer.clicked;
      pointer.clicked = false;
      return c;
    },
    // Called once per frame by the loop so justPressed only fires once.
    endFrame() { pressed.clear(); },
  };
}
