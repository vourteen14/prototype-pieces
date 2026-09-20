"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QueueStatusBadge } from "@/components/ui";

const POLL_MS = 5_000;

type LiveStatus = {
  status: string;
  queueId: number;
  queueNumber: string;
  serviceName: string;
  staffName?: string | null;
  waitingAhead?: number;
  estimate?: number;
};

type Popup = {
  title: string;
  body: string;
  variant: "panggil" | "layani" | "selesai";
};

const POPUP_STYLE: Record<Popup["variant"], { bar: string; label: string; badge: string }> = {
  panggil: { bar: "bg-blue-700", label: "Dipanggil", badge: "bg-blue-600" },
  layani: { bar: "bg-amber-500", label: "Sedang Dilayani", badge: "bg-amber-500" },
  selesai: { bar: "bg-green-700", label: "Selesai", badge: "bg-green-600" },
};

function vibrate(pattern: number | number[]) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // getaran tidak didukung (mis. iOS Safari)
  }
}

// Polling status antrean. Pada perpindahan status:
// - MENUNGGU -> DIPANGGIL : getar pola panjang + bunyi + popup "dipanggil".
// - -> DILAYANI           : getar pendek + bunyi + popup "sedang dilayani".
// - -> SELESAI / BATAL    : cookie sudah dibuang server, arahan ke beranda.
export function QueueMonitor({
  queueId,
  initialStatus,
}: {
  queueId: number;
  initialStatus: string;
}) {
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const router = useRouter();
  const audioRef = useRef<AudioContext | null>(null);
  const prevStatus = useRef(initialStatus);

  const status = live?.status ?? initialStatus;
  const popupLocked = popup?.variant === "selesai";

  // AudioContext dibuat pada interaksi pertama pengguna (aturan autoplay).
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioRef.current) audioRef.current = new AudioContext();
        if (audioRef.current.state === "suspended") void audioRef.current.resume();
      } catch {
        // tanpa dukungan WebAudio -> popup & getar tetap jalan
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const playBeep = useCallback((times: number) => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state === "suspended") return;
    try {
      let t = ctx.currentTime;
      for (let i = 0; i < times; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
        t += 0.45;
      }
    } catch {
      // abaikan
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue/status?queueId=${queueId}`, {
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data: LiveStatus = await res.json();
      setLive(data);

      const prev = prevStatus.current;
      if (data.status === prev) return true;

      prevStatus.current = data.status;

      if (data.status === "DIPANGGIL") {
        vibrate([250, 150, 250, 150, 600]);
        playBeep(3);
        setPopup({
          variant: "panggil",
          title: `Nomor ${data.queueNumber} Dipanggil!`,
          body: `Segera menuju loket ${data.serviceName}` + (data.staffName ? ` (${data.staffName})` : "") + ".",
        });
      } else if (data.status === "DILAYANI") {
        vibrate([200, 100, 200]);
        playBeep(2);
        setPopup({
          variant: "layani",
          title: "Anda Sedang Dilayani",
          body: "Silakan bersiap, Anda sedang dilayani oleh petugas di loket.",
        });
      } else if (data.status === "SELESAI") {
        vibrate([150, 80, 150, 80, 150]);
        setPopup({
          variant: "selesai",
          title: "Antrean Selesai",
          body: "Terima kasih. Cookie tiket Anda sudah dibersihkan, terima kasih telah berkunjung.",
        });
        window.setTimeout(() => {
          router.push("/");
        }, 2_500);
      } else if (data.status === "BATAL") {
        setPopup({
          variant: "selesai",
          title: "Antrean Anda Dibatalkan",
          body: "Silakan kembali ke beranda.",
        });
        window.setTimeout(() => {
          router.push("/");
        }, 2_500);
      }

      return true;
    } catch {
      return true;
    }
  }, [queueId, playBeep, router]);

  useEffect(() => {
    let stopped = false;
    const timer = window.setInterval(async () => {
      if (stopped) return;
      const cont = await poll();
      if (!cont) {
        window.clearInterval(timer);
        stopped = true;
      }
    }, POLL_MS);
    const first = window.setTimeout(() => {
      if (!stopped) void poll();
    }, 0);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, [poll]);

  const headline: Record<string, string> = {
    MENUNGGU: "Silakan menunggu hingga nomor antrean Anda dipanggil.",
    DIPANGGIL: "Nomor Anda telah dipanggil. Segera menuju loket.",
    DILAYANI: "Anda sedang dilayani di loket.",
    SELESAI: "Konsultasi telah selesai. Terima kasih.",
    BATAL: "Antrean dibatalkan.",
  };

  const popupStyle = popup ? POPUP_STYLE[popup.variant] : POPUP_STYLE.panggil;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-500">Status</span>
        <QueueStatusBadge status={status} />
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Antrean di depan</span>
        <span className="font-bold text-slate-900">
          {live?.waitingAhead ?? "..."} orang
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Estimasi waktu tunggu</span>
        <span className="font-bold text-slate-900">
          ± {live?.estimate ?? "..."} menit
        </span>
      </div>

      <p className="mt-8 text-lg font-semibold text-slate-700">
        {headline[status] ?? "Mohon menunggu."}
      </p>

      {status === "MENUNGGU" ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          Status diperbarui otomatis. Getar & suara aktif saat nomor Anda dipanggil
          (buka aplikasi ini di layar utama / jangan tutup tab ini).
        </p>
      ) : null}

      {popup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!popupLocked) setPopup(null);
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className={`${popupStyle.bar} flex items-center justify-between px-6 py-4`}>
              <p className="text-base font-extrabold uppercase tracking-wide text-white">
                {popupStyle.label}
              </p>
              <span className={`${popupStyle.badge} rounded-full px-3 py-1 text-sm font-bold text-white`}>
                {live?.queueNumber ?? ""}
              </span>
            </div>
            <div className="px-6 py-8 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900">{popup.title}</h2>
              <p className="mt-2 text-base text-slate-600">{popup.body}</p>
              {!popupLocked ? (
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="mt-6 w-full rounded-2xl bg-emerald-700 px-6 py-3 text-lg font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                >
                  OK
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}