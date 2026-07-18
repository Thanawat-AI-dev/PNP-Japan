import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AttachSlipFab() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/add-slip")}
      aria-label="แนบสลิป"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-growth-600 text-white shadow-[var(--shadow-float)] transition-transform active:scale-95"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}
