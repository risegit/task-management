let audio = null;
let unlocked = localStorage.getItem("sound_unlocked") === "1";

export const initNotificationSound = () => {
  // ✅ Already unlocked → do nothing
  if (unlocked) return;

  try {
    audio = new Audio("/audio/notification.mp3");
    audio.volume = 1;

    audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;

        unlocked = true;
        localStorage.setItem("sound_unlocked", "1");

        console.log("🔊 Notification sound unlocked (once)");
      })
      .catch(() => {
        // expected in some browsers
      });
  } catch (e) {}
};

export const playNotificationSound = () => {
  if (!unlocked || !audio) return;

  audio.currentTime = 0;
  audio.play().catch(() => {});
};
