import { autoDeleteChatRoom } from "./chat.job";
import { autoResolveUnpaidOnlineOrders } from "./payment.job";
// import { ham1, ham2 } from "./file1.job";
// import { ham3 } from "./file2.job";

export const startJobs = () => {
  autoDeleteChatRoom();
  autoResolveUnpaidOnlineOrders();
  // ham1();
  // ham2();
  // ham3();
}
