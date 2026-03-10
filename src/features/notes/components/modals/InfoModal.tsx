import Modal from "./Modal";

export default function InfoModal({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      }
    >
      <p className="text-sm opacity-90">{message}</p>
    </Modal>
  );
}
