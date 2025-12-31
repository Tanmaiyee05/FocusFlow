import React from 'react';
import { XPPacket } from '../types';

interface XPFloatProps {
  packets: XPPacket[];
}

export const XPFloat: React.FC<XPFloatProps> = ({ packets }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {packets.map((packet) => (
        <div
          key={packet.id}
          className="absolute xp-float flex flex-col items-center text-center"
          style={{ left: packet.x, top: packet.y }}
        >
          <span className="text-yellow-400 font-black text-2xl drop-shadow-md">
            +{packet.amount} XP
          </span>
          <span className="text-white text-xs font-bold bg-black/50 px-2 rounded-full">
            {packet.label}
          </span>
        </div>
      ))}
    </div>
  );
};