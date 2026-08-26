/* Notification chime — synthesized with Web Audio, no audio file needed.
   Chime: the counter bell that rings when a new order chit lands. */

(function () {
  let ctx = null;
  let alertTimer = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, gainVal, type = "sine") {
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(gainVal, c.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.05);
  }

  function beepCycle() {
    tone(1244, 0, 0.18, 0.18, "sine");
    tone(1864, 0.02, 0.22, 0.10, "sine");
    tone(880, 0.28, 0.14, 0.12, "sine");
    tone(1244, 0.44, 0.18, 0.14, "sine");
  }

  window.Chime = {
    /* Counter bell — two bright strikes (new order). */
    order() {
      tone(1244, 0, 0.28, 0.22, "sine");       // D#6
      tone(1864, 0.02, 0.35, 0.14, "sine");    // A#6 overtone
      tone(1244, 0.34, 0.22, 0.12, "sine");    // second strike
      /* Phones in pockets don't hear bells — buzz too. */
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
    },
    /* Soft thunk — item added to the pan. */
    add() {
      tone(420, 0, 0.12, 0.08, "triangle");
      tone(210, 0.02, 0.14, 0.06, "sine");
    },
    /* Stamp — order placed. */
    stamp() {
      tone(660, 0, 0.16, 0.16, "triangle");
      tone(880, 0.03, 0.2, 0.12, "triangle");
    },
    /* Error buzz. */
    error() {
      tone(160, 0, 0.28, 0.14, "sawtooth");
      tone(120, 0.05, 0.3, 0.12, "sawtooth");
    },
    /* Continuous alert — repeats until alertStop() is called. */
    alertLoop() {
      if (alertTimer) return;
      beepCycle();
      alertTimer = setInterval(beepCycle, 1200);
    },
    alertStop() {
      if (alertTimer) { clearInterval(alertTimer); alertTimer = null; }
    }
  };

  /* Mobile browsers only allow audio after a user gesture — arm the context
     on the first touch/press so the counter bell can ring later. */
  ["pointerdown", "touchend", "keydown"].forEach(ev =>
    window.addEventListener(ev, () => ensure(), { passive: true }));
})();
