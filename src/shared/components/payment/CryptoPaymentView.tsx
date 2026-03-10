// src/components/payment/CryptoPaymentView.tsx
import { Check, Copy, Send } from "lucide-react";

type CryptoCoin = {
  id: string;
  name: string;
  network: string;
  icon: any;
  colorClass: string;
  bgColorClass: string;
  address: string;
  qrImage: string;
};

type Props = {
  coin: CryptoCoin;
  copied: boolean;
  onCopy: (address: string) => void;
  onSubmit: () => void; // ✅ Le bouton appellera cette fonction
};

export default function CryptoPaymentView({
  coin,
  copied,
  onCopy,
  onSubmit,
}: Props) {
  return (
    <div className="flex flex-col items-center animation-fade-in">
      {/* Container QR Code */}
      <div className="bg-white p-3 rounded-xl shadow-lg mb-4 flex items-center justify-center">
        <img
          src={coin.qrImage}
          alt={`QR Code ${coin.name} ${coin.network}`}
          className="w-40 h-40 object-contain"
        />
      </div>

      {/* Info Réseau */}
      <div className="w-full mb-4 px-1">
        <div className="flex justify-between text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">
          <span>Réseau choisi</span>
          <span className={coin.colorClass}>{coin.network}</span>
        </div>
      </div>

      {/* Adresse */}
      <div className="w-full relative group mb-6">
        <div
          onClick={() => onCopy(coin.address)}
          className="flex items-center justify-between w-full bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-600 transition"
        >
          <p className="text-xs text-slate-300 font-mono break-all pr-2">
            {coin.address}
          </p>
          <div className="text-slate-500 pl-2 border-l border-slate-800">
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4 group-hover:text-white" />
            )}
          </div>
        </div>
        {copied && (
          <span className="absolute -top-8 right-0 text-xs text-white bg-emerald-600 px-2 py-1 rounded shadow-lg animate-pulse">
            Copié !
          </span>
        )}
      </div>

      {/* --- SECTION VALIDATION --- */}
      <div className="w-full pt-5 border-t border-white/5 flex flex-col items-center text-center">
        <p className="text-sm text-slate-300 mb-4 leading-snug">
          Après paiement effectué, veuillez soumettre la preuve au service
          client en cliquant sur ce bouton :
        </p>

        <button
          onClick={onSubmit}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          Soumettre la preuve
        </button>
      </div>
    </div>
  );
}
