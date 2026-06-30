/**
 * loader.js — Cinematic Interstellar Intro sequence.
 * Exports: initLoader() → Promise<void>
 */

export function initLoader() {
  return new Promise(resolve => {
    const preloader = document.getElementById('preloader');
    const stage = document.getElementById('cinematic-stage');
    const wordTop = document.getElementById('word-top');
    const wordBottom = document.getElementById('word-bottom');
    const restTop = document.getElementById('rest-top');
    const restBottom = document.getElementById('rest-bottom');
    const cursorTop = document.getElementById('cursor-top');
    const cursorBottom = document.getElementById('cursor-bottom');

    if (!preloader || !stage) {
      resolve();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      preloader.classList.add('exit');
      setTimeout(() => {
        preloader.style.display = 'none';
        resolve();
      }, 800);
    };

    // Hard safety timeout so the site never blocks completely if something stalls
    setTimeout(finish, 9000);

    // Ensure initial state
    wordTop.classList.add('normal');
    wordBottom.classList.add('normal');

    // Helper for typewriter effect
    const typeText = (element, text, speed = 75) => {
      return new Promise(res => {
        let i = 0;
        const interval = setInterval(() => {
          if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
          } else {
            clearInterval(interval);
            res();
          }
        }, speed);
      });
    };

    const runSequence = async () => {
      // Step 1: Hold M M appearing with 3D gradient glow (wait 1.3s)
      await new Promise(r => setTimeout(r, 1300));

      // Step 2: Typewriter effect for ARKETING and AESTRO
      if (cursorTop) cursorTop.classList.add('active');
      if (cursorBottom) cursorBottom.classList.add('active');

      // Type both words concurrently
      await Promise.all([
        typeText(restTop, ' A R K E T I N G', 65),
        typeText(restBottom, ' A E S T R O', 80)
      ]);

      await new Promise(r => setTimeout(r, 600));
      if (cursorTop) cursorTop.classList.remove('active');
      if (cursorBottom) cursorBottom.classList.remove('active');

      // Step 3: Flip both words in 3D
      wordTop.classList.remove('normal');
      wordTop.classList.add('flip-out');
      wordBottom.classList.remove('normal');
      wordBottom.classList.add('flip-out');

      await new Promise(r => setTimeout(r, 600));

      // Change text while flipped out
      const topM = wordTop.querySelector('.m-letter');
      const bottomM = wordBottom.querySelector('.m-letter');
      if (topM) topM.textContent = 'M';
      if (bottomM) bottomM.textContent = 'M';
      if (restTop) restTop.textContent = 'E E M A N S A';
      if (restBottom) restBottom.textContent = 'A L A V';

      // Flip back in
      wordTop.classList.remove('flip-out');
      wordTop.classList.add('flip-in');
      wordBottom.classList.remove('flip-out');
      wordBottom.classList.add('flip-in');

      // Force reflow
      void wordTop.offsetWidth;

      wordTop.classList.remove('flip-in');
      wordTop.classList.add('normal');
      wordBottom.classList.remove('flip-in');
      wordBottom.classList.add('normal');

      await new Promise(r => setTimeout(r, 1400));

      // Step 4: Cinematic Warp Zoom into the text and dismiss loader
      stage.classList.add('warp-zoom');
      await new Promise(r => setTimeout(r, 900));

      finish();
    };

    runSequence();
  });
}
