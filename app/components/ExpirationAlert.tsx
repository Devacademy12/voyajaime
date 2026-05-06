"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, X } from "lucide-react";

interface ExpirationAlertProps {
  bookingCode: string;
  deadline: string; // ISO timestamp
  onExpire?: () => void;
}

export function ExpirationAlert({ bookingCode, deadline, onExpire }: ExpirationAlertProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const deadlineTime = new Date(deadline).getTime();
    
    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  if (!show || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 300; // moins de 5 minutes

  return (
    <div className={`
      fixed bottom-4 right-4 z-50 max-w-sm rounded-lg shadow-lg p-4
      ${isUrgent ? "bg-red-50 border-l-4 border-red-500" : "bg-amber-50 border-l-4 border-amber-500"}
    `}>
      <button 
        onClick={() => setShow(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3">
        <Clock size={20} className={isUrgent ? "text-red-500" : "text-amber-500"} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">
            ⏱ Paiement en attente
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Réservation <span className="font-mono font-bold">#{bookingCode}</span>
          </p>
          <p className={`text-sm font-bold mt-2 ${isUrgent ? "text-red-600" : "text-amber-700"}`}>
            Expire dans {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          {isUrgent && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠️ Dernières minutes — finalisez votre paiement !
            </p>
          )}
        </div>
      </div>
    </div>
  );
}