import { X, Trash } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Safeguard: if no selected user, don't render header
  if (!selectedUser) return null;

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-center gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center items-center gap-3 w-full">
          {/* Avatar */}
          <div className="avatar">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden relative">
              <img className="w-full h-full object-cover" src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.userName || 'User avatar'} />
            </div>
          </div>

          {/* User info */}
          <div className="w-full sm:w-auto text-center sm:text-left mt-1 sm:mt-0">
            <h3 className="font-medium text-xs sm:text-base break-words">{selectedUser.userName || 'Unknown User'}</h3>
            <p className="text-xs sm:text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            title="Delete conversation"
            onClick={async () => {
              if (!selectedUser) return;
              const confirmDelete = window.confirm(`Delete conversation with ${selectedUser.userName}? This will remove messages for both users.`);
              if (!confirmDelete) return;
              try {
                await useChatStore.getState().deleteChat(selectedUser._id);
              } catch (err) {
                console.log('Error deleting conversation', err);
              }
            }}
          >
            <Trash />
          </button>

          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
